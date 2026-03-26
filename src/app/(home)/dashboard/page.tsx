"use client";

import { useSession } from "next-auth/react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import {
  Trophy, GraduationCap, Clock, FileSignature,
  FileText, ArrowRight, Zap, Sparkles, ShieldCheck,
} from "lucide-react";

const docTypes = [
  {
    href: "/generate/congratulations",
    label: "Congratulations Letter",
    description: "Achievement & competition wins",
    icon: Trophy,
    from: "from-yellow-500/20",
    to: "to-orange-500/20",
    border: "border-yellow-500/20",
    iconColor: "text-yellow-400",
    glow: "shadow-yellow-500/10",
  },
  {
    href: "/generate/quiz-prorate",
    label: "Quiz Pro-Rate",
    description: "Exam duty absence letters",
    icon: GraduationCap,
    from: "from-blue-500/20",
    to: "to-cyan-500/20",
    border: "border-blue-500/20",
    iconColor: "text-blue-400",
    glow: "shadow-blue-500/10",
  },
  {
    href: "/generate/attendance",
    label: "Attendance Certificate",
    description: "Event participation record",
    icon: FileText,
    from: "from-emerald-500/20",
    to: "to-green-500/20",
    border: "border-emerald-500/20",
    iconColor: "text-emerald-400",
    glow: "shadow-emerald-500/10",
  },
  {
    href: "/generate/late-stay",
    label: "Late Stay Permission",
    description: "Overnight campus stay request",
    icon: Clock,
    from: "from-purple-500/20",
    to: "to-pink-500/20",
    border: "border-purple-500/20",
    iconColor: "text-purple-400",
    glow: "shadow-purple-500/10",
  },
  {
    href: "/generate/event-writeup",
    label: "Event Write-Up",
    description: "Event report & documentation",
    icon: FileSignature,
    from: "from-rose-500/20",
    to: "to-red-500/20",
    border: "border-rose-500/20",
    iconColor: "text-rose-400",
    glow: "shadow-rose-500/10",
  },
];

export default function DashboardPage() {
  const { data: session } = useSession();
  const role = (session?.user as { role?: string })?.role;
  const firstName = session?.user?.name?.split(" ")[0] ?? "there";

  return (
    <div className="space-y-10">

      {/* ── Header ── */}
      <div>
        <div className="flex items-center gap-2 mb-3">
          <div className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
          <Badge
            className={`text-xs border ${
              role === "ADMIN"
                ? "bg-cyan-500/15 text-cyan-400 border-cyan-500/25"
                : "bg-blue-500/15 text-blue-400 border-blue-500/25"
            }`}
          >
            {role === "ADMIN" ? (
              <><ShieldCheck className="w-3 h-3 mr-1" />Administrator</>
            ) : (
              "Coordinator"
            )}
          </Badge>
        </div>
        <h1 className="text-3xl font-bold tracking-tight flex items-center gap-3">
          Welcome back, {firstName}
          <Sparkles className="w-6 h-6 text-cyan-400/70" />
        </h1>
        <p className="text-muted-foreground mt-2 text-sm">
          Generate official documents for SRMCEM Robotics Club events.
        </p>
      </div>

      {/* ── Quick Generate ── */}
      <section>
        <div className="flex items-center gap-2 mb-5">
          <Zap className="w-4 h-4 text-cyan-400" />
          <h2 className="text-base font-semibold">Quick Generate</h2>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {docTypes.map(({ href, label, description, icon: Icon, from, to, border, iconColor, glow }) => (
            <Link key={href} href={href} className="group">
              <Card
                className={`
                  border bg-linear-to-br ${from} ${to} ${border}
                  hover:shadow-xl ${glow}
                  hover:border-white/20
                  transition-all duration-200 cursor-pointer h-full
                `}
              >
                <CardContent className="p-5">
                  <div className="flex items-start justify-between mb-3">
                    <div className={`w-9 h-9 rounded-xl bg-white/5 border border-white/8 flex items-center justify-center`}>
                      <Icon className={`w-4.5 h-4.5 ${iconColor} flex-shrink-0`} />
                    </div>
                    <ArrowRight
                      className="w-4 h-4 text-muted-foreground group-hover:text-foreground group-hover:translate-x-1 transition-all duration-200"
                    />
                  </div>
                  <p className="font-semibold text-sm leading-snug">{label}</p>
                  <p className="text-xs text-muted-foreground mt-1 leading-snug">{description}</p>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      </section>

      {/* ── Recent Documents ── */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-base font-semibold">Recent Documents</h2>
          <Link
            href="/my-documents"
            className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
          >
            View all <ArrowRight className="w-3 h-3" />
          </Link>
        </div>
        <Card className="border border-white/8 bg-white/[0.02]">
          <CardContent className="flex flex-col items-center justify-center py-14 text-center">
            <div className="w-12 h-12 rounded-2xl bg-white/[0.04] border border-white/8 flex items-center justify-center mb-4">
              <FileText className="w-6 h-6 text-muted-foreground/40" />
            </div>
            <p className="text-muted-foreground text-sm font-medium">No documents yet</p>
            <p className="text-muted-foreground/50 text-xs mt-1">
              Your generated documents will appear here
            </p>
          </CardContent>
        </Card>
      </section>
    </div>
  );
}
