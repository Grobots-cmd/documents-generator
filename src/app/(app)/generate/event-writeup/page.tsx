"use client";
import { useState } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { eventWriteUpSchema, type EventWriteUpData } from "@/lib/validators";
import { MemberSelect } from "@/components/forms/MemberSelect";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { FileSignature, Loader2, Download, FileText } from "lucide-react";
import { toast } from "sonner";

export default function EventWriteUpPage() {
  const [loading, setLoading] = useState(false);
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);

  const { register, handleSubmit, control, watch, setValue, formState: { errors } } = useForm<EventWriteUpData>({
    resolver: zodResolver(eventWriteUpSchema),
    defaultValues: { memberIds: [], language: "English", generateBoth: false, monthYear: new Date().toLocaleString("en-IN", { month: "long", year: "numeric" }) },
  });

  const language = watch("language");

  const onSubmit = async (data: EventWriteUpData) => {
    setLoading(true); setPdfUrl(null);
    try {
      const docType = data.language === "Hindi" ? "EVENT_WRITEUP_HI" : "EVENT_WRITEUP_EN";
      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          docType,
          memberIds: data.memberIds,
          issueDate: new Date().toISOString().split("T")[0],
          eventDetails: {
            event_name: data.eventName, event_host: data.eventHost,
            event_dates_full: data.eventDatesFull, month_year: data.monthYear,
            intro_paragraph: data.introParagraph, results_section: data.resultsSection,
            closing_paragraph: data.closingParagraph,
          },
        }),
      });
      const json = await res.json();
      if (!res.ok) { toast.error(json.error || "Generation failed"); return; }
      toast.success("Write-up generated!"); setPdfUrl(json.data.cloudinaryUrl);
    } catch { toast.error("Network error."); } finally { setLoading(false); }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-linear-to-br from-red-400/20 to-rose-500/20 border border-rose-500/25 flex items-center justify-center">
          <FileSignature className="w-5 h-5 text-red-400" />
        </div>
        <div>
          <h1 className="text-2xl font-bold">Event Write-Up</h1>
          <p className="text-muted-foreground text-sm">Generate official event reports in English or Hindi</p>
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <Card className="border border-white/8 bg-white/[0.03]">
          <CardHeader><CardTitle className="text-base">Language & Members</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Language</Label>
              <Tabs value={language} onValueChange={(v) => setValue("language", v as "English" | "Hindi")}>
                <TabsList className="bg-white/[0.04] border border-white/8">
                  <TabsTrigger value="English">English</TabsTrigger>
                  <TabsTrigger value="Hindi">हिंदी (Hindi)</TabsTrigger>
                </TabsList>
              </Tabs>
            </div>
            <Controller name="memberIds" control={control} render={({ field }) => (
              <MemberSelect value={field.value} onChange={field.onChange} label="Select team members" />
            )} />
          </CardContent>
        </Card>

        <Card className="border border-white/8 bg-white/[0.03]">
          <CardHeader><CardTitle className="text-base">Event Information</CardTitle></CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2"><Label>Event Name</Label><Input placeholder="e.g. TECHKRITI 2026" {...register("eventName")} className="border-white/10 bg-white/[0.03]" /></div>
            <div className="space-y-2"><Label>Organised By</Label><Input placeholder="e.g. IIT Kanpur" {...register("eventHost")} className="border-white/10 bg-white/[0.03]" /></div>
            <div className="space-y-2"><Label>Event Dates</Label><Input placeholder="e.g. 19 to 22 March 2026" {...register("eventDatesFull")} className="border-white/10 bg-white/[0.03]" /></div>
            <div className="space-y-2"><Label>Month / Year</Label><Input placeholder="e.g. March 2026" {...register("monthYear")} className="border-white/10 bg-white/[0.03]" /></div>
          </CardContent>
        </Card>

        <Card className="border border-white/8 bg-white/[0.03]">
          <CardHeader><CardTitle className="text-base">Write-Up Content</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2"><Label>Introduction Paragraph</Label><Textarea placeholder="Brief introduction about the event and team's participation..." {...register("introParagraph")} rows={4} className="border-white/10 bg-white/[0.03] resize-none" /></div>
            <div className="space-y-2"><Label>Results & Achievements</Label><Textarea placeholder="Describe the results, achievements, and competition details..." {...register("resultsSection")} rows={5} className="border-white/10 bg-white/[0.03] resize-none" /></div>
            <div className="space-y-2"><Label>Closing Paragraph</Label><Textarea placeholder="Closing remarks, acknowledgements..." {...register("closingParagraph")} rows={3} className="border-white/10 bg-white/[0.03] resize-none" /></div>
          </CardContent>
        </Card>

        <div className="flex items-center gap-3">
          <Button type="submit" disabled={loading} className="bg-linear-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white shadow-lg shadow-cyan-500/20 cursor-pointer transition-all duration-200">
            {loading ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Generating {language} write-up...</> : <><FileText className="w-4 h-4 mr-2" />Generate {language} Write-Up</>}
          </Button>
          {pdfUrl && (
            <a
              href={pdfUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 rounded-lg border border-green-500/30 px-3 py-1.5 text-sm font-medium text-green-400 hover:bg-green-500/10 transition-colors cursor-pointer"
            >
              <Download className="w-4 h-4" />Download
            </a>
          )}
        </div>
      </form>
    </div>
  );
}
