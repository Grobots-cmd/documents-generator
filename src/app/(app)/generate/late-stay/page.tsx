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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Clock, Loader2, Download, FileText, AtSign } from "lucide-react";
import { toast } from "sonner";

const KIND_ATTENTION_DEPARTMENTS = [
  "Security Office",
  "Admin Office",
  "Finance Office",
  "B.Tech 1st Year Office",
  "B.Tech CSE Department",
  "B.Tech IT Department",
  "B.Tech DS/AL Department",
  "B.Tech ECE Department",
  "B.Tech EC Department",
  "B.Tech CE Department",
  "B.Tech ME Department",
  "BCA Department",
  "Examination Office",
  "Library",
  "Hostel Office",
];

export default function LateStayPage() {
  const [loading, setLoading] = useState(false);
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
  } = useForm<LateStayData>({
    resolver: zodResolver(lateStaySchema),
    defaultValues: {
      memberIds: [],
      issueDate: new Date().toISOString().split("T")[0],
      individualLetters: false,
      kindAttentionDept: "",
    },
  });

  const onSubmit = async (data: LateStayData) => {
    setLoading(true);
    setPdfUrl(null);
    try {
      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          docType: "LATE_STAY",
          memberIds: data.memberIds,
          issueDate: data.issueDate,
          eventDetails: {
            event_name: data.eventName,
            stay_date: data.stayDate,
            permitted_until_time: data.permittedUntilTime,
            venue: data.venue,
            kind_attention_dept: data.kindAttentionDept,
          },
        }),
      });
      const json = await res.json();
      if (!res.ok) {
        toast.error(json.error || "Generation failed");
        return;
      }
      toast.success("Permission letter generated!");
      setPdfUrl(json.data.cloudinaryUrl);
    } catch {
      toast.error("Network error.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-400/20 to-pink-500/20 border border-purple-500/30 flex items-center justify-center">
          <Clock className="w-5 h-5 text-purple-400" />
        </div>
        <div>
          <h1 className="text-2xl font-bold">Late Stay / Overnight Permission</h1>
          <p className="text-muted-foreground text-sm">
            Request campus stay permission for club activities
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Member Selection */}
        <Card className="border border-white/8 bg-white/[0.03]">
          <CardHeader>
            <CardTitle className="text-base">Member Selection</CardTitle>
          </CardHeader>
          <CardContent>
            <Controller
              name="memberIds"
              control={control}
              render={({ field }) => (
                <MemberSelect
                  value={field.value}
                  onChange={field.onChange}
                  label="Select members"
                />
              )}
            />
          </CardContent>
        </Card>

        {/* Kind Attention */}
        <Card className="border border-white/8 bg-white/[0.03]">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <AtSign className="w-4 h-4 text-cyan-400" />
              Kind Attention
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <Label>Department / Office</Label>
            <Controller
              name="kindAttentionDept"
              control={control}
              render={({ field }) => (
                <Select value={field.value} onValueChange={field.onChange}>
                  <SelectTrigger className="border-white/15">
                    <SelectValue placeholder="Select department…" />
                  </SelectTrigger>
                  <SelectContent>
                    {KIND_ATTENTION_DEPARTMENTS.map((dept) => (
                      <SelectItem key={dept} value={dept}>
                        {dept}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
            {errors.kindAttentionDept && (
              <p className="text-xs text-destructive">
                {errors.kindAttentionDept.message}
              </p>
            )}
            <p className="text-xs text-muted-foreground">
              This will appear as{" "}
              <span className="font-medium text-foreground/80">
                Kind Attention: The [Department]
              </span>{" "}
              in the letter.
            </p>
          </CardContent>
        </Card>

        {/* Stay Details */}
        <Card className="border border-white/8 bg-white/[0.03]">
          <CardHeader>
            <CardTitle className="text-base">Stay Details</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Issue Date</Label>
              <Input type="date" {...register("issueDate")} className="border-white/10 bg-white/[0.03]" />
            </div>
            <div className="space-y-2">
              <Label>Event / Activity Name</Label>
              <Input
                placeholder="e.g. Robot Assembly for TECHNEX"
                {...register("eventName")}
                className="border-white/10 bg-white/[0.03]"
              />
            </div>
            <div className="space-y-2">
              <Label>Stay Date</Label>
              <Input type="date" {...register("stayDate")} className="border-white/10 bg-white/[0.03]" />
            </div>
            <div className="space-y-2">
              <Label>Permitted Until (Time)</Label>
              <Input
                type="time"
                {...register("permittedUntilTime")}
                className="border-white/10 bg-white/[0.03]"
              />
            </div>
            <div className="space-y-2 md:col-span-2">
              <Label>Venue</Label>
              <Input
                placeholder="e.g. Workshop, Block C"
                {...register("venue")}
                className="border-white/10 bg-white/[0.03]"
              />
            </div>
          </CardContent>
        </Card>

        <div className="flex items-center gap-3">
          <Button
            type="submit"
            disabled={loading}
            className="bg-linear-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white shadow-lg shadow-cyan-500/20 cursor-pointer transition-all duration-200"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Generating...
              </>
            ) : (
              <>
                <FileText className="w-4 h-4 mr-2" />
                Generate PDF
              </>
            )}
          </Button>
          {pdfUrl && (
            <a
              href={pdfUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 rounded-lg border border-green-500/30 px-3 py-1.5 text-sm font-medium text-green-400 hover:bg-green-500/10 transition-colors cursor-pointer"
            >
              <Download className="w-4 h-4" />
              Download
            </a>
          )}
        </div>
      </form>
    </div>
  );
}
