import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuth } from "@/lib/get-auth";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getAuth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const member = await prisma.member.findUnique({
    where: { id },
    include: { activeSubjects: true },
  });

  if (!member) return NextResponse.json({ error: "Not found" }, { status: 404 });

  return NextResponse.json({ data: member });
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getAuth();
  if (!session || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;
  const body = await req.json();

  // Handle status update (approve/reject)
  if (body.status !== undefined) {
    const member = await prisma.member.update({
      where: { id },
      data: {
        status: body.status,
        rejectedReason: body.rejectedReason || null,
      },
    });
    return NextResponse.json({ data: member });
  }

  // Handle subject refresh (replace active subjects)
  if (body.activeSubjects !== undefined) {
    await prisma.subject.deleteMany({ where: { memberId: id } });
    const member = await prisma.member.update({
      where: { id },
      data: {
        activeSubjects: {
          create: body.activeSubjects.map((s: { name: string; code: string }) => ({
            name: s.name,
            code: s.code,
          })),
        },
      },
      include: { activeSubjects: true },
    });
    return NextResponse.json({ data: member });
  }

  // General update
  const { activeSubjects, dateOfBirth, ...rest } = body;
  const member = await prisma.member.update({
    where: { id },
    data: {
      ...rest,
      ...(dateOfBirth ? { dateOfBirth: new Date(dateOfBirth) } : {}),
    },
    include: { activeSubjects: true },
  });

  return NextResponse.json({ data: member });
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getAuth();
  if (!session || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;
  await prisma.member.delete({ where: { id } });
  return NextResponse.json({ message: "Member deleted." });
}
