"use client";
import { useState } from "react";
import { useForm, Controller, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { attendanceSchema, type AttendanceData } from "@/lib/validators";
import { MemberSelect } from "@/components/forms/MemberSelect";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { FileText, Loader2, Download } from "lucide-react";
import { toast } from "sonner";

export default function AttendancePage() {
  const [loading, setLoading] = useState(false);
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);

  const { register, handleSubmit, control, formState: { errors } } = useForm<AttendanceData>({
    resolver: zodResolver(attendanceSchema),
    defaultValues: { memberIds: [], issueDate: new Date().toISOString().split("T")[0] },
  });

  const onSubmit = async (data: AttendanceData) => {
    setLoading(true); setPdfUrl(null);
    try {
      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          docType: "ATTENDANCE",
          memberIds: data.memberIds,
          issueDate: data.issueDate,
          eventDetails: { event_name: data.eventName, event_date: data.eventDate, event_venue: data.eventVenue },
        }),
      });
      const json = await res.json();
      if (!res.ok) { toast.error(json.error || "Generation failed"); return; }
      toast.success("Certificate generated!"); setPdfUrl(json.data.cloudinaryUrl);
    } catch { toast.error("Network error."); } finally { setLoading(false); }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-green-400/20 to-emerald-500/20 border border-green-500/30 flex items-center justify-center">
          <FileText className="w-5 h-5 text-green-400" />
        </div>
        <div>
          <h1 className="text-2xl font-bold">Event Attendance Certificate</h1>
          <p className="text-muted-foreground text-sm">Certify member attendance at club events</p>
        </div>
      </div>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <Card className="border border-white/10 bg-card/50">
          <CardHeader><CardTitle className="text-base">Member Selection</CardTitle></CardHeader>
          <CardContent>
            <Controller name="memberIds" control={control} render={({ field }) => (
              <MemberSelect value={field.value} onChange={field.onChange} label="Select attendees" />
            )} />
            {errors.memberIds && <p className="text-sm text-destructive mt-2">{errors.memberIds.message}</p>}
          </CardContent>
        </Card>
        <Card className="border border-white/10 bg-card/50">
          <CardHeader><CardTitle className="text-base">Event Details</CardTitle></CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Issue Date</Label>
              <Input type="date" {...register("issueDate")} className="border-white/15" />
            </div>
            <div className="space-y-2">
              <Label>Event Name</Label>
              <Input placeholder="e.g. Gantavya 2026" {...register("eventName")} className="border-white/15" />
            </div>
            <div className="space-y-2">
              <Label>Event Date</Label>
              <Input type="date" {...register("eventDate")} className="border-white/15" />
            </div>
            <div className="space-y-2">
              <Label>Event Venue</Label>
              <Input placeholder="e.g. IIT Kanpur" {...register("eventVenue")} className="border-white/15" />
            </div>
          </CardContent>
        </Card>
        <div className="flex items-center gap-3">
          <Button type="submit" disabled={loading} className="bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white shadow-lg shadow-cyan-500/25">
            {loading ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Generating...</> : <><FileText className="w-4 h-4 mr-2" />Generate PDF</>}
          </Button>
          {pdfUrl && (
            <Button variant="outline" asChild className="border-green-500/30 text-green-400 hover:bg-green-500/10">
              <a href={pdfUrl} target="_blank" rel="noopener noreferrer"><Download className="w-4 h-4 mr-2" />Download</a>
            </Button>
          )}
        </div>
      </form>
    </div>
  );
}
