"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { Message, Attachment } from "@/types/chat";
import { ChatMessage } from "./ChatMessage";
import { ChatInput } from "./ChatInput";
import { AnimatePresence, motion } from "framer-motion";
import { Snowflake, Mic, MicOff, Volume2 } from "lucide-react";
import { useVoice } from "@/hooks/useVoice";
import { useSpeech } from "@/hooks/useSpeech";

export function ChatContainer() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  // Voice & Speech Hooks
  const { speak, stop: stopSpeaking, isSpeaking } = useSpeech();

  // Auto-scroll to bottom
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isLoading]);

  const handleSendMessage = useCallback(
    async (content: string, attachments?: Attachment[]) => {
      // Stop speech when user sends a new message
      stopSpeaking();

      const userMessage: Message = { role: "user", content, attachments };
      const newMessages = [...messages, userMessage];
      setMessages(newMessages);
      setIsLoading(true);

      try {
        const response = await fetch("/api/chat", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ messages: newMessages }),
        });


        if (!response.ok) {
          throw new Error("Failed to get response");
        }

        const data = await response.json();
        const aiMessage: Message = {
          role: "assistant",
          content: data.reply || "",
        };
        setMessages((prev) => [...prev, aiMessage]);

        // Speak the response out loud
        if (data.reply) {
          speak(data.reply);
        }
      } catch (error) {
        console.error("Chat error:", error);
        const errorMessage: Message = {
          role: "assistant",
          content:
            "**Error**: Unable to reach the AI model. Please ensure the backend is available.",
        };
        setMessages((prev) => [...prev, errorMessage]);
      } finally {
        setIsLoading(false);
      }
    },
    [messages, speak, stopSpeaking]
  );

  // Voice Hook triggers handleSendMessage on wake word detection
  const { voiceState, transcript, isSupported, startListening, stopListening } =
    useVoice(handleSendMessage);

  const voiceActive = voiceState !== "idle";

  const toggleVoice = () => {
    if (voiceActive) {
      stopListening();
    } else {
      startListening();
    }
  };

  return (
    <div className="flex flex-col h-full w-full max-w-5xl mx-auto px-4 sm:px-6 z-10 relative mt-16 sm:mt-0">
      {messages.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center opacity-80 h-[80vh]">
          <div className="bg-white/5 p-6 rounded-full border border-white/10 mb-6 glass-panel">
            <Snowflake size={48} className="text-zinc-200" />
          </div>
          <h2 className="text-2xl font-bold text-[#E2E8F0] mb-2 tracking-tight">
            Hi Love, How can I help you today?
          </h2>

          {/* Initial Voice Status Indicator (Monochrome Glass) */}
          {/* Transcript box when heard */}
          {transcript && (
            <div className="glass-panel px-5 py-3 border-white/10 rounded-2xl text-sm text-zinc-300 max-w-sm text-center shadow-xl">
              {voiceState === "awake" ? `✦ "${transcript}"` : `Hearing: "${transcript || "..."}"`}
            </div>
          )}
        </div>
      ) : (
        <div className="flex-1 overflow-y-auto scrollbar-hide py-8 flex flex-col space-y-2 mt-4 lg:mt-12 h-screen max-h-[calc(100vh-140px)] w-full relative pl-2 overflow-x-hidden">
          <AnimatePresence initial={false}>
            {messages.map((msg, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
                className="w-full flex"
              >
                <ChatMessage message={msg} />
              </motion.div>
            ))}

            {isLoading && (
              <motion.div
                key="loading"
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.3 }}
                className="w-full flex justify-start mb-6"
              >
                <div className="flex max-w-[85%] sm:max-w-[75%] gap-4 p-5 rounded-3xl glass-panel mr-auto border-white/5 text-zinc-300 rounded-bl-sm shadow-2xl items-center">
                  <div className="flex-shrink-0 mt-1">
                    <div className="bg-white/10 p-2 rounded-full border border-white/10">
                      <Snowflake size={18} className="text-zinc-400" />
                    </div>
                  </div>
                  <div className="flex space-x-1 items-center ml-2">
                    <div className="w-2 h-2 bg-white/60 rounded-full animate-bounce [animation-delay:-0.3s]"></div>
                    <div className="w-2 h-2 bg-white/60 rounded-full animate-bounce [animation-delay:-0.15s]"></div>
                    <div className="w-2 h-2 bg-white/60 rounded-full animate-bounce"></div>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
          <div ref={bottomRef} className="h-4" />
        </div>
      )}

      {/* Input Section */}
      <div className="w-full pb-4 sm:pb-8 pt-2 sticky bottom-0 bg-transparent flex flex-col justify-center items-center">

        <ChatInput
          onSendMessage={handleSendMessage}
          isLoading={isLoading}
          isVoiceSupported={isSupported}
          voiceActive={voiceActive}
          onToggleVoice={toggleVoice}
        />
      </div>
    </div>
  );
}
