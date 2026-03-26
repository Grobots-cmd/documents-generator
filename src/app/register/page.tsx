"use client";
import { useState } from "react";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { memberRegistrationSchema, type MemberRegistrationData } from "@/lib/validators";
import { BRANCHES, YEARS } from "@/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Bot, Plus, Trash2, Loader2, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";
import { Controller } from "react-hook-form";

export default function RegisterPage() {
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);

  const { register, handleSubmit, control, formState: { errors } } = useForm<MemberRegistrationData>({
    resolver: zodResolver(memberRegistrationSchema),
    defaultValues: { activeSubjects: [{ name: "", code: "" }], yearOfStudy: "1st" },
  });

  const { fields, append, remove } = useFieldArray({ control, name: "activeSubjects" });

  const onSubmit = async (data: MemberRegistrationData) => {
    setLoading(true);
    try {
      const res = await fetch("/api/members", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) });
      const json = await res.json();
      if (!res.ok) { toast.error(json.error || "Registration failed"); return; }
      setSubmitted(true);
    } catch { toast.error("Network error. Please try again."); } finally { setLoading(false); }
  };

  if (submitted) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <Card className="border border-green-500/30 bg-card/80 max-w-md w-full text-center p-8">
          <CheckCircle2 className="w-16 h-16 text-green-400 mx-auto mb-4" />
          <h2 className="text-2xl font-bold mb-2">Registration Submitted!</h2>
          <p className="text-muted-foreground text-sm">Your registration is pending admin approval. You'll be notified once approved.</p>
          <Button variant="outline" className="mt-6" onClick={() => window.location.href = "/login"}>Go to Login</Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background py-12 px-4">
      <div className="max-w-2xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center gap-3 mb-8">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-400 to-blue-600 flex items-center justify-center shadow-lg shadow-cyan-500/25">
            <Bot className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">Join SRMCEM Robotics Club</h1>
            <p className="text-muted-foreground text-sm">Register your profile for the Document Generator</p>
          </div>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {/* Personal Info */}
          <Card className="border border-white/10 bg-card/50">
            <CardHeader><CardTitle className="text-base">Personal Information</CardTitle></CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2 md:col-span-2">
                <Label>Full Name <span className="text-destructive">*</span></Label>
                <Input placeholder="As on official documents" {...register("fullName")} className="border-white/15" />
                {errors.fullName && <p className="text-sm text-destructive">{errors.fullName.message}</p>}
              </div>
              <div className="space-y-2">
                <Label>Roll Number <span className="text-destructive">*</span></Label>
                <Input placeholder="e.g. 2301220310035" {...register("rollNumber")} className="border-white/15" />
                {errors.rollNumber && <p className="text-sm text-destructive">{errors.rollNumber.message}</p>}
              </div>
              <div className="space-y-2">
                <Label>Date of Birth <span className="text-destructive">*</span></Label>
                <Input type="date" {...register("dateOfBirth")} className="border-white/15" />
              </div>
              <div className="space-y-2">
                <Label>Branch <span className="text-destructive">*</span></Label>
                <Controller name="branch" control={control} render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger className="border-white/15"><SelectValue placeholder="Select branch" /></SelectTrigger>
                    <SelectContent>{BRANCHES.map(b => <SelectItem key={b} value={b}>{b}</SelectItem>)}</SelectContent>
                  </Select>
                )} />
              </div>
              <div className="space-y-2">
                <Label>Year of Study <span className="text-destructive">*</span></Label>
                <Controller name="yearOfStudy" control={control} render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger className="border-white/15"><SelectValue /></SelectTrigger>
                    <SelectContent>{YEARS.map(y => <SelectItem key={y} value={y}>{y} Year</SelectItem>)}</SelectContent>
                  </Select>
                )} />
              </div>
              <div className="space-y-2 md:col-span-2">
                <Label>Department (Full Name) <span className="text-destructive">*</span></Label>
                <Input placeholder="e.g. Computer Science & Engineering" {...register("department")} className="border-white/15" />
              </div>
            </CardContent>
          </Card>

          {/* Contact Info */}
          <Card className="border border-white/10 bg-card/50">
            <CardHeader><CardTitle className="text-base">Contact Information</CardTitle></CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Personal Email <span className="text-destructive">*</span></Label>
                <Input type="email" placeholder="your@gmail.com" {...register("personalEmail")} className="border-white/15" />
                {errors.personalEmail && <p className="text-sm text-destructive">{errors.personalEmail.message}</p>}
              </div>
              <div className="space-y-2">
                <Label>College Email <span className="text-muted-foreground text-xs">(optional)</span></Label>
                <Input type="email" placeholder="2301xxx@srmcem.ac.in" {...register("collegeEmail")} className="border-white/15" />
              </div>
              <div className="space-y-2">
                <Label>Phone Number <span className="text-muted-foreground text-xs">(optional)</span></Label>
                <Input type="tel" placeholder="10-digit mobile number" {...register("phoneNumber")} className="border-white/15" />
              </div>
            </CardContent>
          </Card>

          {/* Active Subjects */}
          <Card className="border border-white/10 bg-card/50">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-base">Current Semester Subjects</CardTitle>
                  <CardDescription className="text-xs mt-1">Add your active subjects — required for Quiz Pro-Rate documents</CardDescription>
                </div>
                {fields.length < 8 && (
                  <Button type="button" variant="ghost" size="sm" onClick={() => append({ name: "", code: "" })}>
                    <Plus className="w-4 h-4 mr-1" />Add Subject
                  </Button>
                )}
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              {fields.map((field, idx) => (
                <div key={field.id} className="flex items-center gap-3">
                  <div className="flex-1 grid grid-cols-2 gap-2">
                    <Input placeholder="Subject Name" {...register(`activeSubjects.${idx}.name`)} className="border-white/15 text-sm" />
                    <Input placeholder="Code (e.g. CS301)" {...register(`activeSubjects.${idx}.code`)} className="border-white/15 text-sm" />
                  </div>
                  {idx > 0 && (
                    <Button type="button" variant="ghost" size="icon" className="w-8 h-8 text-muted-foreground hover:text-destructive flex-shrink-0" onClick={() => remove(idx)}>
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  )}
                </div>
              ))}
              {errors.activeSubjects && <p className="text-sm text-destructive">{errors.activeSubjects.message}</p>}
            </CardContent>
          </Card>

          <Button type="submit" disabled={loading} className="w-full bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-semibold shadow-lg shadow-cyan-500/25 py-6">
            {loading ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Submitting...</> : "Submit Registration"}
          </Button>
        </form>
      </div>
    </div>
  );
}
