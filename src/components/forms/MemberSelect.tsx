"use client";

import { useState, useCallback } from "react";
import { useQuery } from "@tanstack/react-query";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { ChevronDown, X, UserCheck } from "lucide-react";
import { cn } from "@/lib/utils";

interface Subject { id?: string; name: string; code: string; }
interface Member { id: string; fullName: string; rollNumber: string; branch: string; yearOfStudy: string; department: string; activeSubjects: Subject[]; }

interface MemberSelectProps {
  value: string[];
  onChange: (ids: string[]) => void;
  label?: string;
  multiple?: boolean;
}

async function fetchMembers(): Promise<Member[]> {
  const res = await fetch("/api/members?status=ACTIVE");
  const json = await res.json();
  return json.data || [];
}

export function MemberSelect({ value, onChange, label = "Select Members", multiple = true }: MemberSelectProps) {
  const [open, setOpen] = useState(false);
  const { data: members = [], isLoading } = useQuery({ queryKey: ["members"], queryFn: fetchMembers });

  const selectedMembers = members.filter(m => value.includes(m.id));

  const toggle = useCallback((id: string) => {
    if (multiple) {
      onChange(value.includes(id) ? value.filter(v => v !== id) : [...value, id]);
    } else {
      onChange(value.includes(id) ? [] : [id]);
      setOpen(false);
    }
  }, [value, onChange, multiple]);

  const remove = (id: string) => onChange(value.filter(v => v !== id));

  return (
    <div className="space-y-2">
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className={cn(
              "w-full justify-between bg-background border-white/15 hover:bg-white/5 min-h-10 h-auto py-2",
              value.length === 0 && "text-muted-foreground"
            )}
          >
            <div className="flex items-center gap-2 flex-wrap flex-1 text-left">
              <UserCheck className="w-4 h-4 flex-shrink-0" />
              {value.length === 0 ? label : `${value.length} member${value.length > 1 ? "s" : ""} selected`}
            </div>
            <ChevronDown className="w-4 h-4 ml-2 flex-shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[380px] p-0 border-white/15 bg-card" align="start">
          <Command>
            <CommandInput placeholder="Search by name or roll number..." className="h-9" />
            <CommandList>
              {isLoading && (
                <div className="p-3 space-y-2">
                  <Skeleton className="h-8 w-full" />
                  <Skeleton className="h-8 w-full" />
                  <Skeleton className="h-8 w-3/4" />
                </div>
              )}
              <CommandEmpty>No members found.</CommandEmpty>
              <CommandGroup heading={`${members.length} active members`}>
                {members.map((m) => (
                  <CommandItem
                    key={m.id}
                    value={`${m.fullName} ${m.rollNumber}`}
                    onSelect={() => toggle(m.id)}
                    className="cursor-pointer"
                  >
                    <div className={cn(
                      "mr-2 flex h-4 w-4 items-center justify-center rounded border border-muted-foreground/30",
                      value.includes(m.id) ? "bg-cyan-500 border-cyan-500" : "opacity-50"
                    )}>
                      {value.includes(m.id) && <span className="text-white text-[10px] font-bold">✓</span>}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm truncate">{m.fullName}</p>
                      <p className="text-xs text-muted-foreground">{m.rollNumber} · {m.branch} · {m.yearOfStudy} Year</p>
                    </div>
                  </CommandItem>
                ))}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>

      {/* Selected chips */}
      {selectedMembers.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {selectedMembers.map(m => (
            <Badge
              key={m.id}
              variant="secondary"
              className="flex items-center gap-1.5 pr-1 pl-3 py-1 bg-cyan-500/15 text-cyan-300 border border-cyan-500/30 hover:bg-cyan-500/20"
            >
              <span className="text-xs font-medium max-w-[140px] truncate">{m.fullName}</span>
              <span className="text-cyan-400/60 text-xs">· {m.rollNumber}</span>
              <button
                onClick={() => remove(m.id)}
                className="ml-1 rounded-full hover:bg-cyan-500/30 p-0.5 transition-colors"
                type="button"
              >
                <X className="w-3 h-3" />
              </button>
            </Badge>
          ))}
        </div>
      )}
    </div>
  );
}

// Export member data for use in form
export function useMemberData(ids: string[]): Member[] {
  const { data: members = [] } = useQuery<Member[]>({ queryKey: ["members"], queryFn: fetchMembers });
  return members.filter(m => ids.includes(m.id));
}
