"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { MessageCircle, X, Send, ChevronDown } from "lucide-react";
import {
  rickOpeningSequence,
  rickSectionComments,
  rickIdleQuips,
  rickFAQ,
} from "@/lib/rick-messages";

interface ChatMessage {
  id: string;
  role: "rick" | "user";
  text: string;
}

interface RickChatProps {
  activeSection: string;
}

export default function RickChat({ activeSection }: RickChatProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [hasOpened, setHasOpened] = useState(false);
  const [showBubble, setShowBubble] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const seenSections = useRef<Set<string>>(new Set());
  const idleTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const idleIndex = useRef(0);

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  // Rick's opening — auto-open after 1.5s
  useEffect(() => {
    const timer = setTimeout(() => {
      setShowBubble(true);
    }, 1500);

    const openTimer = setTimeout(() => {
      setIsOpen(true);
      setHasOpened(true);
      // Start the opening sequence
      rickOpeningSequence.forEach((msg) => {
        setTimeout(() => {
          setIsTyping(true);
          setTimeout(() => {
            setMessages((prev) => [
              ...prev,
              { id: msg.id, role: "rick", text: msg.text },
            ]);
            setIsTyping(false);
          }, 1200);
        }, msg.delay);
      });
    }, 2500);

    return () => {
      clearTimeout(timer);
      clearTimeout(openTimer);
    };
  }, []);

  // Section-aware comments
  useEffect(() => {
    if (!activeSection || seenSections.current.has(activeSection)) return;
    seenSections.current.add(activeSection);

    const comments = rickSectionComments[activeSection];
    if (!comments || comments.length === 0) return;

    const comment = comments[Math.floor(Math.random() * comments.length)];

    setTimeout(() => {
      if (!isOpen) {
        setUnreadCount((prev) => prev + 1);
      }
      setIsTyping(true);
      setTimeout(() => {
        setMessages((prev) => [
          ...prev,
          {
            id: `section-${activeSection}-${Date.now()}`,
            role: "rick",
            text: comment,
          },
        ]);
        setIsTyping(false);
      }, 1500);
    }, 2000);
  }, [activeSection, isOpen]);

  // Idle quips
  useEffect(() => {
    const resetIdle = () => {
      if (idleTimer.current) clearTimeout(idleTimer.current);
      idleTimer.current = setTimeout(() => {
        if (idleIndex.current < rickIdleQuips.length) {
          const quip = rickIdleQuips[idleIndex.current];
          if (!isOpen) setUnreadCount((prev) => prev + 1);
          setIsTyping(true);
          setTimeout(() => {
            setMessages((prev) => [
              ...prev,
              { id: `idle-${Date.now()}`, role: "rick", text: quip },
            ]);
            setIsTyping(false);
            idleIndex.current++;
          }, 1200);
        }
      }, 45000);
    };

    window.addEventListener("scroll", resetIdle);
    window.addEventListener("mousemove", resetIdle);
    resetIdle();

    return () => {
      window.removeEventListener("scroll", resetIdle);
      window.removeEventListener("mousemove", resetIdle);
      if (idleTimer.current) clearTimeout(idleTimer.current);
    };
  }, [isOpen]);

  const handleSend = () => {
    if (!input.trim()) return;

    const userMsg: ChatMessage = {
      id: `user-${Date.now()}`,
      role: "user",
      text: input.trim(),
    };
    setMessages((prev) => [...prev, userMsg]);
    const query = input.toLowerCase();
    setInput("");

    // Match against FAQ
    setTimeout(() => {
      setIsTyping(true);
      setTimeout(() => {
        let response = "";

        if (query.includes("timeline") || query.includes("how long") || query.includes("when")) {
          response = rickFAQ.timeline;
        } else if (query.includes("cost") || query.includes("price") || query.includes("money") || query.includes("pay") || query.includes("invest")) {
          response = rickFAQ.cost;
        } else if (query.includes("godaddy") || query.includes("go daddy") || query.includes("website")) {
          response = rickFAQ.godaddy;
        } else if (query.includes("artist") || query.includes("payout") || query.includes("80") || query.includes("consent")) {
          response = rickFAQ.artists;
        } else if (query.includes("seo") || query.includes("search") || query.includes("google") || query.includes("traffic")) {
          response = "The SEO engine is probably the most undervalued piece of this whole proposal. Most marketplaces wait 18 months for organic traffic. We start building domain authority on day one. By the time you're onboarding artists, Google already knows your site exists and likes what it sees. That's not a nice-to-have — it's the difference between a marketplace that gets found and one that doesn't.";
        } else if (query.includes("stripe") || query.includes("payment") || query.includes("split")) {
          response = "Stripe Connect handles the 80/20 split automatically. When a buyer purchases art on your marketplace, 80% goes directly to the artist's Stripe account and 20% goes to WEA. No spreadsheets. No manual transfers. No 'I'll pay you at the end of the month.' It happens at the point of sale, every time.";
        } else if (query.includes("own") || query.includes("data") || query.includes("lock")) {
          response = "You own everything. The database, the code, the artist data, the SEO content — all of it. If you want to fire us and take the whole stack in-house, you can. If you want to switch from GoDaddy to Shopify or a fully custom frontend, the backend doesn't change. Zero vendor lock-in. That's by design, not by accident.";
        } else if (query.includes("hello") || query.includes("hey") || query.includes("hi")) {
          response = "Hey Alanson. What's on your mind? I'm happy to dig into any part of this proposal — the tech, the money, the timeline, the philosophy behind it. No question is off limits.";
        } else if (query.includes("thank")) {
          response = "Don't thank me yet — thank me when artists are getting paid 80 cents on every dollar and your marketplace is outranking the competition on Google. That's when the thank you means something. But I appreciate you taking the time to read this seriously.";
        } else {
          response = `Good question. I don't have a canned answer for that one, which means it deserves a real conversation. Pete's the strategist — reach out at pete@deal-whisper.com or just sign below and we'll schedule a deep dive on exactly that. No commitment until you're comfortable.`;
        }

        setMessages((prev) => [
          ...prev,
          { id: `rick-${Date.now()}`, role: "rick", text: response },
        ]);
        setIsTyping(false);
      }, 1800);
    }, 300);
  };

  return (
    <>
      {/* Floating button */}
      <AnimatePresence>
        {showBubble && !isOpen && (
          <motion.button
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            onClick={() => {
              setIsOpen(true);
              setHasOpened(true);
              setUnreadCount(0);
            }}
            className="fixed bottom-6 right-6 z-50 w-16 h-16 rounded-full bg-gradient-to-br from-green-600 to-green-800 text-white shadow-2xl flex items-center justify-center rick-pulse hover:from-green-500 hover:to-green-700 transition-all cursor-pointer"
          >
            <MessageCircle className="w-7 h-7" />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs w-5 h-5 rounded-full flex items-center justify-center font-bold">
                {unreadCount}
              </span>
            )}
          </motion.button>
        )}
      </AnimatePresence>

      {/* Chat panel */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 40, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 40, scale: 0.95 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="fixed bottom-6 right-6 z-50 w-[400px] max-w-[calc(100vw-2rem)] h-[560px] max-h-[calc(100vh-6rem)] bg-[#0d1117] border border-green-800/50 rounded-2xl shadow-2xl flex flex-col overflow-hidden"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 bg-gradient-to-r from-[#0d1117] to-[#1a2332] border-b border-green-900/30">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-green-500 to-green-700 flex items-center justify-center text-lg font-bold">
                  R
                </div>
                <div>
                  <div className="font-semibold text-green-400 text-sm">
                    Rick — Lead Engineer
                  </div>
                  <div className="text-xs text-green-600">
                    DTSP-AI Technologies
                  </div>
                </div>
              </div>
              <button
                onClick={() => {
                  setIsOpen(false);
                  setUnreadCount(0);
                }}
                className="text-zinc-500 hover:text-white transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3">
              {messages.map((msg) => (
                <motion.div
                  key={msg.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
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

            {/* Quick actions */}
            {messages.length <= 4 && (
              <div className="px-4 pb-2 flex flex-wrap gap-1.5">
                {["What's the timeline?", "Tell me about costs", "How does SEO work?", "What about GoDaddy?"].map(
                  (q) => (
                    <button
                      key={q}
                      onClick={() => {
                        setInput(q);
                        setTimeout(() => {
                          const fakeEvent = { trim: () => q } as unknown;
                          void fakeEvent;
                          setMessages((prev) => [
                            ...prev,
                            { id: `user-${Date.now()}`, role: "user", text: q },
                          ]);
                          // Trigger rick response
                          const query = q.toLowerCase();
                          setTimeout(() => {
                            setIsTyping(true);
                            setTimeout(() => {
                              let response = "";
                              if (query.includes("timeline")) response = rickFAQ.timeline;
                              else if (query.includes("cost")) response = rickFAQ.cost;
                              else if (query.includes("seo")) response = "The SEO engine is probably the most undervalued piece of this whole proposal. Most marketplaces wait 18 months for organic traffic. We start building domain authority on day one. By the time you're onboarding artists, Google already knows your site exists and likes what it sees.";
                              else if (query.includes("godaddy")) response = rickFAQ.godaddy;
                              setMessages((prev) => [
                                ...prev,
                                { id: `rick-${Date.now()}`, role: "rick", text: response },
                              ]);
                              setIsTyping(false);
                              setInput("");
                            }, 1800);
                          }, 300);
                        }, 50);
                      }}
                      className="text-xs px-3 py-1.5 rounded-full bg-green-900/30 text-green-400 border border-green-800/40 hover:bg-green-800/40 transition-colors cursor-pointer"
                    >
                      {q}
                    </button>
                  )
                )}
              </div>
            )}

            {/* Input */}
            <div className="px-4 py-3 border-t border-green-900/30 bg-[#0d1117]">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleSend()}
                  placeholder="Ask Rick anything..."
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
    </>
  );
}
