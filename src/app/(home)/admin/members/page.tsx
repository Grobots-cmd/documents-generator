"use client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useRef, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { CheckCircle2, XCircle, Search, Upload, Users, FileText, Loader2 } from "lucide-react";
import { toast } from "sonner";

interface Member {
  id: string;
  fullName: string;
  rollNumber: string;
  branch: string;
  yearOfStudy: string;
  status: string;
  personalEmail: string;
  createdAt: string;
}

const statusColors: Record<string, string> = {
  ACTIVE: "bg-green-500/15 text-green-400 border-green-500/30",
  PENDING: "bg-yellow-500/15 text-yellow-400 border-yellow-500/30",
  INACTIVE: "bg-white/10 text-muted-foreground border-white/20",
};

export default function AdminMembersPage() {
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<string | null>(null);
  const [importOpen, setImportOpen] = useState(false);
  const [importFile, setImportFile] = useState<File | null>(null);
  const [importing, setImporting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
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
      const res = await fetch(`/api/members/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      if (!res.ok) throw new Error("Failed");
      return res.json();
    },
    onSuccess: () => {
      toast.success("Status updated");
      queryClient.invalidateQueries({ queryKey: ["admin-members"] });
    },
    onError: () => toast.error("Failed to update status"),
  });

  const handleImport = async () => {
    if (!importFile) return;
    setImporting(true);
    try {
      const formData = new FormData();
      formData.append("file", importFile);
      const res = await fetch("/api/members/import", { method: "POST", body: formData });
      const json = await res.json();
      if (!res.ok) {
        toast.error(json.error || "Import failed");
        return;
      }
      const { imported, skipped, errors } = json.data;
      toast.success(`Imported ${imported} members${skipped > 0 ? `, skipped ${skipped}` : ""}.`);
      if (errors?.length) {
        errors.slice(0, 3).forEach((e: string) => toast.error(e, { duration: 6000 }));
      }
      setImportOpen(false);
      setImportFile(null);
      queryClient.invalidateQueries({ queryKey: ["admin-members"] });
    } catch {
      toast.error("Network error during import.");
    } finally {
      setImporting(false);
    }
  };

  const filtered = members.filter(
    (m) =>
      m.fullName.toLowerCase().includes(search.toLowerCase()) ||
      m.rollNumber.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Header */}
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
        <Button
          variant="outline"
          size="sm"
          className="border-white/15 cursor-pointer"
          onClick={() => setImportOpen(true)}
        >
          <Upload className="w-4 h-4 mr-2" />Import CSV
        </Button>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search by name or roll number..."
            className="pl-9 border-white/15"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="flex gap-2">
          {[null, "ACTIVE", "PENDING", "INACTIVE"].map((s) => (
            <Button
              key={s ?? "all"}
              variant={filter === s ? "default" : "outline"}
              size="sm"
              className={filter === s ? "bg-cyan-500/20 text-cyan-400 border-cyan-500/30 cursor-pointer" : "border-white/15 cursor-pointer"}
              onClick={() => setFilter(s)}
            >
              {s ?? "All"}
            </Button>
          ))}
        </div>
      </div>

      {/* Table */}
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
              {isLoading &&
                Array.from({ length: 5 }).map((_, i) => (
                  <TableRow key={i} className="border-white/10">
                    {Array.from({ length: 6 }).map((_, j) => (
                      <TableCell key={j}><Skeleton className="h-4 w-full" /></TableCell>
                    ))}
                  </TableRow>
                ))}
              {!isLoading &&
                filtered.map((m) => (
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
                            <Button
                              size="sm" variant="ghost"
                              className="h-7 px-2 text-green-400 hover:bg-green-500/10 cursor-pointer"
                              onClick={() => updateStatus.mutate({ id: m.id, status: "ACTIVE" })}
                            >
                              <CheckCircle2 className="w-4 h-4 mr-1" />Approve
                            </Button>
                            <Button
                              size="sm" variant="ghost"
                              className="h-7 px-2 text-destructive hover:bg-destructive/10 cursor-pointer"
                              onClick={() => updateStatus.mutate({ id: m.id, status: "INACTIVE" })}
                            >
                              <XCircle className="w-4 h-4 mr-1" />Reject
                            </Button>
                          </>
                        )}
                        {m.status === "ACTIVE" && (
                          <Button
                            size="sm" variant="ghost"
                            className="h-7 px-2 text-muted-foreground cursor-pointer"
                            onClick={() => updateStatus.mutate({ id: m.id, status: "INACTIVE" })}
                          >
                            Deactivate
                          </Button>
                        )}
                        {m.status === "INACTIVE" && (
                          <Button
                            size="sm" variant="ghost"
                            className="h-7 px-2 text-cyan-400 hover:bg-cyan-500/10 cursor-pointer"
                            onClick={() => updateStatus.mutate({ id: m.id, status: "ACTIVE" })}
                          >
                            Reactivate
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              {!isLoading && filtered.length === 0 && (
                <TableRow className="border-white/10">
                  <TableCell colSpan={6} className="text-center py-12 text-muted-foreground">
                    No members found.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Import CSV Dialog */}
      <Dialog open={importOpen} onOpenChange={(open) => { setImportOpen(open); if (!open) setImportFile(null); }}>
        <DialogContent className="border border-white/10 bg-card max-w-md">
          <DialogHeader>
            <DialogTitle>Import Members from CSV</DialogTitle>
            <DialogDescription className="text-muted-foreground text-sm">
              Required columns: <span className="font-mono text-xs">full_name, roll_number, branch, year, dob, email, department</span>.
              Optional: <span className="font-mono text-xs">phone, subject_1_name, subject_1_code, …</span> (up to 8 subjects).
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 pt-2">
            <div className="space-y-2">
              <Label htmlFor="csv-file">CSV File</Label>
              <div
                className="border border-dashed border-white/20 rounded-lg p-6 text-center cursor-pointer hover:border-cyan-500/40 hover:bg-cyan-500/5 transition-colors"
                onClick={() => fileInputRef.current?.click()}
              >
                {importFile ? (
                  <div className="flex items-center justify-center gap-2 text-sm">
                    <FileText className="w-4 h-4 text-cyan-400" />
                    <span className="font-medium text-foreground">{importFile.name}</span>
                    <span className="text-muted-foreground">({(importFile.size / 1024).toFixed(1)} KB)</span>
                  </div>
                ) : (
                  <div className="text-muted-foreground text-sm">
                    <Upload className="w-6 h-6 mx-auto mb-2 opacity-50" />
                    Click to select a CSV file
                  </div>
                )}
              </div>
              <input
                ref={fileInputRef}
                id="csv-file"
                type="file"
                accept=".csv,text/csv"
                className="hidden"
                onChange={(e) => setImportFile(e.target.files?.[0] ?? null)}
              />
            </div>

            <div className="flex gap-3 justify-end">
              <Button
                variant="outline"
                className="border-white/15 cursor-pointer"
                onClick={() => { setImportOpen(false); setImportFile(null); }}
                disabled={importing}
              >
                Cancel
              </Button>
              <Button
                disabled={!importFile || importing}
                className="bg-cyan-500/20 text-cyan-400 border border-cyan-500/30 hover:bg-cyan-500/30 cursor-pointer"
                onClick={handleImport}
              >
                {importing ? (
                  <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Importing…</>
                ) : (
                  <><Upload className="w-4 h-4 mr-2" />Import</>
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
