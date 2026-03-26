"use client";

import { signOut, useSession } from "next-auth/react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  Bot, LayoutDashboard, FileText, History, Users, Settings,
  ShieldCheck, ScrollText, LogOut, Menu, X, FileType,
  ChevronRight, UserCircle, Trophy, GraduationCap, Clock, FileSignature,
} from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";

const coordinatorNav = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  {
    label: "Generate Documents",
    icon: FileText,
    children: [
      { href: "/generate/congratulations", label: "Congratulations Letter", icon: Trophy },
      { href: "/generate/quiz-prorate", label: "Quiz Pro-Rate", icon: GraduationCap },
      { href: "/generate/attendance", label: "Attendance Certificate", icon: FileText },
      { href: "/generate/late-stay", label: "Late Stay Permission", icon: Clock },
      { href: "/generate/event-writeup", label: "Event Write-Up", icon: FileSignature },
    ],
  },
  { href: "/my-documents", label: "My Documents", icon: History },
];

const adminNav = [
  { href: "/admin", label: "Admin Dashboard", icon: ShieldCheck },
  { href: "/admin/members", label: "Members", icon: Users },
  { href: "/admin/templates", label: "Templates", icon: FileType },
  { href: "/admin/audit-log", label: "Audit Log", icon: ScrollText },
  { href: "/admin/users", label: "Manage Users", icon: UserCircle },
  { href: "/admin/settings", label: "Settings", icon: Settings },
];

type NavChild = { href: string; label: string; icon?: React.ComponentType<{ className?: string }> };
type NavItemType = {
  href?: string;
  label: string;
  icon?: React.ComponentType<{ className?: string }>;
  children?: NavChild[];
};

function NavItem({ item, pathname }: { item: NavItemType; pathname: string }) {
  const [open, setOpen] = useState(() =>
    item.children?.some((c) => pathname.startsWith(c.href)) ?? false
  );

  if (item.children) {
    const isGroupActive = item.children.some((c) => pathname.startsWith(c.href));
    return (
      <div>
        <button
          onClick={() => setOpen(!open)}
          className={cn(
            "w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-all duration-200 cursor-pointer",
            isGroupActive
              ? "text-foreground bg-white/8"
              : "text-muted-foreground hover:text-foreground hover:bg-white/5"
          )}
        >
          {item.icon && <item.icon className="w-4 h-4 flex-shrink-0" />}
          <span className="flex-1 text-left font-medium">{item.label}</span>
          <ChevronRight
            className={cn("w-3 h-3 transition-transform duration-200", open && "rotate-90")}
          />
        </button>
        {open && (
          <div className="ml-3.5 mt-1 space-y-0.5 border-l border-white/8 pl-3">
            {item.children.map((child) => {
              const isActive = pathname === child.href;
              return (
                <Link
                  key={child.href}
                  href={child.href}
                  className={cn(
                    "flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs transition-all duration-200 relative group",
                    isActive
                      ? "text-cyan-400 bg-cyan-500/10 font-semibold"
                      : "text-muted-foreground hover:text-foreground hover:bg-white/5"
                  )}
                >
                  {isActive && (
                    <span className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-4 bg-cyan-400 rounded-full -ml-3" />
                  )}
                  {child.icon && <child.icon className="w-3.5 h-3.5 flex-shrink-0" />}
                  {child.label}
                </Link>
              );
            })}
          </div>
        )}
      </div>
    );
  }

  const href = item.href!;
  const isActive = pathname === href || (href !== "/dashboard" && pathname.startsWith(href + "/"));

  return (
    <Link
      href={href}
      className={cn(
        "flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-all duration-200 relative",
        isActive
          ? "text-cyan-400 bg-cyan-500/10 font-semibold"
          : "text-muted-foreground hover:text-foreground hover:bg-white/5"
      )}
    >
      {isActive && (
        <span className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-5 bg-cyan-400 rounded-full" />
      )}
      {item.icon && <item.icon className="w-4 h-4 flex-shrink-0" />}
      {item.label}
    </Link>
  );
}

const roleBadgeClass: Record<string, string> = {
  ADMIN: "bg-cyan-500/15 text-cyan-400 border-cyan-500/25",
  COORDINATOR: "bg-blue-500/15 text-blue-400 border-blue-500/25",
  MEMBER: "bg-slate-500/15 text-slate-400 border-slate-500/25",
};

export function AppSidebar() {
  const { data: session } = useSession();
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  const role = (session?.user as { role?: string })?.role ?? "MEMBER";
  const initials =
    session?.user?.name?.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase() || "RC";

  const sidebarContent = (
    <aside className="flex flex-col h-full bg-[oklch(0.085_0.012_240)]/95 backdrop-blur-2xl border-r border-white/8 w-64">

      {/* ── Logo ── */}
      <div className="p-5 pb-4">
        <div className="flex items-center gap-3">
          <div className="relative flex-shrink-0">
            <div className="w-9 h-9 rounded-xl bg-linear-to-br from-cyan-400 to-blue-600 flex items-center justify-center shadow-lg shadow-cyan-500/25">
              <Bot className="w-5 h-5 text-white" />
            </div>
            <div className="absolute -inset-[3px] rounded-[14px] border border-cyan-500/20" />
          </div>
          <div className="min-w-0">
            <p className="font-bold text-sm leading-tight tracking-tight">SRMCEM Robotics</p>
            <p className="text-[11px] text-muted-foreground leading-tight mt-0.5">Doc Generator</p>
          </div>
        </div>
      </div>

      <Separator className="opacity-[0.08]" />

      {/* ── Navigation ── */}
      <nav className="flex-1 p-3 space-y-0.5 overflow-y-auto">
        {coordinatorNav.map((item) => (
          <NavItem key={item.label} item={item} pathname={pathname} />
        ))}

        {role === "ADMIN" && (
          <>
            <div className="pt-5 pb-2 px-3">
              <div className="flex items-center gap-2">
                <div className="flex-1 h-px bg-white/8" />
                <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-widest whitespace-nowrap">
                  Administration
                </p>
                <div className="flex-1 h-px bg-white/8" />
              </div>
            </div>
            {adminNav.map((item) => (
              <NavItem key={item.href} item={item} pathname={pathname} />
            ))}
          </>
        )}
      </nav>

      <Separator className="opacity-[0.08]" />

      {/* ── User card ── */}
      <div className="p-4">
        <div className="flex items-center gap-3 p-3 rounded-xl bg-white/[0.04] border border-white/8">
          <Avatar className="w-8 h-8 flex-shrink-0">
            <AvatarFallback className="bg-linear-to-br from-cyan-400 to-blue-600 text-white text-xs font-bold">
              {initials}
            </AvatarFallback>
          </Avatar>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-medium truncate leading-tight">{session?.user?.name}</p>
            <span
              className={cn(
                "inline-block text-[10px] px-1.5 py-0.5 mt-1 rounded-md border font-semibold",
                roleBadgeClass[role] ?? roleBadgeClass.MEMBER
              )}
            >
              {role.charAt(0) + role.slice(1).toLowerCase()}
            </span>
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="w-7 h-7 text-muted-foreground hover:text-destructive hover:bg-destructive/10 flex-shrink-0 transition-all duration-200 cursor-pointer"
            onClick={() => signOut({ callbackUrl: "/login" })}
            title="Sign out"
          >
            <LogOut className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </aside>
  );

  return (
    <>
      {/* Desktop sidebar — sticky full height */}
      <div className="hidden md:flex h-screen sticky top-0 flex-shrink-0">
        {sidebarContent}
      </div>

      {/* Mobile toggle */}
      <div className="md:hidden fixed top-4 left-4 z-50">
        <Button
          variant="outline"
          size="icon"
          className="bg-card/90 backdrop-blur-xl border-white/10 shadow-lg cursor-pointer"
          onClick={() => setMobileOpen(!mobileOpen)}
        >
          {mobileOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
        </Button>
      </div>

      {/* Mobile sidebar — slide in */}
      {mobileOpen && (
        <div className="md:hidden fixed inset-0 z-40 flex">
          <div
            className="w-64 h-full animate-in slide-in-from-left duration-300"
          >
            {sidebarContent}
          </div>
          <div
            className="flex-1 bg-black/60 backdrop-blur-sm"
            onClick={() => setMobileOpen(false)}
          />
        </div>
      )}
    </>
  );
}
