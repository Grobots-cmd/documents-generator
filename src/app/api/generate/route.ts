import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuth } from "@/lib/get-auth";
import {
  fillTemplate,
  fillEachLoop,
  compileLatexToPdf,
} from "@/lib/latex";
import { uploadPdfToCloudinary } from "@/lib/cloudinary";
import { generateRefNumber } from "@/lib/ref-number";
import { generatePdfName } from "@/lib/pdf-naming";

type DocType = "CONGRATULATIONS" | "QUIZ_PRORATE" | "ATTENDANCE" | "LATE_STAY" | "EVENT_WRITEUP_EN" | "EVENT_WRITEUP_HI";

export async function POST(req: NextRequest) {
  const session = await getAuth();
  if (!session || (session.user.role !== "COORDINATOR" && session.user.role !== "ADMIN")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const ip = req.headers.get("x-forwarded-for") || req.headers.get("x-real-ip") || "unknown";

  try {
    const body = await req.json();
    const { docType, memberIds, eventDetails, issueDate } = body as {
      docType: DocType;
      memberIds: string[];
      eventDetails: Record<string, string>;
      issueDate: string;
    };

    if (!docType || !memberIds?.length) {
      return NextResponse.json({ error: "docType and memberIds are required" }, { status: 400 });
    }

    // Fetch template
    const template = await prisma.documentTemplate.findUnique({ where: { type: docType } });
    if (!template) {
      return NextResponse.json({ error: "Template not found" }, { status: 404 });
    }

    // Fetch global settings
    const settings = await prisma.globalSettings.findUnique({ where: { id: "singleton" } });
    if (!settings) {
      return NextResponse.json({ error: "Global settings not configured" }, { status: 500 });
    }

    // Fetch selected members
    const members = await prisma.member.findMany({
      where: { id: { in: memberIds }, status: "ACTIVE" },
      include: { activeSubjects: true },
    });

    if (members.length === 0) {
      return NextResponse.json({ error: "No active members found" }, { status: 400 });
    }

    // Generate reference number
    const issueDateTime = issueDate ? new Date(issueDate) : new Date();
    const refNumber = await generateRefNumber(issueDateTime);

    // Build common vars from settings
    const settingsVars: Record<string, string> = {
      club_name: settings.clubName,
      institution_name: settings.institutionFull,
      institution_short: settings.institutionShort,
      city: settings.city,
      club_head_name: settings.clubHeadName,
      faculty_coordinator_1: settings.facultyCoordinator1,
      faculty_coordinator_2: settings.facultyCoordinator2,
      director_name: settings.directorName,
      department_name: settings.departmentName,
      coordinator_name: session.user.name,
      ref_number: refNumber,
      issue_date: new Date(issueDateTime).toLocaleDateString("en-GB"),
    };

    // Build member rows for tables (for quiz pro-rate, etc.)
    const memberRows = members.map((m: { id: string; fullName: string; rollNumber: string; branch: string; yearOfStudy: string; department: string }, idx: number) => ({
      s_no: String(idx + 1),
      member_name: m.fullName,
      member_roll: m.rollNumber,
      member_branch: m.branch,
      member_year: m.yearOfStudy,
      member_department: m.department,
    }));

    // For write-up: team members list
    const teamMembersList = members
      .map((m: { fullName: string; branch: string; yearOfStudy: string }) => `\\textbf{${m.fullName}} (${m.branch}, ${m.yearOfStudy} Year)`)
      .join(", ");

    // Fill template
    let filled = fillTemplate(template.content, {
      ...settingsVars,
      ...eventDetails,
      team_members_list: teamMembersList,
    });

    // Handle {{#each members}} loops
    filled = fillEachLoop(filled, memberRows);

    // Compile to PDF
    const pdfBuffer = await compileLatexToPdf(filled);

    // Generate filename
    const pdfFileName = generatePdfName(docType, eventDetails.event_name || "Document", members, issueDateTime);

    // Upload to Cloudinary
    const { url: cloudinaryUrl, publicId: cloudinaryId } = await uploadPdfToCloudinary(
      pdfBuffer,
      pdfFileName,
      docType,
      {
        generatedById: session.user.id,
        generatedByName: session.user.name,
        documentType: docType,
        eventName: eventDetails.event_name || "",
        memberIds,
        templateVersion: template.version,
      }
    );

    // Create immutable audit log entry
    await prisma.generationLog.create({
      data: {
        generatedById: session.user.id,
        generatedByName: session.user.name,
        documentType: docType,
        eventName: eventDetails.event_name || "",
        membersIncluded: members.map((m: { fullName: string; rollNumber: string }) => ({ name: m.fullName, rollNumber: m.rollNumber })),
        templateVersion: template.version,
        cloudinaryUrl,
        cloudinaryId,
        ipAddress: ip,
        sessionId: session.user.id,
        pdfFileName,
        refNumber,
      },
    });

    return NextResponse.json({
      data: { cloudinaryUrl, pdfFileName, refNumber },
      message: "Document generated successfully.",
    });
  } catch (err: unknown) {
    console.error("[generate] Error:", err);
    const msg = err instanceof Error ? err.message : "Generation failed";
    return NextResponse.json(
      { error: msg, latexLog: msg.includes("LaTeX") ? msg : undefined },
      { status: 500 }
    );
  }
}
