import { ChatContainer } from "@/components/chat/ChatContainer";
import { AnimatedBackground } from "@/components/AnimatedBackground";

export default function Home() {
  return (
    <main className="flex flex-col h-[100dvh] w-full overflow-hidden relative selection:bg-primary/30 selection:text-white bg-black">
      <div className="absolute inset-0 z-0 w-full h-full pointer-events-none">
        <AnimatedBackground />
      </div>

      {/* Chat application body */}
      <div className="flex-1 min-h-0 w-full relative z-10 flex flex-col items-center pt-0 pb-0">
        <ChatContainer />
      </div>
    </main>
  );
}
