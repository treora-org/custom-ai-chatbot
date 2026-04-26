"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { Message, Attachment } from "@/types/chat";
import { ChatMessage } from "./ChatMessage";
import { ChatInput } from "./ChatInput";
import { HistorySidebar } from "./HistorySidebar";
import { AnimatePresence, motion } from "framer-motion";
import { Snowflake, Menu, LogOut, ChevronDown, User } from "lucide-react";
import { useVoice } from "@/hooks/useVoice";
import { useSpeech } from "@/hooks/useSpeech";
import { useAuth } from "@/hooks/useAuth";
import {
  createSession, saveSession, loadSession, deleteSession,
  getIndex, syncFromCloud, setActiveUserId, ChatSession, SessionMeta,
} from "@/lib/chatStorage";

export function ChatContainer() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sessions, setSessions] = useState<SessionMeta[]>([]);
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  const { speak, stop: stopSpeaking, isSpeaking } = useSpeech();
  const { user, signOut } = useAuth();

  // Set active user for per-user storage and load sessions
  useEffect(() => {
    if (user?.id) setActiveUserId(user.id);
    getIndex().then(setSessions);
    syncFromCloud().then(() => getIndex().then(setSessions));
  }, [user?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  // Auto-scroll
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isLoading]);

  // Auto-save whenever messages change
  useEffect(() => {
    if (messages.length === 0) return;
    const persist = async () => {
      if (currentSessionId) {
        const session = await loadSession(currentSessionId);
        if (session) {
          await saveSession({ ...session, messages });
          setSessions(await getIndex());
        }
      } else {
        // First message — create a new session
        const session = createSession(messages);
        setCurrentSessionId(session.id);
        await saveSession(session);
        setSessions(await getIndex());
      }
    };
    persist();
  }, [messages]); // eslint-disable-line react-hooks/exhaustive-deps



  const handleSendMessage = useCallback(
    async (content: string, attachments?: Attachment[]) => {
      stopSpeaking();
      const userMessage: Message = { role: "user", content, attachments };
      const newMessages = [...messages, userMessage];
      setMessages(newMessages);
      setIsLoading(true);

      try {
        const response = await fetch("/api/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ messages: newMessages }),
        });

        const data = await response.json();
        if (!response.ok) throw new Error(data?.error || `API error ${response.status}`);

        const aiMessage: Message = {
          role: "assistant",
          content: data.reply || "",
          sources: data.sources
        };
        setMessages((prev) => [...prev, aiMessage]);
        if (data.reply) speak(data.reply);
        // First AI response — enter session mode (no more wake word needed)
        setSessionMode(true);
      } catch (error) {
        const detail = error instanceof Error ? error.message : "Unknown error";
        setMessages((prev) => [...prev, { role: "assistant", content: `**Error**: ${detail}` }]);
      } finally {
        setIsLoading(false);
      }
    },
    [messages, speak, stopSpeaking]
  );

  const { voiceState, transcript, startListening, stopListening, muteListening, unmuteListening, setSessionMode } =
    useVoice(handleSendMessage);

  const startNewChat = useCallback(() => {
    setMessages([]);
    setCurrentSessionId(null);
    setSessionMode(false); // reset to wake-word mode for new conversation
  }, [setSessionMode]);

  const handleSelectSession = useCallback(async (id: string) => {
    console.log("[Chat] Loading session:", id);
    const session = await loadSession(id);
    if (session) {
      console.log("[Chat] Loaded messages:", session.messages.length);
      setMessages(session.messages);
      setCurrentSessionId(id);
      setSessionMode(true); // Automatically assume they want to talk when opening history
    } else {
      console.warn("[Chat] Session not found or failed to load");
    }
  }, [setSessionMode]);

  const handleDeleteSession = useCallback(async (id: string) => {
    await deleteSession(id);
    setSessions(await getIndex());
    if (currentSessionId === id) startNewChat();
  }, [currentSessionId, startNewChat]);

  // Auto-start listening when the page loads — always-on wake word detection
  useEffect(() => {
    startListening();
    return () => stopListening();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Mute mic while Eve is speaking to prevent feedback
  useEffect(() => {
    if (isSpeaking) muteListening();
    else unmuteListening();
  }, [isSpeaking, muteListening, unmuteListening]);

  // Always show voice status — it's always listening
  const voiceLabel =
    voiceState === "listening" ? '✦ Say "Eve" or "Hey Eve" to start'
      : voiceState === "awake" ? "I'm listening, go ahead…"
        : voiceState === "processing" ? "Processing…"
          : '✦ Say "Eve" or "Hey Eve" to start';

  return (
    <>
      <HistorySidebar
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        sessions={sessions}
        currentSessionId={currentSessionId}
        onSelectSession={handleSelectSession}
        onNewChat={startNewChat}
        onDeleteSession={handleDeleteSession}
      />

      {/* Top Navigation - Fixed to act sticky */}
      <div className="fixed top-4 left-4 z-20">
        <button
          onClick={() => setSidebarOpen(true)}
          className="p-2.5 rounded-xl bg-white/5 backdrop-blur-xl border border-white/10 text-white hover:bg-white/10 hover:border-white/20 transition-all shadow-lg"
        >
          <Menu size={20} />
        </button>
      </div>

      <div className="fixed top-4 right-4 z-20">
        <div className="relative">
          <button
            onClick={() => setUserMenuOpen((o) => !o)}
            className="flex items-center gap-2 bg-white/5 backdrop-blur-xl border border-white/10 px-3 py-2 rounded-full shadow-lg hover:bg-white/10 transition-all"
          >
            <Snowflake size={16} className="text-zinc-300" />
            <span className="text-sm font-medium text-white max-w-[120px] truncate">
              {user?.user_metadata?.full_name || "Eve 1.0"}
            </span>
            <ChevronDown size={14} className={`text-zinc-400 transition-transform ${userMenuOpen ? "rotate-180" : ""}`} />
          </button>

          <AnimatePresence>
            {userMenuOpen && (
              <motion.div
                initial={{ opacity: 0, y: -8, scale: 0.96 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -8, scale: 0.96 }}
                transition={{ duration: 0.15 }}
                className="absolute right-0 top-full mt-2 w-52 bg-zinc-950/90 backdrop-blur-2xl border border-white/10 rounded-xl shadow-xl overflow-hidden"
              >
                <div className="px-4 py-3 border-b border-white/5">
                  <p className="text-xs font-medium text-white truncate">{user?.user_metadata?.full_name || "User"}</p>
                  <p className="text-xs text-zinc-500 truncate mt-0.5">{user?.email}</p>
                </div>
                <button
                  onClick={() => { setUserMenuOpen(false); window.location.href = "/profile"; }}
                  className="w-full flex items-center gap-2.5 px-4 py-3 text-sm text-zinc-400 hover:text-white hover:bg-white/5 transition-colors"
                >
                  <User size={14} />
                  Profile settings
                </button>
                <button
                  onClick={async () => { setUserMenuOpen(false); await signOut(); window.location.href = "/"; }}
                  className="w-full flex items-center gap-2.5 px-4 py-3 text-sm text-zinc-400 hover:text-white hover:bg-white/5 transition-colors border-t border-white/5"
                >
                  <LogOut size={14} />
                  Sign out
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      <div className="flex flex-col flex-1 min-h-0 w-full max-w-5xl mx-auto px-4 sm:px-6 z-10 relative">

        {messages.length === 0 ? (
          <div className="flex-1 min-h-0 flex flex-col items-center justify-center opacity-80 h-[80vh]">
            {/* Empty State */}
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.5 }}
              className="text-center"
            >
              <div className="w-20 h-20 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-6 shadow-[0_0_50px_rgba(255,255,255,0.05)] border border-white/10 relative overflow-hidden group">
                <div className="absolute inset-0 bg-gradient-to-tr from-white/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                <Snowflake size={32} className="text-zinc-200" />
              </div>
              <h2 className="text-2xl font-bold text-white mb-2 tracking-tight">Hi Love, How can I help you today?</h2>
              <p className="text-sm text-zinc-500">Just say "Eve" to start talking.</p>
            </motion.div>
            
            {transcript && (
              <div className="bg-white/5 backdrop-blur-2xl border-white/10 shadow-[0_8px_30px_rgb(0,0,0,0.12)] px-5 py-3 border rounded-2xl text-sm text-zinc-300 max-w-sm text-center mt-4">
                {voiceState === "awake" ? `✦ "${transcript}"` : `Hearing: "${transcript || "..."}"`}
              </div>
            )}
          </div>
        ) : (
          <div key={currentSessionId || "new"} className="flex-1 min-h-0 overflow-y-auto scrollbar-hide pt-20 pb-4 flex flex-col space-y-2 mt-0 w-full relative pl-2 overflow-x-hidden">
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
                      <div className="w-2 h-2 bg-white/60 rounded-full animate-bounce [animation-delay:-0.3s]" />
                      <div className="w-2 h-2 bg-white/60 rounded-full animate-bounce [animation-delay:-0.15s]" />
                      <div className="w-2 h-2 bg-white/60 rounded-full animate-bounce" />
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
            <div ref={bottomRef} className="h-4" />
          </div>
        )}

        {/* Input section */}
        <div className="w-full pb-4 sm:pb-8 pt-2 sticky bottom-0 bg-transparent flex flex-col justify-center items-center">
          <AnimatePresence>
            {voiceLabel && (
              <motion.div
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 6 }}
                transition={{ duration: 0.2 }}
                className="flex items-center gap-2 mb-2 px-4 py-1.5 rounded-full glass-panel border-white/10 text-xs text-zinc-400"
              >
                <span className={`w-1.5 h-1.5 rounded-full ${voiceState === "awake" ? "bg-white animate-pulse" : "bg-zinc-500 animate-pulse"}`} />
                {voiceLabel}
                {transcript && voiceState === "awake" && (
                  <span className="text-zinc-200 ml-1">"{transcript}"</span>
                )}
              </motion.div>
            )}
          </AnimatePresence>

          <ChatInput
            onSendMessage={handleSendMessage}
            isLoading={isLoading}
          />
        </div>
      </div>
    </>
  );
}
