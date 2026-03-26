// Local DocType union (mirrors Prisma schema enum)
export type DocType = "CONGRATULATIONS" | "QUIZ_PRORATE" | "ATTENDANCE" | "LATE_STAY" | "EVENT_WRITEUP_EN" | "EVENT_WRITEUP_HI";
export type Role = "ADMIN" | "COORDINATOR" | "MEMBER";
export type MemberStatus = "PENDING" | "ACTIVE" | "INACTIVE";


// ─── Extended session type ─────────────────────────────────────────────────────

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      email: string;
      name: string;
      role: Role;
    };
  }
}

// ─── API response types ────────────────────────────────────────────────────────

export interface ApiResponse<T = unknown> {
  data?: T;
  error?: string;
  message?: string;
}

// ─── Member types ──────────────────────────────────────────────────────────────

export interface SubjectData {
  id?: string;
  name: string;
  code: string;
}

export interface MemberWithSubjects {
  id: string;
  fullName: string;
  rollNumber: string;
  branch: string;
  yearOfStudy: string;
  department: string;
  dateOfBirth: Date;
  personalEmail: string;
  collegeEmail?: string | null;
  phoneNumber?: string | null;
  status: MemberStatus;
  rejectedReason?: string | null;
  activeSubjects: SubjectData[];
  createdAt: Date;
}

// ─── Generation request types ──────────────────────────────────────────────────

export interface GenerationRequest {
  docType: DocType;
  eventDetails: Record<string, string | boolean | string[]>;
  memberIds: string[];
  issueDate: string;
}

export interface GenerationResult {
  success: boolean;
  pdfUrl?: string;
  pdfFileName?: string;
  refNumber?: string;
  error?: string;
  latexLog?: string;
}

// ─── Audit log types ───────────────────────────────────────────────────────────

export interface AuditLogEntry {
  id: string;
  timestamp: Date;
  generatedByName: string;
  documentType: DocType;
  eventName: string;
  membersIncluded: { name: string; rollNumber: string }[];
  templateVersion: number;
  cloudinaryUrl?: string | null;
  pdfFileName: string;
  refNumber: string;
  ipAddress?: string | null;
}

// ─── Branch options ────────────────────────────────────────────────────────────

export const BRANCHES = [
  "CSE", "ECE", "ME", "CE", "EE", "DS", "IOT", "AI/ML", "BCAI",
  "MBA", "MCA", "Other",
] as const;

export const YEARS = ["1st", "2nd", "3rd", "4th"] as const;

export const DOC_TYPE_LABELS: Record<DocType, string> = {
  CONGRATULATIONS: "Congratulations Letter",
  QUIZ_PRORATE: "Quiz Pro-Rate / Weightage Request",
  ATTENDANCE: "Event Attendance Certificate",
  LATE_STAY: "Late Stay / Overnight Permission",
  EVENT_WRITEUP_EN: "Event Write-Up (English)",
  EVENT_WRITEUP_HI: "Event Write-Up (Hindi)",
};
