"use client";

import { useState, useRef, useCallback, useEffect } from "react";

export type VoiceState = "idle" | "listening" | "awake" | "processing";

const WAKE_WORDS = /\b(hey\s+eve|hi\s+eve|okay\s+eve|eve)\b/i;
const STOP_CMD   = /\b(stop\s+listening|stop\s+eve|eve\s+stop|pause\s+listening)\b/i;

// ── VAD Tuning ──────────────────────────────────────────────
const VAD_THRESHOLD   = 1.5;    // RMS level (0-100) that counts as speech
const VAD_SILENCE_MS  = 2000;   // Wait 2 seconds of silence before processing
const MAX_SPEECH_MS   = 15000;  // Force cut-off if they talk for 15s straight
const PRE_ROLL_CHUNKS = 5;      // Keep 500ms of audio *before* speech is detected

function getSupportedMimeType(): string {
  const types = ["audio/webm;codecs=opus", "audio/webm", "audio/ogg;codecs=opus", "audio/mp4"];
  return types.find((t) => MediaRecorder.isTypeSupported(t)) || "";
}

interface UseVoiceReturn {
  voiceState: VoiceState;
  transcript: string;
  isSupported: boolean;
  startListening: () => void;
  stopListening: () => void;
  muteListening: () => void;
  unmuteListening: () => void;
  setSessionMode: (active: boolean) => void;
}

export function useVoice(onCommand: (cmd: string) => void): UseVoiceReturn {
  const [voiceState, setVoiceState] = useState<VoiceState>("idle");
  const [transcript, setTranscript] = useState("");
  const [isSupported, setIsSupported] = useState(false);

  const activeRef       = useRef(false);
  const mutedRef        = useRef(false);
  const isAwakeRef      = useRef(false);
  const sessionModeRef  = useRef(false);
  const streamRef       = useRef<MediaStream | null>(null);
  const recorderRef     = useRef<MediaRecorder | null>(null);
  const audioCtxRef     = useRef<AudioContext | null>(null);
  const getLevelRef     = useRef<(() => number) | null>(null);
  const onCommandRef    = useRef(onCommand);

  // VAD state memory
  const rollingBufferRef   = useRef<Blob[]>([]);
  const speechChunksRef    = useRef<Blob[]>([]);
  const isSpeakingRef      = useRef(false);
  const lastSpeechTimeRef  = useRef(0);
  const speechStartTimeRef = useRef(0);

  useEffect(() => { onCommandRef.current = onCommand; }, [onCommand]);
  useEffect(() => {
    setIsSupported(!!(navigator.mediaDevices && typeof MediaRecorder !== "undefined"));
  }, []);

  // ── 1. Setup VAD & Continuous Recorder ───────────────────────
  
  const setupPipeline = useCallback((stream: MediaStream) => {
    // 1a. Setup AudioContext for VAD
    const ctx = new AudioContext();
    const source = ctx.createMediaStreamSource(stream);
    const analyser = ctx.createAnalyser();
    analyser.fftSize = 1024;
    source.connect(analyser);
    const data = new Uint8Array(analyser.frequencyBinCount);

    audioCtxRef.current = ctx;
    
    if (ctx.state === "suspended") {
      const resumeCtx = () => {
        if (ctx.state === "suspended") ctx.resume();
        window.removeEventListener("click", resumeCtx);
        window.removeEventListener("keydown", resumeCtx);
      };
      window.addEventListener("click", resumeCtx);
      window.addEventListener("keydown", resumeCtx);
    }

    const getLevel = () => {
      analyser.getByteTimeDomainData(data);
      let sum = 0;
      for (let i = 0; i < data.length; i++) {
        const v = data[i] / 128 - 1;
        sum += v * v;
      }
      return Math.sqrt(sum / data.length) * 100;
    };
    getLevelRef.current = getLevel;

    // 1b. Setup Recorder
    const mimeType = getSupportedMimeType();
    let recorder: MediaRecorder;
    try {
      recorder = new MediaRecorder(stream, mimeType ? { mimeType } : {});
    } catch (e) {
      console.error("[Voice] MediaRecorder failed:", e);
      return;
    }
    
    recorderRef.current = recorder;

    recorder.ondataavailable = (e) => {
      if (!activeRef.current || e.data.size < 1500) return;
      if (mutedRef.current) return;
      processUtterance(e.data); // e.data is now a perfectly valid, complete Blob
    };

    // 1c. VAD Polling Loop
    let silenceTimer: NodeJS.Timeout | null = null;
    let forceCutoffTimer: NodeJS.Timeout | null = null;

    const stopRecording = () => {
      if (recorder.state === "recording") {
        recorder.stop();
        console.log("[VAD] Speech ended (silence detected). Processing...");
      }
      isSpeakingRef.current = false;
      if (silenceTimer) clearTimeout(silenceTimer);
      if (forceCutoffTimer) clearTimeout(forceCutoffTimer);
    };

    const vadInterval = setInterval(() => {
      if (!activeRef.current || mutedRef.current) return;

      const level = getLevel();
      
      if (level > VAD_THRESHOLD) {
        // We heard speech!
        if (silenceTimer) clearTimeout(silenceTimer);

        if (!isSpeakingRef.current) {
          isSpeakingRef.current = true;
          setTranscript("Hearing...");
          console.log("[VAD] Speech started");
          
          if (recorder.state === "inactive") {
            recorder.start(); // Start recording exactly when speech starts
          }

          // Force cut-off if they talk for 15 seconds without stopping
          if (forceCutoffTimer) clearTimeout(forceCutoffTimer);
          forceCutoffTimer = setTimeout(() => {
            console.log("[VAD] Max speech duration reached");
            stopRecording();
          }, MAX_SPEECH_MS);
        }

        // Set/reset the silence timer. If 2s pass with no spikes, speech is done.
        silenceTimer = setTimeout(stopRecording, VAD_SILENCE_MS);
      }
    }, 50);

    // Cleanup interval on unmount/stop
    return () => {
      clearInterval(vadInterval);
      if (silenceTimer) clearTimeout(silenceTimer);
      if (forceCutoffTimer) clearTimeout(forceCutoffTimer);
    };

  }, []);

  // ── 2. Process Transcriptions ────────────────────────────────

  const processUtterance = async (blob: Blob) => {
    setTranscript("Processing...");
    
    // Transcribe via Groq Whisper
    const mimeType = blob.type || "audio/webm";
    const ext = mimeType.includes("ogg") ? "ogg" : mimeType.includes("mp4") ? "mp4" : "webm";
    const formData = new FormData();
    formData.append("audio", new File([blob], `audio.${ext}`, { type: mimeType }));
    
    let text = "";
    try {
      const res = await fetch("/api/transcribe", { method: "POST", body: formData });
      const data = await res.json();
      text = (data.text || "").trim();
    } catch {
      setTranscript(sessionModeRef.current ? "Listening..." : "");
      return;
    }

    if (!text || !activeRef.current) {
      if (sessionModeRef.current) setTranscript("Listening for your next message…");
      else setTranscript("");
      return;
    }

    console.log("[Voice] Transcribed:", text);

    if (STOP_CMD.test(text)) {
      console.log("[Voice] Stop command heard");
      stopListening();
      return;
    }

    if (!isAwakeRef.current) {
      if (sessionModeRef.current) {
        setTranscript(text);
        submitCommand(text);
        return;
      }

      setTranscript(text.slice(-70));
      const match = WAKE_WORDS.exec(text);
      if (match) {
        console.log("[Voice] ✅ Wake word:", match[0]);
        isAwakeRef.current = true;
        setVoiceState("awake");
        const afterWake = text.slice(match.index + match[0].length).trim();
        if (afterWake.length > 2) {
          submitCommand(afterWake);
        } else {
          setTranscript("I'm listening…");
        }
      } else {
        setTranscript(""); // Ignore background chatter
      }
    } else {
      setTranscript(text);
      const cleaned = text.replace(WAKE_WORDS, "").trim();
      if (cleaned.length > 1) {
        submitCommand(cleaned);
      } else {
        setTranscript("I'm listening…");
      }
    }
  };

  // ── 3. Submit Command ────────────────────────────────────────

  const submitCommand = useCallback((cmd: string) => {
    console.log("[Voice] Submitting:", cmd);
    isAwakeRef.current = false;
    setTranscript("");
    setVoiceState("processing");
    onCommandRef.current(cmd);
    
    setTimeout(() => {
      if (!activeRef.current) return;
      if (sessionModeRef.current) {
        isAwakeRef.current = true;
        setVoiceState("awake");
        setTranscript("Listening for your next message…");
      } else {
        setVoiceState("listening");
      }
    }, 600);
  }, []);

  // ── Public Controls ──────────────────────────────────────────

  const startListening = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      setupPipeline(stream);
      
      activeRef.current = true;
      isAwakeRef.current = false;
      sessionModeRef.current = false;
      mutedRef.current = false;
      isSpeakingRef.current = false;
      rollingBufferRef.current = [];
      speechChunksRef.current = [];
      
      setTranscript("");
      setVoiceState("listening");
      console.log("[Voice] Started Continuous Event-Driven VAD");
    } catch (e) {
      console.error("[Voice] Mic access denied:", e);
    }
  }, [setupPipeline]);

  function stopListening() {
    activeRef.current = false;
    isAwakeRef.current = false;
    sessionModeRef.current = false;
    mutedRef.current = false;
    isSpeakingRef.current = false;
    
    if (recorderRef.current?.state !== "inactive") try { recorderRef.current?.stop(); } catch {}
    if (audioCtxRef.current) { 
      try { 
        if (audioCtxRef.current.state !== "closed") {
          audioCtxRef.current.close().catch(() => {}); 
        }
      } catch {} 
      audioCtxRef.current = null; 
    }
    getLevelRef.current = null;
    if (streamRef.current) { streamRef.current.getTracks().forEach((t) => t.stop()); streamRef.current = null; }
    
    setVoiceState("idle");
    setTranscript("");
  }

  const stopListeningCb = useCallback(stopListening, []); // eslint-disable-line react-hooks/exhaustive-deps

  const muteListening   = useCallback(() => { mutedRef.current = true; }, []);
  const unmuteListening = useCallback(() => { mutedRef.current = false; }, []);

  const setSessionMode = useCallback((active: boolean) => {
    sessionModeRef.current = active;
    if (active && activeRef.current) {
      isAwakeRef.current = true;
      setVoiceState("awake");
      setTranscript("Listening for your next message…");
      console.log("[Voice] Session mode ON");
    }
  }, []);

  useEffect(() => () => {
    activeRef.current = false;
    if (recorderRef.current?.state !== "inactive") try { recorderRef.current?.stop(); } catch {}
    if (audioCtxRef.current) {
      try {
        if (audioCtxRef.current.state !== "closed") {
          audioCtxRef.current.close().catch(() => {});
        }
      } catch {}
    }
    if (streamRef.current) streamRef.current.getTracks().forEach((t) => t.stop());
  }, []);

  return {
    voiceState, transcript, isSupported,
    startListening, stopListening: stopListeningCb,
    muteListening, unmuteListening, setSessionMode,
  };
}
