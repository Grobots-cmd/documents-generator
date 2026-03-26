import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuth } from "@/lib/get-auth";

export async function GET(req: NextRequest) {
  const session = await getAuth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const page = parseInt(searchParams.get("page") || "1", 10);
  const limit = parseInt(searchParams.get("limit") || "20", 10);
  const docType = searchParams.get("docType") || undefined;
  const from = searchParams.get("from");
  const to = searchParams.get("to");
  const search = searchParams.get("search") || "";

  // Coordinators only see their own logs
  const whereBase =
    session.user.role === "COORDINATOR"
      ? { generatedById: session.user.id }
      : {};

  const where = {
    ...whereBase,
    ...(docType ? { documentType: docType as never } : {}),
    ...(from || to
      ? {
          timestamp: {
            ...(from ? { gte: new Date(from) } : {}),
            ...(to ? { lte: new Date(to) } : {}),
          },
        }
      : {}),
    ...(search
      ? {
          OR: [
            { eventName: { contains: search, mode: "insensitive" as const } },
            { generatedByName: { contains: search, mode: "insensitive" as const } },
          ],
        }
      : {}),
  };

  const [total, logs] = await Promise.all([
    prisma.generationLog.count({ where }),
    prisma.generationLog.findMany({
      where,
      orderBy: { timestamp: "desc" },
      skip: (page - 1) * limit,
      take: limit,
    }),
  ]);

  return NextResponse.json({ data: logs, total, page, limit });
}
