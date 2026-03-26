import { prisma } from "@/lib/prisma";

/**
 * Generates the next reference number in the format:
 * RC/DM/YYYY/MMDD/XXXX  e.g. RC/DM/2026/0325/0042
 *
 * Uses a transaction to atomically increment the counter and avoid
 * duplicate ref numbers under concurrent requests.
 */
export async function generateRefNumber(date: Date = new Date()): Promise<string> {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  const settings = await prisma.$transaction(async (tx) => {
    // Ensure singleton exists
    const existing = await tx.globalSettings.findUnique({ where: { id: "singleton" } });

    if (!existing) {
      return tx.globalSettings.create({
        data: {
          id: "singleton",
          refNumberCounter: 1,
          refNumberYear: year,
        },
      });
    }

    if (existing.refNumberYear !== year) {
      // New year — reset counter to 1
      return tx.globalSettings.update({
        where: { id: "singleton" },
        data: { refNumberCounter: 1, refNumberYear: year },
      });
    }

    // Same year — atomically increment
    return tx.globalSettings.update({
      where: { id: "singleton" },
      data: { refNumberCounter: { increment: 1 } },
    });
  });

  const seq = String(settings.refNumberCounter).padStart(4, "0");
  return `RC/DM/${year}/${month}${day}/${seq}`;
}
