"use client";

import { SessionMeta, deleteSession } from "@/lib/chatStorage";
import { motion, AnimatePresence } from "framer-motion";
import { MessageSquare, Trash2, Plus, X, Clock } from "lucide-react";

interface HistorySidebarProps {
  isOpen: boolean;
  onClose: () => void;
  sessions: SessionMeta[];
  currentSessionId: string | null;
  onSelectSession: (id: string) => void;
  onNewChat: () => void;
  onDeleteSession: (id: string) => void;
}

function formatDate(iso: string): string {
  const d = new Date(iso);
  const now = new Date();
  const diffDays = Math.floor((now.getTime() - d.getTime()) / 86400000);
  if (diffDays === 0) return "Today " + d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  if (diffDays === 1) return "Yesterday";
  if (diffDays < 7) return d.toLocaleDateString([], { weekday: "long" });
  return d.toLocaleDateString([], { month: "short", day: "numeric" });
}

export function HistorySidebar({
  isOpen, onClose, sessions, currentSessionId,
  onSelectSession, onNewChat, onDeleteSession,
}: HistorySidebarProps) {
  return (
    <>
      {/* Backdrop */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 z-30 bg-black/40 backdrop-blur-sm"
          />
        )}
      </AnimatePresence>

      {/* Sidebar panel */}
      <AnimatePresence>
        {isOpen && (
          <motion.aside
            initial={{ x: "-100%" }}
            animate={{ x: 0 }}
            exit={{ x: "-100%" }}
            transition={{ type: "spring", damping: 28, stiffness: 260 }}
            className="fixed left-0 top-0 h-full w-[85vw] max-w-sm sm:w-80 z-40 flex flex-col shadow-2xl"
            style={{
              background: "rgba(5, 5, 5, 0.4)",
              backdropFilter: "blur(12px)",
              borderRight: "1px solid rgba(255,255,255,0.1)",
            }}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-5 pt-6 pb-4">
              <span className="text-sm font-semibold text-zinc-300 tracking-widest uppercase">History</span>
              <button onClick={onClose} className="p-1.5 rounded-lg text-zinc-500 hover:text-zinc-200 hover:bg-white/5 transition-colors">
                <X size={16} />
              </button>
            </div>

            {/* New chat */}
            <div className="px-4 mb-3">
              <button
                onClick={() => { onNewChat(); onClose(); }}
                className="w-full flex items-center gap-2.5 px-4 py-2.5 rounded-xl border border-white/10 text-zinc-300 hover:text-white hover:bg-white/8 hover:border-white/20 transition-all text-sm font-medium"
              >
                <Plus size={15} />
                New conversation
              </button>
            </div>

            <div className="w-full h-px bg-white/5 mb-3" />

            {/* Sessions list */}
            <div className="flex-1 overflow-y-auto px-2 pb-6 space-y-1 scrollbar-hide">
              {sessions.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-40 text-zinc-600 text-sm gap-2">
                  <Clock size={28} strokeWidth={1.2} />
                  <p>No past conversations</p>
                </div>
              ) : (
                sessions.map((s) => {
                  const isActive = s.id === currentSessionId;
                  return (
                    <div
                      key={s.id}
                      className={`group relative flex items-start gap-3 px-3 py-2.5 rounded-xl cursor-pointer transition-all ${
                        isActive
                          ? "bg-white/10 border border-white/15"
                          : "hover:bg-white/5 border border-transparent"
                      }`}
                      onClick={() => { onSelectSession(s.id); onClose(); }}
                    >
                      <MessageSquare size={15} className="flex-shrink-0 mt-0.5 text-zinc-500" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-zinc-300 truncate leading-snug">{s.title}</p>
                        <p className="text-[11px] text-zinc-600 mt-0.5">
                          {formatDate(s.updatedAt)} · {s.messageCount} msgs
                        </p>
                      </div>
                      {/* Delete button */}
                      <button
                        onClick={(e) => { e.stopPropagation(); onDeleteSession(s.id); }}
                        className="opacity-0 group-hover:opacity-100 flex-shrink-0 p-1 rounded-lg text-zinc-600 hover:text-red-400 hover:bg-red-500/10 transition-all"
                        title="Delete"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  );
                })
              )}
            </div>
          </motion.aside>
        )}
      </AnimatePresence>
    </>
  );
}
