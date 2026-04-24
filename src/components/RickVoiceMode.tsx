"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Mic, MicOff } from "lucide-react";
import {
  RealtimeAgent,
  RealtimeSession,
  OpenAIRealtimeWebRTC,
} from "@openai/agents/realtime";
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
// Must match REALTIME_MODEL in /api/rick/realtime-session/route.ts.
// The server response IS the source of truth — this is only a defensive
// fallback if the route somehow returns without a model field.
const DEFAULT_MODEL = "gpt-4o-realtime-preview-2024-12-17";

// Same localStorage key RickChat uses. Reading it lets voice Rick resume
// the exact conversation from the chat widget instead of starting fresh.
const CHAT_STORAGE_KEY = "wea-rick-chat-v1";

interface StoredChatMessage {
  id: string;
  role: "rick" | "user";
  text: string;
}

interface StoredChat {
  messages?: StoredChatMessage[];
}

// Build SDK-shaped RealtimeItem[] from the persisted chat history so
// session.updateHistory() can seed voice Rick with what was already said.
function loadChatHistoryForVoice(): RealtimeItem[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(CHAT_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as StoredChat;
    const msgs = Array.isArray(parsed.messages) ? parsed.messages : [];
    const items: RealtimeItem[] = [];
    for (const m of msgs) {
      if (!m || typeof m.text !== "string" || !m.text.trim()) continue;
      if (m.role === "user") {
        items.push({
          itemId: m.id || `seed-user-${items.length}`,
          type: "message",
          role: "user",
          status: "completed",
          content: [{ type: "input_text", text: m.text }],
        } as RealtimeItem);
      } else if (m.role === "rick") {
        items.push({
          itemId: m.id || `seed-asst-${items.length}`,
          type: "message",
          role: "assistant",
          status: "completed",
          content: [{ type: "output_text", text: m.text }],
        } as RealtimeItem);
      }
    }
    return items;
  } catch {
    return [];
  }
}

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
  const audioElRef = useRef<HTMLAudioElement | null>(null);

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

    // Tear down the DOM audio element we attached during connect.
    const a = audioElRef.current;
    if (a) {
      try {
        a.pause();
        a.srcObject = null;
        a.remove();
      } catch {
        /* noop */
      }
    }
    audioElRef.current = null;
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

    // 2. Spin up the Agents SDK with a hand-built WebRTC transport.
    // We create the <audio> element ourselves and attach it to the DOM
    // with `playsInline` set — iOS Safari refuses to play audio from
    // peer connections where the element is detached or lacks the
    // playsInline attribute. Same tree is used for microphone capture
    // so the whole pipeline goes through one gesture-authorized context.
    try {
      const agent = new RealtimeAgent({
        name: "Rick",
        instructions: RICK_SYSTEM_PROMPT,
        voice,
      });

      // Create the audio sink first, in the DOM, before peer connection
      // handshake. Mobile browsers require this.
      let audioEl = audioElRef.current;
      if (!audioEl) {
        audioEl = document.createElement("audio");
        audioEl.autoplay = true;
        audioEl.setAttribute("playsinline", "true");
        audioEl.setAttribute("webkit-playsinline", "true");
        audioEl.style.display = "none";
        document.body.appendChild(audioEl);
        audioElRef.current = audioEl;
      }

      // Custom WebRTC transport — we point baseUrl at the older
      // /v1/realtime?model=X endpoint (the SDK default /v1/realtime/calls
      // has been erroring against ephemeral tokens from /v1/realtime/sessions)
      // and we pass the DOM-attached audio element so iOS plays audio.
      const transport = new OpenAIRealtimeWebRTC({
        baseUrl: `https://api.openai.com/v1/realtime?model=${encodeURIComponent(model)}`,
        audioElement: audioEl,
      });

      const session = new RealtimeSession(agent, {
        transport,
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
        // Always log the full object to console — covers DOMException,
        // Event, nested error stacks, and anything else the SDK might emit.
        // Pete + I inspect this when something fails in the field.
        console.error("[RickVoice] session error event:", err);
        const extracted =
          err && typeof err === "object" && "error" in err
            ? extractErrorMessage((err as { error: unknown }).error)
            : undefined;
        // Secondary probe: if the event itself is an Error / has a message,
        // use that. (SDK sometimes emits plain Error objects.)
        const fallback =
          extractErrorMessage(err) ??
          "Voice connection failed. Check the browser console for detail.";
        setErrorMsg(extracted ?? fallback);
      });

      // 3. Connect using the ephemeral token. The URL override lives on
      // the transport's baseUrl above, not on connect(), so all the
      // session.reconnect()-style flows inherit it.
      await session.connect({ apiKey: ephemeralKey, model });

      if (closedRef.current) {
        cleanup();
        return;
      }

      // 4. Seed the voice session with whatever chat history already
      // happened on this device. This is what makes voice Rick feel
      // like the SAME Rick Lance has been typing to — not a separate
      // entity who doesn't know the context. If there's no prior
      // conversation, fall back to the canonical opening greeting.
      const priorHistory = loadChatHistoryForVoice();
      if (priorHistory.length > 0) {
        try {
          session.updateHistory(priorHistory);
        } catch {
          /* history seed is best-effort; session still works without it */
        }
        // Nudge Rick to continue naturally instead of re-introducing
        // himself. Framed as a silent system-style hint, not a greeting.
        try {
          session.sendMessage(
            "[system] You are continuing an existing conversation with Lance that started in the chat widget. Do not re-introduce yourself, do not recap, do not say hi again. Wait for him to speak, then respond naturally as if you just walked over to the bench he's sitting on."
          );
        } catch {
          /* noop */
        }
      } else {
        // Fresh session — speak the canonical opener verbatim.
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
