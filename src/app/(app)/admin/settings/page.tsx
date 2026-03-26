"use client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { globalSettingsSchema, type GlobalSettingsData } from "@/lib/validators";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Settings, Loader2, Save } from "lucide-react";
import { toast } from "sonner";
import { useEffect } from "react";

export default function SettingsPage() {
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ["settings"],
    queryFn: () => fetch("/api/settings").then(r => r.json()).then(j => j.data),
  });

  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm<GlobalSettingsData>({
    resolver: zodResolver(globalSettingsSchema),
    defaultValues: { defaultLanguage: "English" },
  });

  useEffect(() => {
    if (data) reset(data);
  }, [data, reset]);

  const save = useMutation({
    mutationFn: async (values: GlobalSettingsData) => {
      const res = await fetch("/api/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Failed to save");
      return json;
    },
    onSuccess: () => {
      toast.success("Settings saved");
      queryClient.invalidateQueries({ queryKey: ["settings"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const fields: { key: keyof GlobalSettingsData; label: string; placeholder?: string }[] = [
    { key: "clubName", label: "Club Name", placeholder: "SRMCEM Robotics Club" },
    { key: "institutionFull", label: "Institution (Full Name)", placeholder: "Sri Ram Swarup Memorial..." },
    { key: "institutionShort", label: "Institution (Short)", placeholder: "SRMCEM" },
    { key: "city", label: "City", placeholder: "Lucknow" },
    { key: "departmentName", label: "Department Name", placeholder: "Data & Management" },
    { key: "clubHeadName", label: "Club Head Name", placeholder: "Full name" },
    { key: "facultyCoordinator1", label: "Faculty Coordinator 1", placeholder: "Dr. ..." },
    { key: "facultyCoordinator2", label: "Faculty Coordinator 2", placeholder: "Er. ..." },
    { key: "directorName", label: "Director Name", placeholder: "Optional" },
  ];

  return (
    <div className="space-y-6 max-w-2xl">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center">
          <Settings className="w-5 h-5" />
        </div>
        <div>
          <h1 className="text-2xl font-bold">Settings</h1>
          <p className="text-muted-foreground text-sm">Club and institution configuration used in all documents</p>
        </div>
      </div>

      {isLoading ? (
        <Card className="border border-white/10 bg-card/50">
          <CardContent className="p-6 space-y-4">
            {Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-10 w-full" />)}
          </CardContent>
        </Card>
      ) : (
        <form onSubmit={handleSubmit((d) => save.mutate(d))}>
          <Card className="border border-white/10 bg-card/50">
            <CardHeader>
              <CardTitle className="text-base">Global Settings</CardTitle>
              <CardDescription>These values are injected into every generated document.</CardDescription>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {fields.map(({ key, label, placeholder }) => (
                <div key={key} className={`space-y-2 ${key === "institutionFull" ? "md:col-span-2" : ""}`}>
                  <Label>{label}</Label>
                  <Input
                    {...register(key)}
                    placeholder={placeholder}
                    className="border-white/15"
                  />
                  {errors[key] && <p className="text-xs text-destructive">{errors[key]?.message}</p>}
                </div>
              ))}
            </CardContent>
          </Card>

          <div className="mt-4 flex justify-end">
            <Button
              type="submit"
              disabled={isSubmitting}
              className="bg-cyan-500/20 text-cyan-400 border border-cyan-500/30 hover:bg-cyan-500/30 cursor-pointer"
            >
              {isSubmitting
                ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Saving…</>
                : <><Save className="w-4 h-4 mr-2" />Save Settings</>
              }
            </Button>
          </div>
        </form>
      )}
    </div>
  );
}
