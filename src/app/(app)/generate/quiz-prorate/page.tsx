"use client";
import { useState } from "react";
import { useForm, Controller, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { quizProRateSchema, type QuizProRateData } from "@/lib/validators";
import { MemberSelect, useMemberData } from "@/components/forms/MemberSelect";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { GraduationCap, Loader2, Download, FileText, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export default function QuizProRatePage() {
  const [loading, setLoading] = useState(false);
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  const { register, handleSubmit, control, formState: { errors } } = useForm<QuizProRateData>({
    resolver: zodResolver(quizProRateSchema),
    defaultValues: {
      memberIds: [],
      issueDate: new Date().toISOString().split("T")[0],
      quizDates: [{ date: "", label: "Annexure A", memberSubjects: {} }],
    },
  });

  const { fields: quizFields, append, remove } = useFieldArray({ control, name: "quizDates" });
  const members = useMemberData(selectedIds);

  const onSubmit = async (data: QuizProRateData) => {
    setLoading(true); setPdfUrl(null);
    try {
      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          docType: "QUIZ_PRORATE",
          memberIds: data.memberIds,
          issueDate: data.issueDate,
          eventDetails: {
            event_name: data.eventName, event_venue: data.eventVenue,
            event_start_date: data.eventStartDate, event_end_date: data.eventEndDate,
            quiz_dates: data.quizDates.map(q => q.date).join(", "),
          },
        }),
      });
      const json = await res.json();
      if (!res.ok) { toast.error(json.error || "Generation failed"); return; }
      toast.success("Quiz Pro-Rate request generated!"); setPdfUrl(json.data.cloudinaryUrl);
    } catch { toast.error("Network error."); } finally { setLoading(false); }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-400/20 to-cyan-500/20 border border-blue-500/30 flex items-center justify-center">
          <GraduationCap className="w-5 h-5 text-blue-400" />
        </div>
        <div>
          <h1 className="text-2xl font-bold">Quiz Pro-Rate / Weightage Request</h1>
          <p className="text-muted-foreground text-sm">Request quiz weightage for members who missed quizzes due to club events</p>
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Member Selection */}
        <Card className="border border-white/10 bg-card/50">
          <CardHeader><CardTitle className="text-base">Affected Members</CardTitle></CardHeader>
          <CardContent>
            <Controller name="memberIds" control={control} render={({ field }) => (
              <MemberSelect value={field.value} onChange={(ids) => { field.onChange(ids); setSelectedIds(ids); }} label="Select affected members" />
            )} />
            {errors.memberIds && <p className="text-sm text-destructive mt-2">{errors.memberIds.message}</p>}
          </CardContent>
        </Card>

        {/* Event Details */}
        <Card className="border border-white/10 bg-card/50">
          <CardHeader><CardTitle className="text-base">Event Details</CardTitle></CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2"><Label>Issue Date</Label><Input type="date" {...register("issueDate")} className="border-white/15" /></div>
            <div className="space-y-2"><Label>Event Name</Label><Input placeholder="e.g. TECHNEX'26" {...register("eventName")} className="border-white/15" /></div>
            <div className="space-y-2"><Label>Event Venue</Label><Input placeholder="e.g. IIT BHU, Varanasi" {...register("eventVenue")} className="border-white/15" /></div>
            <div className="space-y-2"><Label>Event Start Date</Label><Input type="date" {...register("eventStartDate")} className="border-white/15" /></div>
            <div className="space-y-2"><Label>Event End Date</Label><Input type="date" {...register("eventEndDate")} className="border-white/15" /></div>
          </CardContent>
        </Card>

        {/* Quiz Dates (Annexures) */}
        <Card className="border border-white/10 bg-card/50">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-base">Quiz Dates (Annexures)</CardTitle>
              <Button type="button" variant="ghost" size="sm" onClick={() => append({ date: "", label: `Annexure ${String.fromCharCode(65 + quizFields.length)}`, memberSubjects: {} })}>
                <Plus className="w-4 h-4 mr-1" />Add Quiz Date
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            {quizFields.map((field, idx) => (
              <div key={field.id} className="border border-white/10 rounded-lg p-4 space-y-4">
                <div className="flex items-center justify-between">
                  <span className="font-medium text-sm text-cyan-400">{field.label}</span>
                  {idx > 0 && (
                    <Button type="button" variant="ghost" size="icon" className="w-7 h-7 text-destructive hover:bg-destructive/10" onClick={() => remove(idx)}>
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  )}
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2"><Label>Date of Missed Quiz</Label><Input type="date" {...register(`quizDates.${idx}.date`)} className="border-white/15" /></div>
                  <div className="space-y-2"><Label>Annexure Label</Label><Input {...register(`quizDates.${idx}.label`)} className="border-white/15" /></div>
                </div>

                {/* Per-member subject selection */}
                {members.length > 0 && (
                  <div className="space-y-2">
                    <Label className="text-xs text-muted-foreground uppercase tracking-wider">Subject mapping per member</Label>
                    <div className="space-y-2">
                      {members.map(member => (
                        <div key={member.id} className="flex items-center gap-3 p-3 rounded-lg bg-white/5">
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium truncate">{member.fullName}</p>
                            <p className="text-xs text-muted-foreground">{member.rollNumber}</p>
                          </div>
                          <Controller
                            name={`quizDates.${idx}.memberSubjects.${member.id}`}
                            control={control}
                            render={({ field }) => (
                              <Select
                                value={field.value ? `${field.value.subjectCode}||${field.value.subjectName}` : ""}
                                onValueChange={(v) => {
                                  const [code, name] = v.split("||");
                                  field.onChange({ subjectName: name, subjectCode: code });
                                }}
                              >
                                <SelectTrigger className="w-[200px] border-white/15 bg-background text-xs">
                                  <SelectValue placeholder="Select subject" />
                                </SelectTrigger>
                                <SelectContent>
                                  {member.activeSubjects.map(s => (
                                    <SelectItem key={s.code} value={`${s.code}||${s.name}`} className="text-xs">
                                      {s.name} ({s.code})
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            )}
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ))}
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
