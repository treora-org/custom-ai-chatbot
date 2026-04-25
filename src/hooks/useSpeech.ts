"use client";

import { useCallback, useRef, useState } from "react";

interface UseSpeechReturn {
  speak: (text: string) => void;
  stop: () => void;
  isSpeaking: boolean;
}

function stripMarkdown(md: string): string {
  return md
    .replace(/```[\s\S]*?```/g, " code block ")
    .replace(/`([^`]+)`/g, "$1")
    .replace(/\*\*([^*]+)\*\*/g, "$1")
    .replace(/\*([^*]+)\*/g, "$1")
    .replace(/#{1,6}\s?/g, "")
    .replace(/!\[.*?\]\(.*?\)/g, "image")
    .replace(/\[([^\]]+)\]\(.*?\)/g, "$1")
    .replace(/[-*+]\s/g, "")
    .replace(/\d+\.\s/g, "")
    .replace(/>\s?/g, "")
    .replace(/---/g, "")
    .replace(/\n+/g, ". ")
    .replace(/\s+/g, " ")
    .trim();
}

// ── Browser TTS fallback ──────────────────────────────────────

function speakBrowser(text: string, onStart: () => void, onEnd: () => void) {
  if (!window.speechSynthesis) { onEnd(); return; }
  window.speechSynthesis.cancel();
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.rate = 1.0;
  utterance.pitch = 1.05;
  const voices = window.speechSynthesis.getVoices();
  const preferred = voices.find(
    (v) =>
      v.name.includes("Google UK English Female") ||
      v.name.includes("Microsoft Zira") ||
      v.name.toLowerCase().includes("samantha") ||
      v.name.toLowerCase().includes("female")
  );
  if (preferred) utterance.voice = preferred;
  utterance.onstart = onStart;
  utterance.onend = onEnd;
  utterance.onerror = onEnd;
  window.speechSynthesis.speak(utterance);
}

// ── ElevenLabs TTS ────────────────────────────────────────────

export function useSpeech(): UseSpeechReturn {
  const [isSpeaking, setIsSpeaking] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  const stop = useCallback(() => {
    // Stop ElevenLabs audio
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.src = "";
      audioRef.current = null;
    }
    // Cancel in-flight request
    if (abortRef.current) {
      abortRef.current.abort();
      abortRef.current = null;
    }
    // Stop browser TTS
    if (window.speechSynthesis) window.speechSynthesis.cancel();
    setIsSpeaking(false);
  }, []);

  const speak = useCallback(
    (text: string) => {
      stop();
      const clean = stripMarkdown(text);
      if (!clean) return;

      // Truncate very long responses (ElevenLabs free tier: 10k chars/month)
      const truncated = clean.length > 800 ? clean.slice(0, 800) + "…" : clean;

      setIsSpeaking(true);
      const controller = new AbortController();
      abortRef.current = controller;

      fetch("/api/tts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: truncated }),
        signal: controller.signal,
      })
        .then(async (res) => {
          if (!res.ok) throw new Error("TTS API failed");
          const blob = await res.blob();
          const url = URL.createObjectURL(blob);
          const audio = new Audio(url);
          audioRef.current = audio;

          audio.onended = () => {
            URL.revokeObjectURL(url);
            setIsSpeaking(false);
          };
          audio.onerror = () => {
            URL.revokeObjectURL(url);
            setIsSpeaking(false);
          };

          await audio.play();
        })
        .catch((err) => {
          if (err.name === "AbortError") return; // intentional stop
          console.warn("[Speech] ElevenLabs failed, using browser TTS:", err.message);
          // ── Fallback to browser TTS ──
          speakBrowser(
            truncated,
            () => setIsSpeaking(true),
            () => setIsSpeaking(false)
          );
        });
    },
    [stop]
  );

  return { speak, stop, isSpeaking };
}
