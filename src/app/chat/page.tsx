"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { ChatContainer } from "@/components/chat/ChatContainer";
import { AnimatedBackground } from "@/components/AnimatedBackground";
import { useAuth } from "@/hooks/useAuth";
import { Loader2 } from "lucide-react";

export default function ChatPage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) {
      router.replace("/auth");
    }
  }, [user, loading, router]);

  if (loading) {
    return (
      <main className="flex h-[100dvh] w-full items-center justify-center bg-black">
        <Loader2 size={24} className="text-zinc-600 animate-spin" />
      </main>
    );
  }

  if (!user) return null;

  return (
    <main className="flex flex-col h-[100dvh] w-full overflow-hidden relative selection:bg-primary/30 selection:text-white bg-black">
      <div className="absolute inset-0 z-0 w-full h-full pointer-events-none">
        <AnimatedBackground />
      </div>
      <div className="flex-1 min-h-0 w-full relative z-10 flex flex-col items-center pt-0 pb-0">
        <ChatContainer />
      </div>
    </main>
  );
}
