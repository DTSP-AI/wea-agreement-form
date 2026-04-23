"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Mic, MicOff } from "lucide-react";
import { RealtimeAgent, RealtimeSession } from "@openai/agents/realtime";
import type { RealtimeItem } from "@openai/agents/realtime";
import { RICK_SYSTEM_PROMPT, rickOpening } from "@/lib/rick-messages";

type VoiceState = "connecting" | "idle" | "listening" | "thinking" | "speaking";

interface RickVoiceModeProps {
  isOpen: boolean;
  onClose: () => void;
  onExchange: (userText: string, rickText: string, nextStage: string) => void;
}

// Stage we emit for voice exchanges. Keeps the chat CTAs in "still-talking" mode
// so Lance can either dig deeper or jump to signing when he closes voice.
const VOICE_EXCHANGE_STAGE = "post_tangent";
const DEFAULT_MODEL = "gpt-realtime";

// Pull the latest user + assistant transcripts out of the SDK's history snapshot.
// Returns the last completed user utterance and the last assistant utterance
// (which may still be in progress / streaming in).
function extractTranscripts(history: RealtimeItem[]): {
  lastUser: string;
  lastUserCompleted: string;
  lastAssistant: string;
  lastAssistantCompleted: string;
} {
  let lastUser = "";
  let lastUserCompleted = "";
  let lastAssistant = "";
  let lastAssistantCompleted = "";

  for (const item of history) {
    if (item.type !== "message") continue;
    if (item.role === "user") {
      const text = item.content
        .map((c) => {
          if (c.type === "input_text") return c.text;
          if (c.type === "input_audio") return c.transcript ?? "";
          return "";
        })
        .join(" ")
        .trim();
      if (text) {
        lastUser = text;
        if (item.status === "completed") lastUserCompleted = text;
      }
    } else if (item.role === "assistant") {
      const text = item.content
        .map((c) => {
          if (c.type === "output_text") return c.text;
          if (c.type === "output_audio") return c.transcript ?? "";
          return "";
        })
        .join(" ")
        .trim();
      if (text) {
        lastAssistant = text;
        if (item.status === "completed") lastAssistantCompleted = text;
      }
    }
  }

  return { lastUser, lastUserCompleted, lastAssistant, lastAssistantCompleted };
}

export default function RickVoiceMode({
  isOpen,
  onClose,
  onExchange,
}: RickVoiceModeProps) {
  const [state, setState] = useState<VoiceState>("connecting");
  const [userTranscript, setUserTranscript] = useState("");
  const [rickTranscript, setRickTranscript] = useState("");
  const [muted, setMuted] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const sessionRef = useRef<RealtimeSession | null>(null);
  const closedRef = useRef(false);

  // Exchange dedup — fire onExchange only once per (user, rick) turn pair.
  const lastEmittedUserRef = useRef<string>("");
  const lastEmittedRickRef = useRef<string>("");

  const cleanup = useCallback(() => {
    const s = sessionRef.current;
    if (s) {
      try {
        s.close();
      } catch {
        /* noop */
      }
    }
    sessionRef.current = null;
  }, []);

  const connect = useCallback(async () => {
    if (typeof window === "undefined") return;

    setState("connecting");
    setErrorMsg(null);
    setUserTranscript("");
    setRickTranscript("");
    lastEmittedUserRef.current = "";
    lastEmittedRickRef.current = "";

    // 1. Mint an ephemeral OpenAI Realtime token via our server route.
    let ephemeralKey: string;
    let model = DEFAULT_MODEL;
    let voice = "cedar";
    try {
      const tokenResp = await fetch("/api/rick/realtime-session", {
        method: "GET",
        cache: "no-store",
      });
      if (!tokenResp.ok) {
        const body = await tokenResp.text();
        throw new Error(`Session mint failed (${tokenResp.status}): ${body}`);
      }
      const data = await tokenResp.json();
      ephemeralKey = data?.client_secret?.value;
      model = data?.model ?? DEFAULT_MODEL;
      voice = data?.voice ?? "cedar";
      if (!ephemeralKey) {
        throw new Error("Ephemeral token missing from session response.");
      }
    } catch (err) {
      if (closedRef.current) return;
      setErrorMsg(
        err instanceof Error
          ? err.message
          : "Could not start Rick's voice session."
      );
      setState("idle");
      return;
    }

    if (closedRef.current) return;

    // 2. Spin up the Agents SDK — RealtimeAgent carries the contract, the
    // RealtimeSession handles WebRTC, mic, playback, VAD, and turn management.
    try {
      const agent = new RealtimeAgent({
        name: "Rick",
        instructions: RICK_SYSTEM_PROMPT,
        voice,
      });

      const session = new RealtimeSession(agent, {
        transport: "webrtc",
        model,
        config: {
          audio: {
            output: { voice },
          },
          turnDetection: {
            type: "semantic_vad",
            eagerness: "medium",
            createResponse: true,
            interruptResponse: true,
          },
        },
      });
      sessionRef.current = session;

      // ---------- Event wiring ----------

      session.on("history_updated", (history) => {
        if (closedRef.current) return;
        const {
          lastUser,
          lastUserCompleted,
          lastAssistant,
          lastAssistantCompleted,
        } = extractTranscripts(history);

        setUserTranscript(lastUser);
        setRickTranscript(lastAssistant);

        // When both sides of the turn are complete, emit the exchange back
        // to the chat thread so it's preserved after voice closes.
        if (
          lastUserCompleted &&
          lastAssistantCompleted &&
          (lastUserCompleted !== lastEmittedUserRef.current ||
            lastAssistantCompleted !== lastEmittedRickRef.current)
        ) {
          lastEmittedUserRef.current = lastUserCompleted;
          lastEmittedRickRef.current = lastAssistantCompleted;
          onExchange(
            lastUserCompleted,
            lastAssistantCompleted,
            VOICE_EXCHANGE_STAGE
          );
        }
      });

      session.on("audio_start", () => {
        if (closedRef.current) return;
        setState("speaking");
      });

      session.on("audio_stopped", () => {
        if (closedRef.current) return;
        setState("idle");
      });

      session.on("audio_interrupted", () => {
        if (closedRef.current) return;
        setState("listening");
      });

      session.on("transport_event", (evt) => {
        if (closedRef.current) return;
        const type = (evt as { type?: string })?.type;
        if (type === "input_audio_buffer.speech_started") {
          setState("listening");
        } else if (type === "input_audio_buffer.speech_stopped") {
          setState("thinking");
        } else if (type === "session.created" || type === "session.updated") {
          setState((prev) => (prev === "connecting" ? "idle" : prev));
        }
      });

      session.on("error", (err) => {
        if (closedRef.current) return;
        const msg =
          (err && typeof err === "object" && "error" in err
            ? extractErrorMessage((err as { error: unknown }).error)
            : undefined) ?? "Realtime session error.";
        setErrorMsg(msg);
      });

      // 3. Connect using the ephemeral token.
      await session.connect({ apiKey: ephemeralKey, model });

      if (closedRef.current) {
        cleanup();
        return;
      }

      // 4. Ask Rick to open with the canonical greeting. Same contract as
      // the chat widget — he says the opening line, in his voice.
      const greeting = rickOpening[0]?.text ?? "";
      if (greeting) {
        try {
          session.sendMessage(
            `Open the conversation by saying exactly this, verbatim, in your natural voice: "${greeting.replace(/"/g, '\\"')}"`
          );
        } catch {
          /* noop — session will still accept user speech */
        }
      }
    } catch (err) {
      if (closedRef.current) return;
      setErrorMsg(
        err instanceof Error ? err.message : "Could not connect to Rick."
      );
      setState("idle");
      cleanup();
    }
  }, [cleanup, onExchange]);

  // Open / close lifecycle
  useEffect(() => {
    if (!isOpen) {
      closedRef.current = true;
      cleanup();
      setState("connecting");
      setUserTranscript("");
      setRickTranscript("");
      setErrorMsg(null);
      setMuted(false);
      return;
    }

    closedRef.current = false;
    connect();

    return () => {
      closedRef.current = true;
      cleanup();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  const toggleMute = useCallback(() => {
    setMuted((prev) => {
      const next = !prev;
      try {
        sessionRef.current?.mute(next);
      } catch {
        /* noop */
      }
      return next;
    });
  }, []);

  const handleClose = useCallback(() => {
    closedRef.current = true;
    cleanup();
    onClose();
  }, [cleanup, onClose]);

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
    state === "connecting"
      ? "Connecting"
      : state === "listening"
        ? "Listening"
        : state === "thinking"
          ? "Thinking"
          : state === "speaking"
            ? "Speaking"
            : muted
              ? "Muted"
              : "Go ahead";

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

          {/* Top bar — orb-first, ChatGPT-style. No avatar chip. */}
          <div className="relative flex items-center justify-between px-6 py-5">
            <div className="flex flex-col">
              <div className="text-sm font-semibold text-white tracking-wide">
                Rick
              </div>
              <div className="text-[11px] uppercase tracking-[0.2em] text-green-400/70">
                {stateLabel}
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
                  key="rick-transcript"
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
              disabled={state === "connecting"}
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

function extractErrorMessage(raw: unknown): string | undefined {
  if (!raw) return undefined;
  if (typeof raw === "string") return raw;
  if (typeof raw === "object" && raw !== null && "message" in raw) {
    const msg = (raw as { message?: unknown }).message;
    if (typeof msg === "string") return msg;
  }
  return undefined;
}

function VoiceOrb({ state }: { state: VoiceState }) {
  const speaking = state === "speaking";
  const listening = state === "listening";
  const thinking = state === "thinking" || state === "connecting";

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
