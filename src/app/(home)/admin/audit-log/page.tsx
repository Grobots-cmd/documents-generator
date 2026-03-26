"use client";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { ScrollText, Search, ExternalLink } from "lucide-react";

interface LogEntry {
  id: string;
  timestamp: string;
  documentType: string;
  eventName: string;
  generatedByName: string;
  pdfFileName: string;
  refNumber: string;
  cloudinaryUrl?: string;
  templateVersion: number;
  ipAddress?: string;
}

const docTypeLabel: Record<string, string> = {
  CONGRATULATIONS: "Congratulations",
  QUIZ_PRORATE: "Quiz Pro-Rate",
  ATTENDANCE: "Attendance",
  LATE_STAY: "Late Stay",
  EVENT_WRITEUP_EN: "Write-Up (EN)",
  EVENT_WRITEUP_HI: "Write-Up (HI)",
};

const docTypeColor: Record<string, string> = {
  CONGRATULATIONS: "bg-yellow-500/15 text-yellow-400 border-yellow-500/30",
  QUIZ_PRORATE: "bg-blue-500/15 text-blue-400 border-blue-500/30",
  ATTENDANCE: "bg-emerald-500/15 text-emerald-400 border-emerald-500/30",
  LATE_STAY: "bg-purple-500/15 text-purple-400 border-purple-500/30",
  EVENT_WRITEUP_EN: "bg-rose-500/15 text-rose-400 border-rose-500/30",
  EVENT_WRITEUP_HI: "bg-orange-500/15 text-orange-400 border-orange-500/30",
};

export default function AuditLogPage() {
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [docType, setDocType] = useState("");

  const { data, isLoading } = useQuery({
    queryKey: ["audit-log", page, search, docType],
    queryFn: async () => {
      const params = new URLSearchParams({ page: String(page), limit: "25" });
      if (search) params.set("search", search);
      if (docType) params.set("docType", docType);
      const res = await fetch(`/api/audit-log?${params}`);
      return res.json();
    },
  });

  const logs: LogEntry[] = data?.data ?? [];
  const total: number = data?.total ?? 0;
  const totalPages = Math.ceil(total / 25);

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center">
          <ScrollText className="w-5 h-5" />
        </div>
        <div>
          <h1 className="text-2xl font-bold">Audit Log</h1>
          <p className="text-muted-foreground text-sm">Immutable record of all generated documents ({total} total)</p>
        </div>
      </div>

      <div className="flex gap-3 flex-wrap">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search by event or coordinator..."
            className="pl-9 border-white/15"
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          />
        </div>
        <select
          value={docType}
          onChange={(e) => { setDocType(e.target.value); setPage(1); }}
          className="rounded-lg border border-white/15 bg-background px-3 py-2 text-sm text-foreground cursor-pointer"
        >
          <option value="">All types</option>
          {Object.entries(docTypeLabel).map(([k, v]) => (
            <option key={k} value={k}>{v}</option>
          ))}
        </select>
      </div>

      <Card className="border border-white/10 bg-card/50">
        <CardContent className="p-0">
          {isLoading && (
            <div className="p-4 space-y-3">
              {Array.from({ length: 8 }).map((_, i) => <Skeleton key={i} className="h-14 w-full" />)}
            </div>
          )}
          {!isLoading && logs.length === 0 && (
            <p className="text-center py-16 text-muted-foreground text-sm">No entries found.</p>
          )}
          {!isLoading && logs.length > 0 && (
            <div className="divide-y divide-white/8">
              {logs.map((log) => (
                <div key={log.id} className="flex items-center gap-4 px-4 py-3 hover:bg-white/[0.02] transition-colors">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <Badge variant="outline" className={`text-xs ${docTypeColor[log.documentType] ?? ""}`}>
                        {docTypeLabel[log.documentType] ?? log.documentType}
                      </Badge>
                      <span className="font-medium text-sm truncate">{log.eventName || "—"}</span>
                    </div>
                    <div className="flex items-center gap-3 mt-1 flex-wrap">
                      <span className="text-xs font-mono text-muted-foreground">{log.refNumber}</span>
                      <span className="text-xs text-muted-foreground">{log.generatedByName}</span>
                      <span className="text-xs text-muted-foreground">
                        {new Date(log.timestamp).toLocaleString("en-GB", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" })}
                      </span>
                    </div>
                  </div>
                  {log.cloudinaryUrl && (
                    <a
                      href={log.cloudinaryUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1.5 text-xs text-cyan-400 hover:text-cyan-300 transition-colors flex-shrink-0"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                      Open
                    </a>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <button disabled={page === 1} onClick={() => setPage(p => p - 1)}
            className="px-3 py-1.5 text-xs rounded-lg border border-white/15 text-muted-foreground hover:text-foreground hover:bg-white/5 disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer">
            Previous
          </button>
          <span className="text-xs text-muted-foreground">Page {page} of {totalPages}</span>
          <button disabled={page === totalPages} onClick={() => setPage(p => p + 1)}
            className="px-3 py-1.5 text-xs rounded-lg border border-white/15 text-muted-foreground hover:text-foreground hover:bg-white/5 disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer">
            Next
          </button>
        </div>
      )}
    </div>
  );
}
