"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Mic, MicOff } from "lucide-react";
import { rickOpening } from "@/lib/rick-messages";

type VoiceState = "connecting" | "idle" | "listening" | "thinking" | "speaking";

interface RickVoiceModeProps {
  isOpen: boolean;
  onClose: () => void;
  onExchange: (userText: string, rickText: string, nextStage: string) => void;
}

// Stage we emit for voice exchanges. Keeps the chat CTAs in "still-talking" mode
// so Lance can either dig deeper or jump to signing when he closes voice.
const VOICE_EXCHANGE_STAGE = "post_tangent";

type RealtimeEvent =
  | { type: "session.created" }
  | { type: "session.updated" }
  | { type: "input_audio_buffer.speech_started" }
  | { type: "input_audio_buffer.speech_stopped" }
  | {
      type: "conversation.item.input_audio_transcription.completed";
      transcript: string;
    }
  | { type: "response.created" }
  | { type: "response.audio_transcript.delta"; delta: string }
  | { type: "response.audio_transcript.done"; transcript: string }
  | { type: "response.done" }
  | { type: "error"; error?: { message?: string } | string }
  | { type: string; [key: string]: unknown };

function extractErrorMessage(raw: unknown): string | undefined {
  if (!raw) return undefined;
  if (typeof raw === "string") return raw;
  if (typeof raw === "object" && raw !== null && "message" in raw) {
    const msg = (raw as { message?: unknown }).message;
    if (typeof msg === "string") return msg;
  }
  return undefined;
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

  const pcRef = useRef<RTCPeerConnection | null>(null);
  const dcRef = useRef<RTCDataChannel | null>(null);
  const micStreamRef = useRef<MediaStream | null>(null);
  const audioElRef = useRef<HTMLAudioElement | null>(null);
  const closedRef = useRef(false);

  // Buffer the in-progress exchange so we can emit ONE onExchange per turn
  // with a clean (userText, rickText) pair.
  const pendingUserRef = useRef<string>("");
  const pendingRickRef = useRef<string>("");

  const cleanup = useCallback(() => {
    try {
      dcRef.current?.close();
    } catch {
      /* noop */
    }
    dcRef.current = null;

    try {
      pcRef.current?.getSenders().forEach((s) => {
        try {
          s.track?.stop();
        } catch {
          /* noop */
        }
      });
      pcRef.current?.close();
    } catch {
      /* noop */
    }
    pcRef.current = null;

    try {
      micStreamRef.current?.getTracks().forEach((t) => t.stop());
    } catch {
      /* noop */
    }
    micStreamRef.current = null;

    if (audioElRef.current) {
      try {
        audioElRef.current.pause();
        audioElRef.current.srcObject = null;
        audioElRef.current.remove();
      } catch {
        /* noop */
      }
      audioElRef.current = null;
    }
  }, []);

  const flushExchange = useCallback(() => {
    const u = pendingUserRef.current.trim();
    const r = pendingRickRef.current.trim();
    if (u || r) {
      onExchange(u, r, VOICE_EXCHANGE_STAGE);
    }
    pendingUserRef.current = "";
    pendingRickRef.current = "";
  }, [onExchange]);

  const handleRealtimeEvent = useCallback(
    (event: RealtimeEvent) => {
      if (closedRef.current) return;

      switch (event.type) {
        case "session.created":
        case "session.updated":
          // Connection live — drop out of "connecting" into idle. First audio
          // from Rick (the greeting) will flip us to "speaking".
          setState((prev) => (prev === "connecting" ? "idle" : prev));
          break;

        case "input_audio_buffer.speech_started":
          setState("listening");
          setUserTranscript("");
          pendingUserRef.current = "";
          break;

        case "input_audio_buffer.speech_stopped":
          setState("thinking");
          break;

        case "conversation.item.input_audio_transcription.completed": {
          const t =
            typeof event.transcript === "string" ? event.transcript : "";
          pendingUserRef.current = t;
          setUserTranscript(t);
          break;
        }

        case "response.created":
          setState("speaking");
          setRickTranscript("");
          pendingRickRef.current = "";
          break;

        case "response.audio_transcript.delta": {
          const delta = typeof event.delta === "string" ? event.delta : "";
          pendingRickRef.current += delta;
          setRickTranscript((prev) => prev + delta);
          break;
        }

        case "response.audio_transcript.done": {
          const t =
            typeof event.transcript === "string"
              ? event.transcript
              : pendingRickRef.current;
          pendingRickRef.current = t;
          setRickTranscript(t);
          break;
        }

        case "response.done":
          flushExchange();
          setState("idle");
          break;

        case "error": {
          setErrorMsg(
            extractErrorMessage(event.error) ?? "Realtime session error."
          );
          break;
        }

        default:
          break;
      }
    },
    [flushExchange]
  );

  const connect = useCallback(async () => {
    if (typeof window === "undefined") return;

    setState("connecting");
    setErrorMsg(null);
    setUserTranscript("");
    setRickTranscript("");
    pendingUserRef.current = "";
    pendingRickRef.current = "";

    // 1. Mint an ephemeral OpenAI Realtime token via our server route.
    let ephemeralKey: string;
    let model: string;
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
      model = data?.model ?? "gpt-4o-realtime-preview-2024-12-17";
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

    // 2. Build the RTCPeerConnection and attach a remote-audio sink.
    const pc = new RTCPeerConnection();
    pcRef.current = pc;

    const audioEl = document.createElement("audio");
    audioEl.autoplay = true;
    audioEl.setAttribute("playsinline", "true");
    audioElRef.current = audioEl;
    pc.ontrack = (e) => {
      if (closedRef.current) return;
      audioEl.srcObject = e.streams[0];
    };

    // 3. Capture the mic and add it as a track.
    let micStream: MediaStream;
    try {
      micStream = await navigator.mediaDevices.getUserMedia({ audio: true });
    } catch {
      if (closedRef.current) return;
      setErrorMsg(
        "Microphone permission denied. Enable it and reopen voice mode."
      );
      setState("idle");
      cleanup();
      return;
    }
    if (closedRef.current) {
      micStream.getTracks().forEach((t) => t.stop());
      return;
    }
    micStreamRef.current = micStream;
    micStream.getTracks().forEach((track) => pc.addTrack(track, micStream));

    // 4. Open the events data channel BEFORE negotiating SDP.
    const dc = pc.createDataChannel("oai-events");
    dcRef.current = dc;
    dc.addEventListener("message", (e) => {
      try {
        const parsed = JSON.parse(e.data) as RealtimeEvent;
        handleRealtimeEvent(parsed);
      } catch {
        /* ignore malformed */
      }
    });
    dc.addEventListener("open", () => {
      if (closedRef.current) return;
      // Kick Rick off with a greeting tied to the chat contract. This fires
      // the opening line via the model so it sounds natural, not canned TTS.
      const greeting = rickOpening[0]?.text ?? "";
      if (greeting) {
        try {
          dc.send(
            JSON.stringify({
              type: "response.create",
              response: {
                modalities: ["audio", "text"],
                instructions: `Open the conversation by saying exactly this, verbatim, in your natural voice: "${greeting.replace(/"/g, '\\"')}"`,
              },
            })
          );
        } catch {
          /* noop */
        }
      }
    });

    // 5. SDP offer → OpenAI Realtime → answer.
    try {
      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);

      const sdpResp = await fetch(
        `https://api.openai.com/v1/realtime?model=${encodeURIComponent(model)}`,
        {
          method: "POST",
          body: offer.sdp ?? "",
          headers: {
            Authorization: `Bearer ${ephemeralKey}`,
            "Content-Type": "application/sdp",
          },
        }
      );
      if (!sdpResp.ok) {
        const body = await sdpResp.text();
        throw new Error(`SDP handshake failed (${sdpResp.status}): ${body}`);
      }
      const answer: RTCSessionDescriptionInit = {
        type: "answer",
        sdp: await sdpResp.text(),
      };
      await pc.setRemoteDescription(answer);
    } catch (err) {
      if (closedRef.current) return;
      setErrorMsg(
        err instanceof Error ? err.message : "Could not connect to Rick."
      );
      setState("idle");
      cleanup();
    }
  }, [cleanup, handleRealtimeEvent]);

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

  // Mute = disable the mic track. Rick stops hearing Lance but the session
  // stays alive, so unmuting is instant (no reconnect).
  const toggleMute = useCallback(() => {
    setMuted((prev) => {
      const next = !prev;
      const stream = micStreamRef.current;
      if (stream) {
        stream.getAudioTracks().forEach((t) => {
          t.enabled = !next;
        });
      }
      return next;
    });
  }, []);

  const handleClose = useCallback(() => {
    closedRef.current = true;
    flushExchange();
    cleanup();
    onClose();
  }, [cleanup, flushExchange, onClose]);

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
