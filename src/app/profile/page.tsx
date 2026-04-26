"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/hooks/useAuth";
import { useRouter } from "next/navigation";
import { AnimatedBackground } from "@/components/AnimatedBackground";
import { Snowflake, User, Mail, Phone, Lock, Loader2, ArrowLeft, CheckCircle2 } from "lucide-react";
import Link from "next/link";

export default function ProfilePage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [isUpdating, setIsUpdating] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  useEffect(() => {
    if (!authLoading && !user) {
      router.replace("/auth?mode=signin");
    } else if (user) {
      setName(user.user_metadata?.full_name || "");
      setEmail(user.email || "");
      setPhone(user.user_metadata?.phone || "");
    }
  }, [user, authLoading, router]);

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsUpdating(true);
    setMessage(null);

    try {
      const updates: any = {};
      const metadataUpdates: any = {};

      if (email !== user?.email) updates.email = email;
      if (password) updates.password = password;
      if (name !== user?.user_metadata?.full_name) metadataUpdates.full_name = name;
      if (phone !== user?.user_metadata?.phone) metadataUpdates.phone = phone;

      if (Object.keys(metadataUpdates).length > 0) {
        updates.data = metadataUpdates;
      }

      if (Object.keys(updates).length === 0) {
        setMessage({ type: "success", text: "No changes to save." });
        setIsUpdating(false);
        return;
      }

      const { error } = await supabase.auth.updateUser(updates);

      if (error) throw error;

      setMessage({ type: "success", text: "Profile updated successfully!" });
      setPassword(""); // Clear password field after update
    } catch (err: any) {
      setMessage({ type: "error", text: err.message || "Failed to update profile." });
    } finally {
      setIsUpdating(false);
    }
  };

  if (authLoading || !user) {
    return (
      <main className="flex h-[100dvh] w-full items-center justify-center bg-black">
        <Loader2 size={24} className="text-zinc-600 animate-spin" />
      </main>
    );
  }

  return (
    <main className="flex flex-col h-[100dvh] w-full overflow-y-auto selection:bg-white/20 text-white bg-black relative">
      <div className="fixed inset-0 z-0 pointer-events-none">
        <AnimatedBackground />
        <div className="absolute inset-0 bg-black/40 backdrop-blur-[2px]" />
      </div>

      {/* Header */}
      <header className="relative z-10 p-6 flex items-center justify-between">
        <Link href="/chat" className="flex items-center gap-2 text-zinc-400 hover:text-white transition-colors">
          <ArrowLeft size={16} />
          <span className="text-sm">Back to Chat</span>
        </Link>
        <div className="flex items-center gap-2">
          <Snowflake size={16} className="text-zinc-500" />
          <span className="text-xs text-zinc-500 uppercase tracking-widest">Eve Profile</span>
        </div>
      </header>

      {/* Content */}
      <div className="relative z-10 flex-1 flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
          className="w-full max-w-md bg-zinc-950/80 backdrop-blur-2xl border border-white/10 rounded-3xl overflow-hidden shadow-2xl"
        >
          <div className="p-8">
            <h2 className="text-2xl font-bold text-white tracking-tight mb-2">Profile Settings</h2>
            <p className="text-sm text-zinc-400 mb-8 leading-relaxed">
              Update your personal details. Changes to your email may require verification.
            </p>

            <form onSubmit={handleUpdate} className="space-y-4">
              <div className="space-y-1">
                <label className="text-xs text-zinc-400 ml-1">Full Name</label>
                <div className="relative">
                  <User size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500" />
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-11 py-3 text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-white/20 focus:bg-white/10 transition-all"
                    placeholder="Enter your name"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs text-zinc-400 ml-1">Email Address</label>
                <div className="relative">
                  <Mail size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-11 py-3 text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-white/20 focus:bg-white/10 transition-all"
                    placeholder="Enter your email"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs text-zinc-400 ml-1">Phone Number (Optional)</label>
                <div className="relative">
                  <Phone size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500" />
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-11 py-3 text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-white/20 focus:bg-white/10 transition-all"
                    placeholder="Enter your phone"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs text-zinc-400 ml-1">New Password (Optional)</label>
                <div className="relative">
                  <Lock size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500" />
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-11 py-3 text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-white/20 focus:bg-white/10 transition-all"
                    placeholder="Leave blank to keep current"
                  />
                </div>
              </div>

              {message && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  className={`p-3 rounded-xl flex items-start gap-2 text-sm ${
                    message.type === "success" ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20" : "bg-red-500/10 text-red-400 border border-red-500/20"
                  }`}
                >
                  {message.type === "success" ? <CheckCircle2 size={16} className="mt-0.5 shrink-0" /> : <div className="w-1.5 h-1.5 rounded-full bg-red-400 mt-1.5 shrink-0" />}
                  <span>{message.text}</span>
                </motion.div>
              )}

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={isUpdating}
                  className="w-full bg-white text-black font-medium py-3.5 rounded-xl hover:bg-zinc-200 active:scale-[0.98] transition-all flex justify-center items-center h-[52px]"
                >
                  {isUpdating ? <Loader2 size={18} className="animate-spin text-zinc-500" /> : "Save Changes"}
                </button>
              </div>
            </form>
          </div>
        </motion.div>
      </div>
    </main>
  );
}
