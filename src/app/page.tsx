import { ChatContainer } from "@/components/chat/ChatContainer";
import { AnimatedBackground } from "@/components/AnimatedBackground";

export default function Home() {
  return (
    <main className="flex flex-col h-[100dvh] w-full overflow-hidden relative selection:bg-primary/30 selection:text-white">
      {/* Dynamic Animated Background */}
      <AnimatedBackground />

      {/* Sticky Header */}
      <header className="absolute sm:relative top-0 left-0 right-0 z-50 flex items-center justify-between px-4 sm:px-6 py-3 sm:py-4 glass border-b-0 shadow-sm backdrop-blur-xl bg-black/70">
        <div className="flex items-center space-x-2.5">
          <div className="w-8 h-8 rounded-xl bg-white/5 backdrop-blur-md border border-white/10 flex items-center justify-center">
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-zinc-200">
              <line x1="2" x2="22" y1="12" y2="12"/><line x1="12" x2="12" y1="2" y2="22"/>
              <path d="m20 16-4-4 4-4"/><path d="m4 8 4 4-4 4"/>
              <path d="m16 4-4 4-4-4"/><path d="m8 20 4-4 4 4"/>
            </svg>
          </div>
          <h1 className="text-zinc-100 font-semibold text-base sm:text-lg tracking-tight">Eve 1.0</h1>
        </div>
        <div className="flex items-center space-x-2 sm:space-x-4">
        </div>
      </header>

      {/* Chat application body */}
      <div className="flex-1 w-full h-full relative z-10 flex flex-col items-center">
        <ChatContainer />
      </div>
    </main>
  );
}
