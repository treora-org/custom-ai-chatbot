"use client";

import { useState, useEffect, useRef, useCallback } from "react";

type VoiceState = "idle" | "listening" | "awake" | "processing";

interface UseVoiceReturn {
  voiceState: VoiceState;
  transcript: string;
  isSupported: boolean;
  startListening: () => void;
  stopListening: () => void;
}

const WAKE_WORDS = /\b(hey\s*eve|hi\s*eve|eve)\b/i;

export function useVoice(onCommand: (command: string) => void): UseVoiceReturn {
  const [voiceState, setVoiceState] = useState<VoiceState>("idle");
  const [transcript, setTranscript] = useState("");
  const [isSupported, setIsSupported] = useState(false);

  // Refs to avoid stale closures
  const recognitionRef = useRef<any>(null);
  const awakeTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const commandBufferRef = useRef("");
  const isAwakeRef = useRef(false);
  const onCommandRef = useRef(onCommand);
  const activeRef = useRef(false); // Whether we WANT to be listening

  // Keep callback ref fresh
  useEffect(() => {
    onCommandRef.current = onCommand;
  }, [onCommand]);

  // Check support on mount
  useEffect(() => {
    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    setIsSupported(!!SR);
  }, []);

  const createRecognition = useCallback(() => {
    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SR) return null;

    const recognition = new SR();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = "en-US";
    recognition.maxAlternatives = 1;

    recognition.onstart = () => {
      console.log("[Voice] Recognition started");
      setVoiceState(isAwakeRef.current ? "awake" : "listening");
    };

    recognition.onresult = (event: any) => {
      let interimTranscript = "";
      let finalTranscript = "";

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i];
        if (result.isFinal) {
          finalTranscript += result[0].transcript;
        } else {
          interimTranscript += result[0].transcript;
        }
      }

      const currentText = (finalTranscript || interimTranscript).trim();
      if (!currentText) return;

      console.log("[Voice] Heard:", currentText);
      setTranscript(currentText);

      if (!isAwakeRef.current) {
        // Passive mode: waiting for wake word
        if (WAKE_WORDS.test(currentText)) {
          console.log("[Voice] Wake word detected!");
          isAwakeRef.current = true;
          setVoiceState("awake");
          commandBufferRef.current = "";

          const afterWake = currentText.replace(WAKE_WORDS, "").trim();
          if (afterWake.length > 0) {
            commandBufferRef.current = afterWake;
          }

          // Set a timeout to submit whatever we've heard
          if (awakeTimeoutRef.current) clearTimeout(awakeTimeoutRef.current);
          awakeTimeoutRef.current = setTimeout(() => {
            submitCommand();
          }, 4000);
        }
      } else {
        // Active mode: capturing command after wake word
        const cleaned = (finalTranscript || interimTranscript).replace(WAKE_WORDS, "").trim();
        if (cleaned.length > 0) {
          commandBufferRef.current = cleaned;
        }

        // Reset the submit timeout (user is still talking)
        if (awakeTimeoutRef.current) clearTimeout(awakeTimeoutRef.current);
        awakeTimeoutRef.current = setTimeout(() => {
          submitCommand();
        }, 3000);
      }
    };

    recognition.onerror = (event: any) => {
      console.log("[Voice] Error:", event.error);
      // Don't restart on fatal errors
      if (event.error === "not-allowed") {
        console.error("[Voice] Microphone permission denied");
        activeRef.current = false;
        setVoiceState("idle");
        return;
      }
      // For recoverable errors, onend will handle restart
    };

    recognition.onend = () => {
      console.log("[Voice] Recognition ended, activeRef:", activeRef.current);
      // Only restart if we still want to be listening
      if (activeRef.current) {
        console.log("[Voice] Restarting...");
        setTimeout(() => {
          if (activeRef.current && recognitionRef.current) {
            try {
              recognitionRef.current.start();
            } catch (e) {
              // If restarting fails, recreate the whole instance
              console.log("[Voice] Restart failed, recreating...");
              const newRec = createRecognition();
              if (newRec) {
                recognitionRef.current = newRec;
                try {
                  newRec.start();
                } catch (e2) {
                  console.error("[Voice] Full restart failed:", e2);
                }
              }
            }
          }
        }, 300);
      }
    };

    return recognition;
  }, []);

  const submitCommand = useCallback(() => {
    const cmd = commandBufferRef.current.trim();
    isAwakeRef.current = false;
    commandBufferRef.current = "";

    if (cmd.length > 0) {
      console.log("[Voice] Submitting command:", cmd);
      setVoiceState("processing");
      onCommandRef.current(cmd);
      setTimeout(() => {
        if (activeRef.current) {
          setVoiceState("listening");
        }
      }, 500);
    } else {
      console.log("[Voice] No command captured, going back to listening");
      if (activeRef.current) {
        setVoiceState("listening");
      }
    }
  }, []);

  const startListening = useCallback(() => {
    // Abort any existing
    if (recognitionRef.current) {
      try { recognitionRef.current.abort(); } catch (e) {}
      recognitionRef.current = null;
    }

    activeRef.current = true;
    isAwakeRef.current = false;
    commandBufferRef.current = "";

    const recognition = createRecognition();
    if (!recognition) {
      console.error("[Voice] SpeechRecognition not available");
      return;
    }

    recognitionRef.current = recognition;
    try {
      recognition.start();
      console.log("[Voice] Started listening");
    } catch (e) {
      console.error("[Voice] Failed to start:", e);
    }
  }, [createRecognition]);

  const stopListening = useCallback(() => {
    console.log("[Voice] Stopping");
    activeRef.current = false;
    isAwakeRef.current = false;
    commandBufferRef.current = "";

    if (awakeTimeoutRef.current) {
      clearTimeout(awakeTimeoutRef.current);
      awakeTimeoutRef.current = null;
    }

    if (recognitionRef.current) {
      try { recognitionRef.current.abort(); } catch (e) {}
      recognitionRef.current = null;
    }

    setVoiceState("idle");
    setTranscript("");
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      activeRef.current = false;
      if (recognitionRef.current) {
        try { recognitionRef.current.abort(); } catch (e) {}
      }
      if (awakeTimeoutRef.current) {
        clearTimeout(awakeTimeoutRef.current);
      }
    };
  }, []);

  return {
    voiceState,
    transcript,
    isSupported,
    startListening,
    stopListening,
  };
}
