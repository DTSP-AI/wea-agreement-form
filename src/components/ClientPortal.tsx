"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import dynamic from "next/dynamic";
import { motion } from "framer-motion";
import {
  CheckCircle,
  Circle,
  Clock,
  DollarSign,
  FolderOpen,
  ExternalLink,
  Mic,
  Square,
  Copy,
  Check,
  Loader2,
  FileText,
} from "lucide-react";
import { planCAddendum } from "@/lib/proposal-data";

const RickChat = dynamic(() => import("@/components/RickChat"), {
  ssr: false,
});

const CHECKLIST_STORAGE_KEY = "wea-portal-checklist-v1";
const TRANSCRIPT_STORAGE_KEY = "wea-portal-transcripts-v1";

// Drive folder placeholders — Pete drops in real URLs and these light up.
// Anything left as empty string renders a "Pending" pill instead of a link.
const DRIVE_FOLDERS: {
  label: string;
  description: string;
  url: string;
}[] = [
  {
    label: "Signed Agreements",
    description: "Plan C Addendum + any future addenda.",
    url: "",
  },
  {
    label: "Brand Assets",
    description: "Logos, fonts, color palette, imagery.",
    url: "",
  },
  {
    label: "Artist Roster & Onboarding",
    description: "Pilot artist list, bios, consent docs.",
    url: "",
  },
  {
    label: "Milestone Deliverables",
    description: "Shipped artifacts per milestone (code, configs, docs).",
    url: "",
  },
  {
    label: "Meeting Notes & Transcripts",
    description: "Milestone reviews and Rick transcription exports.",
    url: "",
  },
];

// Kickoff tasks that sit BEFORE the milestone work — onboarding hygiene.
const KICKOFF_TASKS: { id: string; label: string; auto?: boolean }[] = [
  { id: "kickoff-signed", label: "Agreement signed", auto: true },
  { id: "kickoff-paid", label: "First payment received", auto: true },
  { id: "kickoff-call", label: "Kickoff call scheduled with Pete" },
  { id: "kickoff-brand", label: "Brand assets uploaded to Drive" },
  { id: "kickoff-domain", label: "Primary domain + registrar access granted" },
  { id: "kickoff-slack", label: "Shared channel / comms set up" },
];

type CheckState = Record<string, boolean>;

function loadCheckState(): CheckState {
  if (typeof window === "undefined") return {};
  try {
    const raw = localStorage.getItem(CHECKLIST_STORAGE_KEY);
    if (!raw) return {};
    return JSON.parse(raw) as CheckState;
  } catch {
    return {};
  }
}

function saveCheckState(state: CheckState) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(CHECKLIST_STORAGE_KEY, JSON.stringify(state));
  } catch {
    /* noop */
  }
}

interface SavedTranscript {
  id: string;
  text: string;
  createdAt: string;
}

function loadTranscripts(): SavedTranscript[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(TRANSCRIPT_STORAGE_KEY);
    if (!raw) return [];
    return JSON.parse(raw) as SavedTranscript[];
  } catch {
    return [];
  }
}

function saveTranscripts(items: SavedTranscript[]) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(TRANSCRIPT_STORAGE_KEY, JSON.stringify(items));
  } catch {
    /* noop */
  }
}

export default function ClientPortal() {
  const plan = planCAddendum;
  const schedule = plan.meta.paymentSchedule ?? [];

  const [checkState, setCheckState] = useState<CheckState>({});
  const [transcripts, setTranscripts] = useState<SavedTranscript[]>([]);

  // Hydrate from localStorage once on client. Pre-existing localStorage
  // state is a classic exception to "no setState in effect".
  useEffect(() => {
    const loaded = loadCheckState();
    // Auto-mark kickoff-signed and kickoff-paid unless user toggled them off.
    const autoIds = KICKOFF_TASKS.filter((t) => t.auto).map((t) => t.id);
    const next = { ...loaded };
    for (const id of autoIds) {
      if (next[id] === undefined) next[id] = true;
    }
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setCheckState(next);
    setTranscripts(loadTranscripts());
  }, []);

  const toggleCheck = useCallback((id: string) => {
    setCheckState((prev) => {
      const next = { ...prev, [id]: !prev[id] };
      saveCheckState(next);
      return next;
    });
  }, []);

  // ---------- Payment summary ----------
  const paidCount = schedule.filter((p) => p.paid).length;
  const nextPayment = schedule.find((p) => !p.paid);

  // ---------- Checklist progress ----------
  const allChecklistIds = useMemo(() => {
    const ids: string[] = [];
    KICKOFF_TASKS.forEach((t) => ids.push(t.id));
    plan.phases.forEach((phase) => {
      phase.requirements?.forEach((_, i) =>
        ids.push(`p${phase.number}-req-${i}`)
      );
      phase.deliverables.forEach((_, i) =>
        ids.push(`p${phase.number}-del-${i}`)
      );
    });
    return ids;
  }, [plan.phases]);

  const completedCount = allChecklistIds.filter((id) => checkState[id]).length;
  const progressPct =
    allChecklistIds.length > 0
      ? Math.round((completedCount / allChecklistIds.length) * 100)
      : 0;

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white">
      <header className="sticky top-0 z-40 bg-[#0a0a0a]/90 backdrop-blur-xl border-b border-[#1a1a1a]">
        <div className="max-w-5xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-green-500 to-green-700 flex items-center justify-center text-white font-bold">
              W
            </div>
            <div>
              <div className="text-sm font-semibold text-white">
                Whole Earth Industries — Client Portal
              </div>
              <div className="text-xs text-zinc-500">
                Artist Marketplace Platform · Plan C Addendum
              </div>
            </div>
          </div>
          <div className="hidden sm:flex items-center gap-4 text-xs text-zinc-400">
            <span className="flex items-center gap-1.5">
              <CheckCircle className="w-3.5 h-3.5 text-green-400" />
              {paidCount}/{schedule.length} paid
            </span>
            <span className="flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-green-400" />
              {completedCount}/{allChecklistIds.length} checklist
            </span>
          </div>
        </div>
      </header>

      <div className="max-w-5xl mx-auto px-6 py-10 space-y-10">
        {/* Hero / welcome */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gradient-to-br from-green-950/40 via-[#0d1117] to-[#0a0a0a] border border-green-800/40 rounded-2xl p-8"
        >
          <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
            <div>
              <div className="text-xs uppercase tracking-[0.2em] text-green-400/80 mb-2">
                Welcome, Alanson
              </div>
              <h1 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-white via-green-200 to-green-500 bg-clip-text text-transparent">
                Plan C Addendum is Active
              </h1>
              <p className="text-zinc-400 text-sm mt-3 max-w-xl leading-relaxed">
                First payment received April 23, 2026. Foundation milestone is
                underway. Rick is available 24/7 in the chat widget — talk,
                type, or transcribe a note and he&apos;ll hang on every word.
              </p>
            </div>
            <div className="flex gap-3">
              <a
                href="/plan_c_addendum"
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white text-sm hover:bg-white/10 transition-colors"
              >
                <FileText className="w-4 h-4" />
                View Agreement
              </a>
            </div>
          </div>

          <div className="grid sm:grid-cols-3 gap-4 mt-8">
            <StatCard
              label="Plan Total"
              value={plan.meta.totalValue}
              sub="8 × $1,800 biweekly"
            />
            <StatCard
              label="Paid"
              value={`${paidCount} of ${schedule.length}`}
              sub={
                paidCount > 0
                  ? `$${paidCount * 1800} received`
                  : "Awaiting first payment"
              }
              emphasis="green"
            />
            <StatCard
              label="Next Payment"
              value={nextPayment?.amount ?? "—"}
              sub={
                nextPayment
                  ? nextPayment.dateLabel
                  : "All payments received"
              }
            />
          </div>
        </motion.section>

        {/* Payment schedule */}
        <section>
          <SectionHeader
            icon={<DollarSign className="w-5 h-5 text-green-400" />}
            title="Payment Schedule"
            subtitle="Full 8-payment addendum schedule."
          />
          <div className="overflow-hidden rounded-xl border border-[#262626]">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-[#141414]">
                  <th className="px-4 py-3 text-left text-[10px] uppercase tracking-wider text-zinc-500">
                    #
                  </th>
                  <th className="px-4 py-3 text-left text-[10px] uppercase tracking-wider text-zinc-500">
                    Date
                  </th>
                  <th className="px-4 py-3 text-left text-[10px] uppercase tracking-wider text-zinc-500">
                    Amount
                  </th>
                  <th className="px-4 py-3 text-left text-[10px] uppercase tracking-wider text-zinc-500">
                    Status
                  </th>
                </tr>
              </thead>
              <tbody>
                {schedule.map((p, i) => {
                  const paid = p.paid === true;
                  return (
                    <tr
                      key={p.isoDate}
                      className={`border-t border-[#262626] ${
                        paid ? "bg-green-500/5" : ""
                      }`}
                    >
                      <td className="px-4 py-3 text-zinc-500 font-mono text-xs">
                        {i + 1}
                      </td>
                      <td className="px-4 py-3 text-zinc-200 text-xs">
                        {p.dateLabel}
                      </td>
                      <td
                        className={`px-4 py-3 font-semibold text-xs ${
                          paid
                            ? "text-green-300 line-through decoration-green-500/40"
                            : "text-white"
                        }`}
                      >
                        {p.amount}
                      </td>
                      <td className="px-4 py-3">
                        {paid ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-green-500 text-black text-[10px] font-bold uppercase tracking-wider">
                            <CheckCircle className="w-3 h-3" />
                            Paid{p.paidOn ? ` ${p.paidOn}` : ""}
                          </span>
                        ) : (
                          <span className="text-zinc-500 text-[11px]">
                            {p.tag ?? "Biweekly"}
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </section>

        {/* Kickoff checklist */}
        <section>
          <SectionHeader
            icon={<Circle className="w-5 h-5 text-green-400" />}
            title="Kickoff"
            subtitle="Onboarding hygiene before Milestone 1 work begins."
          />
          <div className="bg-[#141414] border border-[#262626] rounded-xl p-6 space-y-2">
            {KICKOFF_TASKS.map((t) => (
              <ChecklistItem
                key={t.id}
                checked={Boolean(checkState[t.id])}
                onChange={() => toggleCheck(t.id)}
                label={t.label}
              />
            ))}
          </div>
        </section>

        {/* Phases — Requirements + Deliverables per milestone */}
        <section>
          <SectionHeader
            icon={<CheckCircle className="w-5 h-5 text-green-400" />}
            title="Milestones — Requirements & Deliverables"
            subtitle="Check off requirements as you provide them. Check off deliverables as they ship."
            trailing={
              <div className="flex items-center gap-2 text-xs text-zinc-400">
                <div className="w-32 h-1.5 rounded-full bg-[#262626] overflow-hidden">
                  <div
                    className="h-full bg-green-500 transition-all"
                    style={{ width: `${progressPct}%` }}
                  />
                </div>
                {progressPct}%
              </div>
            }
          />
          <div className="space-y-5">
            {plan.phases.map((phase) => (
              <div
                key={phase.number}
                className="bg-[#141414] border border-[#262626] rounded-xl overflow-hidden"
              >
                <div className="flex items-start justify-between gap-4 px-6 py-4 border-b border-[#262626] bg-[#0d0d0d]">
                  <div className="flex items-center gap-4">
                    <div className="flex-shrink-0 w-9 h-9 rounded-lg bg-green-900/40 flex items-center justify-center text-green-400 font-bold text-sm">
                      {phase.number}
                    </div>
                    <div>
                      <div className="font-semibold text-white">
                        {phase.title}
                      </div>
                      <div className="flex items-center gap-2 text-xs text-zinc-500 mt-0.5">
                        <Clock className="w-3 h-3" />
                        {phase.weeks}
                        <span className="text-zinc-700">·</span>
                        <span className="text-green-400">
                          {phase.milestone}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-0 divide-y md:divide-y-0 md:divide-x divide-[#262626]">
                  <div className="p-6">
                    <div className="text-[10px] uppercase tracking-[0.2em] text-yellow-400/80 font-semibold mb-3">
                      Requirements from you
                    </div>
                    <div className="space-y-1.5">
                      {(phase.requirements ?? []).map((r, i) => {
                        const id = `p${phase.number}-req-${i}`;
                        return (
                          <ChecklistItem
                            key={id}
                            checked={Boolean(checkState[id])}
                            onChange={() => toggleCheck(id)}
                            label={r}
                          />
                        );
                      })}
                      {(!phase.requirements ||
                        phase.requirements.length === 0) && (
                        <div className="text-xs text-zinc-600 italic">
                          No inputs required this milestone.
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="p-6">
                    <div className="text-[10px] uppercase tracking-[0.2em] text-green-400/80 font-semibold mb-3">
                      Deliverables from Pete
                    </div>
                    <div className="space-y-1.5">
                      {phase.deliverables.map((d, i) => {
                        const id = `p${phase.number}-del-${i}`;
                        return (
                          <ChecklistItem
                            key={id}
                            checked={Boolean(checkState[id])}
                            onChange={() => toggleCheck(id)}
                            label={d}
                          />
                        );
                      })}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Drive folders */}
        <section>
          <SectionHeader
            icon={<FolderOpen className="w-5 h-5 text-green-400" />}
            title="Shared Drive Folders"
            subtitle="Everything that is not code — agreements, brand, onboarding, notes."
          />
          <div className="grid sm:grid-cols-2 gap-3">
            {DRIVE_FOLDERS.map((f) => {
              const live = f.url.length > 0;
              return live ? (
                <a
                  key={f.label}
                  href={f.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group bg-[#141414] border border-[#262626] hover:border-green-700/60 hover:bg-[#171a17] rounded-xl p-5 transition-all cursor-pointer"
                >
                  <div className="flex items-center justify-between gap-3">
                    <div className="font-semibold text-white text-sm">
                      {f.label}
                    </div>
                    <ExternalLink className="w-4 h-4 text-zinc-500 group-hover:text-green-400 transition-colors" />
                  </div>
                  <div className="text-xs text-zinc-500 mt-1">
                    {f.description}
                  </div>
                </a>
              ) : (
                <div
                  key={f.label}
                  className="bg-[#0d0d0d] border border-dashed border-[#262626] rounded-xl p-5 opacity-80"
                >
                  <div className="flex items-center justify-between gap-3">
                    <div className="font-semibold text-zinc-400 text-sm">
                      {f.label}
                    </div>
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-zinc-800 text-zinc-500 uppercase tracking-wider">
                      Pending
                    </span>
                  </div>
                  <div className="text-xs text-zinc-600 mt-1">
                    {f.description}
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* Transcribe */}
        <section>
          <SectionHeader
            icon={<Mic className="w-5 h-5 text-green-400" />}
            title="Rick · Transcribe"
            subtitle="Tap record, talk, and Rick will transcribe it and save it here. Stays local unless you copy it out."
          />
          <TranscribePanel
            transcripts={transcripts}
            setTranscripts={(next) => {
              setTranscripts(next);
              saveTranscripts(next);
            }}
          />
        </section>
      </div>

      <footer className="border-t border-[#1a1a1a] py-8 text-center">
        <p className="text-xs text-zinc-600">
          Whole Earth Industries — Client Portal · Prepared by DTSP-AI
          Technologies · {plan.meta.contact}
        </p>
      </footer>

      {/* Rick chat widget */}
      <div data-rick-chat>
        <RickChat />
      </div>
    </div>
  );
}

// ---------- Helpers ----------

function SectionHeader({
  icon,
  title,
  subtitle,
  trailing,
}: {
  icon: React.ReactNode;
  title: string;
  subtitle?: string;
  trailing?: React.ReactNode;
}) {
  return (
    <div className="flex items-end justify-between gap-4 mb-4">
      <div>
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-green-900/20 flex items-center justify-center">
            {icon}
          </div>
          <h2 className="text-lg font-bold text-white">{title}</h2>
        </div>
        {subtitle && (
          <p className="text-xs text-zinc-500 mt-1 ml-12">{subtitle}</p>
        )}
      </div>
      {trailing}
    </div>
  );
}

function StatCard({
  label,
  value,
  sub,
  emphasis,
}: {
  label: string;
  value: string;
  sub?: string;
  emphasis?: "green" | "yellow";
}) {
  const valueColor =
    emphasis === "green"
      ? "text-green-300"
      : emphasis === "yellow"
        ? "text-yellow-300"
        : "text-white";
  return (
    <div className="bg-[#0d0d0d] border border-[#262626] rounded-xl p-4">
      <div className="text-[10px] uppercase tracking-[0.2em] text-zinc-500 font-semibold mb-1">
        {label}
      </div>
      <div className={`text-xl font-bold ${valueColor}`}>{value}</div>
      {sub && <div className="text-xs text-zinc-500 mt-1">{sub}</div>}
    </div>
  );
}

function ChecklistItem({
  checked,
  onChange,
  label,
}: {
  checked: boolean;
  onChange: () => void;
  label: string;
}) {
  return (
    <label className="flex items-start gap-2.5 group cursor-pointer py-1">
      <button
        type="button"
        onClick={onChange}
        className={`mt-0.5 flex-shrink-0 w-4 h-4 rounded border-2 flex items-center justify-center transition-all cursor-pointer ${
          checked
            ? "bg-green-500 border-green-500"
            : "border-zinc-600 group-hover:border-zinc-400"
        }`}
        aria-pressed={checked}
      >
        {checked && <Check className="w-2.5 h-2.5 text-black" strokeWidth={3} />}
      </button>
      <span
        className={`text-xs leading-relaxed ${
          checked
            ? "text-zinc-500 line-through decoration-zinc-700"
            : "text-zinc-300"
        }`}
      >
        {label}
      </span>
    </label>
  );
}

// ---------- Transcribe Panel ----------

function TranscribePanel({
  transcripts,
  setTranscripts,
}: {
  transcripts: SavedTranscript[];
  setTranscripts: (items: SavedTranscript[]) => void;
}) {
  const [recording, setRecording] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const streamRef = useRef<MediaStream | null>(null);

  const stopStream = useCallback(() => {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
  }, []);

  const start = useCallback(async () => {
    setErrorMsg(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      const mime = MediaRecorder.isTypeSupported("audio/webm;codecs=opus")
        ? "audio/webm;codecs=opus"
        : MediaRecorder.isTypeSupported("audio/mp4")
          ? "audio/mp4"
          : "";
      const recorder = mime
        ? new MediaRecorder(stream, { mimeType: mime })
        : new MediaRecorder(stream);
      mediaRecorderRef.current = recorder;
      chunksRef.current = [];
      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };
      recorder.onstop = async () => {
        stopStream();
        const blob = new Blob(chunksRef.current, {
          type: recorder.mimeType || "audio/webm",
        });
        chunksRef.current = [];
        setProcessing(true);
        try {
          const form = new FormData();
          form.set("file", blob, "audio.webm");
          const res = await fetch("/api/rick/transcribe", {
            method: "POST",
            body: form,
          });
          if (!res.ok) {
            const body = await res.text();
            throw new Error(`Transcribe failed (${res.status}): ${body}`);
          }
          const data = (await res.json()) as { text?: string };
          const text = (data.text ?? "").trim();
          if (text) {
            const entry: SavedTranscript = {
              id: `t-${Date.now()}`,
              text,
              createdAt: new Date().toLocaleString(),
            };
            setTranscripts([entry, ...transcripts]);
          }
        } catch (err) {
          setErrorMsg(err instanceof Error ? err.message : "Transcription failed.");
        } finally {
          setProcessing(false);
        }
      };
      recorder.start();
      setRecording(true);
    } catch (err) {
      setErrorMsg(
        err instanceof Error
          ? err.message
          : "Microphone permission denied. Enable it and try again."
      );
      stopStream();
    }
  }, [setTranscripts, transcripts, stopStream]);

  const stop = useCallback(() => {
    const r = mediaRecorderRef.current;
    if (r && r.state !== "inactive") {
      r.stop();
    }
    setRecording(false);
  }, []);

  const handleCopy = useCallback(async (item: SavedTranscript) => {
    try {
      await navigator.clipboard.writeText(item.text);
      setCopiedId(item.id);
      setTimeout(() => setCopiedId(null), 1500);
    } catch {
      /* noop */
    }
  }, []);

  const handleDelete = useCallback(
    (id: string) => {
      setTranscripts(transcripts.filter((t) => t.id !== id));
    },
    [setTranscripts, transcripts]
  );

  return (
    <div className="bg-[#141414] border border-[#262626] rounded-xl p-6 space-y-5">
      <div className="flex items-center gap-3">
        <button
          onClick={recording ? stop : start}
          disabled={processing}
          className={`inline-flex items-center gap-2 px-5 py-2.5 rounded-xl font-semibold text-sm transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed ${
            recording
              ? "bg-red-600 hover:bg-red-500 text-white"
              : "bg-green-600 hover:bg-green-500 text-white"
          }`}
        >
          {recording ? (
            <>
              <Square className="w-4 h-4" />
              Stop & Transcribe
            </>
          ) : processing ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Transcribing…
            </>
          ) : (
            <>
              <Mic className="w-4 h-4" />
              Record a Note
            </>
          )}
        </button>
        {recording && (
          <span className="text-xs text-red-300 flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
            Recording — hit stop when done
          </span>
        )}
      </div>

      {errorMsg && (
        <div className="px-3 py-2 rounded-lg bg-red-900/40 border border-red-700 text-red-200 text-xs">
          {errorMsg}
        </div>
      )}

      {transcripts.length === 0 ? (
        <div className="text-xs text-zinc-600 italic">
          No transcripts yet. Record a note and it will appear here.
        </div>
      ) : (
        <div className="space-y-3">
          {transcripts.map((t) => (
            <div
              key={t.id}
              className="bg-[#0d0d0d] border border-[#262626] rounded-lg p-4"
            >
              <div className="flex items-center justify-between gap-3 mb-2">
                <div className="text-[10px] uppercase tracking-[0.15em] text-zinc-500 font-semibold">
                  {t.createdAt}
                </div>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => handleCopy(t)}
                    className="p-1.5 rounded-md text-zinc-500 hover:text-green-400 hover:bg-green-900/20 transition-colors cursor-pointer"
                    title="Copy"
                  >
                    {copiedId === t.id ? (
                      <Check className="w-3.5 h-3.5" />
                    ) : (
                      <Copy className="w-3.5 h-3.5" />
                    )}
                  </button>
                  <button
                    onClick={() => handleDelete(t.id)}
                    className="p-1.5 rounded-md text-zinc-500 hover:text-red-400 hover:bg-red-900/20 transition-colors cursor-pointer text-xs"
                    title="Delete"
                  >
                    ×
                  </button>
                </div>
              </div>
              <div className="text-sm text-zinc-200 leading-relaxed whitespace-pre-wrap">
                {t.text}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
