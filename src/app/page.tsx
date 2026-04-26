"use client";

import { useRef, useCallback, useEffect, useState } from "react";
import { motion, useInView, AnimatePresence } from "framer-motion";
import Link from "next/link";
import {
  Snowflake, Mic, Globe, Search, Volume2, History,
  Shield, ArrowRight, Zap, Brain, ChevronRight
} from "lucide-react";

// ─── 3D Tilt Card ──────────────────────────────────────────────
function TiltCard({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const frameRef = useRef<number>(0);

  const onMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    cancelAnimationFrame(frameRef.current);
    frameRef.current = requestAnimationFrame(() => {
      if (!ref.current) return;
      const r = ref.current.getBoundingClientRect();
      const x = (e.clientX - r.left) / r.width - 0.5;
      const y = (e.clientY - r.top) / r.height - 0.5;
      ref.current.style.transform = `perspective(800px) rotateY(${x * 10}deg) rotateX(${-y * 10}deg) translateZ(10px)`;
    });
  }, []);

  const onLeave = useCallback(() => {
    cancelAnimationFrame(frameRef.current);
    if (ref.current) ref.current.style.transform = "perspective(800px) rotateY(0deg) rotateX(0deg) translateZ(0px)";
  }, []);

  return (
    <div
      ref={ref}
      onMouseMove={onMove}
      onMouseLeave={onLeave}
      className={className}
      style={{ transition: "transform 0.2s ease-out", willChange: "transform", transformStyle: "preserve-3d" }}
    >
      {children}
    </div>
  );
}

// ─── Animated Canvas Background ────────────────────────────────
function ParticleField() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animId: number;
    const particles: { x: number; y: number; vx: number; vy: number; size: number; opacity: number }[] = [];

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resize();
    window.addEventListener("resize", resize);

    // Create particles
    for (let i = 0; i < 80; i++) {
      particles.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        vx: (Math.random() - 0.5) * 0.3,
        vy: (Math.random() - 0.5) * 0.3,
        size: Math.random() * 1.5 + 0.3,
        opacity: Math.random() * 0.5 + 0.1,
      });
    }

    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Connect nearby particles
      for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
          const dx = particles[i].x - particles[j].x;
          const dy = particles[i].y - particles[j].y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < 120) {
            ctx.beginPath();
            ctx.strokeStyle = `rgba(255,255,255,${0.06 * (1 - dist / 120)})`;
            ctx.lineWidth = 0.5;
            ctx.moveTo(particles[i].x, particles[i].y);
            ctx.lineTo(particles[j].x, particles[j].y);
            ctx.stroke();
          }
        }
      }

      particles.forEach((p) => {
        p.x += p.vx;
        p.y += p.vy;
        if (p.x < 0 || p.x > canvas.width) p.vx *= -1;
        if (p.y < 0 || p.y > canvas.height) p.vy *= -1;

        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(255,255,255,${p.opacity})`;
        ctx.fill();
      });

      animId = requestAnimationFrame(draw);
    };
    draw();

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener("resize", resize);
    };
  }, []);

  return <canvas ref={canvasRef} className="absolute inset-0 w-full h-full pointer-events-none" />;
}

// ─── Feature Card ───────────────────────────────────────────────
const features = [
  {
    icon: Brain,
    title: "Llama 3.1 via Groq",
    description: "Ultra-fast LPU inference with near-instant responses on the world's most capable open-source model.",
    glow: "rgba(180,180,180,0.08)",
  },
  {
    icon: Search,
    title: "Autonomous Web Research",
    description: "Eve searches the web and reads full webpages autonomously before answering, chaining up to 4 tool calls.",
    glow: "rgba(160,160,160,0.08)",
  },
  {
    icon: Mic,
    title: "Always-On Voice",
    description: 'Say "Hey Eve" to activate. Groq Whisper Large v3 Turbo transcribes your voice in milliseconds.',
    glow: "rgba(200,200,200,0.08)",
  },
  {
    icon: Volume2,
    title: "Neural Text-to-Speech",
    description: "ElevenLabs neural voice reads Eve's responses aloud. Falls back to browser TTS automatically.",
    glow: "rgba(140,140,140,0.08)",
  },
  {
    icon: History,
    title: "Persistent History",
    description: "Every conversation is saved to Supabase. Your research is always there when you need it.",
    glow: "rgba(170,170,170,0.08)",
  },
  {
    icon: Shield,
    title: "Privacy First",
    description: "All API keys live server-side. Your conversations are scoped to your account only, secured by RLS.",
    glow: "rgba(190,190,190,0.08)",
  },
];

function FeatureCard({ feat, index }: { feat: typeof features[0]; index: number }) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-60px" });
  const Icon = feat.icon;

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 30 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.5, delay: index * 0.08, ease: [0.22, 1, 0.36, 1] }}
    >
      <TiltCard className="h-full">
        <div
          className="h-full relative rounded-2xl border border-white/8 bg-white/[0.03] p-6 overflow-hidden group"
          style={{ boxShadow: `inset 0 0 40px ${feat.glow}` }}
        >
          {/* Top gradient line */}
          <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent" />

          <div className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center mb-4 group-hover:bg-white/10 transition-colors">
            <Icon size={18} className="text-zinc-300" />
          </div>
          <h3 className="text-sm font-semibold text-white mb-2">{feat.title}</h3>
          <p className="text-xs text-zinc-500 leading-relaxed">{feat.description}</p>
        </div>
      </TiltCard>
    </motion.div>
  );
}

// ─── Animated number counter ───────────────────────────────────
function StatItem({ value, label }: { value: string; label: string }) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true });
  return (
    <motion.div ref={ref} initial={{ opacity: 0, y: 16 }} animate={inView ? { opacity: 1, y: 0 } : {}} transition={{ duration: 0.5 }} className="text-center">
      <div className="text-3xl font-bold text-white mb-1 tracking-tight">{value}</div>
      <div className="text-xs text-zinc-500">{label}</div>
    </motion.div>
  );
}

// ─── Main Landing Page ─────────────────────────────────────────
export default function LandingPage() {
  const heroRef = useRef(null);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <main className="relative bg-black text-white overflow-x-hidden selection:bg-white/20">
      <ParticleField />

      {/* Radial gradient hero glow */}
      <div className="fixed inset-0 pointer-events-none" style={{
        background: "radial-gradient(ellipse 80% 50% at 50% -10%, rgba(255,255,255,0.06) 0%, transparent 60%)"
      }} />

      {/* ── Navbar ── */}
      <motion.nav
        className="fixed top-0 left-0 right-0 z-50 px-6 py-4 flex items-center justify-between"
        style={{
          backdropFilter: scrolled ? "blur(20px)" : "none",
          backgroundColor: scrolled ? "rgba(0,0,0,0.7)" : "transparent",
          borderBottom: scrolled ? "1px solid rgba(255,255,255,0.06)" : "1px solid transparent",
          transition: "all 0.3s ease",
        }}
      >
        <div className="flex items-center gap-2.5">
          <Snowflake size={20} className="text-zinc-300" />
          <span className="font-semibold text-sm tracking-widest text-white uppercase">Eve</span>
          <span className="text-xs text-zinc-600 font-mono">1.0</span>
        </div>

        <div className="flex items-center gap-3">
          <Link href="/auth?mode=signin"
            className="text-sm text-zinc-400 hover:text-white transition-colors px-4 py-2 rounded-xl hover:bg-white/5">
            Sign In
          </Link>
          <Link href="/auth?mode=signup"
            className="text-sm font-medium text-black bg-white px-4 py-2 rounded-xl hover:bg-zinc-100 transition-all shadow-[0_0_20px_rgba(255,255,255,0.15)] active:scale-[0.97]">
            Get Started
          </Link>
        </div>
      </motion.nav>

      {/* ── Hero ── */}
      <section ref={heroRef} className="relative min-h-screen flex flex-col items-center justify-center text-center px-4 pt-20">
        {/* Badge */}
        <motion.div
          initial={{ opacity: 0, y: -12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="inline-flex items-center gap-2 border border-white/10 bg-white/5 backdrop-blur-sm rounded-full px-4 py-1.5 mb-8"
        >
          <Zap size={12} className="text-zinc-400" />
          <span className="text-xs text-zinc-400 tracking-wide">Powered by Groq · Llama 3.1 · ElevenLabs</span>
        </motion.div>

        {/* Main headline */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.2, ease: [0.22, 1, 0.36, 1] }}
        >
          <h1 className="text-5xl sm:text-7xl lg:text-8xl font-bold tracking-tight leading-[0.95] mb-6">
            <span className="text-white">The AI that</span>
            <br />
            <span className="bg-gradient-to-b from-white to-zinc-500 bg-clip-text text-transparent">
              thinks before
            </span>
            <br />
            <span className="text-white">it answers.</span>
          </h1>
        </motion.div>

        <motion.p
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.35 }}
          className="text-base sm:text-lg text-zinc-500 max-w-xl mb-10 leading-relaxed"
        >
          Eve searches the web, reads webpages, and synthesizes real-time answers —
          all triggered by just your voice.
        </motion.p>

        {/* CTAs */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.5 }}
          className="flex flex-col sm:flex-row items-center gap-3 mb-16"
        >
          <Link href="/auth?mode=signup"
            className="group flex items-center gap-2 bg-white text-black font-semibold px-7 py-3.5 rounded-2xl hover:bg-zinc-100 active:scale-[0.97] transition-all shadow-[0_4px_40px_rgba(255,255,255,0.2)] text-sm">
            Start for free
            <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
          </Link>
          <Link href="/auth?mode=signin"
            className="flex items-center gap-2 border border-white/10 text-zinc-300 px-7 py-3.5 rounded-2xl hover:bg-white/5 hover:border-white/20 transition-all text-sm">
            Sign in
            <ChevronRight size={16} className="text-zinc-600" />
          </Link>
        </motion.div>

        {/* Stats row */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.8, delay: 0.7 }}
          className="flex items-center gap-12 border-t border-white/5 pt-10 w-full max-w-sm justify-between"
        >
          <StatItem value="~50ms" label="Response latency" />
          <StatItem value="4x" label="Research depth" />
          <StatItem value="100%" label="Voice-enabled" />
        </motion.div>

        {/* Scroll indicator */}
        <motion.div
          className="absolute bottom-8 left-1/2 -translate-x-1/2"
          animate={{ y: [0, 6, 0] }}
          transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
        >
          <div className="w-5 h-8 rounded-full border border-white/15 flex items-start justify-center pt-1.5">
            <div className="w-1 h-2 bg-white/30 rounded-full" />
          </div>
        </motion.div>
      </section>

      {/* ── 3D Hero Card preview ── */}
      <section className="relative px-4 pb-24 flex justify-center">
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
          className="w-full max-w-3xl"
        >
          <TiltCard>
            <div className="relative rounded-2xl border border-white/10 bg-zinc-950/80 backdrop-blur-xl overflow-hidden shadow-[0_40px_100px_rgba(0,0,0,0.8)]">
              {/* Fake browser chrome */}
              <div className="flex items-center gap-1.5 px-4 py-3 border-b border-white/5">
                <div className="w-3 h-3 rounded-full bg-white/10" />
                <div className="w-3 h-3 rounded-full bg-white/10" />
                <div className="w-3 h-3 rounded-full bg-white/10" />
                <div className="flex-1 mx-3 h-5 rounded-md bg-white/5 flex items-center px-3">
                  <span className="text-[10px] text-zinc-600">eve-ai.vercel.app/chat</span>
                </div>
              </div>
              {/* Chat preview */}
              <div className="p-6 space-y-4">
                <div className="flex justify-end">
                  <div className="bg-white/10 rounded-2xl rounded-tr-sm px-4 py-2.5 max-w-xs">
                    <p className="text-xs text-zinc-300">What are the latest AI breakthroughs in 2025?</p>
                  </div>
                </div>
                <div className="flex gap-3">
                  <div className="w-7 h-7 rounded-full bg-white/5 border border-white/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <Snowflake size={13} className="text-zinc-400" />
                  </div>
                  <div className="bg-white/5 border border-white/8 rounded-2xl rounded-tl-sm px-4 py-3 max-w-sm">
                    <p className="text-xs text-zinc-400 leading-relaxed">
                      I&apos;ll research that for you… <span className="text-zinc-600">🔍 Searching web · 📄 Reading 3 sources</span>
                      <br /><br />
                      Based on my research, the top 2025 breakthroughs include multimodal reasoning models, open-weight 70B models matching GPT-4, and real-time voice AI…
                    </p>
                    <div className="mt-2 flex items-center gap-1.5">
                      <Globe size={10} className="text-zinc-600" />
                      <span className="text-[10px] text-zinc-600">3 sources · arxiv.org, techcrunch.com, nature.com</span>
                    </div>
                  </div>
                </div>
                {/* Voice indicator */}
                <div className="flex items-center gap-2 px-3 py-2 bg-white/3 border border-white/8 rounded-full w-fit mx-auto">
                  <div className="w-1.5 h-1.5 rounded-full bg-zinc-400 animate-pulse" />
                  <span className="text-[10px] text-zinc-500">✦ Say "Hey Eve" to start talking</span>
                </div>
              </div>
            </div>
          </TiltCard>
        </motion.div>
      </section>

      {/* ── Features ── */}
      <section className="relative px-4 py-24 max-w-6xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="text-center mb-16"
        >
          <div className="inline-flex items-center gap-2 border border-white/10 bg-white/5 rounded-full px-4 py-1.5 mb-5">
            <span className="text-xs text-zinc-500 tracking-wide">Everything you need</span>
          </div>
          <h2 className="text-3xl sm:text-5xl font-bold tracking-tight">
            Built different.
          </h2>
          <p className="text-zinc-500 text-sm mt-4 max-w-md mx-auto leading-relaxed">
            Eve isn't a chatbot. She's an autonomous research agent that works the way your brain does — search, read, synthesize.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {features.map((f, i) => <FeatureCard key={f.title} feat={f} index={i} />)}
        </div>
      </section>

      {/* ── How it works ── */}
      <section className="relative px-4 py-24 max-w-4xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="text-center mb-16"
        >
          <h2 className="text-3xl sm:text-4xl font-bold tracking-tight mb-4">How Eve works</h2>
          <p className="text-zinc-500 text-sm max-w-sm mx-auto">Three steps. Completely hands-free.</p>
        </motion.div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-8 relative">
          {/* Connector line */}
          <div className="hidden sm:block absolute top-8 left-1/3 right-1/3 h-px bg-gradient-to-r from-white/5 via-white/15 to-white/5" />

          {[
            { step: "01", title: "You speak", desc: 'Say "Hey Eve" followed by your question. Eve wakes up instantly.', icon: Mic },
            { step: "02", title: "Eve researches", desc: "She searches the web, picks the best URLs, and reads their full content.", icon: Search },
            { step: "03", title: "Eve responds", desc: "A concise, cited answer is spoken aloud and shown on screen.", icon: Volume2 },
          ].map((item, i) => {
            const Icon = item.icon;
            return (
              <motion.div
                key={item.step}
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: i * 0.12 }}
                className="text-center flex flex-col items-center"
              >
                <div className="w-16 h-16 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center mb-4 relative">
                  <Icon size={22} className="text-zinc-300" />
                  <div className="absolute -top-2 -right-2 w-5 h-5 rounded-full bg-zinc-900 border border-white/10 flex items-center justify-center">
                    <span className="text-[9px] text-zinc-500 font-mono">{item.step}</span>
                  </div>
                </div>
                <h3 className="text-sm font-semibold text-white mb-2">{item.title}</h3>
                <p className="text-xs text-zinc-500 leading-relaxed max-w-[200px]">{item.desc}</p>
              </motion.div>
            );
          })}
        </div>
      </section>

      {/* ── Bottom CTA ── */}
      <section className="relative px-4 py-32 text-center">
        <div className="absolute inset-0 pointer-events-none" style={{
          background: "radial-gradient(ellipse 60% 50% at 50% 100%, rgba(255,255,255,0.04) 0%, transparent 70%)"
        }} />
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <h2 className="text-4xl sm:text-6xl font-bold tracking-tight mb-4">
            Ready to research<br />
            <span className="bg-gradient-to-b from-white to-zinc-600 bg-clip-text text-transparent">at the speed of thought?</span>
          </h2>
          <p className="text-zinc-500 text-sm mb-10 max-w-sm mx-auto">
            Free to start. No credit card required. Just your voice and a question.
          </p>
          <Link href="/auth?mode=signup"
            className="group inline-flex items-center gap-2.5 bg-white text-black font-semibold px-8 py-4 rounded-2xl hover:bg-zinc-100 active:scale-[0.97] transition-all shadow-[0_4px_60px_rgba(255,255,255,0.2)] text-sm">
            Create free account
            <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
          </Link>
        </motion.div>
      </section>

      {/* ── Footer ── */}
      <footer className="border-t border-white/5 px-6 py-8 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <Snowflake size={14} className="text-zinc-600" />
          <span className="text-xs text-zinc-600 tracking-widest uppercase">Eve 1.0</span>
        </div>
        <p className="text-xs text-zinc-700">Built with Groq · Supabase · ElevenLabs · Next.js 16</p>
        <div className="flex items-center gap-4">
          <Link href="/auth?mode=signin" className="text-xs text-zinc-600 hover:text-zinc-400 transition-colors">Sign In</Link>
          <Link href="/auth?mode=signup" className="text-xs text-zinc-600 hover:text-zinc-400 transition-colors">Sign Up</Link>
        </div>
      </footer>
    </main>
  );
}
