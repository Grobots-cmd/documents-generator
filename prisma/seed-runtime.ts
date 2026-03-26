/**
 * Runtime seed — called from instrumentation.ts on server startup.
 * Uses the shared prisma singleton (already has the adapter configured).
 * Only seeds if no admin user exists — safe to call on every cold start.
 */
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";

export async function runSeedIfEmpty() {
  const adminCount = await prisma.user.count({ where: { role: "ADMIN" } });
  if (adminCount > 0) return; // already seeded

  console.log("[seed] No admin found — seeding database...");

  // Global settings
  await prisma.globalSettings.upsert({
    where: { id: "singleton" },
    update: {},
    create: {
      id: "singleton",
      clubName: "SRMCEM Robotics Club",
      institutionFull: "Sri Ram Swaroop Memorial College of Engineering & Management",
      institutionShort: "SRMCEM",
      city: "Lucknow",
      clubHeadName: "Saarthak Pandey",
      facultyCoordinator1: "Dr. Sunil Yadav",
      facultyCoordinator2: "Er. Uddaish Porov",
      directorName: "",
      departmentName: "Data & Management",
      defaultLanguage: "English",
      refNumberCounter: 0,
      refNumberYear: 2026,
    },
  });

  // Admin user
  const passwordHash = await bcrypt.hash("Admin@123", 12);
  await prisma.user.upsert({
    where: { email: "admin@srmcem.ac.in" },
    update: {},
    create: {
      email: "admin@srmcem.ac.in",
      passwordHash,
      fullName: "System Administrator",
      role: "ADMIN",
      isActive: true,
    },
  });

  // Coordinator user
  const coordHash = await bcrypt.hash("Coord@123", 12);
  await prisma.user.upsert({
    where: { email: "coordinator@srmcem.ac.in" },
    update: {},
    create: {
      email: "coordinator@srmcem.ac.in",
      passwordHash: coordHash,
      fullName: "Data Management Coordinator",
      role: "COORDINATOR",
      isActive: true,
    },
  });

  // Default templates
  const templates = [
    { type: "CONGRATULATIONS" as const, name: "Congratulations Letter" },
    { type: "QUIZ_PRORATE" as const, name: "Quiz Pro-Rate / Weightage Request" },
    { type: "ATTENDANCE" as const, name: "Event Attendance Certificate" },
    { type: "LATE_STAY" as const, name: "Late Stay / Overnight Permission" },
    { type: "EVENT_WRITEUP_EN" as const, name: "Event Write-Up (English)" },
    { type: "EVENT_WRITEUP_HI" as const, name: "Event Write-Up (Hindi)" },
  ];

  for (const tmpl of templates) {
    await prisma.documentTemplate.upsert({
      where: { type: tmpl.type },
      update: {},
      create: { type: tmpl.type, name: tmpl.name, content: `% ${tmpl.name} — replace via Admin → Templates`, version: 1, updatedBy: "System" },
    });
  }

  console.log("[seed] ✅ Database seeded. Admin: admin@srmcem.ac.in / Admin@123");
}
