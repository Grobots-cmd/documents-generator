import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import bcrypt from "bcryptjs";
import "dotenv/config";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter });

// Default LaTeX templates (simplified — admins can replace via the UI)
const CONGRATULATIONS_TEMPLATE = String.raw`
\documentclass[12pt,a4paper]{article}
\usepackage[a4paper, margin=2.5cm]{geometry}
\usepackage[T1]{fontenc}
\usepackage[utf8]{inputenc}
\usepackage{array}
\usepackage{booktabs}
\usepackage{tabularx}
\usepackage{graphicx}
\usepackage{fancyhdr}
\usepackage{parskip}
\usepackage{hyperref}
\usepackage{ulem}

\pagestyle{fancy}
\fancyhf{}
\renewcommand{\headrulewidth}{0.4pt}
\lhead{\textbf{{{club_name}}}}
\rhead{{{institution_short}}}

\begin{document}

\begin{center}
  {\LARGE \textbf{{{institution_name}}}}\\[4pt]
  {\large \textbf{{{club_name}}}}\\[2pt]
  \textit{{{department_name}} Department}
\end{center}

\vspace{0.5cm}
\noindent
\textbf{Ref No:} {{ref_number}} \hfill \textbf{Date:} {{issue_date}}

\vspace{0.3cm}
\noindent To,\\
The Director,\\
{{institution_name}},\\
{{city}}.

\vspace{0.5cm}
\noindent \textbf{Subject:} \uline{Congratulations Letter for {{member_name}} — {{event_name}}}

\vspace{0.4cm}
\noindent Sir/Ma'am,

We are delighted to inform you that \textbf{{{member_name}}} (Roll No: {{member_roll}}, {{member_branch}}, {{member_year}} Year), a member of the \textbf{{{club_name}}}, has represented our institution at \textbf{{{event_name}}} held at \textbf{{{event_location}}} during \textbf{{{event_dates}}} and has achieved \textbf{{{achievement}}}.

We extend our heartfelt congratulations to the student and thank the institute for its continued support.

\vspace{1cm}
\noindent
\begin{tabular}{p{5cm}p{5cm}p{5cm}}
\textbf{{{club_head_name}}} & \textbf{{{faculty_coordinator_1}}} & \textbf{{{faculty_coordinator_2}}} \\
(Head of Robotics Club) & \multicolumn{2}{l}{Faculty Coordinators, {{club_name}}} \\
\end{tabular}

\vspace{1.5cm}
\noindent
\rule{6cm}{0.4pt}\\
Director\\
{{institution_name}}

\end{document}
`;

const QUIZ_PRORATE_TEMPLATE = String.raw`
\documentclass[12pt,a4paper]{article}
\usepackage[a4paper, margin=2.5cm]{geometry}
\usepackage[T1]{fontenc}
\usepackage[utf8]{inputenc}
\usepackage{array}
\usepackage{booktabs}
\usepackage{tabularx}
\usepackage{graphicx}
\usepackage{fancyhdr}
\usepackage{parskip}
\usepackage{longtable}
\usepackage{ulem}

\pagestyle{fancy}
\fancyhf{}
\renewcommand{\headrulewidth}{0.4pt}
\lhead{\textbf{{{club_name}}}}
\rhead{{{institution_short}}}

\begin{document}

\begin{center}
  {\LARGE \textbf{{{institution_name}}}}\\[4pt]
  {\large \textbf{{{club_name}}}}\\[2pt]
\end{center}

\vspace{0.5cm}
\noindent
\textbf{Ref No:} {{ref_number}} \hfill \textbf{Date:} {{issue_date}}

\vspace{0.3cm}
\noindent To,\\
{{director_name}},\\
The Director,\\
{{institution_name}},\\
{{city}}.

\vspace{0.5cm}
\noindent \textbf{Subject:} \uline{Request for Quiz Pro-Rate/Weightage for students who missed quiz due to club participation at {{event_name}}}

\vspace{0.4cm}
\noindent Sir/Ma'am,

It is to inform you that the students listed in the Annexure below represented our institution at \textbf{{{event_name}}} held at \textbf{{{event_venue}}} from \textbf{{{event_start_date}}} to \textbf{{{event_end_date}}} and consequently missed their quiz scheduled on \textbf{{{quiz_dates}}}.

We humbly request that appropriate pro-rate/weightage be granted to these students for the missed quiz.

\vspace{0.5cm}
\noindent \textbf{Annexure — Students List}

\vspace{0.3cm}
\begin{longtable}{|c|p{4cm}|p{3cm}|p{4cm}|p{2cm}|}
\hline
\textbf{S.No.} & \textbf{Name} & \textbf{Roll No.} & \textbf{Subject} & \textbf{Code} \\
\hline
\endhead
{{#each members}}
{{s_no}} & {{member_name}} & {{member_roll}} & {{subject_name}} & {{subject_code}} \\
\hline
{{/each}}
\end{longtable}

\vspace{1cm}
\noindent
\begin{tabular}{p{5cm}p{5cm}p{5cm}}
\textbf{{{club_head_name}}} & \textbf{{{faculty_coordinator_1}}} & \textbf{{{faculty_coordinator_2}}} \\
(Head of Robotics Club) & \multicolumn{2}{l}{Faculty Coordinators} \\
\end{tabular}

\end{document}
`;

const ATTENDANCE_TEMPLATE = String.raw`
\documentclass[12pt,a4paper]{article}
\usepackage[a4paper, margin=2.5cm]{geometry}
\usepackage[T1]{fontenc}
\usepackage[utf8]{inputenc}
\usepackage{fancyhdr}
\usepackage{parskip}
\usepackage{ulem}

\pagestyle{fancy}
\fancyhf{}
\renewcommand{\headrulewidth}{0.4pt}
\lhead{\textbf{{{club_name}}}}
\rhead{{{institution_short}}}

\begin{document}

\begin{center}
  {\LARGE \textbf{{{institution_name}}}}\\[4pt]
  {\large \textbf{{{club_name}}}}\\[2pt]
\end{center}

\vspace{0.5cm}
\noindent \textbf{Ref No:} {{ref_number}} \hfill \textbf{Date:} {{issue_date}}

\vspace{1cm}
\begin{center}
  {\Large \textbf{CERTIFICATE OF ATTENDANCE}}
\end{center}

\vspace{0.5cm}
\noindent This is to certify that \textbf{{{member_name}}} (Roll No: \textbf{{{member_roll}}}, {{member_branch}}, {{member_year}} Year) attended/participated in \textbf{{{event_name}}} held at \textbf{{{event_venue}}} on \textbf{{{event_date}}}.

\vspace{1cm}
\noindent
\begin{tabular}{p{5cm}p{5cm}p{5cm}}
\textbf{{{coordinator_name}}} & \textbf{{{club_head_name}}} & \\
Coordinator & Head of Robotics Club & \\
\end{tabular}

\vspace{1cm}
\noindent
\textbf{{{faculty_coordinator_1}}} \quad | \quad \textbf{{{faculty_coordinator_2}}}\\
Faculty Coordinators, {{club_name}}

\end{document}
`;

const LATE_STAY_TEMPLATE = String.raw`
\documentclass[12pt,a4paper]{article}
\usepackage[a4paper, margin=2.5cm]{geometry}
\usepackage[T1]{fontenc}
\usepackage[utf8]{inputenc}
\usepackage{fancyhdr}
\usepackage{parskip}
\usepackage{ulem}

\pagestyle{fancy}
\fancyhf{}
\renewcommand{\headrulewidth}{0.4pt}
\lhead{\textbf{{{club_name}}}}
\rhead{{{institution_short}}}

\begin{document}

\begin{center}
  {\LARGE \textbf{{{institution_name}}}}\\[4pt]
  {\large \textbf{{{club_name}}}}\\[2pt]
\end{center}

\noindent \textbf{Ref No:} {{ref_number}} \hfill \textbf{Date:} {{issue_date}}

\vspace{0.5cm}
\noindent To,\\
The Security In-Charge,\\
{{institution_name}},\\
{{city}}.

\vspace{0.5cm}
\noindent \textbf{Subject:} \uline{Permission for Late Stay on {{stay_date}}}

\vspace{0.4cm}
\noindent Sir/Ma'am,

This is to inform you that \textbf{{{member_name}}} (Roll No: {{member_roll}}, {{member_branch}}) is permitted to stay on campus until \textbf{{{permitted_until_time}}} on \textbf{{{stay_date}}} at \textbf{{{venue}}} for the purpose of club activity: \textbf{{{event_name}}}.

Kindly allow the student access to the campus premises as required.

\vspace{1cm}
\noindent
\begin{tabular}{p{5cm}p{5cm}p{5cm}}
\textbf{{{club_head_name}}} & \textbf{{{faculty_coordinator_1}}} & \textbf{{{faculty_coordinator_2}}} \\
Head of Robotics Club & \multicolumn{2}{l}{Faculty Coordinators} \\
\end{tabular}

\end{document}
`;

const EVENT_WRITEUP_EN_TEMPLATE = String.raw`
\documentclass[12pt,a4paper]{article}
\usepackage[a4paper, margin=2.5cm]{geometry}
\usepackage[T1]{fontenc}
\usepackage[utf8]{inputenc}
\usepackage{fancyhdr}
\usepackage{parskip}
\usepackage{setspace}

\pagestyle{fancy}
\fancyhf{}
\renewcommand{\headrulewidth}{0.4pt}
\lhead{\textbf{{{club_name}}}}
\rhead{{{institution_short}}}

\begin{document}
\onehalfspacing

\begin{center}
  {\LARGE \textbf{{{event_name}}}}\\[4pt]
  {\large \textbf{Event Write-Up}}\\[2pt]
  {\normalsize {{institution_full}} $|$ {{city}} $|$ {{month_year}}}
\end{center}

\vspace{0.5cm}
{{intro_paragraph}}

\vspace{0.4cm}
\noindent \textbf{Team Members:}\\
{{team_members_list}}

\vspace{0.4cm}
\noindent \textbf{Event Details:}\\
{{event_name}} was organized by \textbf{{{event_host}}} and was held from \textbf{{{event_dates_full}}}.

\vspace{0.4cm}
\noindent \textbf{Results \& Achievements:}\\
{{results_section}}

\vspace{0.4cm}
{{closing_paragraph}}

\end{document}
`;

const EVENT_WRITEUP_HI_TEMPLATE = String.raw`
\documentclass[12pt,a4paper]{article}
\usepackage[a4paper, margin=2.5cm]{geometry}
\usepackage{fontspec}
\usepackage{polyglossia}
\setmainlanguage{hindi}
\setotherlanguage{english}
\newfontfamily\devanagarifont[Script=Devanagari]{Noto Serif Devanagari}
\usepackage{fancyhdr}
\usepackage{parskip}

\pagestyle{fancy}
\fancyhf{}
\lhead{\textbf{{{club_name}}}}
\rhead{{{institution_short}}}

\begin{document}

\begin{center}
  {\LARGE \textbf{{{event_name}}}}\\[4pt]
  {\large \textbf{कार्यक्रम रिपोर्ट}}\\[2pt]
  {\normalsize {{institution_full}} $|$ {{city}} $|$ {{month_year}}}
\end{center}

\vspace{0.5cm}
{{intro_paragraph}}

\vspace{0.4cm}
\noindent \textbf{दल के सदस्य:}\\
{{team_members_list}}

\vspace{0.4cm}
{{results_section}}

\vspace{0.4cm}
{{closing_paragraph}}

\end{document}
`;

async function main() {
  console.log("🌱 Seeding database...");

  // Global settings
  await prisma.globalSettings.upsert({
    where: { id: "singleton" },
    update: {},
    create: {
      id: "singleton",
      clubName: "SRMCEM Robotics Club",
      institutionFull: "Sri Ram Swarup Memorial College of Engineering & Management",
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
  console.log("✅ Global settings seeded");

  // Default admin user
  const passwordHash = await bcrypt.hash("Admin@123", 12);
  const admin = await prisma.user.upsert({
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
  console.log("✅ Admin user seeded:", admin.email);

  // Default coordinator
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
  console.log("✅ Coordinator user seeded");

  // Seed default LaTeX templates
  const templates = [
    { type: "CONGRATULATIONS" as const, name: "Congratulations Letter", content: CONGRATULATIONS_TEMPLATE },
    { type: "QUIZ_PRORATE" as const, name: "Quiz Pro-Rate / Weightage Request", content: QUIZ_PRORATE_TEMPLATE },
    { type: "ATTENDANCE" as const, name: "Event Attendance Certificate", content: ATTENDANCE_TEMPLATE },
    { type: "LATE_STAY" as const, name: "Late Stay / Overnight Permission", content: LATE_STAY_TEMPLATE },
    { type: "EVENT_WRITEUP_EN" as const, name: "Event Write-Up (English)", content: EVENT_WRITEUP_EN_TEMPLATE },
    { type: "EVENT_WRITEUP_HI" as const, name: "Event Write-Up (Hindi)", content: EVENT_WRITEUP_HI_TEMPLATE },
  ];

  for (const tmpl of templates) {
    await prisma.documentTemplate.upsert({
      where: { type: tmpl.type },
      update: {},
      create: { ...tmpl, version: 1, updatedBy: "System" },
    });
    console.log(`✅ Template seeded: ${tmpl.name}`);
  }

  console.log("\n🎉 Seeding complete!");
  console.log("   Admin:       admin@srmcem.ac.in  /  Admin@123");
  console.log("   Coordinator: coordinator@srmcem.ac.in  /  Coord@123");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
