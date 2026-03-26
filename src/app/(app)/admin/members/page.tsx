"use client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { CheckCircle2, XCircle, Search, Upload, UserPlus, Users } from "lucide-react";
import { toast } from "sonner";
import Link from "next/link";

interface Member { id: string; fullName: string; rollNumber: string; branch: string; yearOfStudy: string; status: string; personalEmail: string; createdAt: string; }

const statusColors: Record<string, string> = {
  ACTIVE: "bg-green-500/15 text-green-400 border-green-500/30",
  PENDING: "bg-yellow-500/15 text-yellow-400 border-yellow-500/30",
  INACTIVE: "bg-white/10 text-muted-foreground border-white/20",
};

export default function AdminMembersPage() {
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<string | null>(null);
  const queryClient = useQueryClient();

  const { data: members = [], isLoading } = useQuery<Member[]>({
    queryKey: ["admin-members", filter],
    queryFn: async () => {
      const url = filter ? `/api/members?status=${filter}` : "/api/members";
      const res = await fetch(url);
      const json = await res.json();
      return json.data || [];
    },
  });

  const updateStatus = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const res = await fetch(`/api/members/${id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ status }) });
      if (!res.ok) throw new Error("Failed");
      return res.json();
    },
    onSuccess: () => { toast.success("Status updated"); queryClient.invalidateQueries({ queryKey: ["admin-members"] }); },
    onError: () => toast.error("Failed to update status"),
  });

  const filtered = members.filter(m =>
    m.fullName.toLowerCase().includes(search.toLowerCase()) ||
    m.rollNumber.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center">
            <Users className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">Members</h1>
            <p className="text-muted-foreground text-sm">Manage club member registrations</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" className="border-white/15" asChild>
            <Link href="/admin/members/import"><Upload className="w-4 h-4 mr-2" />Import CSV</Link>
          </Button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input placeholder="Search by name or roll number..." className="pl-9 border-white/15" value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <div className="flex gap-2">
          {[null, "ACTIVE", "PENDING", "INACTIVE"].map(s => (
            <Button key={s ?? "all"} variant={filter === s ? "default" : "outline"} size="sm"
              className={filter === s ? "bg-cyan-500/20 text-cyan-400 border-cyan-500/30" : "border-white/15"}
              onClick={() => setFilter(s)}>
              {s ?? "All"}
            </Button>
          ))}
        </div>
      </div>

      <Card className="border border-white/10 bg-card/50">
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="border-white/10 hover:bg-transparent">
                <TableHead>Name</TableHead>
                <TableHead>Roll No.</TableHead>
                <TableHead>Branch / Year</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading && Array.from({ length: 5 }).map((_, i) => (
                <TableRow key={i} className="border-white/10">
                  {Array.from({ length: 6 }).map((_, j) => <TableCell key={j}><Skeleton className="h-4 w-full" /></TableCell>)}
                </TableRow>
              ))}
              {!isLoading && filtered.map(m => (
                <TableRow key={m.id} className="border-white/10 hover:bg-white/5">
                  <TableCell className="font-medium">{m.fullName}</TableCell>
                  <TableCell className="font-mono text-sm text-muted-foreground">{m.rollNumber}</TableCell>
                  <TableCell className="text-sm">{m.branch} · {m.yearOfStudy} Year</TableCell>
                  <TableCell className="text-sm text-muted-foreground">{m.personalEmail}</TableCell>
                  <TableCell>
                    <Badge variant="outline" className={statusColors[m.status]}>{m.status}</Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-2">
                      {m.status === "PENDING" && (
                        <>
                          <Button size="sm" variant="ghost" className="h-7 px-2 text-green-400 hover:bg-green-500/10"
                            onClick={() => updateStatus.mutate({ id: m.id, status: "ACTIVE" })}>
                            <CheckCircle2 className="w-4 h-4 mr-1" />Approve
                          </Button>
                          <Button size="sm" variant="ghost" className="h-7 px-2 text-destructive hover:bg-destructive/10"
                            onClick={() => updateStatus.mutate({ id: m.id, status: "INACTIVE" })}>
                            <XCircle className="w-4 h-4 mr-1" />Reject
                          </Button>
                        </>
                      )}
                      {m.status === "ACTIVE" && (
                        <Button size="sm" variant="ghost" className="h-7 px-2 text-muted-foreground"
                          onClick={() => updateStatus.mutate({ id: m.id, status: "INACTIVE" })}>
                          Deactivate
                        </Button>
                      )}
                      {m.status === "INACTIVE" && (
                        <Button size="sm" variant="ghost" className="h-7 px-2 text-cyan-400 hover:bg-cyan-500/10"
                          onClick={() => updateStatus.mutate({ id: m.id, status: "ACTIVE" })}>
                          Reactivate
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
              {!isLoading && filtered.length === 0 && (
                <TableRow className="border-white/10">
                  <TableCell colSpan={6} className="text-center py-12 text-muted-foreground">No members found.</TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
