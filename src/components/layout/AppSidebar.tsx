"use client";

import { signOut, useSession } from "next-auth/react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  Bot, LayoutDashboard, FileText, History, Users, Settings,
  ShieldCheck, ScrollText, LogOut, Menu, X, FileType, ChevronRight, UserCircle
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
      { href: "/generate/congratulations", label: "Congratulations Letter" },
      { href: "/generate/quiz-prorate", label: "Quiz Pro-Rate" },
      { href: "/generate/attendance", label: "Attendance Certificate" },
      { href: "/generate/late-stay", label: "Late Stay Permission" },
      { href: "/generate/event-writeup", label: "Event Write-Up" },
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

function NavItem({ item, pathname, depth = 0 }: {
  item: typeof coordinatorNav[0] & { children?: { href: string; label: string }[] };
  pathname: string;
  depth?: number;
}) {
  const [open, setOpen] = useState(() => item.children?.some(c => pathname.startsWith(c.href)) ?? false);

  if (item.children) {
    return (
      <div>
        <button
          onClick={() => setOpen(!open)}
          className={cn(
            "w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-all duration-200",
            "text-muted-foreground hover:text-foreground hover:bg-white/5",
            open && "text-foreground bg-white/5"
          )}
        >
          {item.icon && <item.icon className="w-4 h-4 flex-shrink-0" />}
          <span className="flex-1 text-left">{item.label}</span>
          <ChevronRight className={cn("w-3 h-3 transition-transform", open && "rotate-90")} />
        </button>
        {open && (
          <div className="ml-7 mt-1 space-y-1 border-l border-white/10 pl-3">
            {item.children.map((child) => (
              <Link
                key={child.href}
                href={child.href}
                className={cn(
                  "block px-3 py-1.5 rounded-lg text-sm transition-all duration-200",
                  pathname === child.href
                    ? "text-cyan-400 bg-cyan-400/10 font-medium"
                    : "text-muted-foreground hover:text-foreground hover:bg-white/5"
                )}
              >
                {child.label}
              </Link>
            ))}
          </div>
        )}
      </div>
    );
  }

  const href = (item as { href: string }).href;
  return (
    <Link
      href={href}
      className={cn(
        "flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-all duration-200",
        pathname === href || pathname.startsWith(href + "/")
          ? "text-cyan-400 bg-cyan-400/10 font-medium shadow-sm"
          : "text-muted-foreground hover:text-foreground hover:bg-white/5",
        depth > 0 && "py-1.5 text-xs"
      )}
    >
      {item.icon && <item.icon className="w-4 h-4 flex-shrink-0" />}
      {item.label}
    </Link>
  );
}

export function AppSidebar() {
  const { data: session } = useSession();
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  const role = (session?.user as { role?: string })?.role;
  const initials = session?.user?.name?.split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase() || "RC";

  const sidebarContent = (
    <aside className="flex flex-col h-full bg-card/50 backdrop-blur-xl border-r border-white/10 w-64">
      {/* Logo */}
      <div className="p-6 pb-4">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-cyan-400 to-blue-600 flex items-center justify-center shadow-lg shadow-cyan-500/20 flex-shrink-0">
            <Bot className="w-5 h-5 text-white" />
          </div>
          <div className="min-w-0">
            <p className="font-bold text-sm leading-tight">SRMCEM Robotics</p>
            <p className="text-xs text-muted-foreground leading-tight">Doc Generator</p>
          </div>
        </div>
      </div>

      <Separator className="opacity-10" />

      {/* Navigation */}
      <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
        {coordinatorNav.map((item) => (
          <NavItem key={item.label} item={item} pathname={pathname} />
        ))}

        {role === "ADMIN" && (
          <>
            <div className="pt-4 pb-2">
              <p className="px-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Administration</p>
            </div>
            {adminNav.map((item) => (
              <NavItem key={item.href} item={item} pathname={pathname} />
            ))}
          </>
        )}
      </nav>

      <Separator className="opacity-10" />

      {/* User info */}
      <div className="p-4">
        <div className="flex items-center gap-3 p-3 rounded-xl bg-white/5 border border-white/10">
          <Avatar className="w-8 h-8 flex-shrink-0">
            <AvatarFallback className="bg-gradient-to-br from-cyan-400 to-blue-600 text-white text-xs font-bold">
              {initials}
            </AvatarFallback>
          </Avatar>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-medium truncate">{session?.user?.name}</p>
            <Badge variant="secondary" className="text-xs px-1.5 py-0 mt-0.5 capitalize">
              {role?.toLowerCase() || "member"}
            </Badge>
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="w-7 h-7 text-muted-foreground hover:text-destructive flex-shrink-0"
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
      {/* Desktop sidebar */}
      <div className="hidden md:flex h-screen sticky top-0 flex-shrink-0">
        {sidebarContent}
      </div>

      {/* Mobile toggle */}
      <div className="md:hidden fixed top-4 left-4 z-50">
        <Button
          variant="outline"
          size="icon"
          className="bg-card/90 backdrop-blur border-white/10"
          onClick={() => setMobileOpen(!mobileOpen)}
        >
          {mobileOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
        </Button>
      </div>

      {/* Mobile sidebar */}
      {mobileOpen && (
        <div className="md:hidden fixed inset-0 z-40 flex">
          <div className="w-64 h-full">{sidebarContent}</div>
          <div className="flex-1 bg-black/60 backdrop-blur-sm" onClick={() => setMobileOpen(false)} />
        </div>
      )}
    </>
  );
}
