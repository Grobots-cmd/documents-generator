"use client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { FileType, Save, Loader2, ChevronDown, ChevronUp } from "lucide-react";
import { toast } from "sonner";

interface Template {
  id: string;
  type: string;
  name: string;
  version: number;
  updatedBy?: string;
  updatedAt: string;
}

interface TemplateWithContent extends Template {
  content: string;
}

const docTypeLabel: Record<string, string> = {
  CONGRATULATIONS: "Congratulations Letter",
  QUIZ_PRORATE: "Quiz Pro-Rate",
  ATTENDANCE: "Attendance Certificate",
  LATE_STAY: "Late Stay Permission",
  EVENT_WRITEUP_EN: "Event Write-Up (English)",
  EVENT_WRITEUP_HI: "Event Write-Up (Hindi)",
};

function TemplateEditor({ template }: { template: Template }) {
  const [expanded, setExpanded] = useState(false);
  const [content, setContent] = useState<string | null>(null);
  const queryClient = useQueryClient();

  const { isLoading: loadingContent } = useQuery({
    queryKey: ["template-content", template.type],
    queryFn: async (): Promise<TemplateWithContent> => {
      // Fetch full template including content via a dedicated call
      const res = await fetch(`/api/templates?type=${template.type}`);
      const json = await res.json();
      const found = json.data?.find((t: TemplateWithContent) => t.type === template.type);
      if (found?.content) setContent(found.content);
      return found;
    },
    enabled: expanded,
  });

  const save = useMutation({
    mutationFn: async () => {
      const res = await fetch("/api/templates", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: template.type, name: template.name, content }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || (json.missing ? `Missing placeholders: ${json.missing.join(", ")}` : "Failed"));
      return json;
    },
    onSuccess: () => {
      toast.success(`Template saved (v${template.version + 1})`);
      queryClient.invalidateQueries({ queryKey: ["templates"] });
      queryClient.invalidateQueries({ queryKey: ["template-content", template.type] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <Card className="border border-white/10 bg-card/50">
      <CardHeader
        className="cursor-pointer select-none"
        onClick={() => setExpanded(e => !e)}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <CardTitle className="text-sm font-semibold">{template.name}</CardTitle>
            <Badge variant="outline" className="text-xs bg-white/5 border-white/15">v{template.version}</Badge>
          </div>
          <div className="flex items-center gap-2">
            {template.updatedBy && (
              <span className="text-xs text-muted-foreground hidden sm:block">by {template.updatedBy}</span>
            )}
            {expanded ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
          </div>
        </div>
        <CardDescription className="text-xs">{docTypeLabel[template.type]}</CardDescription>
      </CardHeader>

      {expanded && (
        <CardContent className="space-y-3 pt-0">
          {loadingContent && !content ? (
            <Skeleton className="h-64 w-full" />
          ) : (
            <>
              <Textarea
                value={content ?? ""}
                onChange={(e) => setContent(e.target.value)}
                rows={20}
                className="font-mono text-xs border-white/15 bg-black/20 resize-y"
                placeholder="LaTeX template content..."
              />
              <p className="text-xs text-muted-foreground">
                Use <code className="bg-white/10 px-1 rounded">{"{{placeholder}}"}</code> for variables and{" "}
                <code className="bg-white/10 px-1 rounded">{"{{#each members}}...{{/each}}"}</code> for loops.
              </p>
              <div className="flex justify-end">
                <Button
                  onClick={() => save.mutate()}
                  disabled={save.isPending || !content}
                  className="bg-cyan-500/20 text-cyan-400 border border-cyan-500/30 hover:bg-cyan-500/30 cursor-pointer"
                >
                  {save.isPending
                    ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Saving…</>
                    : <><Save className="w-4 h-4 mr-2" />Save Template</>
                  }
                </Button>
              </div>
            </>
          )}
        </CardContent>
      )}
    </Card>
  );
}

export default function TemplatesPage() {
  const { data, isLoading } = useQuery<Template[]>({
    queryKey: ["templates"],
    queryFn: () => fetch("/api/templates").then(r => r.json()).then(j => j.data ?? []),
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center">
          <FileType className="w-5 h-5" />
        </div>
        <div>
          <h1 className="text-2xl font-bold">Templates</h1>
          <p className="text-muted-foreground text-sm">Edit LaTeX templates — changes are versioned automatically</p>
        </div>
      </div>

      {isLoading && (
        <div className="space-y-3">
          {Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-16 w-full" />)}
        </div>
      )}

      {!isLoading && (data ?? []).length === 0 && (
        <p className="text-muted-foreground text-sm">No templates found. Run the seed to create defaults.</p>
      )}

      <div className="space-y-3">
        {(data ?? []).map((t) => (
          <TemplateEditor key={t.type} template={t} />
        ))}
      </div>
    </div>
  );
}
