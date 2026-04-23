"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { MessageCircle, X, Send, Mic } from "lucide-react";
import {
  rickOpening,
  ctaStages,
  rickResponses,
  getFreetextResponse,
} from "@/lib/rick-messages";
import RickVoiceMode from "@/components/RickVoiceMode";

interface ChatMessage {
  id: string;
  role: "rick" | "user";
  text: string;
}

// Keep history we forward to the LLM lean. 10 turns is plenty of continuity
// for a 3-minute page session and keeps cost/latency tight.
const LLM_HISTORY_WINDOW = 10;

async function askRickLLM(
  history: ChatMessage[],
  userText: string
): Promise<string | null> {
  try {
    const payload = {
      messages: [
        ...history.slice(-LLM_HISTORY_WINDOW).map((m) => ({
          role: m.role === "user" ? "user" : "assistant",
          content: m.text,
        })),
        { role: "user" as const, content: userText },
      ],
    };
    const res = await fetch("/api/rick/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    if (!res.ok) return null;
    const data = await res.json();
    const text = typeof data?.text === "string" ? data.text.trim() : "";
    return text || null;
  } catch {
    return null;
  }
}

export default function RickChat() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [showBubble, setShowBubble] = useState(false);
  const [launcherHint, setLauncherHint] = useState("");
  const [currentStage, setCurrentStage] = useState("opening");
  const [voiceModeOpen, setVoiceModeOpen] = useState(false);
  const hasInitializedRef = useRef(false);
  const hasUserInteractedRef = useRef(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const introCloseTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping, scrollToBottom]);

  const clearIntroCloseTimer = useCallback(() => {
    if (introCloseTimerRef.current) {
      clearTimeout(introCloseTimerRef.current);
      introCloseTimerRef.current = null;
    }
  }, []);

  const queueIntroCollapse = useCallback(() => {
    clearIntroCloseTimer();
    // Hold the intro open for 10s so Lance has time to read Rick's greeting
    // before it auto-collapses. Any user interaction cancels the timer.
    introCloseTimerRef.current = setTimeout(() => {
      if (hasUserInteractedRef.current) return;
      setIsOpen(false);
      setLauncherHint("I'm here when you need me.");
    }, 10000);
  }, [clearIntroCloseTimer]);

  const initializeChat = useCallback(
    (withTypingDelay = true) => {
      if (hasInitializedRef.current) return;

      hasInitializedRef.current = true;
      setLauncherHint("");

      if (withTypingDelay) {
        setIsTyping(true);
        setTimeout(() => {
          setMessages([
            { id: rickOpening[0].id, role: "rick", text: rickOpening[0].text },
          ]);
          setIsTyping(false);
          queueIntroCollapse();
        }, 1200);
        return;
      }

      setMessages([
        { id: rickOpening[0].id, role: "rick", text: rickOpening[0].text },
      ]);
    },
    [queueIntroCollapse]
  );

  useEffect(() => {
    const bubbleTimer = setTimeout(() => setShowBubble(true), 1500);
    const openTimer = setTimeout(() => {
      setIsOpen(true);
      initializeChat(true);
    }, 2500);

    return () => {
      clearTimeout(bubbleTimer);
      clearTimeout(openTimer);
      clearIntroCloseTimer();
    };
  }, [clearIntroCloseTimer, initializeChat]);

  useEffect(() => {
    const handler = (e: Event) => {
      const detail = (e as CustomEvent).detail;
      if (!detail?.responseKey) return;

      hasUserInteractedRef.current = true;
      clearIntroCloseTimer();
      setLauncherHint("");
      setIsOpen(true);

      if (!hasInitializedRef.current) {
        initializeChat(false);
      }

      if (detail.label) {
        setMessages((prev) => [
          ...prev,
          { id: `user-${Date.now()}`, role: "user", text: detail.label },
        ]);
      }

      const response = rickResponses[detail.responseKey];
      if (!response) return;

      setTimeout(() => {
        setIsTyping(true);
        setTimeout(() => {
          setMessages((prev) => [
            ...prev,
            { id: `rick-${Date.now()}`, role: "rick", text: response.text },
          ]);
          setCurrentStage(response.nextStage);
          setIsTyping(false);
        }, 1400);
      }, 300);
    };

    window.addEventListener("ask-rick", handler);
    return () => window.removeEventListener("ask-rick", handler);
  }, [clearIntroCloseTimer, initializeChat]);

  const handleCTA = useCallback(
    (responseKey: string) => {
      hasUserInteractedRef.current = true;
      clearIntroCloseTimer();
      setLauncherHint("");

      const response = rickResponses[responseKey];
      if (!response) return;

      if (responseKey === "go_sign") {
        setTimeout(() => {
          document
            .getElementById("signature-section")
            ?.scrollIntoView({ behavior: "smooth" });
        }, 500);
      }

      setIsTyping(true);
      setTimeout(() => {
        setMessages((prev) => [
          ...prev,
          {
            id: `rick-${Date.now()}`,
            role: "rick",
            text: response.text,
          },
        ]);
        setCurrentStage(response.nextStage);
        setIsTyping(false);
      }, 1400);
    },
    [clearIntroCloseTimer]
  );

  const handleSend = useCallback(async () => {
    if (!input.trim()) return;

    hasUserInteractedRef.current = true;
    clearIntroCloseTimer();
    setLauncherHint("");

    const userText = input.trim();
    const historyAtSend = messages;
    setMessages((prev) => [
      ...prev,
      { id: `user-${Date.now()}`, role: "user", text: userText },
    ]);
    setInput("");

    // Keyword matcher still decides the next CTA stage so the button row
    // reacts sensibly (deterministic UX). The actual reply comes from GPT
    // via the same system prompt Voice Rick uses, so both personas match.
    const { text: fallbackText, nextStage } = getFreetextResponse(userText);

    setIsTyping(true);
    const llmText = await askRickLLM(historyAtSend, userText);
    const text = llmText ?? fallbackText;

    setMessages((prev) => [
      ...prev,
      { id: `rick-${Date.now()}`, role: "rick", text },
    ]);
    setCurrentStage(nextStage);
    setIsTyping(false);
  }, [clearIntroCloseTimer, input, messages]);

  const currentCTAs =
    ctaStages[currentStage]?.options ?? ctaStages.opening.options;

  return (
    <>
      <AnimatePresence>
        {showBubble && !isOpen && (
          <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end gap-3">
            <AnimatePresence>
              {launcherHint && (
                <motion.div
                  initial={{ opacity: 0, y: 8, scale: 0.96 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 8, scale: 0.96 }}
                  className="max-w-[240px] rounded-2xl rounded-br-md border border-green-900/40 bg-[#0d1117] px-4 py-3 text-sm text-green-100 shadow-xl"
                >
                  {launcherHint}
                </motion.div>
              )}
            </AnimatePresence>

            <motion.button
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0, opacity: 0 }}
              onClick={() => {
                hasUserInteractedRef.current = true;
                clearIntroCloseTimer();
                setLauncherHint("");
                setIsOpen(true);
                initializeChat(!hasInitializedRef.current);
              }}
              className="w-16 h-16 rounded-full bg-gradient-to-br from-green-600 to-green-800 text-white shadow-2xl flex items-center justify-center rick-pulse hover:from-green-500 hover:to-green-700 transition-all cursor-pointer"
            >
              <MessageCircle className="w-7 h-7" />
            </motion.button>
          </div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 40, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 40, scale: 0.95 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="fixed bottom-6 right-6 z-50 w-[400px] max-w-[calc(100vw-2rem)] h-[560px] max-h-[calc(100vh-6rem)] bg-[#0d1117] border border-green-800/50 rounded-2xl shadow-2xl flex flex-col overflow-hidden"
          >
            <div className="flex items-center justify-between px-4 py-3 bg-gradient-to-r from-[#0d1117] to-[#1a2332] border-b border-green-900/30">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-green-500 to-green-700 flex items-center justify-center text-lg font-bold text-white">
                  R
                </div>
                <div>
                  <div className="font-semibold text-green-400 text-sm">
                    Rick - Lead Engineer
                  </div>
                  <div className="text-xs text-green-600">
                    DTSP-AI Technologies
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => {
                    hasUserInteractedRef.current = true;
                    clearIntroCloseTimer();
                    setVoiceModeOpen(true);
                  }}
                  className="p-2 rounded-lg text-green-400 hover:text-green-200 hover:bg-green-900/30 transition-colors cursor-pointer"
                  title="Voice mode"
                >
                  <Mic className="w-5 h-5" />
                </button>
                <button
                  onClick={() => {
                    hasUserInteractedRef.current = true;
                    clearIntroCloseTimer();
                    setIsOpen(false);
                    setLauncherHint("I'm here when you need me.");
                  }}
                  className="p-2 rounded-lg text-zinc-500 hover:text-white transition-colors cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3">
              {messages.map((msg) => (
                <motion.div
                  key={msg.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`flex ${
                    msg.role === "user" ? "justify-end" : "justify-start"
                  }`}
                >
                  <div
                    className={`max-w-[85%] px-4 py-2.5 rounded-2xl text-sm leading-relaxed ${
                      msg.role === "rick"
                        ? "bg-[#1a2332] text-green-100 border border-green-900/30 rounded-bl-md"
                        : "bg-green-700 text-white rounded-br-md"
                    }`}
                  >
                    {msg.text}
                  </div>
                </motion.div>
              ))}

              {isTyping && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="flex justify-start"
                >
                  <div className="bg-[#1a2332] border border-green-900/30 px-4 py-3 rounded-2xl rounded-bl-md">
                    <div className="flex gap-1.5">
                      <span className="w-2 h-2 bg-green-500 rounded-full animate-bounce [animation-delay:0ms]" />
                      <span className="w-2 h-2 bg-green-500 rounded-full animate-bounce [animation-delay:150ms]" />
                      <span className="w-2 h-2 bg-green-500 rounded-full animate-bounce [animation-delay:300ms]" />
                    </div>
                  </div>
                </motion.div>
              )}

              <div ref={messagesEndRef} />
            </div>

            {!isTyping && messages.length > 0 && (
              <div className="px-4 pb-2">
                <div className="text-[10px] text-green-700 uppercase tracking-widest mb-1.5 font-medium">
                  Ask Rick
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {currentCTAs.map((cta) => (
                    <button
                      key={cta.responseKey}
                      onClick={() => handleCTA(cta.responseKey)}
                      className="text-xs px-3 py-1.5 rounded-full bg-green-900/20 text-green-400 border border-green-800/30 hover:bg-green-800/30 hover:border-green-700/50 transition-all cursor-pointer"
                    >
                      {cta.label}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div className="px-4 py-3 border-t border-green-900/30 bg-[#0d1117]">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleSend()}
                  placeholder="Or type your question..."
                  className="flex-1 bg-[#1a2332] text-green-100 placeholder-green-800 px-4 py-2.5 rounded-xl border border-green-900/30 focus:border-green-600 focus:outline-none text-sm"
                />
                <button
                  onClick={handleSend}
                  disabled={!input.trim()}
                  className="bg-green-700 hover:bg-green-600 disabled:opacity-30 text-white p-2.5 rounded-xl transition-colors cursor-pointer disabled:cursor-not-allowed"
                >
                  <Send className="w-4 h-4" />
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <RickVoiceMode
        isOpen={voiceModeOpen}
        onClose={() => setVoiceModeOpen(false)}
        onExchange={(userText, rickText, nextStage) => {
          setMessages((prev) => [
            ...prev,
            { id: `user-${Date.now()}`, role: "user", text: userText },
            { id: `rick-${Date.now() + 1}`, role: "rick", text: rickText },
          ]);
          setCurrentStage(nextStage);
        }}
      />
    </>
  );
}
