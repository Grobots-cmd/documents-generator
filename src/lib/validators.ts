import { z } from "zod";

// ─── Auth ─────────────────────────────────────────────────────────────────────

export const loginSchema = z.object({
  email: z.string().email("Invalid email"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

export const resetPasswordSchema = z.object({
  email: z.string().email("Invalid email"),
});

export const newPasswordSchema = z
  .object({
    password: z.string().min(8, "At least 8 characters"),
    confirmPassword: z.string(),
  })
  .refine((d) => d.password === d.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

// ─── Member Registration ───────────────────────────────────────────────────────

const subjectSchema = z.object({
  name: z.string().min(2, "Subject name required"),
  code: z.string().min(2, "Subject code required"),
});

export const memberRegistrationSchema = z.object({
  fullName: z.string().min(2, "Full name is required"),
  rollNumber: z
    .string()
    .min(10, "Enter a valid roll number")
    .max(20)
    .regex(/^[A-Z0-9]+$/i, "Roll number must be alphanumeric"),
  branch: z.string().min(1, "Select a branch"),
  yearOfStudy: z.enum(["1st", "2nd", "3rd", "4th"]),
  department: z.string().min(2, "Department is required"),
  dateOfBirth: z.string().min(1, "Date of birth is required"),
  personalEmail: z.string().email("Invalid email"),
  collegeEmail: z.string().email("Invalid email").optional().or(z.literal("")),
  phoneNumber: z.string().optional(),
  activeSubjects: z
    .array(subjectSchema)
    .min(1, "Add at least one subject")
    .max(8, "Maximum 8 subjects allowed"),
});

// ─── Document Generation Forms ────────────────────────────────────────────────

export const congratulationsSchema = z.object({
  memberIds: z.array(z.string()).min(1, "Select at least one member"),
  issueDate: z.string().min(1, "Issue date is required"),
  eventName: z.string().min(2, "Event name is required"),
  eventLocation: z.string().min(2, "Event location is required"),
  eventDates: z.string().min(2, "Event dates are required"),
  achievement: z.string().min(2, "Achievement is required"),
});

export const quizProRateSchema = z.object({
  memberIds: z.array(z.string()).min(1, "Select at least one member"),
  issueDate: z.string().min(1, "Issue date is required"),
  eventName: z.string().min(2, "Event name is required"),
  eventVenue: z.string().min(2, "Event venue is required"),
  eventStartDate: z.string().min(1, "Start date is required"),
  eventEndDate: z.string().min(1, "End date is required"),
  quizDates: z.array(
    z.object({
      date: z.string().min(1, "Quiz date is required"),
      label: z.string().min(1, "Annexure label is required"),
      memberSubjects: z.record(
        z.string(), // memberId
        z.object({ subjectName: z.string(), subjectCode: z.string() })
      ),
    })
  ).min(1, "Add at least one quiz date"),
});

export const attendanceSchema = z.object({
  memberIds: z.array(z.string()).min(1, "Select at least one member"),
  issueDate: z.string().min(1, "Issue date is required"),
  eventName: z.string().min(2, "Event name is required"),
  eventDate: z.string().min(1, "Event date is required"),
  eventVenue: z.string().min(2, "Event venue is required"),
});

export const lateStaySchema = z.object({
  memberIds: z.array(z.string()).min(1, "Select at least one member"),
  issueDate: z.string().min(1, "Issue date is required"),
  eventName: z.string().min(2, "Event name is required"),
  stayDate: z.string().min(1, "Stay date is required"),
  permittedUntilTime: z.string().min(1, "Time is required"),
  venue: z.string().min(2, "Venue is required"),
  kindAttentionDept: z.string().min(1, "Please select a department"),
  individualLetters: z.boolean(),
});

export const eventWriteUpSchema = z.object({
  memberIds: z.array(z.string()).min(1, "Select at least one member"),
  eventName: z.string().min(2, "Event name is required"),
  eventHost: z.string().min(2, "Event host is required"),
  eventDatesFull: z.string().min(2, "Event dates are required"),
  monthYear: z.string().min(2, "Month/Year is required"),
  introParagraph: z.string().min(10, "Intro paragraph is required"),
  resultsSection: z.string().min(10, "Results section is required"),
  closingParagraph: z.string().min(10, "Closing paragraph is required"),
  language: z.enum(["English", "Hindi"]),
  generateBoth: z.boolean(),
});

// ─── Global Settings ──────────────────────────────────────────────────────────

export const globalSettingsSchema = z.object({
  clubName: z.string().min(2),
  institutionFull: z.string().min(2),
  institutionShort: z.string().min(2),
  city: z.string().min(2),
  clubHeadName: z.string().min(2),
  facultyCoordinator1: z.string().min(2),
  facultyCoordinator2: z.string().min(2),
  directorName: z.string().optional(),
  departmentName: z.string().min(2),
  defaultLanguage: z.string().default("English"),
});

// ─── User Management ──────────────────────────────────────────────────────────

export const createUserSchema = z.object({
  email: z.string().email(),
  fullName: z.string().min(2),
  role: z.enum(["ADMIN", "COORDINATOR", "MEMBER"]),
  password: z.string().min(8),
});

export type MemberRegistrationData = z.infer<typeof memberRegistrationSchema>;
export type CongratulationsData = z.infer<typeof congratulationsSchema>;
export type QuizProRateData = z.infer<typeof quizProRateSchema>;
export type AttendanceData = z.infer<typeof attendanceSchema>;
export type LateStayData = z.infer<typeof lateStaySchema>;
export type EventWriteUpData = z.infer<typeof eventWriteUpSchema>;
export type GlobalSettingsData = z.infer<typeof globalSettingsSchema>;
export type CreateUserData = z.infer<typeof createUserSchema>;
export type LoginData = z.infer<typeof loginSchema>;
