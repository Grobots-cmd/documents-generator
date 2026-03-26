"use client";

import { useSession } from "next-auth/react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import {
  Trophy, GraduationCap, Clock, FileSignature,
  FileText, ArrowRight, Zap
} from "lucide-react";

const docTypes = [
  { href: "/generate/congratulations", label: "Congratulations Letter", icon: Trophy, color: "from-yellow-500/20 to-orange-500/20 border-yellow-500/30" },
  { href: "/generate/quiz-prorate", label: "Quiz Pro-Rate", icon: GraduationCap, color: "from-blue-500/20 to-cyan-500/20 border-blue-500/30" },
  { href: "/generate/attendance", label: "Attendance Certificate", icon: FileText, color: "from-green-500/20 to-emerald-500/20 border-green-500/30" },
  { href: "/generate/late-stay", label: "Late Stay Permission", icon: Clock, color: "from-purple-500/20 to-pink-500/20 border-purple-500/30" },
  { href: "/generate/event-writeup", label: "Event Write-Up", icon: FileSignature, color: "from-red-500/20 to-rose-500/20 border-red-500/30" },
];

export default function DashboardPage() {
  const { data: session } = useSession();
  const role = (session?.user as { role?: string })?.role;

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2 mb-2">
          <div className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
          <Badge variant="secondary" className="text-xs">
            {role === "ADMIN" ? "Administrator" : "Coordinator"}
          </Badge>
        </div>
        <h1 className="text-3xl font-bold bg-gradient-to-r from-white to-white/60 bg-clip-text text-transparent">
          Welcome back, {session?.user?.name?.split(" ")[0]} 👋
        </h1>
        <p className="text-muted-foreground mt-1">
          Generate official documents for SRMCEM Robotics Club events.
        </p>
      </div>

      {/* Quick Generate */}
      <section>
        <div className="flex items-center gap-2 mb-4">
          <Zap className="w-4 h-4 text-cyan-400" />
          <h2 className="text-lg font-semibold">Quick Generate</h2>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {docTypes.map(({ href, label, icon: Icon, color }) => (
            <Link key={href} href={href}>
              <Card className={`border bg-gradient-to-br ${color} hover:scale-[1.02] transition-all duration-200 cursor-pointer group`}>
                <CardContent className="p-5">
                  <div className="flex items-start justify-between">
                    <Icon className="w-6 h-6 text-foreground/80 flex-shrink-0" />
                    <ArrowRight className="w-4 h-4 text-muted-foreground group-hover:text-foreground group-hover:translate-x-1 transition-all duration-200" />
                  </div>
                  <p className="mt-3 font-semibold text-sm leading-tight">{label}</p>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      </section>

      {/* Recent Activity placeholder */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">Recent Documents</h2>
          <Button variant="ghost" size="sm" asChild>
            <Link href="/my-documents">View all <ArrowRight className="w-3 h-3 ml-1" /></Link>
          </Button>
        </div>
        <Card className="border border-white/10 bg-card/50">
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <FileText className="w-10 h-10 text-muted-foreground/40 mb-3" />
            <p className="text-muted-foreground text-sm">No documents generated yet.</p>
            <p className="text-muted-foreground/60 text-xs mt-1">Your recent documents will appear here.</p>
          </CardContent>
        </Card>
      </section>
    </div>
  );
}
