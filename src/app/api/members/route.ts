import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuth } from "@/lib/get-auth";
import bcrypt from "bcryptjs";
import { memberRegistrationSchema } from "@/lib/validators";

export async function GET(req: NextRequest) {
  const session = await getAuth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const status = searchParams.get("status");
  const search = searchParams.get("search") || "";

  // Coordinators can only see active members (for dropdown)
  const statusFilter =
    session.user.role === "COORDINATOR"
      ? "ACTIVE"
      : status || undefined;

  const members = await prisma.member.findMany({
    where: {
      ...(statusFilter ? { status: statusFilter as "ACTIVE" | "PENDING" | "INACTIVE" } : {}),
      ...(search
        ? {
            OR: [
              { fullName: { contains: search, mode: "insensitive" } },
              { rollNumber: { contains: search, mode: "insensitive" } },
            ],
          }
        : {}),
    },
    include: { activeSubjects: true },
    orderBy: { fullName: "asc" },
  });

  return NextResponse.json({ data: members });
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const session = await getAuth();

  // Parse and validate
  const parsed = memberRegistrationSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const { activeSubjects, dateOfBirth, ...memberData } = parsed.data;

  // Check roll number uniqueness
  const existing = await prisma.member.findUnique({
    where: { rollNumber: memberData.rollNumber },
  });
  if (existing) {
    return NextResponse.json(
      { error: "A member with this roll number already exists." },
      { status: 409 }
    );
  }

  // Admin/manual adds are Active immediately; self-registration is Pending
  const isAdmin = session?.user?.role === "ADMIN";

  // If password provided (admin creating user account), create User too
  let userId: string | undefined;
  if (body.password && isAdmin) {
    const passwordHash = await bcrypt.hash(body.password, 12);
    const user = await prisma.user.create({
      data: {
        email: memberData.personalEmail,
        passwordHash,
        fullName: memberData.fullName,
        role: "MEMBER",
      },
    });
    userId = user.id;
  }

  const member = await prisma.member.create({
    data: {
      ...memberData,
      dateOfBirth: new Date(dateOfBirth),
      status: isAdmin ? "ACTIVE" : "PENDING",
      ...(userId ? { userId } : {}),
      activeSubjects: {
        create: activeSubjects.map((s) => ({ name: s.name, code: s.code })),
      },
    },
    include: { activeSubjects: true },
  });

  return NextResponse.json({ data: member, message: "Member registered successfully." }, { status: 201 });
}
