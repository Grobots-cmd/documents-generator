"use client";
import { useState } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { lateStaySchema, type LateStayData } from "@/lib/validators";
import { MemberSelect } from "@/components/forms/MemberSelect";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Clock, Loader2, Download, FileText } from "lucide-react";
import { toast } from "sonner";

export default function LateStayPage() {
  const [loading, setLoading] = useState(false);
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);

  const { register, handleSubmit, control, formState: { errors } } = useForm<LateStayData>({
    resolver: zodResolver(lateStaySchema),
    defaultValues: { memberIds: [], issueDate: new Date().toISOString().split("T")[0], individualLetters: false },
  });

  const onSubmit = async (data: LateStayData) => {
    setLoading(true); setPdfUrl(null);
    try {
      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          docType: "LATE_STAY",
          memberIds: data.memberIds,
          issueDate: data.issueDate,
          eventDetails: { event_name: data.eventName, stay_date: data.stayDate, permitted_until_time: data.permittedUntilTime, venue: data.venue },
        }),
      });
      const json = await res.json();
      if (!res.ok) { toast.error(json.error || "Generation failed"); return; }
      toast.success("Permission letter generated!"); setPdfUrl(json.data.cloudinaryUrl);
    } catch { toast.error("Network error."); } finally { setLoading(false); }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-400/20 to-pink-500/20 border border-purple-500/30 flex items-center justify-center">
          <Clock className="w-5 h-5 text-purple-400" />
        </div>
        <div>
          <h1 className="text-2xl font-bold">Late Stay / Overnight Permission</h1>
          <p className="text-muted-foreground text-sm">Request campus stay permission for club activities</p>
        </div>
      </div>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <Card className="border border-white/10 bg-card/50">
          <CardHeader><CardTitle className="text-base">Member Selection</CardTitle></CardHeader>
          <CardContent>
            <Controller name="memberIds" control={control} render={({ field }) => (
              <MemberSelect value={field.value} onChange={field.onChange} label="Select members" />
            )} />
          </CardContent>
        </Card>
        <Card className="border border-white/10 bg-card/50">
          <CardHeader><CardTitle className="text-base">Stay Details</CardTitle></CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2"><Label>Issue Date</Label><Input type="date" {...register("issueDate")} className="border-white/15" /></div>
            <div className="space-y-2"><Label>Event / Activity Name</Label><Input placeholder="e.g. Robot Assembly for TECHNEX" {...register("eventName")} className="border-white/15" /></div>
            <div className="space-y-2"><Label>Stay Date</Label><Input type="date" {...register("stayDate")} className="border-white/15" /></div>
            <div className="space-y-2"><Label>Permitted Until (Time)</Label><Input type="time" {...register("permittedUntilTime")} className="border-white/15" /></div>
            <div className="space-y-2 md:col-span-2"><Label>Venue</Label><Input placeholder="e.g. Workshop, Block C" {...register("venue")} className="border-white/15" /></div>
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
