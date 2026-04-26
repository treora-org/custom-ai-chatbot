"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useSearchParams } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { Snowflake, Eye, EyeOff, Loader2, User, Mail, Lock, Phone } from "lucide-react";

// ─── 3D Tilt Card ──────────────────────────────────────────────
function TiltCard({ children }: { children: React.ReactNode }) {
  const cardRef = useRef<HTMLDivElement>(null);
  const frameRef = useRef<number>(0);

  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    cancelAnimationFrame(frameRef.current);
    frameRef.current = requestAnimationFrame(() => {
      if (!cardRef.current) return;
      const rect = cardRef.current.getBoundingClientRect();
      const x = (e.clientX - rect.left) / rect.width - 0.5;
      const y = (e.clientY - rect.top) / rect.height - 0.5;
      cardRef.current.style.transform = `perspective(1000px) rotateY(${x * 12}deg) rotateX(${-y * 12}deg) scale3d(1.02,1.02,1.02)`;
    });
  }, []);

  const handleMouseLeave = useCallback(() => {
    cancelAnimationFrame(frameRef.current);
    if (cardRef.current) {
      cardRef.current.style.transform = "perspective(1000px) rotateY(0deg) rotateX(0deg) scale3d(1,1,1)";
    }
  }, []);

  return (
    <div
      ref={cardRef}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      style={{ transition: "transform 0.15s ease-out", willChange: "transform", transformStyle: "preserve-3d" }}
    >
      {children}
    </div>
  );
}

// ─── Floating Grid Background ──────────────────────────────────
function FloatingGrid() {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {/* Radial glow */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_50%_0%,rgba(255,255,255,0.06)_0%,transparent_60%)]" />
      {/* Grid */}
      <div
        className="absolute inset-0 opacity-[0.04]"
        style={{
          backgroundImage: `linear-gradient(rgba(255,255,255,0.8) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.8) 1px, transparent 1px)`,
          backgroundSize: "60px 60px",
        }}
      />
      {/* Animated orbs */}
      <motion.div
        className="absolute w-96 h-96 rounded-full blur-3xl"
        style={{ background: "radial-gradient(circle, rgba(120,120,120,0.15) 0%, transparent 70%)" }}
        animate={{ x: ["-20%", "20%", "-20%"], y: ["-10%", "30%", "-10%"] }}
        transition={{ duration: 20, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.div
        className="absolute right-0 bottom-0 w-80 h-80 rounded-full blur-3xl"
        style={{ background: "radial-gradient(circle, rgba(80,80,80,0.12) 0%, transparent 70%)" }}
        animate={{ x: ["10%", "-15%", "10%"], y: ["10%", "-20%", "10%"] }}
        transition={{ duration: 25, repeat: Infinity, ease: "easeInOut" }}
      />
    </div>
  );
}

// ─── Input Field ───────────────────────────────────────────────
function AuthInput({
  id, label, type = "text", placeholder, value, onChange, icon: Icon, optional = false,
}: {
  id: string; label: string; type?: string; placeholder: string;
  value: string; onChange: (v: string) => void;
  icon: React.ElementType; optional?: boolean;
}) {
  const [show, setShow] = useState(false);
  const isPassword = type === "password";

  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={id} className="text-xs font-medium text-zinc-400 tracking-wide uppercase flex items-center gap-1.5">
        {label}
        {optional && <span className="text-zinc-600 normal-case font-normal">(optional)</span>}
      </label>
      <div className="relative group">
        <Icon size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-600 group-focus-within:text-zinc-300 transition-colors" />
        <input
          id={id}
          type={isPassword ? (show ? "text" : "password") : type}
          placeholder={placeholder}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-full bg-white/5 border border-white/10 rounded-xl pl-10 pr-10 py-3 text-sm text-white placeholder:text-zinc-600 focus:outline-none focus:border-white/30 focus:bg-white/8 transition-all duration-200"
        />
        {isPassword && (
          <button type="button" onClick={() => setShow(!show)}
            className="absolute right-3.5 top-1/2 -translate-y-1/2 text-zinc-600 hover:text-zinc-300 transition-colors">
            {show ? <EyeOff size={15} /> : <Eye size={15} />}
          </button>
        )}
      </div>
    </div>
  );
}

// ─── Main Auth Page ────────────────────────────────────────────
export default function AuthPage() {
  const searchParams = useSearchParams();
  const [mode, setMode] = useState<"signin" | "signup">(searchParams.get("mode") === "signup" ? "signup" : "signin");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [phone, setPhone] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const switchMode = () => {
    setMode((m) => (m === "signin" ? "signup" : "signin"));
    setError("");
    setSuccess("");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setLoading(true);

    try {
      if (mode === "signup") {
        if (!name.trim()) { setError("Please enter your name."); setLoading(false); return; }
        if (password.length < 8) { setError("Password must be at least 8 characters."); setLoading(false); return; }

        const { error: signUpError } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              full_name: name.trim(),
              phone: phone.trim() || null,
            },
          },
        });

        if (signUpError) throw signUpError;

        // Some Supabase projects require email confirmation — handle both paths
        const { data: sessionData } = await supabase.auth.getSession();
        if (sessionData.session) {
          window.location.href = "/chat";
        } else {
          setSuccess("Account created! Check your email to confirm your account, then sign in.");
          setMode("signin");
        }
      } else {
        const { error: signInError } = await supabase.auth.signInWithPassword({ email, password });
        if (signInError) throw signInError;
        window.location.href = "/chat";
      }
    } catch (err: any) {
      setError(err.message || "Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="relative min-h-screen w-full bg-black flex items-center justify-center overflow-hidden px-4">
      <FloatingGrid />

      {/* Branding */}
      <div className="fixed top-6 left-1/2 -translate-x-1/2 z-20 flex items-center gap-2">
        <Snowflake size={18} className="text-zinc-300" />
        <span className="font-semibold text-sm tracking-widest text-zinc-300 uppercase">Eve 1.0</span>
      </div>

      {/* 3D Tilt Form Card */}
      <TiltCard>
        <motion.div
          initial={{ opacity: 0, y: 24, scale: 0.97 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
          className="relative w-full max-w-sm"
        >
          {/* Card glow ring */}
          <div className="absolute -inset-px rounded-2xl bg-gradient-to-b from-white/10 via-white/5 to-transparent pointer-events-none" />

          <div className="relative bg-zinc-950/80 backdrop-blur-2xl border border-white/10 rounded-2xl p-8 shadow-[0_32px_80px_rgba(0,0,0,0.6)]">
            {/* Header */}
            <div className="mb-8 text-center">
              <div className="w-14 h-14 rounded-full bg-white/5 border border-white/10 flex items-center justify-center mx-auto mb-4 shadow-[0_0_30px_rgba(255,255,255,0.04)]">
                <Snowflake size={26} className="text-zinc-200" />
              </div>
              <AnimatePresence mode="wait">
                <motion.div key={mode}
                  initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 8 }}
                  transition={{ duration: 0.2 }}>
                  <h1 className="text-xl font-semibold text-white mb-1 tracking-tight">
                    {mode === "signin" ? "Welcome back" : "Create your account"}
                  </h1>
                  <p className="text-xs text-zinc-500">
                    {mode === "signin" ? "Sign in to continue with Eve" : "Start your research journey"}
                  </p>
                </motion.div>
              </AnimatePresence>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
              <AnimatePresence mode="wait">
                {mode === "signup" && (
                  <motion.div key="signup-fields"
                    initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }} transition={{ duration: 0.25 }}
                    className="flex flex-col gap-4 overflow-hidden">
                    <AuthInput id="name" label="Full Name" placeholder="Your name" value={name} onChange={setName} icon={User} />
                    <AuthInput id="phone" label="Phone" type="tel" placeholder="+1 234 567 8900" value={phone} onChange={setPhone} icon={Phone} optional />
                  </motion.div>
                )}
              </AnimatePresence>

              <AuthInput id="email" label="Email" type="email" placeholder="you@example.com" value={email} onChange={setEmail} icon={Mail} />
              <AuthInput id="password" label="Password" type="password" placeholder="••••••••" value={password} onChange={setPassword} icon={Lock} />

              {/* Error / Success */}
              <AnimatePresence>
                {error && (
                  <motion.p initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                    className="text-xs text-red-400 bg-red-400/10 border border-red-400/20 rounded-lg px-3 py-2">
                    {error}
                  </motion.p>
                )}
                {success && (
                  <motion.p initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                    className="text-xs text-emerald-400 bg-emerald-400/10 border border-emerald-400/20 rounded-lg px-3 py-2">
                    {success}
                  </motion.p>
                )}
              </AnimatePresence>

              {/* Submit */}
              <button type="submit" disabled={loading}
                className="mt-1 w-full bg-white text-black font-semibold rounded-xl py-3 text-sm hover:bg-zinc-100 active:scale-[0.98] transition-all duration-150 flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed shadow-[0_4px_20px_rgba(255,255,255,0.15)]">
                {loading && <Loader2 size={16} className="animate-spin" />}
                {loading ? "Please wait…" : mode === "signin" ? "Sign In" : "Create Account"}
              </button>
            </form>

            {/* Toggle mode */}
            <div className="mt-6 text-center">
              <span className="text-xs text-zinc-600">
                {mode === "signin" ? "Don't have an account? " : "Already have an account? "}
              </span>
              <button onClick={switchMode}
                className="text-xs text-zinc-300 hover:text-white font-medium transition-colors underline underline-offset-2">
                {mode === "signin" ? "Sign up" : "Sign in"}
              </button>
            </div>
          </div>
        </motion.div>
      </TiltCard>

      {/* Bottom tagline */}
      <p className="fixed bottom-6 left-1/2 -translate-x-1/2 text-xs text-zinc-700 text-center whitespace-nowrap">
        Your research. Your history. Secured by Supabase.
      </p>
    </main>
  );
}
