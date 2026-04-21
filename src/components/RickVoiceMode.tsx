"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Mic, MicOff } from "lucide-react";
import { getFreetextResponse } from "@/lib/rick-messages";

type VoiceState = "idle" | "listening" | "thinking" | "speaking";

interface RickVoiceModeProps {
  isOpen: boolean;
  onClose: () => void;
  onExchange: (userText: string, rickText: string, nextStage: string) => void;
}

// Minimal SpeechRecognition type surface. Browser vendor-prefixed impl.
interface SRResult {
  readonly transcript: string;
}
interface SRResultAlt {
  readonly length: number;
  item(index: number): SRResult;
  [index: number]: SRResult;
}
interface SRResults {
  readonly length: number;
  item(index: number): SRResultAlt;
  [index: number]: SRResultAlt;
}
interface SREvent extends Event {
  readonly resultIndex: number;
  readonly results: SRResults;
}
interface SRErrorEvent extends Event {
  readonly error: string;
}
interface SRInstance extends EventTarget {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  onresult: ((e: SREvent) => void) | null;
  onerror: ((e: SRErrorEvent) => void) | null;
  onend: (() => void) | null;
  onstart: (() => void) | null;
  start: () => void;
  stop: () => void;
  abort: () => void;
}
interface SRConstructor {
  new (): SRInstance;
}

declare global {
  interface Window {
    SpeechRecognition?: SRConstructor;
    webkitSpeechRecognition?: SRConstructor;
  }
}

export default function RickVoiceMode({
  isOpen,
  onClose,
  onExchange,
}: RickVoiceModeProps) {
  const [state, setState] = useState<VoiceState>("idle");
  const [userTranscript, setUserTranscript] = useState("");
  const [rickTranscript, setRickTranscript] = useState("");
  const [muted, setMuted] = useState(false);
  const [supported, setSupported] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const recognitionRef = useRef<SRInstance | null>(null);
  const voiceRef = useRef<SpeechSynthesisVoice | null>(null);
  const closedRef = useRef(false);
  const silenceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const finalTranscriptRef = useRef("");
  const mutedRef = useRef(false);

  useEffect(() => {
    mutedRef.current = muted;
  }, [muted]);

  // Pick a British voice for Rick (Ember-style)
  const pickVoice = useCallback(() => {
    if (typeof window === "undefined" || !window.speechSynthesis) return;
    const voices = window.speechSynthesis.getVoices();
    if (!voices.length) return;

    // Ordered preference: British male voices first, best engines first.
    const prefer = [
      "Microsoft Ryan Online (Natural) - English (United Kingdom)",
      "Microsoft Ryan Online",
      "Microsoft Ryan",
      "Google UK English Male",
      "Daniel (Enhanced)",
      "Daniel",
      "Oliver",
      "Arthur",
      "Microsoft George",
    ];

    // 1. Exact-name match against preferred list
    const exact = prefer
      .map((name) => voices.find((v) => v.name === name))
      .find(Boolean);
    if (exact) {
      voiceRef.current = exact;
      return;
    }

    // 2. Partial-name match against preferred list
    const partial = voices.find((v) =>
      prefer.some((p) => v.name.includes(p))
    );
    if (partial) {
      voiceRef.current = partial;
      return;
    }

    // 3. Any en-GB voice
    const gb = voices.find((v) => /en[-_]GB/i.test(v.lang));
    if (gb) {
      voiceRef.current = gb;
      return;
    }

    // 4. Any English male voice
    const enMale = voices.find(
      (v) => v.lang.startsWith("en") && /male/i.test(v.name)
    );
    if (enMale) {
      voiceRef.current = enMale;
      return;
    }

    // 5. Last resort — any English voice
    voiceRef.current = voices.find((v) => v.lang.startsWith("en")) ?? voices[0];
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!window.speechSynthesis) return;
    pickVoice();
    window.speechSynthesis.onvoiceschanged = pickVoice;
    return () => {
      if (window.speechSynthesis) {
        window.speechSynthesis.onvoiceschanged = null;
      }
    };
  }, [pickVoice]);

  const stopRecognition = useCallback(() => {
    const r = recognitionRef.current;
    if (!r) return;
    try {
      r.onresult = null;
      r.onerror = null;
      r.onend = null;
      r.onstart = null;
      r.abort();
    } catch {
      /* noop */
    }
    recognitionRef.current = null;
    if (silenceTimerRef.current) {
      clearTimeout(silenceTimerRef.current);
      silenceTimerRef.current = null;
    }
  }, []);

  const cancelSpeaking = useCallback(() => {
    if (typeof window !== "undefined" && window.speechSynthesis) {
      window.speechSynthesis.cancel();
    }
  }, []);

  const startListening = useCallback(() => {
    if (closedRef.current || mutedRef.current) return;
    if (typeof window === "undefined") return;
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) {
      setSupported(false);
      setErrorMsg(
        "Your browser does not support voice input. Try Chrome or Edge."
      );
      return;
    }

    stopRecognition();
    finalTranscriptRef.current = "";
    setUserTranscript("");

    const recognition = new SR();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = "en-US";

    recognition.onstart = () => {
      if (closedRef.current) return;
      setState("listening");
    };

    recognition.onresult = (event: SREvent) => {
      let interim = "";
      let finalTxt = finalTranscriptRef.current;
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const alt = event.results[i][0];
        const text = alt?.transcript ?? "";
        // @ts-expect-error isFinal exists on SpeechRecognitionResult
        if (event.results[i].isFinal) {
          finalTxt += text + " ";
        } else {
          interim += text;
        }
      }
      finalTranscriptRef.current = finalTxt;
      setUserTranscript((finalTxt + interim).trim());

      // Reset silence timer on any speech
      if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);
      silenceTimerRef.current = setTimeout(() => {
        // User paused — treat as end-of-utterance
        try {
          recognition.stop();
        } catch {
          /* noop */
        }
      }, 1400);
    };

    recognition.onerror = (e: SRErrorEvent) => {
      if (closedRef.current) return;
      if (e.error === "no-speech" || e.error === "aborted") {
        // benign — just restart
        return;
      }
      if (e.error === "not-allowed" || e.error === "service-not-allowed") {
        setErrorMsg("Microphone permission denied. Enable it to use voice mode.");
        setState("idle");
      } else {
        setErrorMsg(`Mic error: ${e.error}`);
      }
    };

    recognition.onend = () => {
      if (closedRef.current) return;
      const finalText = finalTranscriptRef.current.trim();
      if (!finalText) {
        // nothing captured — loop back to listening if still open
        if (!mutedRef.current && !closedRef.current) {
          setTimeout(() => startListening(), 200);
        } else {
          setState("idle");
        }
        return;
      }
      handleUserUtterance(finalText);
    };

    recognitionRef.current = recognition;
    try {
      recognition.start();
    } catch {
      // Sometimes throws if called too fast — retry shortly
      setTimeout(() => {
        if (!closedRef.current && !mutedRef.current) startListening();
      }, 300);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stopRecognition]);

  const speakRick = useCallback(
    (text: string, onDone: () => void) => {
      if (typeof window === "undefined" || !window.speechSynthesis) {
        onDone();
        return;
      }
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      if (voiceRef.current) utterance.voice = voiceRef.current;
      utterance.rate = 1.05;
      utterance.pitch = 0.85;
      utterance.volume = 1;
      utterance.onend = () => {
        if (closedRef.current) return;
        onDone();
      };
      utterance.onerror = () => {
        if (closedRef.current) return;
        onDone();
      };
      setState("speaking");
      window.speechSynthesis.speak(utterance);
    },
    []
  );

  const handleUserUtterance = useCallback(
    (text: string) => {
      if (closedRef.current) return;
      setState("thinking");
      setRickTranscript("");

      const { text: responseText, nextStage } = getFreetextResponse(text);

      // Sync back into chat history
      onExchange(text, responseText, nextStage);

      // Tiny thinking delay for realism
      setTimeout(() => {
        if (closedRef.current) return;
        setRickTranscript(responseText);
        speakRick(responseText, () => {
          if (closedRef.current) return;
          // After Rick finishes, clear and listen again
          setUserTranscript("");
          finalTranscriptRef.current = "";
          if (!mutedRef.current) {
            startListening();
          } else {
            setState("idle");
          }
        });
      }, 450);
    },
    [onExchange, speakRick, startListening]
  );

  // Open / close lifecycle
  useEffect(() => {
    if (!isOpen) {
      closedRef.current = true;
      stopRecognition();
      cancelSpeaking();
      setState("idle");
      setUserTranscript("");
      setRickTranscript("");
      setErrorMsg(null);
      finalTranscriptRef.current = "";
      return;
    }

    closedRef.current = false;
    setErrorMsg(null);
    setMuted(false);

    // Greeting — Rick announces voice mode, then starts listening
    const greeting =
      "Voice mode. Ask me anything about the platform and I'll answer.";
    setRickTranscript(greeting);
    speakRick(greeting, () => {
      if (closedRef.current) return;
      startListening();
    });

    return () => {
      closedRef.current = true;
      stopRecognition();
      cancelSpeaking();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  // Mute toggle
  const toggleMute = useCallback(() => {
    setMuted((prev) => {
      const next = !prev;
      if (next) {
        stopRecognition();
        cancelSpeaking();
        setState("idle");
      } else {
        startListening();
      }
      return next;
    });
  }, [stopRecognition, cancelSpeaking, startListening]);

  const handleClose = useCallback(() => {
    closedRef.current = true;
    stopRecognition();
    cancelSpeaking();
    onClose();
  }, [stopRecognition, cancelSpeaking, onClose]);

  // ESC to close
  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") handleClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [isOpen, handleClose]);

  const stateLabel =
    state === "listening"
      ? "Listening"
      : state === "thinking"
        ? "Thinking"
        : state === "speaking"
          ? "Speaking"
          : muted
            ? "Muted"
            : "Tap the mic to talk";

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
          className="fixed inset-0 z-[100] bg-[#05070a] flex flex-col"
        >
          {/* Ambient backdrop gradients */}
          <div className="absolute inset-0 pointer-events-none">
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[900px] h-[900px] bg-green-500/10 rounded-full blur-3xl" />
            <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[700px] h-[500px] bg-emerald-400/5 rounded-full blur-3xl" />
          </div>

          {/* Top bar */}
          <div className="relative flex items-center justify-between px-6 py-5">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-green-500 to-green-700 flex items-center justify-center text-sm font-bold text-white">
                R
              </div>
              <div>
                <div className="text-sm font-semibold text-white">Rick</div>
                <div className="text-[11px] uppercase tracking-widest text-green-500/80">
                  {stateLabel}
                </div>
              </div>
            </div>
            <button
              onClick={handleClose}
              className="p-2 rounded-full text-zinc-400 hover:text-white hover:bg-white/5 transition-colors cursor-pointer"
              title="Close voice mode (Esc)"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          {/* Orb */}
          <div className="relative flex-1 flex items-center justify-center px-6">
            <VoiceOrb state={state} />
          </div>

          {/* Transcripts */}
          <div className="relative px-6 pb-4 space-y-3 max-w-2xl mx-auto w-full">
            <AnimatePresence mode="wait">
              {userTranscript && (
                <motion.div
                  key="user-transcript"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className="text-right"
                >
                  <div className="inline-block max-w-full px-4 py-2 rounded-2xl rounded-br-md bg-green-700/80 text-white text-sm">
                    {userTranscript}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
            <AnimatePresence mode="wait">
              {rickTranscript && (
                <motion.div
                  key={rickTranscript}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className="text-left"
                >
                  <div className="inline-block max-w-full px-4 py-2 rounded-2xl rounded-bl-md bg-[#0d1117] border border-green-900/40 text-green-100 text-sm leading-relaxed">
                    {rickTranscript}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Controls */}
          <div className="relative flex items-center justify-center gap-4 px-6 pb-10 pt-4">
            <button
              onClick={toggleMute}
              disabled={!supported}
              className={`group flex items-center justify-center w-16 h-16 rounded-full border-2 transition-all cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed ${
                muted
                  ? "bg-red-900/40 border-red-700 text-red-300 hover:bg-red-800/40"
                  : "bg-green-900/30 border-green-600 text-green-300 hover:bg-green-800/40"
              }`}
              title={muted ? "Unmute" : "Mute"}
            >
              {muted ? (
                <MicOff className="w-6 h-6" />
              ) : (
                <Mic className="w-6 h-6" />
              )}
            </button>
            <button
              onClick={handleClose}
              className="flex items-center justify-center w-16 h-16 rounded-full bg-white/5 border-2 border-white/10 text-zinc-300 hover:bg-white/10 hover:text-white transition-all cursor-pointer"
              title="End voice mode"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          {errorMsg && (
            <div className="absolute top-20 left-1/2 -translate-x-1/2 px-4 py-2 rounded-lg bg-red-900/40 border border-red-700 text-red-200 text-xs max-w-sm text-center">
              {errorMsg}
            </div>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function VoiceOrb({ state }: { state: VoiceState }) {
  const speaking = state === "speaking";
  const listening = state === "listening";
  const thinking = state === "thinking";

  return (
    <div className="relative w-[280px] h-[280px] md:w-[360px] md:h-[360px]">
      {/* Outermost halo */}
      <motion.div
        className="absolute inset-0 rounded-full bg-gradient-to-br from-green-400/30 via-emerald-500/20 to-teal-600/10 blur-2xl"
        animate={{
          scale: speaking ? [1, 1.15, 1] : listening ? [1, 1.08, 1] : 1,
          opacity: speaking ? [0.6, 1, 0.6] : listening ? [0.5, 0.8, 0.5] : 0.5,
        }}
        transition={{
          duration: speaking ? 0.6 : 2,
          repeat: speaking || listening ? Infinity : 0,
          ease: "easeInOut",
        }}
      />

      {/* Middle ring */}
      <motion.div
        className="absolute inset-6 rounded-full border border-green-400/30"
        animate={{
          rotate: thinking ? 360 : 0,
          scale: listening ? [1, 1.05, 1] : 1,
        }}
        transition={{
          rotate: { duration: 4, repeat: thinking ? Infinity : 0, ease: "linear" },
          scale: { duration: 1.2, repeat: listening ? Infinity : 0, ease: "easeInOut" },
        }}
      />

      {/* Core orb */}
      <motion.div
        className="absolute inset-10 rounded-full bg-gradient-to-br from-green-400 via-emerald-500 to-green-700 shadow-[0_0_80px_rgba(34,197,94,0.6)]"
        animate={{
          scale: speaking
            ? [1, 1.12, 0.98, 1.08, 1]
            : listening
              ? [1, 1.04, 1]
              : thinking
                ? [1, 1.02, 1]
                : [1, 1.015, 1],
        }}
        transition={{
          duration: speaking ? 0.5 : thinking ? 1 : 2.8,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      />

      {/* Inner shimmer */}
      <motion.div
        className="absolute inset-20 rounded-full bg-gradient-to-br from-white/40 via-green-200/30 to-transparent blur-sm"
        animate={{
          opacity: speaking ? [0.5, 1, 0.5] : [0.3, 0.6, 0.3],
          scale: speaking ? [0.9, 1.1, 0.9] : [0.95, 1.05, 0.95],
        }}
        transition={{
          duration: speaking ? 0.7 : 2.2,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      />

      {/* Listening: outer pulse ripple */}
      {listening && (
        <>
          <motion.div
            className="absolute inset-0 rounded-full border-2 border-green-400/40"
            initial={{ scale: 1, opacity: 0.6 }}
            animate={{ scale: 1.35, opacity: 0 }}
            transition={{ duration: 1.8, repeat: Infinity, ease: "easeOut" }}
          />
          <motion.div
            className="absolute inset-0 rounded-full border-2 border-green-400/30"
            initial={{ scale: 1, opacity: 0.4 }}
            animate={{ scale: 1.55, opacity: 0 }}
            transition={{
              duration: 1.8,
              repeat: Infinity,
              ease: "easeOut",
              delay: 0.6,
            }}
          />
        </>
      )}
    </div>
  );
}
