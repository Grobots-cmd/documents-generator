import type { DocType } from "@prisma/client";

/**
 * Generates a standardised PDF filename for a generated document.
 * Format: {DocType}_{EventName}_{MemberName/ALL}_{YYYY-MM-DD}.pdf
 */
export function generatePdfName(
  docType: DocType,
  eventName: string,
  members: { fullName: string }[],
  date: Date = new Date()
): string {
  const typeMap: Record<DocType, string> = {
    CONGRATULATIONS: "Congratulations",
    QUIZ_PRORATE: "QuizProRate",
    ATTENDANCE: "Attendance",
    LATE_STAY: "LateStay",
    EVENT_WRITEUP_EN: "WriteUp-English",
    EVENT_WRITEUP_HI: "WriteUp-Hindi",
  };

  const sanitize = (s: string) =>
    s.replace(/[^a-zA-Z0-9]/g, "").slice(0, 30);

  const eventSlug = sanitize(eventName);
  const memberSlug =
    members.length === 1
      ? sanitize(members[0].fullName)
      : "ALL";

  const yyyy = date.getFullYear();
  const mm = String(date.getMonth() + 1).padStart(2, "0");
  const dd = String(date.getDate()).padStart(2, "0");

  return `${typeMap[docType]}_${eventSlug}_${memberSlug}_${yyyy}-${mm}-${dd}.pdf`;
}
