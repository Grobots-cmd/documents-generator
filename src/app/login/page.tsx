"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { loginSchema, type LoginData } from "@/lib/validators";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, Eye, EyeOff, Bot } from "lucide-react";
import { toast } from "sonner";

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") || "/dashboard";
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const { register, handleSubmit, formState: { errors } } = useForm<LoginData>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data: LoginData) => {
    setLoading(true);
    const result = await signIn("credentials", {
      email: data.email,
      password: data.password,
      redirect: false,
    });
    setLoading(false);

    if (result?.error) {
      toast.error("Invalid email or password.");
      return;
    }

    toast.success("Welcome back!");
    router.push(callbackUrl);
    router.refresh();
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background relative overflow-hidden">

      {/* ── Dot-grid background ── */}
      <div
        className="absolute inset-0 opacity-[0.15]"
        style={{
          backgroundImage:
            "radial-gradient(circle, oklch(0.62 0.20 200) 1px, transparent 1px)",
          backgroundSize: "32px 32px",
        }}
      />

      {/* ── Ambient glows ── */}
      <div className="absolute -top-56 -left-56 w-[480px] h-[480px] rounded-full bg-cyan-500/10 blur-[120px] pointer-events-none" />
      <div className="absolute -bottom-56 -right-56 w-[480px] h-[480px] rounded-full bg-blue-600/10 blur-[120px] pointer-events-none" />

      {/* ── Card ── */}
      <div className="relative z-10 w-full max-w-md px-4 animate-in fade-in slide-in-from-bottom-4 duration-500">

        {/* Logo */}
        <div className="flex flex-col items-center gap-4 mb-8">
          <div className="relative">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-cyan-400 to-blue-600 flex items-center justify-center shadow-2xl shadow-cyan-500/30">
              <Bot className="w-8 h-8 text-white" />
            </div>
            {/* outer ring */}
            <div className="absolute -inset-1 rounded-[18px] border border-cyan-500/30" />
          </div>
          <div className="text-center">
            <h1 className="text-2xl font-bold tracking-tight">SRMCEM Robotics Club</h1>
            <p className="text-muted-foreground text-sm mt-1">Data &amp; Management Portal</p>
          </div>
        </div>

        {/* Card panel */}
        <div className="rounded-2xl border border-white/8 bg-card/70 backdrop-blur-2xl shadow-2xl overflow-hidden">
          {/* Cyan top accent line */}
          <div className="h-[2px] w-full bg-gradient-to-r from-transparent via-cyan-500/70 to-transparent" />

          <div className="p-8">
            <h2 className="text-xl font-semibold mb-1">Sign in</h2>
            <p className="text-muted-foreground text-sm mb-6">
              Enter your credentials to access the document generator
            </p>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
              {/* Email */}
              <div className="space-y-2">
                <Label htmlFor="email" className="text-sm font-medium">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="your@email.com"
                  autoComplete="email"
                  {...register("email")}
                  className={`
                    bg-white/[0.04] border-white/10 
                    focus:border-cyan-500/60 focus:ring-2 focus:ring-cyan-500/20
                    placeholder:text-muted-foreground/50 transition-all duration-200
                    ${errors.email ? "border-destructive focus:border-destructive focus:ring-destructive/20" : ""}
                  `}
                />
                {errors.email && (
                  <p className="text-xs text-destructive">{errors.email.message}</p>
                )}
              </div>

              {/* Password */}
              <div className="space-y-2">
                <Label htmlFor="password" className="text-sm font-medium">Password</Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="••••••••"
                    autoComplete="current-password"
                    {...register("password")}
                    className={`
                      bg-white/[0.04] border-white/10 pr-10
                      focus:border-cyan-500/60 focus:ring-2 focus:ring-cyan-500/20
                      placeholder:text-muted-foreground/50 transition-all duration-200
                      ${errors.password ? "border-destructive focus:border-destructive focus:ring-destructive/20" : ""}
                    `}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors duration-200 cursor-pointer"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                {errors.password && (
                  <p className="text-xs text-destructive">{errors.password.message}</p>
                )}
              </div>

              {/* Forgot password — TODO: implement reset flow before re-enabling */}

              {/* Submit */}
              <Button
                type="submit"
                className="w-full bg-linear-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-semibold shadow-lg shadow-cyan-500/20 transition-all duration-200 cursor-pointer"
                disabled={loading}
              >
                {loading ? (
                  <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Signing in…</>
                ) : (
                  "Sign in"
                )}
              </Button>
            </form>

            <div className="mt-6 pt-5 border-t border-white/8 text-center">
              <p className="text-sm text-muted-foreground">
                Not registered?{" "}
                <a
                  href="/register"
                  className="text-cyan-400 hover:text-cyan-300 transition-colors duration-200 font-medium"
                >
                  Join as a member
                </a>
              </p>
            </div>
          </div>
        </div>

        <p className="text-center text-xs text-muted-foreground/60 mt-6">
          For access issues, contact the Data &amp; Management Coordinator
        </p>
      </div>
    </div>
  );
}
