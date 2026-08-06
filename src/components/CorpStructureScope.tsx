"use client";

import { useCallback, useEffect, useMemo, useState, useSyncExternalStore } from "react";

// ============================================================================
// /corp-structure-scope — WholEarth Founder Alignment review page
// ----------------------------------------------------------------------------
// Standalone page. Shares nothing with the proposal/plan components on
// purpose: no proposal-data, no rick-messages, no shared plan fallbacks.
// Content mirrors the "WholEarth — Founder Alignment" deck (Working Draft 0.1).
//
// Every section captures a response (Aligned / Discuss / Change + note) and
// the page relays the full selection set back to Pete via a prefilled email
// and a copyable summary. Responses persist in localStorage per responder.
// ============================================================================

// Where "Send to Pete" delivers responses. Confirm this is the address you
// want clients replying to before sharing the URL.
const RELAY_EMAIL = "dtspdigitalmedia@gmail.com";
const STORAGE_KEY = "wea_corp_structure_scope_v1";

type Stance = "aligned" | "discuss" | "change";

interface SectionDef {
  id: string;
  num: string;
  title: string;
  tagline: string;
  body: React.ReactNode;
}

interface SectionResponse {
  stance: Stance | null;
  note: string;
}

const STANCE_LABELS: Record<Stance, string> = {
  aligned: "Aligned — approve as drafted",
  discuss: "Discuss at founder meeting",
  change: "Change requested",
};

const STANCE_SHORT: Record<Stance, string> = {
  aligned: "Aligned",
  discuss: "Discuss",
  change: "Change requested",
};

const OPEN_QUESTION_TOPICS = [
  "Equity",
  "Revenue participation",
  "Compensation",
  "Board structure",
  "Voting rights",
  "Investment",
  "Future subsidiaries",
  "Attorney review items",
];

const RESPONDERS = ["Alanson", "Renée", "Pete"] as const;

// ---------------------------------------------------------------------------
// Small presentational helpers
// ---------------------------------------------------------------------------

function Pill({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-block rounded-full border border-card-border bg-card-bg px-3 py-1 text-sm text-foreground/90">
      {children}
    </span>
  );
}

function List({ items }: { items: string[] }) {
  return (
    <ul className="space-y-2">
      {items.map((item) => (
        <li key={item} className="flex gap-2.5 text-[15px] leading-relaxed text-foreground/85">
          <span className="mt-[9px] h-1.5 w-1.5 shrink-0 rounded-full bg-accent" />
          <span>{item}</span>
        </li>
      ))}
    </ul>
  );
}

// ---------------------------------------------------------------------------
// Section content (mirrors the Founder Alignment deck, Draft 0.1)
// ---------------------------------------------------------------------------

const SECTIONS: SectionDef[] = [
  {
    id: "purpose",
    num: "00",
    title: "Purpose of This Document",
    tagline: "The blueprint between the business plan and the legal documents",
    body: (
      <div className="space-y-4">
        <p className="text-[15px] leading-relaxed text-foreground/85">
          This is the operational blueprint for{" "}
          <strong className="text-foreground">WholEarth Holdings</strong>,{" "}
          <strong className="text-foreground">WholEarth Industries</strong>, and{" "}
          <strong className="text-foreground">WholEarth Records</strong>. Today it exists as a
          role outline; the proposal is to expand it into a full Founder Alignment Document —
          roughly 20–40 pages.
        </p>
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="rounded-lg border border-card-border bg-card-bg p-4">
            <p className="mb-1 text-sm font-semibold text-accent">What it is not</p>
            <p className="text-sm leading-relaxed text-foreground/80">
              Not a legal agreement. It captures the founders&apos; intent before attorneys
              prepare the formal corporate documents.
            </p>
          </div>
          <div className="rounded-lg border border-card-border bg-card-bg p-4">
            <p className="mb-1 text-sm font-semibold text-accent">What it covers</p>
            <p className="text-sm leading-relaxed text-foreground/80">
              Governance, responsibilities, decision-making, and how the companies function
              together — building on the existing filing briefs.
            </p>
          </div>
        </div>
        <p className="text-sm leading-relaxed text-muted">
          Why bother: it answers nearly every question an attorney will ask before drafting the
          operating agreements, and it gives every founder a chance to react to ideas while
          they&apos;re still easy to change.
        </p>
      </div>
    ),
  },
  {
    id: "guiding-principles",
    num: "01",
    title: "Guiding Principles",
    tagline: "Not mission statements — operating principles",
    body: (
      <div className="space-y-4">
        <List
          items={[
            "Build systems before adding people.",
            "Automate repetitive work whenever practical.",
            "People own outcomes; systems handle repetition.",
            "Authority should match responsibility.",
            "Decisions should be documented, not assumed.",
            "Companies should scale without depending on a single individual.",
            "AI augments people — it does not replace executive accountability.",
          ]}
        />
        <p className="text-sm text-muted">
          These become the lens through which future decisions are made.
        </p>
      </div>
    ),
  },
  {
    id: "corporate-structure",
    num: "02",
    title: "Corporate Structure",
    tagline: "A visual organizational chart with the reasoning attached",
    body: (
      <div className="space-y-4">
        <div className="flex flex-col items-center gap-2 rounded-lg border border-card-border bg-card-bg p-5">
          <div className="rounded-md border border-accent/50 bg-accent/10 px-5 py-2 text-sm font-semibold text-accent">
            WholEarth Holdings
          </div>
          <div className="h-4 w-px bg-card-border" />
          <div className="flex flex-wrap justify-center gap-3">
            <div className="rounded-md border border-card-border bg-background px-5 py-2 text-sm font-medium">
              WholEarth Industries
            </div>
            <div className="rounded-md border border-card-border bg-background px-5 py-2 text-sm font-medium">
              WholEarth Records
            </div>
          </div>
        </div>
        <p className="text-sm font-semibold text-foreground/90">The chart has to explain:</p>
        <List
          items={[
            "Why Holdings exists.",
            "Why Industries and Records remain separate.",
            "How intellectual property flows.",
            "How branding is shared.",
            "Why each company has its own operational identity.",
          ]}
        />
        <p className="text-sm text-muted">
          The filing briefs stay the source for the business models — this references them
          rather than rewriting them.
        </p>
      </div>
    ),
  },
  {
    id: "founders",
    num: "03",
    title: "Founders",
    tagline: "Alanson · Renée · Pete — several pages each, not just titles",
    body: (
      <div className="space-y-4">
        <p className="text-[15px] leading-relaxed text-foreground/85">
          Each founder gets several pages covering:
        </p>
        <List
          items={[
            "Why they're involved.",
            "What they're bringing to the company.",
            "What decisions they own.",
            "What decisions they don't own.",
            "What success looks like in their role.",
            "What support they can expect from the other founders.",
          ]}
        />
        <p className="text-sm text-muted">That removes ambiguity later.</p>
      </div>
    ),
  },
  {
    id: "department-ownership",
    num: "04",
    title: "Department Ownership",
    tagline: "Instead of people, think departments",
    body: (
      <div className="space-y-4">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[420px] text-left text-sm">
            <thead>
              <tr className="border-b border-card-border text-muted">
                <th className="py-2 pr-4 font-medium">Department</th>
                <th className="py-2 pr-4 font-medium">Owner</th>
                <th className="py-2 font-medium">Scope</th>
              </tr>
            </thead>
            <tbody className="text-foreground/85">
              <tr className="border-b border-card-border/60">
                <td className="py-2.5 pr-4 font-medium text-foreground">Executive Leadership</td>
                <td className="py-2.5 pr-4">Alanson</td>
                <td className="py-2.5">Everything executive rolls up there.</td>
              </tr>
              <tr className="border-b border-card-border/60">
                <td className="py-2.5 pr-4 font-medium text-foreground">Technology</td>
                <td className="py-2.5 pr-4">Pete</td>
                <td className="py-2.5">Everything technical rolls up there.</td>
              </tr>
              <tr>
                <td className="py-2.5 pr-4 font-medium text-foreground">Artist Success</td>
                <td className="py-2.5 pr-4">Renée</td>
                <td className="py-2.5">Everything artist-facing rolls up there.</td>
              </tr>
            </tbody>
          </table>
        </div>
        <p className="text-sm text-muted">
          This scales much better, because departments can grow — a named person cannot.
        </p>
      </div>
    ),
  },
  {
    id: "decision-matrix",
    num: "05",
    title: "Decision Matrix",
    tagline: "Four roles per decision — process instead of arguments",
    body: (
      <div className="space-y-4">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {["Who proposes it?", "Who reviews it?", "Who approves it?", "Who executes it?"].map(
            (q, i) => (
              <div key={q} className="rounded-lg border border-card-border bg-card-bg p-4">
                <p className="mb-1 font-mono text-xs text-accent">0{i + 1}</p>
                <p className="text-sm font-medium text-foreground/90">{q}</p>
              </div>
            ),
          )}
        </div>
        <p className="text-sm font-semibold text-foreground/90">Applied to every major decision:</p>
        <div className="flex flex-wrap gap-2">
          {[
            "Hiring",
            "New AI models",
            "Financial commitments",
            "Marketing campaigns",
            "Platform features",
            "Artist disputes",
            "Legal issues",
            "Infrastructure",
            "Brand partnerships",
          ].map((d) => (
            <Pill key={d}>{d}</Pill>
          ))}
        </div>
      </div>
    ),
  },
  {
    id: "role-descriptions",
    num: "06",
    title: "Detailed Role Descriptions",
    tagline: "Scope in depth — including explicit exclusions",
    body: (
      <div className="space-y-4">
        <p className="text-[15px] leading-relaxed text-foreground/85">
          Example — Technology. For Pete, not just &ldquo;platform architecture&rdquo;: three or
          four pages describing the full domain.
        </p>
        <div className="flex flex-wrap gap-2">
          {[
            "Architecture",
            "AI",
            "Infrastructure",
            "Automation",
            "Marketing systems",
            "Engineering standards",
            "Security",
            "Vendor evaluation",
            "Analytics",
            "Technology procurement",
            "Growth engineering",
            "Innovation",
            "Research",
            "Platform evolution",
            "Explicit exclusions",
          ].map((s) => (
            <Pill key={s}>{s}</Pill>
          ))}
        </div>
        <p className="text-sm text-muted">Same level of detail for Alanson and Renée.</p>
      </div>
    ),
  },
  {
    id: "cross-department",
    num: "07",
    title: "Cross-Department Collaboration",
    tagline: "Real handoffs, written down — this prevents silos",
    body: (
      <div className="grid gap-3 sm:grid-cols-3">
        {[
          { need: "Marketing needs AI support.", q: "Who owns what?" },
          { need: "Renée needs new onboarding.", q: "Who builds it?" },
          { need: "Alanson wants analytics.", q: "Who produces them?" },
        ].map(({ need, q }) => (
          <div key={need} className="rounded-lg border border-card-border bg-card-bg p-4">
            <p className="text-sm font-medium text-foreground/90">{need}</p>
            <p className="mt-1 text-sm text-accent">{q}</p>
          </div>
        ))}
      </div>
    ),
  },
  {
    id: "delegation",
    num: "08",
    title: "Delegation Philosophy",
    tagline: "Delegation is part of the executive role, not avoidance of it",
    body: (
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="rounded-lg border border-card-border bg-card-bg p-4">
          <p className="mb-1 text-sm font-semibold text-accent">Alanson</p>
          <p className="text-sm leading-relaxed text-foreground/80">
            Executive leadership includes the authority to delegate operational ownership while
            retaining final accountability. That frames delegation as part of the role — not as
            avoiding responsibility.
          </p>
        </div>
        <div className="rounded-lg border border-card-border bg-card-bg p-4">
          <p className="mb-1 text-sm font-semibold text-accent">Renée</p>
          <p className="text-sm leading-relaxed text-foreground/80">
            Not every community and policy task — a coherent domain she can own, with room to
            build processes and ask for technical support when needed.
          </p>
        </div>
      </div>
    ),
  },
  {
    id: "automation-roadmap",
    num: "09",
    title: "Future Automation Roadmap",
    tagline: "Opportunities — not commitments",
    body: (
      <div className="space-y-4">
        <p className="text-[15px] leading-relaxed text-foreground/85">
          &ldquo;These are opportunities&rdquo; — not &ldquo;we&apos;re building all
          this.&rdquo; Candidate areas:
        </p>
        <div className="flex flex-wrap gap-2">
          {[
            "Executive",
            "Marketing",
            "Artist Success",
            "Operations",
            "Support",
            "Legal workflow",
            "Finance",
            "Community",
          ].map((a) => (
            <Pill key={a}>{a}</Pill>
          ))}
        </div>
        <p className="text-sm text-muted">
          The document then notes which are realistic candidates for AI assistance on the
          current stack — each requiring its own planning, prioritization, and development
          effort.
        </p>
      </div>
    ),
  },
  {
    id: "ai-organization",
    num: "10",
    title: "AI Organization",
    tagline: "A strategic differentiator — document future AI departments",
    body: (
      <div className="space-y-4">
        <p className="text-[15px] leading-relaxed text-foreground/85">
          Instead of only documenting people, document the future AI departments:
        </p>
        <div className="flex flex-wrap gap-2">
          {[
            "Executive AI",
            "Marketing AI",
            "Artist Relations AI",
            "Support AI",
            "Knowledge AI",
            "Documentation AI",
            "Analytics AI",
            "Operations AI",
            "Compliance Assistant",
          ].map((a) => (
            <Pill key={a}>{a}</Pill>
          ))}
        </div>
        <p className="text-sm text-muted">
          Not because they&apos;re being built today, but because the company is intentionally
          designing toward that future.
        </p>
      </div>
    ),
  },
  {
    id: "growth-plan",
    num: "11",
    title: "Growth Plan",
    tagline: "What happens when…",
    body: (
      <div className="space-y-4">
        <div className="flex flex-wrap gap-2">
          {["10 artists", "100 artists", "1,000 artists", "50 employees", "100 employees"].map(
            (t) => (
              <Pill key={t}>{t}</Pill>
            ),
          )}
        </div>
        <p className="text-sm font-semibold text-foreground/90">
          At each threshold, responsibilities have to change. Say now how:
        </p>
        <List
          items={[
            "How do responsibilities evolve?",
            "Who hires first?",
            "What gets delegated?",
            "What gets automated?",
          ]}
        />
      </div>
    ),
  },
];

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

interface SavedState {
  responder: string;
  responses: Record<string, SectionResponse>;
  openQuestionFlags: Record<string, boolean>;
  openQuestionNote: string;
}

// Restore any in-progress review from this browser. Window-guarded so the
// same initializers are safe during SSR.
function loadSaved(): SavedState {
  const empty: SavedState = {
    responder: "",
    responses: {},
    openQuestionFlags: {},
    openQuestionNote: "",
  };
  if (typeof window === "undefined") return empty;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return empty;
    const saved = JSON.parse(raw);
    if (!saved || typeof saved !== "object") return empty;
    return {
      responder: typeof saved.responder === "string" ? saved.responder : "",
      responses:
        saved.responses && typeof saved.responses === "object" ? saved.responses : {},
      openQuestionFlags:
        saved.openQuestionFlags && typeof saved.openQuestionFlags === "object"
          ? saved.openQuestionFlags
          : {},
      openQuestionNote:
        typeof saved.openQuestionNote === "string" ? saved.openQuestionNote : "",
    };
  } catch {
    return empty;
  }
}

const emptySubscribe = () => () => {};

export default function CorpStructureScope() {
  // false on the server and during hydration's first render, true after —
  // lets the lazy localStorage initializers below diverge from SSR output
  // without a hydration mismatch (the gate renders null until client-side).
  const isClient = useSyncExternalStore(
    emptySubscribe,
    () => true,
    () => false,
  );

  const [responder, setResponder] = useState<string>(() => loadSaved().responder);
  const [responses, setResponses] = useState<Record<string, SectionResponse>>(
    () => loadSaved().responses,
  );
  const [openQuestionFlags, setOpenQuestionFlags] = useState<Record<string, boolean>>(
    () => loadSaved().openQuestionFlags,
  );
  const [openQuestionNote, setOpenQuestionNote] = useState(
    () => loadSaved().openQuestionNote,
  );
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    try {
      window.localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({ responder, responses, openQuestionFlags, openQuestionNote }),
      );
    } catch {
      // Storage full/blocked — selections still work for this visit.
    }
  }, [responder, responses, openQuestionFlags, openQuestionNote]);

  const setStance = useCallback((id: string, stance: Stance) => {
    setResponses((prev) => ({
      ...prev,
      [id]: {
        note: prev[id]?.note ?? "",
        // Tapping the active stance clears it.
        stance: prev[id]?.stance === stance ? null : stance,
      },
    }));
  }, []);

  const setNote = useCallback((id: string, note: string) => {
    setResponses((prev) => ({
      ...prev,
      [id]: { stance: prev[id]?.stance ?? null, note },
    }));
  }, []);

  const answeredCount = useMemo(
    () => SECTIONS.filter((s) => responses[s.id]?.stance).length,
    [responses],
  );

  const flaggedTopics = useMemo(
    () => OPEN_QUESTION_TOPICS.filter((t) => openQuestionFlags[t]),
    [openQuestionFlags],
  );

  const buildSummary = useCallback(() => {
    const lines: string[] = [];
    lines.push("WholEarth Founder Alignment — Section Responses");
    lines.push(`Responding founder: ${responder || "(not selected)"}`);
    lines.push(`Sections answered: ${answeredCount} of ${SECTIONS.length}`);
    lines.push("");
    for (const s of SECTIONS) {
      const r = responses[s.id];
      lines.push(`${s.num} ${s.title}`);
      lines.push(`   Response: ${r?.stance ? STANCE_LABELS[r.stance] : "No response"}`);
      if (r?.note?.trim()) lines.push(`   Note: ${r.note.trim()}`);
      lines.push("");
    }
    lines.push("12 Open Questions — flagged for the founder meeting agenda:");
    lines.push(
      flaggedTopics.length ? `   ${flaggedTopics.join(", ")}` : "   (none flagged)",
    );
    if (openQuestionNote.trim()) lines.push(`   Note: ${openQuestionNote.trim()}`);
    return lines.join("\n");
  }, [responder, responses, answeredCount, flaggedTopics, openQuestionNote]);

  const handleEmail = useCallback(() => {
    const subject = `Founder Alignment responses — ${responder || "unnamed responder"}`;
    const body = buildSummary();
    // Some mail clients truncate long mailto URLs (~2k chars). Copy the full
    // summary first so the responder can paste it if the email arrives short.
    navigator.clipboard?.writeText(body).catch(() => {});
    window.location.href = `mailto:${RELAY_EMAIL}?subject=${encodeURIComponent(
      subject,
    )}&body=${encodeURIComponent(body)}`;
  }, [responder, buildSummary]);

  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(buildSummary());
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard blocked — the email path still works.
    }
  }, [buildSummary]);

  // Render nothing until client-side so restored localStorage selections
  // never mismatch the server-rendered markup.
  if (!isClient) return null;

  return (
    <main className="mx-auto max-w-4xl px-4 py-10 sm:px-6 lg:py-14">
      {/* ------------------------------------------------------------ Hero */}
      <header className="mb-10">
        <p className="mb-3 font-mono text-xs uppercase tracking-widest text-accent">
          Working Draft 0.1 · Not a legal document
        </p>
        <h1 className="text-3xl font-bold leading-tight sm:text-4xl">
          WholEarth Founder Alignment
          <span className="block text-foreground/60">
            &amp; Corporate Governance Review
          </span>
        </h1>
        <p className="mt-4 max-w-2xl text-[15px] leading-relaxed text-foreground/80">
          The operational blueprint that sits between the business plan and the legal
          documents. Prepared for <strong className="text-foreground">Alanson</strong>,{" "}
          <strong className="text-foreground">Renée</strong>, and{" "}
          <strong className="text-foreground">Pete</strong> — covering WholEarth Holdings,
          WholEarth Industries, and WholEarth Records.
        </p>
        <p className="mt-3 max-w-2xl text-sm leading-relaxed text-muted">
          Read each section, pick a response, add notes where you disagree, and hit{" "}
          <span className="text-accent">Send responses</span> at the bottom. Everything here is
          easy to change right now — that&apos;s the point of reviewing it before the attorneys
          get involved.
        </p>
      </header>

      {/* --------------------------------------------------- Responder pick */}
      <div className="mb-10 rounded-xl border border-card-border bg-card-bg p-5">
        <p className="mb-3 text-sm font-semibold text-foreground/90">Who&apos;s responding?</p>
        <div className="flex flex-wrap gap-2">
          {RESPONDERS.map((name) => (
            <button
              key={name}
              type="button"
              onClick={() => setResponder(name)}
              className={`rounded-full border px-4 py-1.5 text-sm font-medium transition-colors ${
                responder === name
                  ? "border-accent bg-accent/15 text-accent"
                  : "border-card-border bg-background text-foreground/80 hover:border-accent/50"
              }`}
            >
              {name}
            </button>
          ))}
        </div>
      </div>

      {/* --------------------------------------------------------- Sections */}
      <div className="space-y-8">
        {SECTIONS.map((section) => {
          const r = responses[section.id];
          return (
            <section
              key={section.id}
              id={section.id}
              className="rounded-xl border border-card-border bg-card-bg/50 p-5 sm:p-6"
            >
              <div className="mb-4 flex items-baseline gap-3">
                <span className="font-mono text-sm text-accent">{section.num}</span>
                <div>
                  <h2 className="text-xl font-semibold">{section.title}</h2>
                  <p className="text-sm text-muted">{section.tagline}</p>
                </div>
              </div>

              {section.body}

              {/* Response controls */}
              <div className="mt-5 border-t border-card-border pt-4">
                <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted">
                  Your response
                </p>
                <div className="flex flex-wrap gap-2">
                  {(Object.keys(STANCE_LABELS) as Stance[]).map((stance) => (
                    <button
                      key={stance}
                      type="button"
                      onClick={() => setStance(section.id, stance)}
                      className={`rounded-md border px-3 py-1.5 text-sm transition-colors ${
                        r?.stance === stance
                          ? stance === "aligned"
                            ? "border-accent bg-accent/15 text-accent"
                            : stance === "discuss"
                              ? "border-amber-500 bg-amber-500/15 text-amber-400"
                              : "border-red-500 bg-red-500/15 text-red-400"
                          : "border-card-border bg-background text-foreground/75 hover:border-foreground/40"
                      }`}
                    >
                      {STANCE_LABELS[stance]}
                    </button>
                  ))}
                </div>
                {(r?.stance === "discuss" || r?.stance === "change" || r?.note) && (
                  <textarea
                    value={r?.note ?? ""}
                    onChange={(e) => setNote(section.id, e.target.value)}
                    placeholder="What should change, or what needs discussing?"
                    rows={2}
                    className="mt-3 w-full rounded-md border border-card-border bg-background p-3 text-sm text-foreground placeholder:text-muted focus:border-accent focus:outline-none"
                  />
                )}
              </div>
            </section>
          );
        })}

        {/* ----------------------------------------------- Open questions */}
        <section
          id="open-questions"
          className="rounded-xl border border-card-border bg-card-bg/50 p-5 sm:p-6"
        >
          <div className="mb-4 flex items-baseline gap-3">
            <span className="font-mono text-sm text-accent">12</span>
            <div>
              <h2 className="text-xl font-semibold">Open Questions</h2>
              <p className="text-sm text-muted">
                Agenda for the next founder meeting — instead of hiding uncertainty, list it
              </p>
            </div>
          </div>
          <p className="mb-4 text-[15px] leading-relaxed text-foreground/85">
            Flag every topic you want on the founder meeting agenda:
          </p>
          <div className="flex flex-wrap gap-2">
            {OPEN_QUESTION_TOPICS.map((topic) => (
              <button
                key={topic}
                type="button"
                onClick={() =>
                  setOpenQuestionFlags((prev) => ({ ...prev, [topic]: !prev[topic] }))
                }
                className={`rounded-md border px-3 py-1.5 text-sm transition-colors ${
                  openQuestionFlags[topic]
                    ? "border-accent bg-accent/15 text-accent"
                    : "border-card-border bg-background text-foreground/75 hover:border-foreground/40"
                }`}
              >
                {openQuestionFlags[topic] ? "✓ " : ""}
                {topic}
              </button>
            ))}
          </div>
          <textarea
            value={openQuestionNote}
            onChange={(e) => setOpenQuestionNote(e.target.value)}
            placeholder="Anything else that belongs on the agenda?"
            rows={2}
            className="mt-4 w-full rounded-md border border-card-border bg-background p-3 text-sm text-foreground placeholder:text-muted focus:border-accent focus:outline-none"
          />
        </section>

        {/* ------------------------------------------------ Recommendation */}
        <section className="rounded-xl border border-accent/40 bg-accent/5 p-5 sm:p-6">
          <h2 className="mb-2 text-xl font-semibold text-accent">One Recommendation</h2>
          <p className="text-[15px] leading-relaxed text-foreground/85">
            Write it like an internal operating manual for the three founders. Not a legal
            document, and not a business plan. Attorneys use it as the source material for the
            operating agreements — and new leaders read it later to understand not just what the
            structure is, but why it was designed that way.{" "}
            <strong className="text-foreground">30–50 pages, polished</strong> — given the
            thought already put into the platform.
          </p>
        </section>
      </div>

      {/* ------------------------------------------------- Summary + send */}
      <section className="mt-10 rounded-xl border border-card-border bg-card-bg p-5 sm:p-6">
        <h2 className="mb-1 text-xl font-semibold">Your Selections</h2>
        <p className="mb-4 text-sm text-muted">
          {answeredCount} of {SECTIONS.length} sections answered
          {responder ? ` · responding as ${responder}` : " · pick your name above"}
        </p>

        <ul className="mb-5 space-y-1.5">
          {SECTIONS.map((s) => {
            const r = responses[s.id];
            return (
              <li key={s.id} className="flex items-baseline justify-between gap-4 text-sm">
                <a href={`#${s.id}`} className="text-foreground/80 hover:text-accent">
                  {s.num} {s.title}
                </a>
                <span
                  className={
                    r?.stance === "aligned"
                      ? "shrink-0 text-accent"
                      : r?.stance === "discuss"
                        ? "shrink-0 text-amber-400"
                        : r?.stance === "change"
                          ? "shrink-0 text-red-400"
                          : "shrink-0 text-muted"
                  }
                >
                  {r?.stance ? STANCE_SHORT[r.stance] : "—"}
                </span>
              </li>
            );
          })}
          <li className="flex items-baseline justify-between gap-4 text-sm">
            <a href="#open-questions" className="text-foreground/80 hover:text-accent">
              12 Open Questions
            </a>
            <span className={flaggedTopics.length ? "shrink-0 text-accent" : "shrink-0 text-muted"}>
              {flaggedTopics.length ? `${flaggedTopics.length} flagged` : "—"}
            </span>
          </li>
        </ul>

        <div className="flex flex-wrap gap-3">
          <button
            type="button"
            onClick={handleEmail}
            className="rounded-md bg-accent px-5 py-2.5 text-sm font-semibold text-background transition-colors hover:bg-accent-dim"
          >
            Send responses to Pete
          </button>
          <button
            type="button"
            onClick={handleCopy}
            className="rounded-md border border-card-border bg-background px-5 py-2.5 text-sm font-medium text-foreground/85 transition-colors hover:border-accent/50"
          >
            {copied ? "Copied ✓" : "Copy summary"}
          </button>
        </div>
        <p className="mt-3 text-xs text-muted">
          &ldquo;Send responses&rdquo; opens your email app with everything pre-filled — just
          hit send. The summary is also copied to your clipboard, so if the email looks cut
          short, paste it in. Your selections stay saved in this browser.
        </p>
      </section>
    </main>
  );
}
