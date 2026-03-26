"use client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { createUserSchema, type CreateUserData } from "@/lib/validators";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { UserCircle, Plus, Loader2 } from "lucide-react";
import { toast } from "sonner";

interface User { id: string; email: string; fullName: string; role: string; isActive: boolean; createdAt: string; }

export default function ManageUsersPage() {
  const [open, setOpen] = useState(false);
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery<User[]>({
    queryKey: ["admin-users"],
    queryFn: () => fetch("/api/users").then(r => r.json()).then(j => j.data ?? []),
  });

  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm<CreateUserData>({
    resolver: zodResolver(createUserSchema),
    defaultValues: { role: "COORDINATOR" },
  });

  const createUser = useMutation({
    mutationFn: async (data: CreateUserData) => {
      const res = await fetch("/api/users", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Failed");
      return json;
    },
    onSuccess: () => {
      toast.success("User created successfully");
      queryClient.invalidateQueries({ queryKey: ["admin-users"] });
      reset();
      setOpen(false);
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const users = data ?? [];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center">
            <UserCircle className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">Manage Users</h1>
            <p className="text-muted-foreground text-sm">Coordinator and admin accounts</p>
          </div>
        </div>
        <Button onClick={() => setOpen(true)} className="bg-cyan-500/20 text-cyan-400 border border-cyan-500/30 hover:bg-cyan-500/30 cursor-pointer">
          <Plus className="w-4 h-4 mr-2" />Add User
        </Button>
      </div>

      <Card className="border border-white/10 bg-card/50">
        <CardContent className="p-0">
          {isLoading && <div className="p-4 space-y-3">{Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}</div>}
          {!isLoading && users.length === 0 && (
            <p className="text-center py-12 text-muted-foreground text-sm">No coordinator accounts yet.</p>
          )}
          {!isLoading && users.length > 0 && (
            <div className="divide-y divide-white/8">
              {users.map((u) => (
                <div key={u.id} className="flex items-center gap-4 px-4 py-3">
                  <div className="w-8 h-8 rounded-full bg-linear-to-br from-cyan-400 to-blue-600 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                    {u.fullName.split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium">{u.fullName}</p>
                    <p className="text-xs text-muted-foreground">{u.email}</p>
                  </div>
                  <Badge variant="outline" className={u.role === "ADMIN" ? "bg-cyan-500/15 text-cyan-400 border-cyan-500/30" : "bg-blue-500/15 text-blue-400 border-blue-500/30"}>
                    {u.role.charAt(0) + u.role.slice(1).toLowerCase()}
                  </Badge>
                  <Badge variant="outline" className={u.isActive ? "bg-green-500/15 text-green-400 border-green-500/30" : "bg-white/10 text-muted-foreground border-white/20"}>
                    {u.isActive ? "Active" : "Inactive"}
                  </Badge>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="border border-white/10 bg-card max-w-md">
          <DialogHeader>
            <DialogTitle>Add New User</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit((d) => createUser.mutate(d))} className="space-y-4 pt-2">
            <div className="space-y-2">
              <Label>Full Name</Label>
              <Input {...register("fullName")} placeholder="Full name" className="border-white/15" />
              {errors.fullName && <p className="text-xs text-destructive">{errors.fullName.message}</p>}
            </div>
            <div className="space-y-2">
              <Label>Email</Label>
              <Input {...register("email")} type="email" placeholder="email@srmcem.ac.in" className="border-white/15" />
              {errors.email && <p className="text-xs text-destructive">{errors.email.message}</p>}
            </div>
            <div className="space-y-2">
              <Label>Password</Label>
              <Input {...register("password")} type="password" placeholder="Min 8 characters" className="border-white/15" />
              {errors.password && <p className="text-xs text-destructive">{errors.password.message}</p>}
            </div>
            <div className="space-y-2">
              <Label>Role</Label>
              <select {...register("role")} className="w-full rounded-lg border border-white/15 bg-background px-3 py-2 text-sm">
                <option value="COORDINATOR">Coordinator</option>
                <option value="ADMIN">Admin</option>
              </select>
            </div>
            <div className="flex gap-3 justify-end pt-2">
              <Button type="button" variant="outline" className="border-white/15 cursor-pointer" onClick={() => setOpen(false)}>Cancel</Button>
              <Button type="submit" disabled={isSubmitting} className="bg-cyan-500/20 text-cyan-400 border border-cyan-500/30 hover:bg-cyan-500/30 cursor-pointer">
                {isSubmitting ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Creating…</> : "Create User"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
