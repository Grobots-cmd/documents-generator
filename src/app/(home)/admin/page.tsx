"use client";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { ShieldCheck, Users, FileText, ScrollText, UserCircle } from "lucide-react";
import Link from "next/link";

export default function AdminDashboardPage() {
  const { data: membersData } = useQuery({
    queryKey: ["admin-stats-members"],
    queryFn: () => fetch("/api/members").then(r => r.json()),
  });
  const { data: logsData } = useQuery({
    queryKey: ["admin-stats-logs"],
    queryFn: () => fetch("/api/audit-log?limit=5").then(r => r.json()),
  });
  const { data: usersData } = useQuery({
    queryKey: ["admin-stats-users"],
    queryFn: () => fetch("/api/users").then(r => r.json()),
  });

  const members = membersData?.data ?? [];
  const logs = logsData?.data ?? [];
  const total = logsData?.total ?? 0;
  const users = usersData?.data ?? [];

  const activeMembers = members.filter((m: { status: string }) => m.status === "ACTIVE").length;
  const pendingMembers = members.filter((m: { status: string }) => m.status === "PENDING").length;

  const stats = [
    { label: "Total Members", value: members.length, sub: `${pendingMembers} pending approval`, icon: Users, href: "/admin/members", color: "text-cyan-400" },
    { label: "Active Members", value: activeMembers, sub: "can be selected for docs", icon: Users, href: "/admin/members", color: "text-emerald-400" },
    { label: "Documents Generated", value: total, sub: "all time", icon: FileText, href: "/admin/audit-log", color: "text-blue-400" },
    { label: "Coordinators", value: users.length, sub: "active accounts", icon: UserCircle, href: "/admin/users", color: "text-purple-400" },
  ];

  return (
    <div className="space-y-8">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center">
          <ShieldCheck className="w-5 h-5 text-cyan-400" />
        </div>
        <div>
          <h1 className="text-2xl font-bold">Admin Dashboard</h1>
          <p className="text-muted-foreground text-sm">System overview and quick access</p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((s) => (
          <Link key={s.label} href={s.href}>
            <Card className="border border-white/10 bg-card/50 hover:bg-white/[0.04] hover:border-white/20 transition-all duration-200 cursor-pointer">
              <CardContent className="p-5">
                <s.icon className={`w-5 h-5 mb-3 ${s.color}`} />
                <p className="text-2xl font-bold">{s.value}</p>
                <p className="text-sm font-medium mt-0.5">{s.label}</p>
                <p className="text-xs text-muted-foreground mt-1">{s.sub}</p>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Quick links */}
        <Card className="border border-white/10 bg-card/50">
          <CardHeader><CardTitle className="text-base">Quick Actions</CardTitle></CardHeader>
          <CardContent className="space-y-2">
            {[
              { href: "/admin/members", icon: Users, label: "Manage Members", desc: "Approve, reject, or deactivate members" },
              { href: "/admin/templates", icon: FileText, label: "Edit Templates", desc: "Update LaTeX document templates" },
              { href: "/admin/audit-log", icon: ScrollText, label: "View Audit Log", desc: "Full document generation history" },
              { href: "/admin/users", icon: UserCircle, label: "Manage Users", desc: "Add or manage coordinator accounts" },
              { href: "/admin/settings", icon: ShieldCheck, label: "Settings", desc: "Club and institution configuration" },
            ].map((item) => (
              <Link key={item.href} href={item.href} className="flex items-center gap-3 p-3 rounded-xl hover:bg-white/5 transition-colors group">
                <div className="w-8 h-8 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center flex-shrink-0">
                  <item.icon className="w-4 h-4 text-muted-foreground group-hover:text-foreground transition-colors" />
                </div>
                <div>
                  <p className="text-sm font-medium">{item.label}</p>
                  <p className="text-xs text-muted-foreground">{item.desc}</p>
                </div>
              </Link>
            ))}
          </CardContent>
        </Card>

        {/* Recent generations */}
        <Card className="border border-white/10 bg-card/50">
          <CardHeader><CardTitle className="text-base">Recent Generations</CardTitle></CardHeader>
          <CardContent>
            {logs.length === 0 && <p className="text-sm text-muted-foreground">No documents generated yet.</p>}
            <div className="space-y-3">
              {logs.map((log: { id: string; documentType: string; eventName: string; generatedByName: string; timestamp: string; refNumber: string }) => (
                <div key={log.id} className="flex items-start gap-3">
                  <div className="w-1.5 h-1.5 rounded-full bg-cyan-400 mt-2 flex-shrink-0" />
                  <div className="min-w-0">
                    <p className="text-sm font-medium truncate">{log.eventName || log.documentType}</p>
                    <p className="text-xs text-muted-foreground">
                      {log.generatedByName} · {new Date(log.timestamp).toLocaleDateString("en-GB")}
                    </p>
                    <p className="text-xs font-mono text-muted-foreground/60">{log.refNumber}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
