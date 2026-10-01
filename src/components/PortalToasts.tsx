"use client";

import { useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { CalendarClock, IdCard, TriangleAlert, X } from "lucide-react";
import type { ProposalMeta } from "@/lib/proposal-data";
import { portalNotices, todayISO, type NoticeKind } from "@/lib/portal-notices";

const DISMISS_KEY = "wea-portal-toasts-dismissed";

const style: Record<NoticeKind, { icon: typeof X; border: string; color: string }> = {
  overdue: { icon: TriangleAlert, border: "rgba(239,68,68,0.45)", color: "#fca5a5" },
  "due-soon": { icon: CalendarClock, border: "rgba(245,158,11,0.45)", color: "#fbbf24" },
  action: { icon: IdCard, border: "rgba(34,197,94,0.45)", color: "#86efac" },
};

function readDismissed(): string[] {
  try {
    return JSON.parse(sessionStorage.getItem(DISMISS_KEY) ?? "[]") as string[];
  } catch {
    return [];
  }
}

/**
 * Portal toasts for the client — the next payment and any open action item,
 * derived from the plan data. Dismissals last for the browser session, so an
 * unpaid payment or an undelivered item is back on the next visit.
 */
export default function PortalToasts({ meta }: { meta: ProposalMeta }) {
  // Mounted only behind the portal's auth gate, which renders after client
  // hydration — so reading the date and storage in the initializers is safe.
  const [today] = useState(() => todayISO());
  const [dismissed, setDismissed] = useState<string[]>(readDismissed);

  const toasts = useMemo(
    () => portalNotices(meta, today).filter((n) => !dismissed.includes(n.key)),
    [meta, today, dismissed]
  );

  function dismiss(key: string) {
    const next = [...dismissed, key];
    setDismissed(next);
    try {
      sessionStorage.setItem(DISMISS_KEY, JSON.stringify(next));
    } catch {
      // storage unavailable — dismissal lasts for this page view only
    }
  }

  return (
    <div
      // bottom-24 on phones clears Rick's launcher, which owns the bottom-right corner.
      className="pointer-events-none fixed bottom-24 left-4 z-50 sm:bottom-6 flex w-[calc(100%-2rem)] max-w-sm flex-col gap-2 sm:left-6"
      aria-live="polite"
    >
      <AnimatePresence initial={false}>
        {toasts.map((n) => {
          const s = style[n.kind];
          const Icon = s.icon;
          return (
            <motion.div
              key={n.key}
              layout
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, x: -24 }}
              transition={{ duration: 0.25 }}
              role="status"
              className="pointer-events-auto flex items-start gap-3 rounded-xl border bg-[rgba(10,10,10,0.95)] p-4 shadow-lg backdrop-blur"
              style={{ borderColor: s.border }}
            >
              <Icon size={18} className="mt-0.5 shrink-0" style={{ color: s.color }} />
              <button
                onClick={() =>
                  document.getElementById(n.anchor)?.scrollIntoView({ behavior: "smooth" })
                }
                className="flex-1 cursor-pointer text-left"
              >
                <div className="text-[15px] font-semibold" style={{ color: s.color }}>
                  {n.title}
                </div>
                <div className="mt-0.5 text-[15px] leading-snug text-white">{n.text}</div>
              </button>
              <button
                onClick={() => dismiss(n.key)}
                aria-label="Dismiss"
                className="shrink-0 cursor-pointer text-zinc-500 transition hover:text-white"
              >
                <X size={15} />
              </button>
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
}
