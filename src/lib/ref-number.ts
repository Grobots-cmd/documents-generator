import { prisma } from "@/lib/prisma";

/**
 * Generates the next reference number in the format:
 * RC/DM/YYYY/MMDD/XXXX  e.g. RC/DM/2026/0325/0042
 */
export async function generateRefNumber(date: Date = new Date()): Promise<string> {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  // Atomically increment counter, reset if year changed
  const settings = await prisma.globalSettings.findUnique({ where: { id: "singleton" } });

  let counter = 1;
  if (settings) {
    if (settings.refNumberYear !== year) {
      // New year — reset counter
      await prisma.globalSettings.update({
        where: { id: "singleton" },
        data: { refNumberCounter: 1, refNumberYear: year },
      });
      counter = 1;
    } else {
      const updated = await prisma.globalSettings.update({
        where: { id: "singleton" },
        data: { refNumberCounter: { increment: 1 } },
      });
      counter = updated.refNumberCounter;
    }
  }

  const seq = String(counter).padStart(4, "0");
  return `RC/DM/${year}/${month}${day}/${seq}`;
}
