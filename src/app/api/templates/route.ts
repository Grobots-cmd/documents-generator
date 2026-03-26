import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuth } from "@/lib/get-auth";
import { validateTemplatePlaceholders } from "@/lib/latex";

type DocType = "CONGRATULATIONS" | "QUIZ_PRORATE" | "ATTENDANCE" | "LATE_STAY" | "EVENT_WRITEUP_EN" | "EVENT_WRITEUP_HI";

const REQUIRED_PLACEHOLDERS: Record<DocType, string[]> = {
  CONGRATULATIONS: [
    "club_name", "coordinator_name", "issue_date", "ref_number",
    "member_name", "member_roll", "event_name", "event_location",
    "achievement", "club_head_name",
  ],
  QUIZ_PRORATE: [
    "issue_date", "ref_number", "event_name", "event_venue",
    "club_head_name",
  ],
  ATTENDANCE: [
    "issue_date", "ref_number", "member_name", "member_roll",
    "event_name", "event_date", "club_head_name",
  ],
  LATE_STAY: [
    "issue_date", "ref_number", "member_name", "event_name",
    "stay_date", "club_head_name",
  ],
  EVENT_WRITEUP_EN: ["event_name", "institution_short", "event_host", "team_members_list"],
  EVENT_WRITEUP_HI: ["event_name", "institution_short", "event_host", "team_members_list"],
};

export async function GET() {
  const session = await getAuth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const templates = await prisma.documentTemplate.findMany({
    orderBy: { type: "asc" },
    select: {
      id: true, type: true, name: true, content: true, version: true,
      updatedBy: true, updatedAt: true, createdAt: true,
    },
  });

  return NextResponse.json({ data: templates });
}

export async function POST(req: NextRequest) {
  const session = await getAuth();
  if (!session || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await req.json();
  const { type, name, content } = body as { type: DocType; name: string; content: string };

  if (!type || !name || !content) {
    return NextResponse.json({ error: "type, name and content are required" }, { status: 400 });
  }

  // Validate required placeholders
  const required = REQUIRED_PLACEHOLDERS[type] || [];
  const { valid, missing } = validateTemplatePlaceholders(content, required);
  if (!valid) {
    return NextResponse.json(
      { error: "Template is missing required placeholders", missing },
      { status: 400 }
    );
  }

  const existing = await prisma.documentTemplate.findUnique({ where: { type } });

  if (existing) {
    // Archive old version
    await prisma.templateVersion.create({
      data: {
        templateId: existing.id,
        content: existing.content,
        version: existing.version,
        updatedBy: existing.updatedBy,
      },
    });
    // Update template
    const updated = await prisma.documentTemplate.update({
      where: { type },
      data: { name, content, version: existing.version + 1, updatedBy: session.user.name },
    });
    return NextResponse.json({ data: updated });
  }

  // Create new template
  const created = await prisma.documentTemplate.create({
    data: { type, name, content, updatedBy: session.user.name },
  });
  return NextResponse.json({ data: created }, { status: 201 });
}
