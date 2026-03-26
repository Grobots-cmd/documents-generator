"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { congratulationsSchema, type CongratulationsData } from "@/lib/validators";
import { MemberSelect } from "@/components/forms/MemberSelect";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Trophy, Loader2, Download, FileText } from "lucide-react";
import { toast } from "sonner";

export default function CongratulationsPage() {
  const [loading, setLoading] = useState(false);
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const router = useRouter();

  const { register, handleSubmit, control, formState: { errors } } = useForm<CongratulationsData>({
    resolver: zodResolver(congratulationsSchema),
    defaultValues: { memberIds: [], issueDate: new Date().toISOString().split("T")[0] },
  });

  const onSubmit = async (data: CongratulationsData) => {
    setLoading(true);
    setPdfUrl(null);
    try {
      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          docType: "CONGRATULATIONS",
          memberIds: data.memberIds,
          issueDate: data.issueDate,
          eventDetails: {
            event_name: data.eventName,
            event_location: data.eventLocation,
            event_dates: data.eventDates,
            achievement: data.achievement,
          },
        }),
      });

      const json = await res.json();
      if (!res.ok) {
        toast.error(json.error || "Generation failed");
        if (json.latexLog) console.error("LaTeX log:", json.latexLog);
        return;
      }

      toast.success("Document generated successfully!");
      setPdfUrl(json.data.cloudinaryUrl);
    } catch {
      toast.error("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-linear-to-br from-yellow-400/20 to-orange-500/20 border border-yellow-500/25 flex items-center justify-center">
          <Trophy className="w-5 h-5 text-yellow-400" />
        </div>
        <div>
          <h1 className="text-2xl font-bold">Congratulations Letter</h1>
          <p className="text-muted-foreground text-sm">Generate official letters for competition achievements</p>
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <Card className="border border-white/8 bg-white/[0.03]">
          <CardHeader><CardTitle className="text-base">Member Selection</CardTitle></CardHeader>
          <CardContent>
            <Controller
              name="memberIds"
              control={control}
              render={({ field }) => (
                <MemberSelect value={field.value} onChange={field.onChange} label="Select recipients" />
              )}
            />
            {errors.memberIds && <p className="text-sm text-destructive mt-2">{errors.memberIds.message}</p>}
          </CardContent>
        </Card>

        <Card className="border border-white/8 bg-white/[0.03]">
          <CardHeader>
            <CardTitle className="text-base">Document Details</CardTitle>
            <CardDescription>Event and achievement information</CardDescription>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="issueDate">Issue Date</Label>
              <Input id="issueDate" type="date" {...register("issueDate")} className="border-white/10 bg-white/[0.03]" />
              {errors.issueDate && <p className="text-sm text-destructive">{errors.issueDate.message}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="eventName">Event Name</Label>
              <Input id="eventName" placeholder="e.g. TECHKRITI 2026" {...register("eventName")} className="border-white/10 bg-white/[0.03]" />
              {errors.eventName && <p className="text-sm text-destructive">{errors.eventName.message}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="eventLocation">Event Location</Label>
              <Input id="eventLocation" placeholder="e.g. IIT Kanpur" {...register("eventLocation")} className="border-white/10 bg-white/[0.03]" />
              {errors.eventLocation && <p className="text-sm text-destructive">{errors.eventLocation.message}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="eventDates">Event Dates</Label>
              <Input id="eventDates" placeholder="e.g. 19–22 March 2026" {...register("eventDates")} className="border-white/10 bg-white/[0.03]" />
              {errors.eventDates && <p className="text-sm text-destructive">{errors.eventDates.message}</p>}
            </div>
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="achievement">Achievement</Label>
              <Input id="achievement" placeholder="e.g. 1st Place — Robo-War 30kg" {...register("achievement")} className="border-white/10 bg-white/[0.03]" />
              {errors.achievement && <p className="text-sm text-destructive">{errors.achievement.message}</p>}
            </div>
          </CardContent>
        </Card>

        <div className="flex items-center gap-3">
          <Button
            type="submit"
            disabled={loading}
            className="bg-linear-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white shadow-lg shadow-cyan-500/20 cursor-pointer transition-all duration-200"
          >
            {loading ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Generating...</> : <><FileText className="w-4 h-4 mr-2" />Generate PDF</>}
          </Button>
          {pdfUrl && (
            <a
              href={pdfUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 rounded-lg border border-green-500/30 px-3 py-1.5 text-sm font-medium text-green-400 hover:bg-green-500/10 transition-colors cursor-pointer"
            >
              <Download className="w-4 h-4" />Download PDF
            </a>
          )}
        </div>
      </form>
    </div>
  );
}
