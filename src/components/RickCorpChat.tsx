"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { MessageCircle, X, Send } from "lucide-react";
import {
  rickCorpOpening,
  rickCorpCtas,
  rickCorpResponses,
  getCorpFallback,
} from "@/lib/rick-corp-messages";

// Text-only Rick for /corp-structure-scope. Deliberately independent of
// RickChat.tsx: its own storage key (so founders never resume the client
// chat), its own API route (own system prompt), no voice mode, and a flat
// CTA set instead of the A3 stage machine.

interface ChatMessage {
  id: string;
  role: "rick" | "user";
  text: string;
}

const LLM_HISTORY_WINDOW = 10;
const CHAT_STORAGE_KEY = "wea-rick-corp-chat-v1";
const CHAT_STORAGE_MAX = 40;

function loadPersisted(): ChatMessage[] | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(CHAT_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed?.messages) ? parsed.messages : null;
  } catch {
    return null;
  }
}

function savePersisted(messages: ChatMessage[]) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(
      CHAT_STORAGE_KEY,
      JSON.stringify({ messages: messages.slice(-CHAT_STORAGE_MAX) })
    );
  } catch {
    /* noop */
  }
}

async function askRick(
  history: ChatMessage[],
  userText: string
): Promise<string | null> {
  try {
    const res = await fetch("/api/rick/corp-chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        messages: [
          ...history.slice(-LLM_HISTORY_WINDOW).map((m) => ({
            role: m.role === "user" ? "user" : "assistant",
            content: m.text,
          })),
          { role: "user" as const, content: userText },
        ],
      }),
    });
    if (!res.ok) return null;
    const data = await res.json();
    const text = typeof data?.text === "string" ? data.text.trim() : "";
    return text || null;
  } catch {
    return null;
  }
}

export default function RickCorpChat() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [showBubble, setShowBubble] = useState(false);
  const hasInitializedRef = useRef(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isTyping]);

  const initializeChat = useCallback(() => {
    if (hasInitializedRef.current) return;
    hasInitializedRef.current = true;
    const persisted = loadPersisted();
    if (persisted && persisted.length > 0) {
      setMessages(persisted);
      return;
    }
    setIsTyping(true);
    setTimeout(() => {
      setMessages([
        { id: rickCorpOpening.id, role: "rick", text: rickCorpOpening.text },
      ]);
      setIsTyping(false);
    }, 900);
  }, []);

  // Launcher bubble appears shortly after load. No auto-open — founders are
  // reading a document; Rick waits to be asked.
  useEffect(() => {
    const t = setTimeout(() => setShowBubble(true), 1200);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    if (messages.length === 0) return;
    savePersisted(messages);
  }, [messages]);

  const pushRick = useCallback((text: string) => {
    setIsTyping(true);
    setTimeout(() => {
      setMessages((prev) => [
        ...prev,
        { id: `rick-${Date.now()}`, role: "rick", text },
      ]);
      setIsTyping(false);
    }, 900);
  }, []);

  const handleCTA = useCallback(
    (responseKey: string, label: string) => {
      const canned = rickCorpResponses[responseKey];
      if (!canned) return;
      setMessages((prev) => [
        ...prev,
        { id: `user-${Date.now()}`, role: "user", text: label },
      ]);
      pushRick(canned);
    },
    [pushRick]
  );

  const handleSend = useCallback(async () => {
    if (!input.trim()) return;
    const userText = input.trim();
    const historyAtSend = messages;
    setMessages((prev) => [
      ...prev,
      { id: `user-${Date.now()}`, role: "user", text: userText },
    ]);
    setInput("");
    setIsTyping(true);
    const llmText = await askRick(historyAtSend, userText);
    setMessages((prev) => [
      ...prev,
      {
        id: `rick-${Date.now()}`,
        role: "rick",
        text: llmText ?? getCorpFallback(userText),
      },
    ]);
    setIsTyping(false);
  }, [input, messages]);

  return (
    <>
      <AnimatePresence>
        {showBubble && !isOpen && (
          <motion.button
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            onClick={() => {
              setIsOpen(true);
              initializeChat();
            }}
            className="fixed bottom-6 right-6 z-50 w-16 h-16 rounded-full bg-gradient-to-br from-green-600 to-green-800 text-white shadow-2xl flex items-center justify-center hover:from-green-500 hover:to-green-700 transition-all cursor-pointer"
            title="Ask Rick about this document"
          >
            <MessageCircle className="w-7 h-7" />
          </motion.button>
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
                    Founder Alignment Copilot
                  </div>
                </div>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="p-2 rounded-lg text-zinc-500 hover:text-white transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
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
                  {rickCorpCtas.map((cta) => (
                    <button
                      key={cta.responseKey}
                      onClick={() => handleCTA(cta.responseKey, cta.label)}
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
                  placeholder="Ask about any section..."
                  className="flex-1 bg-[#1a2332] text-green-100 placeholder-green-800 px-4 py-2.5 rounded-xl border border-green-900/30 focus:border-green-600 focus:outline-none text-sm"
                />
                <button
                  onClick={handleSend}
                  disabled={!input.trim()}
                  className="bg-green-700 hover:bg-green-600 disabled:opacity-40 disabled:hover:bg-green-700 text-white p-2.5 rounded-xl transition-colors cursor-pointer"
                  title="Send"
                >
                  <Send className="w-4 h-4" />
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
