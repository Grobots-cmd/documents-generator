import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuth } from "@/lib/get-auth";
import Papa from "papaparse";

const REQUIRED_COLUMNS = [
  "full_name", "roll_number", "branch", "year", "dob", "email", "department",
];

export async function POST(req: NextRequest) {
  const session = await getAuth();
  if (!session || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const formData = await req.formData();
  const file = formData.get("file") as File | null;

  if (!file) {
    return NextResponse.json({ error: "No file provided" }, { status: 400 });
  }

  const text = await file.text();
  const parsed = Papa.parse<Record<string, string>>(text, {
    header: true,
    skipEmptyLines: true,
    transformHeader: (h: string) => h.trim().toLowerCase().replace(/\s+/g, "_"),
  });

  if (parsed.errors.length > 0) {
    return NextResponse.json({ error: "CSV parse error", details: parsed.errors }, { status: 400 });
  }

  const rows = parsed.data;
  const missing = REQUIRED_COLUMNS.filter((c) => !Object.keys(rows[0] || {}).includes(c));
  if (missing.length > 0) {
    return NextResponse.json({ error: `Missing columns: ${missing.join(", ")}` }, { status: 400 });
  }

  const results = { imported: 0, skipped: 0, errors: [] as string[] };

  for (const row of rows) {
    try {
      // Build subjects from subject_1_name, subject_1_code, ...
      const subjects: { name: string; code: string }[] = [];
      for (let i = 1; i <= 8; i++) {
        const name = row[`subject_${i}_name`];
        const code = row[`subject_${i}_code`];
        if (name && code) subjects.push({ name: name.trim(), code: code.trim() });
      }

      await prisma.member.create({
        data: {
          fullName: row.full_name.trim(),
          rollNumber: row.roll_number.trim(),
          branch: row.branch.trim(),
          yearOfStudy: row.year.trim(),
          department: row.department?.trim() || "",
          dateOfBirth: new Date(row.dob),
          personalEmail: row.email.trim(),
          phoneNumber: row.phone?.trim() || null,
          status: "ACTIVE",
          activeSubjects: { create: subjects },
        },
      });
      results.imported++;
    } catch (err: unknown) {
      results.skipped++;
      const msg = err instanceof Error ? err.message : "unknown error";
      results.errors.push(`Row ${row.roll_number}: ${msg}`);
    }
  }

  return NextResponse.json({ data: results });
}
