// Plan A  = Full-stack build with 3D Interactive Site (DTSP-AI builds custom 3D frontend + intelligence layer)
// Plan B  = Full-stack build with 2D React web site (DTSP-AI builds custom 2D frontend + intelligence layer)
// Plan C  = Intelligence layer only (GoDaddy handles the storefront, we handle the backend)
// Plan CA = Plan C Addendum — same scope as Plan C, restructured weekly payment plan.
//           Original 8-biweekly structure replaced 2026-04-28 with weekly Wednesday cadence.
//
// All plans run a 12-week project term with 6 biweekly REVIEWS (the cadence Pete and
// Lance meet on). Plan CA's PAYMENT cadence is now weekly (separate from review cadence).
// Math:
//   Plan A:  $5,400 at signing + (6 × $2,000) = $5,400 + $12,000 = $17,400
//   Plan B:  $4,400 at signing + (6 × $2,000) = $4,400 + $12,000 = $16,400
//   Plan C:  $3,600 at signing + (6 × $1,800) = $3,600 + $10,800 = $14,400
//   Plan CA: $1,800 deposit (paid 2026-04-23) + 17 × $900 weekly Wednesdays
//            (Apr 29 → Aug 19 2026) = $1,800 + $15,300 = $17,100 total
//   Plan AA: $1,800 deposit (paid 2026-04-23) + 15 × $900 weekly Wednesdays
//            (Apr 29 → Aug 5 2026) = $1,800 + $13,500 = $15,300 total
//            16-week project term, 8 biweekly reviews, same deliverables as
//            Plan A (just spread across the longer term). Pete pre-signed
//            for print-to-PDF.

export type PlanId = "A" | "AA" | "B" | "C" | "CA" | "CA2" | "A3";

export interface ScheduledPayment {
  /** Human-readable date, e.g. "Wed, Apr 23 2026". */
  dateLabel: string;
  /** ISO date for internal use, e.g. "2026-04-23". */
  isoDate: string;
  /** Display amount, e.g. "$1,800". */
  amount: string;
  /** Optional tag rendered next to the row, e.g. "Today", "Biweekly". */
  tag?: string;
  /** True if this payment has been received. Drives "PAID" badge. */
  paid?: boolean;
  /** Human-readable date the payment was received, e.g. "Apr 23 2026". */
  paidOn?: string;
}

export interface ProposalMeta {
  preparedFor: string;
  preparedBy: string;
  contact: string;
  projectTerm: string;
  investmentAtSigning: string;
  perMilestone: string;
  milestoneCount: number;
  totalValue: string;
  date: string;
  clientName: string;
  paypalHandle: string;
  paypalInvoiceUrl: string;
  zelleEmail: string;
  /** Optional full payment schedule. If present, renderers show this instead
   *  of the default "deposit + N milestones" layout. */
  paymentSchedule?: ScheduledPayment[];
  /** Optional "valid only if paid by" banner copy. */
  conditionalBanner?: string;
  /** Optional override for the schedule headline — the big bold value rendered
   *  left of the "=" in the investment box. Defaults to "{count} × {perMilestone}". */
  scheduleHeadline?: string;
  /** Optional override for the schedule cadence sub-label under the headline.
   *  Defaults to "Biweekly payments". */
  scheduleCadenceLabel?: string;
  /** Optional override for the footnote under the schedule table.
   *  Defaults to the Plan C "Same 12-week scope" line. */
  scheduleFootnote?: string;
  /** Optional plain-text legal terms summary. When set, SignaturePanel renders
   *  this in the agreement checkbox instead of the hardcoded "12 weeks / 6
   *  milestones / biweekly payments" sentence — required for any plan whose
   *  term, cadence, or payment structure is not the Plan C default. */
  termsSummary?: string;
  /** Optional post-launch maintenance plan. Rendered as its own defined box in
   *  the proposal and written into the signed PDF — states what maintenance
   *  covers and that new development is scoped + priced separately. */
  maintenance?: {
    headline: string;
    intro: string;
    covers: string[];
    excluded: string;
  };
  /** Exact legal identity of the provider used in contract text and the
   *  signed PDF's Parties section. Defaults to "DTSP-AI Technologies". */
  providerLegalName?: string;
  /** Date the provider pre-signed THIS plan. Defaults to the original
   *  Plan C signing date ("April 10, 2026") for legacy plans. */
  providerSignedDate?: string;
  /** Explicit balance reconciliation ledger — contract total, every
   *  payment/credit applied, remaining balance, and prior-plan amounts
   *  separately identified. INTERNAL: rendered only in the client portal
   *  (behind login), never on the public proposal page or the signed PDF. */
  balanceLedger?: LedgerRow[];
  /** When true, payment status (PAID badges, credits, balances) is
   *  internal-only: the public proposal page and signed PDF show the plain
   *  contract schedule; status and the balance ledger render only in the
   *  client portal. */
  paymentStatusInternal?: boolean;
}

export interface ComparisonRow {
  capability: string;
  godaddy: string;
  dtsp: string;
}

export interface Phase {
  number: number;
  title: string;
  weeks: string;
  /** What DTSP-AI ships this phase. */
  deliverables: string[];
  /** What the client needs to provide for this phase to execute. */
  requirements?: string[];
  /** Optional — work explicitly NOT included in this phase. Rendered as a
   *  "Not included" list so scope creep is re-quoted, never absorbed. */
  exclusions?: string[];
  milestone: string;
}

export interface ScopeSheet {
  /** Application name, e.g. "WholEarth Industries — Marketplace Platform". */
  title: string;
  /** One-line stack/topology descriptor under the title. */
  subtitle?: string;
  /** Line items delivered — rendered with checked boxes. */
  done: string[];
  /** Line items still to deliver — rendered with unchecked boxes. */
  remaining: string[];
  /** Explicit scope boundary — what this application owns and what it
   *  explicitly does NOT own. Rendered as a distinct note on the sheet and
   *  in the signed PDF so the two applications can never be conflated. */
  boundary?: string;
}

export interface LedgerRow {
  label: string;
  value: string;
  /** Secondary explanation line under the row. */
  sub?: string;
  /** Visually emphasized row (totals / remaining balance). */
  emphasis?: boolean;
}

export interface Plan {
  id: PlanId;
  name: string;
  tagline: string;
  heroTitle: string;
  heroSubtitle: string;
  /** Optional — when set, the hero and the PDF "Scope" section render these
   *  as bullets instead of the heroSubtitle paragraph. */
  heroBullets?: string[];
  meta: ProposalMeta;
  comparisonTable: ComparisonRow[];
  phases: Phase[];
  comparisonHeading: string;
  comparisonColumnLabel: string;
  showParallelSection: boolean;
  /** Optional override for the comparison-section intro paragraph.
   *  Falls back to the Plan C "GoDaddy builds websites" copy. */
  comparisonIntro?: string;
  /** Optional override for the note box below the comparison table. */
  comparisonNote?: string;
  /** Optional override for the architecture-section intro paragraph. */
  architectureNote?: string;
  /** When true, the architecture diagram's top node renders the storefront
   *  as a DTSP-AI build (GoDaddy shown as host only), not a GoDaddy storefront. */
  frontendBuiltByDtsp?: boolean;
  /** Optional per-application scope-of-work sheets. When present, the
   *  proposal page and the signed PDF render these (one card per
   *  application, done items checked / remaining items unchecked) INSTEAD
   *  of the milestone phase grid. `phases` stays as data for the client
   *  portal checklist. */
  scopeSheets?: ScopeSheet[];
  /** Optional fine-print legal section rendered above the signature panel
   *  and written into the signed PDF. */
  finePrint?: {
    title: string;
    paragraphs: string[];
  };
  /** Hide the generic SEO Engine section (plans whose scope sheets already
   *  state the real search/AEO work). */
  hideSeoSection?: boolean;
  /** Hide the generic architecture diagram section. */
  hideArchitectureSection?: boolean;
  /** Signature-section subheading generated per plan — never a hardcoded
   *  project name. States exactly what scope the signer is accepting. */
  signatureHeading?: string;
  /** Version identifier for this plan's terms — embedded in the acceptance
   *  record and the signed PDF footer alongside the document hash. */
  termsVersion?: string;
}

const sharedMeta = {
  preparedFor: "Whole Earth Industries",
  preparedBy: "DTSP-AI Technologies",
  contact: "combatperformfit@gmail.com",
  date: "April 2026",
  clientName: "Alanson Charles",
  paypalHandle: "dtspdigitalmedia@gmail.com",
  paypalInvoiceUrl: "https://www.paypal.com/invoice/p/#RXF9STZ87RGHJWA8",
  zelleEmail: "combatperformfit@gmail.com",
};

// ---------- PLAN A: Full-Stack Build with 3D Interactive Site ----------
export const planA: Plan = {
  id: "A",
  name: "Plan A",
  tagline: "3D Interactive Site — We Build The Whole Thing",
  heroTitle: "Artist Marketplace Platform — 3D Interactive",
  heroSubtitle:
    "End-to-end build. Custom 3D interactive storefront with immersive product experiences, checkout, and admin dashboard — on top of the full AI-powered marketplace infrastructure. You own every pixel, every interaction, and every service. No GoDaddy middleman.",
  meta: {
    ...sharedMeta,
    projectTerm: "12 Weeks — 6 Milestones",
    investmentAtSigning: "$5,400",
    perMilestone: "$2,000",
    milestoneCount: 6,
    totalValue: "$17,400",
  },
  comparisonHeading: "What A Platform Host Gives You. What We Build Instead.",
  comparisonColumnLabel: "Platform Host",
  showParallelSection: false,
  comparisonTable: [
    {
      capability: "Public storefront",
      godaddy: "Template-locked, rented",
      dtsp: "3D interactive site — you own the code",
    },
    {
      capability: "Checkout & cart UX",
      godaddy: "Generic, no artist context",
      dtsp: "3D interactive — artist-aware, immersive end-to-end",
    },
    {
      capability: "Multi-vendor marketplace",
      godaddy: "No — single account only",
      dtsp: "Yes — core architecture",
    },
    {
      capability: "Artist consent + e-sign",
      godaddy: "No mechanism exists",
      dtsp: "Yes — full pipeline",
    },
    {
      capability: "Admin + artist dashboards",
      godaddy: "Basic store admin only",
      dtsp: "3D interactive role-based dashboards",
    },
    {
      capability: "Etsy / Shopify ingestion",
      godaddy: "Syncs TO those, not FROM them",
      dtsp: "Yes — OAuth pull, normalized",
    },
    {
      capability: "AI listing enhancement",
      godaddy: "Template descriptions only",
      dtsp: "Yes — Claude Sonnet agent",
    },
    {
      capability: "80/20 split payouts",
      godaddy: "No — one bank account only",
      dtsp: "Yes — Stripe Connect, automatic",
    },
    {
      capability: "SEO content engine",
      godaddy: "Basic meta tools",
      dtsp: "Yes — thousands of articles",
    },
    {
      capability: "Domain authority building",
      godaddy: "Manual — slow",
      dtsp: "Yes — automated at scale",
    },
    {
      capability: "CRM sync",
      godaddy: "No",
      dtsp: "Yes — GoHighLevel via Supervisor",
    },
    {
      capability: "You own everything",
      godaddy: "No — you rent the platform",
      dtsp: "Yes — source code, servers, data",
    },
  ],
  phases: [
    {
      number: 1,
      title: "Foundation & 3D Interactive Scaffolding",
      weeks: "Weeks 1–2",
      deliverables: [
        "Database schema design & deployment",
        "Auth, roles & tenant scaffolding",
        "3D interactive site scaffolding + design system",
        "Artist consent pipeline with e-sign",
      ],
      milestone: "$2,000",
    },
    {
      number: 2,
      title: "3D Storefront & SEO Infrastructure",
      weeks: "Weeks 3–4",
      deliverables: [
        "3D interactive product listing pages",
        "Immersive artist profile pages",
        "SEO article generator engine",
        "Domain auth (DKIM, SPF, DMARC)",
      ],
      milestone: "$2,000",
    },
    {
      number: 3,
      title: "Cart, Checkout & Stripe Connect",
      weeks: "Weeks 5–6",
      deliverables: [
        "3D interactive cart + checkout UX",
        "Stripe Connect payout engine",
        "Order webhook testing & reconciliation",
        "Payment confirmation flows",
      ],
      milestone: "$2,000",
    },
    {
      number: 4,
      title: "Marketplace Ingestion & AI",
      weeks: "Weeks 7–8",
      deliverables: [
        "Etsy/Shopify OAuth ingestion agents",
        "AI listing enhancement (Claude Sonnet)",
        "CRM integration (GoHighLevel)",
        "Normalization pipelines",
      ],
      milestone: "$2,000",
    },
    {
      number: 5,
      title: "Dashboards & Artist Onboarding",
      weeks: "Weeks 9–10",
      deliverables: [
        "Admin console for marketplace management",
        "Artist dashboard (listings, payouts, analytics)",
        "Onboarding flow (consent → listing)",
        "Automated payout testing (80/20 split)",
      ],
      milestone: "$2,000",
    },
    {
      number: 6,
      title: "Launch & Scale",
      weeks: "Weeks 11–12",
      deliverables: [
        "Production deployment & monitoring",
        "Load testing & optimization",
        "Analytics dashboard & documentation",
        "Handoff & training session",
      ],
      milestone: "$2,000",
    },
  ],
};

// ---------- PLAN B: Full-Stack Build with 2D React Web Site ----------
export const planB: Plan = {
  id: "B",
  name: "Plan B",
  tagline: "2D Full-Stack Build — We Build The Whole Thing",
  heroTitle: "Artist Marketplace Platform — 2D Full-Stack",
  heroSubtitle:
    "End-to-end build. Custom 2D React web storefront, checkout, and admin dashboard — on top of the full AI-powered marketplace infrastructure. You own every pixel and every service. No GoDaddy middleman.",
  meta: {
    ...sharedMeta,
    projectTerm: "12 Weeks — 6 Milestones",
    investmentAtSigning: "$4,400",
    perMilestone: "$2,000",
    milestoneCount: 6,
    totalValue: "$16,400",
  },
  comparisonHeading: "What A Platform Host Gives You. What We Build Instead.",
  comparisonColumnLabel: "Platform Host",
  showParallelSection: false,
  comparisonTable: [
    {
      capability: "Public storefront",
      godaddy: "Template-locked, rented",
      dtsp: "Custom 2D React build — you own the code",
    },
    {
      capability: "Checkout & cart UX",
      godaddy: "Generic, no artist context",
      dtsp: "Custom — artist-aware, branded end-to-end",
    },
    {
      capability: "Multi-vendor marketplace",
      godaddy: "No — single account only",
      dtsp: "Yes — core architecture",
    },
    {
      capability: "Artist consent + e-sign",
      godaddy: "No mechanism exists",
      dtsp: "Yes — full pipeline",
    },
    {
      capability: "Admin + artist dashboards",
      godaddy: "Basic store admin only",
      dtsp: "Custom role-based dashboards",
    },
    {
      capability: "Etsy / Shopify ingestion",
      godaddy: "Syncs TO those, not FROM them",
      dtsp: "Yes — OAuth pull, normalized",
    },
    {
      capability: "AI listing enhancement",
      godaddy: "Template descriptions only",
      dtsp: "Yes — Claude Sonnet agent",
    },
    {
      capability: "80/20 split payouts",
      godaddy: "No — one bank account only",
      dtsp: "Yes — Stripe Connect, automatic",
    },
    {
      capability: "SEO content engine",
      godaddy: "Basic meta tools",
      dtsp: "Yes — thousands of articles",
    },
    {
      capability: "Domain authority building",
      godaddy: "Manual — slow",
      dtsp: "Yes — automated at scale",
    },
    {
      capability: "CRM sync",
      godaddy: "No",
      dtsp: "Yes — GoHighLevel via Supervisor",
    },
    {
      capability: "You own everything",
      godaddy: "No — you rent the platform",
      dtsp: "Yes — source code, servers, data",
    },
  ],
  phases: [
    {
      number: 1,
      title: "Foundation & Frontend Scaffolding",
      weeks: "Weeks 1–2",
      deliverables: [
        "Database schema design & deployment",
        "Auth, roles & tenant scaffolding",
        "React web app scaffolding + design system",
        "Artist consent pipeline with e-sign",
      ],
      milestone: "$2,000",
    },
    {
      number: 2,
      title: "Storefront & SEO Infrastructure",
      weeks: "Weeks 3–4",
      deliverables: [
        "Custom product listing pages",
        "Artist profile pages",
        "SEO article generator engine",
        "Domain auth (DKIM, SPF, DMARC)",
      ],
      milestone: "$2,000",
    },
    {
      number: 3,
      title: "Cart, Checkout & Stripe Connect",
      weeks: "Weeks 5–6",
      deliverables: [
        "Custom cart + checkout UX",
        "Stripe Connect payout engine",
        "Order webhook testing & reconciliation",
        "Payment confirmation flows",
      ],
      milestone: "$2,000",
    },
    {
      number: 4,
      title: "Marketplace Ingestion & AI",
      weeks: "Weeks 7–8",
      deliverables: [
        "Etsy/Shopify OAuth ingestion agents",
        "AI listing enhancement (Claude Sonnet)",
        "CRM integration (GoHighLevel)",
        "Normalization pipelines",
      ],
      milestone: "$2,000",
    },
    {
      number: 5,
      title: "Dashboards & Artist Onboarding",
      weeks: "Weeks 9–10",
      deliverables: [
        "Admin console for marketplace management",
        "Artist dashboard (listings, payouts, analytics)",
        "Onboarding flow (consent → listing)",
        "Automated payout testing (80/20 split)",
      ],
      milestone: "$2,000",
    },
    {
      number: 6,
      title: "Launch & Scale",
      weeks: "Weeks 11–12",
      deliverables: [
        "Production deployment & monitoring",
        "Load testing & optimization",
        "Analytics dashboard & documentation",
        "Handoff & training session",
      ],
      milestone: "$2,000",
    },
  ],
};

// ---------- PLAN C: Intelligence Layer only (GoDaddy for frontend) ----------
export const planC: Plan = {
  id: "C",
  name: "Plan C",
  tagline: "Intelligence Layer — GoDaddy Builds The Storefront",
  heroTitle: "Artist Marketplace Platform",
  heroSubtitle:
    "AI-powered marketplace infrastructure built behind your GoDaddy site — consent management, automated ingestion, split payouts, and an SEO engine that builds domain authority while the platform scales.",
  meta: {
    ...sharedMeta,
    projectTerm: "12 Weeks — 6 Milestones",
    investmentAtSigning: "$3,600",
    perMilestone: "$1,800",
    milestoneCount: 6,
    totalValue: "$14,400",
  },
  comparisonHeading: "What GoDaddy Can Do. What We Do.",
  comparisonColumnLabel: "GoDaddy",
  showParallelSection: true,
  comparisonTable: [
    {
      capability: "Public storefront",
      godaddy: "Yes — fast, well-designed",
      dtsp: "Yes — or connect to yours",
    },
    {
      capability: "Multi-vendor marketplace",
      godaddy: "No — single account only",
      dtsp: "Yes — core purpose",
    },
    {
      capability: "Artist consent + e-sign",
      godaddy: "No mechanism exists",
      dtsp: "Yes — full pipeline",
    },
    {
      capability: "Etsy / Shopify ingestion",
      godaddy: "Syncs TO those, not FROM them",
      dtsp: "Yes — OAuth pull, normalized",
    },
    {
      capability: "AI listing enhancement",
      godaddy: "Template descriptions only",
      dtsp: "Yes — Claude Sonnet agent",
    },
    {
      capability: "80/20 split payouts",
      godaddy: "No — one bank account only",
      dtsp: "Yes — Stripe Connect, automatic",
    },
    {
      capability: "SEO content engine",
      godaddy: "Basic meta tools",
      dtsp: "Yes — thousands of articles",
    },
    {
      capability: "Domain authority building",
      godaddy: "Manual — slow",
      dtsp: "Yes — automated at scale",
    },
    {
      capability: "CRM sync",
      godaddy: "No",
      dtsp: "Yes — GoHighLevel via Supervisor",
    },
    {
      capability: "You own everything",
      godaddy: "No — GoDaddy is the platform",
      dtsp: "Yes — your servers, your data",
    },
    {
      capability: "Frontend flexibility",
      godaddy: "Locked to GoDaddy ecosystem",
      dtsp: "Any frontend. Always.",
    },
  ],
  phases: [
    {
      number: 1,
      title: "Foundation",
      weeks: "Weeks 1–2",
      requirements: [
        "Confirm brand name, tagline, and color palette",
        "Primary domain name and registrar access (for DKIM/SPF setup later)",
        "List of 3–5 artist categories the marketplace will launch with",
      ],
      deliverables: [
        "Database schema design & deployment",
        "Artist consent pipeline with e-sign",
        "Auth, roles & tenant scaffolding",
      ],
      milestone: "$1,800",
    },
    {
      number: 2,
      title: "SEO & Payout Infrastructure",
      weeks: "Weeks 3–4",
      requirements: [
        "Stripe account (business) ready to connect",
        "Top 10 target buyer queries (seed keywords)",
        "Transactional email sender name / address",
      ],
      deliverables: [
        "SEO article generator engine",
        "Domain auth (DKIM, SPF, DMARC)",
        "Stripe Connect payout engine setup",
      ],
      milestone: "$1,800",
    },
    {
      number: 3,
      title: "WooCommerce Integration",
      weeks: "Weeks 5–6",
      requirements: [
        "GoDaddy admin access or WooCommerce REST API keys",
        "Confirmed product taxonomy (categories + tags)",
        "Sample product listing to validate the push pipeline",
      ],
      deliverables: [
        "WooCommerce REST API connection",
        "Product push pipeline",
        "Order webhook testing & reconciliation",
      ],
      milestone: "$1,800",
    },
    {
      number: 4,
      title: "Marketplace Ingestion & AI",
      weeks: "Weeks 7–8",
      requirements: [
        "Etsy and/or Shopify seller credentials (OAuth consent)",
        "3–5 example artist bios + style guides for AI tone reference",
      ],
      deliverables: [
        "Etsy/Shopify OAuth ingestion agents",
        "AI listing enhancement (Claude Sonnet)",
      ],
      milestone: "$1,800",
    },
    {
      number: 5,
      title: "Artist Onboarding",
      weeks: "Weeks 9–10",
      requirements: [
        "List of 5–10 pilot artists (name + contact email)",
        "Stripe Connect test account or sandbox for payout testing",
        "Approval of the onboarding e-sign copy",
        "GoHighLevel account access (or consent to provision)",
      ],
      deliverables: [
        "Artist onboarding flow (consent → listing)",
        "Automated payout testing (80/20 split)",
        "SEO article publishing pipeline",
        "Admin console for marketplace management",
        "CRM integration (GoHighLevel)",
        "Social channel creation & integration (Instagram, X/Twitter) — accounts opened, brand bios, link-in-bio, product feed integration",
      ],
      milestone: "$1,800",
    },
    {
      number: 6,
      title: "Launch & Scale",
      weeks: "Weeks 11–12",
      requirements: [
        "Final content sign-off on public-facing copy",
        "Monitoring + alert email distribution list",
        "Confirmation of the go-live window",
      ],
      deliverables: [
        "Production deployment & monitoring",
        "Load testing & optimization",
        "Artist support documentation",
        "Analytics dashboard & handoff",
      ],
      milestone: "$1,800",
    },
  ],
};

// ---------- PLAN CA: Plan C Addendum — restructured 2026-04-28 ------------
// Same scope as Plan C. Payment structure restructured 2026-04-28:
//   - $1,800 deposit paid on 2026-04-23 (preserved as Payment 1)
//   - 17 weekly Wednesday payments of $900 from 2026-04-29 through 2026-08-19
//   - Total project value: $1,800 + (17 × $900) = $17,100
//   - PROJECT REVIEWS STAY BIWEEKLY — only the payment cadence changed.
//
// The weekly $900 amount is half of the prior biweekly $1,800 — same dollar
// run-rate, just split into smaller weekly draws. The 17-week duration is
// per Pete's spec; reviews remain on a biweekly cadence (6 reviews across
// the 12-week project term).
const planCAddendumSchedule: ScheduledPayment[] = [
  { dateLabel: "Thu, Apr 23 2026", isoDate: "2026-04-23", amount: "$1,800", tag: "Deposit", paid: true, paidOn: "Apr 23 2026" },
  { dateLabel: "Wed, Apr 29 2026", isoDate: "2026-04-29", amount: "$900", tag: "Weekly 1 of 17", paid: true, paidOn: "Apr 29 2026" },
  { dateLabel: "Wed, May 06 2026", isoDate: "2026-05-06", amount: "$900", tag: "Weekly 2 of 17", paid: true, paidOn: "May 06 2026" },
  { dateLabel: "Wed, May 13 2026", isoDate: "2026-05-13", amount: "$900", tag: "Weekly 3 of 17" },
  { dateLabel: "Wed, May 20 2026", isoDate: "2026-05-20", amount: "$900", tag: "Weekly 4 of 17" },
  { dateLabel: "Wed, May 27 2026", isoDate: "2026-05-27", amount: "$900", tag: "Weekly 5 of 17" },
  { dateLabel: "Wed, Jun 03 2026", isoDate: "2026-06-03", amount: "$900", tag: "Weekly 6 of 17" },
  { dateLabel: "Wed, Jun 10 2026", isoDate: "2026-06-10", amount: "$900", tag: "Weekly 7 of 17" },
  { dateLabel: "Wed, Jun 17 2026", isoDate: "2026-06-17", amount: "$900", tag: "Weekly 8 of 17" },
  { dateLabel: "Wed, Jun 24 2026", isoDate: "2026-06-24", amount: "$900", tag: "Weekly 9 of 17" },
  { dateLabel: "Wed, Jul 01 2026", isoDate: "2026-07-01", amount: "$900", tag: "Weekly 10 of 17" },
  { dateLabel: "Wed, Jul 08 2026", isoDate: "2026-07-08", amount: "$900", tag: "Weekly 11 of 17" },
  { dateLabel: "Wed, Jul 15 2026", isoDate: "2026-07-15", amount: "$900", tag: "Weekly 12 of 17" },
  { dateLabel: "Wed, Jul 22 2026", isoDate: "2026-07-22", amount: "$900", tag: "Weekly 13 of 17" },
  { dateLabel: "Wed, Jul 29 2026", isoDate: "2026-07-29", amount: "$900", tag: "Weekly 14 of 17" },
  { dateLabel: "Wed, Aug 05 2026", isoDate: "2026-08-05", amount: "$900", tag: "Weekly 15 of 17" },
  { dateLabel: "Wed, Aug 12 2026", isoDate: "2026-08-12", amount: "$900", tag: "Weekly 16 of 17" },
  { dateLabel: "Wed, Aug 19 2026", isoDate: "2026-08-19", amount: "$900", tag: "Weekly 17 of 17" },
];

export const planCAddendum: Plan = {
  ...planC,
  id: "CA",
  name: "Plan C Addendum",
  tagline: "Plan C — Restructured Weekly Payment Plan",
  heroTitle: planC.heroTitle,
  heroSubtitle:
    "Same scope and deliverables as Plan C — AI-powered marketplace infrastructure behind your GoDaddy site. Restructured 2026-04-28: $1,800 deposit (paid 2026-04-23) plus 17 weekly Wednesday payments of $900 from April 29 through August 19, 2026. Project reviews remain on a biweekly cadence.",
  meta: {
    ...planC.meta,
    projectTerm: "12-Week Project · 6 Biweekly Reviews · 17 Weekly Payments",
    investmentAtSigning: "$1,800",
    perMilestone: "$900",
    milestoneCount: 17,
    totalValue: "$17,100",
    paymentSchedule: planCAddendumSchedule,
    conditionalBanner:
      "Addendum RESTRUCTURED 2026-04-28: $1,800 deposit received April 23, 2026. Seventeen weekly payments of $900 begin Wednesday April 29, 2026 and run through Wednesday August 19, 2026. Reviews remain biweekly.",
  },
};

// ---------- PLAN AA: Plan A Addendum — restructured weekly payment plan ----
// Same scope and deliverables as Plan A. Payment structure restructured
// 2026-04-28 to match Lance's cash-flow request:
//   - $1,800 deposit paid 2026-04-23 (preserved as Payment 1)
//   - 15 weekly Wednesday payments of $900 from 2026-04-29 through 2026-08-05
//   - Total project value: $1,800 + (15 × $900) = $15,300
//
// Pete's signature is pre-filled in the proposal and PDF — Lance only needs
// to type his name, draw a signature, and check terms to print to PDF.
const planAAddendumSchedule: ScheduledPayment[] = [
  { dateLabel: "Thu, Apr 23 2026", isoDate: "2026-04-23", amount: "$1,800", tag: "Deposit", paid: true, paidOn: "Apr 23 2026" },
  { dateLabel: "Wed, Apr 29 2026", isoDate: "2026-04-29", amount: "$900", tag: "Payment 2" },
  { dateLabel: "Wed, May 06 2026", isoDate: "2026-05-06", amount: "$900", tag: "Payment 3" },
  { dateLabel: "Wed, May 13 2026", isoDate: "2026-05-13", amount: "$900", tag: "Payment 4" },
  { dateLabel: "Wed, May 20 2026", isoDate: "2026-05-20", amount: "$900", tag: "Payment 5" },
  { dateLabel: "Wed, May 27 2026", isoDate: "2026-05-27", amount: "$900", tag: "Payment 6" },
  { dateLabel: "Wed, Jun 03 2026", isoDate: "2026-06-03", amount: "$900", tag: "Payment 7" },
  { dateLabel: "Wed, Jun 10 2026", isoDate: "2026-06-10", amount: "$900", tag: "Payment 8" },
  { dateLabel: "Wed, Jun 17 2026", isoDate: "2026-06-17", amount: "$900", tag: "Payment 9" },
  { dateLabel: "Wed, Jun 24 2026", isoDate: "2026-06-24", amount: "$900", tag: "Payment 10" },
  { dateLabel: "Wed, Jul 01 2026", isoDate: "2026-07-01", amount: "$900", tag: "Payment 11" },
  { dateLabel: "Wed, Jul 08 2026", isoDate: "2026-07-08", amount: "$900", tag: "Payment 12" },
  { dateLabel: "Wed, Jul 15 2026", isoDate: "2026-07-15", amount: "$900", tag: "Payment 13" },
  { dateLabel: "Wed, Jul 22 2026", isoDate: "2026-07-22", amount: "$900", tag: "Payment 14" },
  { dateLabel: "Wed, Jul 29 2026", isoDate: "2026-07-29", amount: "$900", tag: "Payment 15" },
  { dateLabel: "Wed, Aug 05 2026", isoDate: "2026-08-05", amount: "$900", tag: "Payment 16" },
];

export const planAAddendum: Plan = {
  ...planA,
  id: "AA",
  name: "Plan A Addendum",
  tagline: "Plan A — Restructured Weekly Payment Plan",
  heroTitle: planA.heroTitle,
  heroSubtitle:
    "Same scope and deliverables as Plan A — full-stack 3D Interactive marketplace platform built end-to-end by DTSP-AI. Restructured 2026-04-28: $1,800 deposit (paid 2026-04-23) plus 15 weekly Wednesday payments of $900 from April 29 through August 5, 2026. 16-week project term with 8 biweekly reviews.",
  meta: {
    ...planA.meta,
    projectTerm: "16-Week Project · 8 Biweekly Reviews · 15 Weekly Payments",
    investmentAtSigning: "$1,800",
    perMilestone: "$900",
    milestoneCount: 15,
    totalValue: "$15,300",
    paymentSchedule: planAAddendumSchedule,
    conditionalBanner:
      "Plan A Addendum: $1,800 deposit credited from April 23, 2026. Fifteen weekly payments of $900 begin Wednesday April 29, 2026 and run through Wednesday August 5, 2026. $13,500 owed across the 15-week schedule. 16-week project term · reviews remain biweekly (8 total).",
  },
};

// ---------- PLAN CA2: Plan C Addendum 2 — Active Build + Ops Director ------
// Restructured 2026-05-11. Supersedes the unpaid portion of Plan CA from
// 2026-05-13 onward. Three blocks of paid history from Plan CA ($1,800
// deposit + 2 × $900 weekly) are credited toward the project and are
// NOT included in CA2's totalValue — CA2 represents only the new build
// commitment.
//
// Why CA2 exists:
//   1. Hourly floor — Pete must not drop below $75/hr × 20 hr/wk = $1,500/wk
//   2. New scope — WEI Ops Director (white-label MSP/RMM-style agent layer
//      for Alanson's marketplace ops) rolled into M4-M6
//   3. Schedule compression — original CA ran to Aug 19; CA2 ends Jul 29
//
// Math:
//   Weeks 1-8 (May 13 → Jul 1):  8 × $1,500 = $12,000  ($75/hr × 20 hr floor)
//   Weeks 9-12 (Jul 8 → Jul 29): 4 × $1,200 = $4,800   (taper: handoff/maint)
//   CA2 total:                                $16,800
//
// White-label note: the Ops Director PRODUCT surface is WEI-branded
// (admin UI, email replies, reports, dashboard all carry WEI identity).
// The CONTRACT remains DTSP-AI ↔ WEI. The agent architecture stays
// reusable by DTSP-AI for future engagements; the prompts, brand voice,
// data, and deployed instance belong to WEI.
const planCA2Schedule: ScheduledPayment[] = [
  // Intensive build phase — $75/hr × 20 hr/wk floor honored every week.
  { dateLabel: "Wed, May 13 2026", isoDate: "2026-05-13", amount: "$1,500", tag: "Intensive 1/8" },
  { dateLabel: "Wed, May 20 2026", isoDate: "2026-05-20", amount: "$1,500", tag: "Intensive 2/8" },
  { dateLabel: "Wed, May 27 2026", isoDate: "2026-05-27", amount: "$1,500", tag: "Intensive 3/8" },
  { dateLabel: "Wed, Jun 03 2026", isoDate: "2026-06-03", amount: "$1,500", tag: "Intensive 4/8" },
  { dateLabel: "Wed, Jun 10 2026", isoDate: "2026-06-10", amount: "$1,500", tag: "Intensive 5/8" },
  { dateLabel: "Wed, Jun 17 2026", isoDate: "2026-06-17", amount: "$1,500", tag: "Intensive 6/8" },
  { dateLabel: "Wed, Jun 24 2026", isoDate: "2026-06-24", amount: "$1,500", tag: "Intensive 7/8" },
  { dateLabel: "Wed, Jul 01 2026", isoDate: "2026-07-01", amount: "$1,500", tag: "Intensive 8/8" },
  // Handoff / maintenance taper — Ops Director moves to autonomous-within-
  // guardrails, support documentation finalized, ownership transferred.
  { dateLabel: "Wed, Jul 08 2026", isoDate: "2026-07-08", amount: "$1,200", tag: "Handoff 1/4" },
  { dateLabel: "Wed, Jul 15 2026", isoDate: "2026-07-15", amount: "$1,200", tag: "Handoff 2/4" },
  { dateLabel: "Wed, Jul 22 2026", isoDate: "2026-07-22", amount: "$1,200", tag: "Handoff 3/4" },
  { dateLabel: "Wed, Jul 29 2026", isoDate: "2026-07-29", amount: "$1,200", tag: "Handoff 4/4" },
];

export const planCA2: Plan = {
  ...planC,
  id: "CA2",
  name: "Plan C Addendum 2",
  tagline: "Active Build + WEI Ops Director — White-Label Agentic Ops Layer",
  heroTitle: "Artist Marketplace Platform + WEI Operations Director",
  heroSubtitle:
    "Plan CA, restructured for the active build phase. The marketplace foundation is shipped (database, consent, payouts, SEO engine, WP plugin, transactional email, social channels). The remaining 12 weeks deliver Marketplace Ingestion, Artist Onboarding, and Launch — plus the WEI Operations Director: a white-label agentic ops layer that runs ticket triage, moderation, financial reconciliation, and reporting on Alanson's behalf. The marketplace platform we're building learns how to run itself.",
  meta: {
    ...planC.meta,
    projectTerm:
      "12-Week Build · 6 Biweekly Reviews · 12 Weekly Payments (Wed)",
    investmentAtSigning: "$1,500",
    perMilestone: "$1,500 / $1,200",
    milestoneCount: 12,
    totalValue: "$16,800",
    paymentSchedule: planCA2Schedule,
    conditionalBanner:
      "PLAN CA2 — Active Build with WEI Ops Director rolled in. Supersedes the unpaid portion of Plan CA effective 2026-05-13. Plan CA's $1,800 deposit and 2 weekly payments ($3,600 total) are CREDITED toward the project — CA2 covers only the new 12-week commitment at the $75/hr × 20 hr/wk floor: 8 weeks at $1,500 (intensive build) + 4 weeks at $1,200 (handoff & maintenance taper). Final payment Wed Jul 29, 2026. Project reviews remain biweekly (6 total across the term).",
  },
  // Override phases to add the WEI Ops Director scope onto M4-M6.
  // M1-M3 are kept (shown as complete in the portal) for proposal-page
  // context, so Alanson sees the full arc he's signed for.
  phases: [
    ...planC.phases.slice(0, 3),
    {
      number: 4,
      title: "Marketplace Ingestion & AI + Ops Director Foundation",
      weeks: "Weeks 1–4 (May 13 → Jun 3)",
      requirements: [
        "Etsy and/or Shopify seller credentials (OAuth consent)",
        "3–5 example artist bios + style guides for AI tone reference",
        "Brand voice doc for Ops Director agent replies (or 3 sample emails Alanson would send himself)",
      ],
      deliverables: [
        "Etsy/Shopify OAuth ingestion agents",
        "AI listing enhancement (Claude Sonnet)",
        "WEI Ops Director — Foundation: read-only agents observing tickets, payouts, listings, and reporting daily digests to Alanson (no actions yet)",
        "Agent contracts + memory architecture wired to Supabase + Stripe + marketplace order data",
      ],
      milestone: "$6,000 (4 × $1,500)",
    },
    {
      number: 5,
      title: "Artist Onboarding + GHL CRM + Ops Director Workers",
      weeks: "Weeks 5–8 (Jun 10 → Jul 1)",
      requirements: [
        "List of 5–10 pilot artists (name + contact email)",
        "Stripe Connect test account or sandbox for payout testing",
        "Approval of the onboarding e-sign copy",
        "GoHighLevel account access (or consent to provision)",
        "Refund / moderation rules Alanson wants the agents to follow (we draft, he approves)",
      ],
      deliverables: [
        "Artist onboarding flow (consent → listing)",
        "Automated payout testing (80/20 split)",
        "SEO article publishing pipeline",
        "Admin console for marketplace management — WEI-branded, white-label",
        "CRM integration (GoHighLevel)",
        "Social channel creation & integration (Instagram, X/Twitter) — accounts opened, brand bios, link-in-bio, product feed integration",
        "WEI Ops Director — Workers: 5 specialist agents (Onboarding, Support, Moderation, Finance, Reporting) in draft-and-approve mode. Agents propose actions; Alanson one-click approves from the WEI admin console.",
      ],
      milestone: "$6,000 (4 × $1,500)",
    },
    {
      number: 6,
      title: "Launch & Scale + Ops Director Autonomous + Handoff",
      weeks: "Weeks 9–12 (Jul 8 → Jul 29)",
      requirements: [
        "Final content sign-off on public-facing copy",
        "Monitoring + alert email distribution list",
        "Confirmation of the go-live window",
        "Guardrail thresholds for autonomous agent actions (refund cap $, KYC steps, escalation triggers)",
      ],
      deliverables: [
        "Production deployment & monitoring",
        "Load testing & optimization",
        "Artist support documentation",
        "Analytics dashboard & handoff",
        "WEI Ops Director — Autonomous within guardrails: agents act on rule-bound work (refunds ≤ cap, KYC steps, standard support, scheduled reports). Anything novel escalates to Alanson.",
        "White-label admin UI handoff — WEI branding throughout, prompt-tuning runbook, ops SLA, repo handed over to WEI ownership",
      ],
      milestone: "$4,800 (4 × $1,200)",
    },
  ],
};

// ---------- PLAN A3: Plan A Addendum 3 — Full-Stack Completion + WholEarthRecords ----------
// Restructured 2026-05-16. Supersedes the prior agreement. Original deal:
// Plan CA at $17,100. $4,500 already paid ($1,800 deposit 2026-04-23 +
// 3 × $900 weekly through 2026-05-13) is credited toward the project and is
// NOT billed again — it is not included in A3's totalValue.
//
// Badged as PLAN A: DTSP-AI delivers the entire stack, frontend and backend.
//
// Math:
//   Core completion (remaining original scope):
//     2026-05-20 $3,600 + 2026-06-01 $4,500 + 2026-07-01 $4,500 = $12,600
//   WholEarthRecords + playthewholearthgame.org (added scope):
//     2026-08-01 $4,500 + 2026-09-01 $2,570 = $7,070
//   Addendum 3 new billing total: $12,600 + $7,070 = $19,670
//   Whole-contract value (incl. $4,500 already paid): $24,170
//
// Cadence: PAYMENTS are monthly (5 total). REVIEWS stay biweekly — the
// every-2-weeks meeting cadence is unchanged from the prior agreement.
//
// Post-launch: a $2,250/month maintenance & support retainer begins
// 2026-10-01, the month after the final project payment (debugging, testing, dependency/security updates, routine
// maintenance). New features / additional dev are scoped and quoted
// separately. The retainer is recurring and is NOT part of totalValue.
//
// Phases: M1-M6 reuse planC's phases (requirements + deliverables
// unchanged) so the client portal's p1-p6 item IDs and saved state carry
// through cleanly. Only the per-phase `milestone` label and `weeks`
// window are restated. M7 (WholEarthRecords) is new.
// Received-payment reconciliation (Zelle, Alanson Charles) — $17,100 total:
//   2026-06-01 $4,500  → covers May 20 ($3,600) — $900 over
//   2026-06-24 $4,500  → covers Jun 1 ($4,500)
//   2026-07-20 $2,250 + 2026-07-27 $2,250 → covers Jul 1 ($4,500) as a split
//   Aug 2026 $3,600 → with the $900 credit, covers Aug 1 ($4,500) in full
//   Net: the first four payments are settled and the $900 credit is consumed.
//   $17,100 received against $19,670; only the Sep 1 payment ($2,570) is open.
//   Scheduled dates and amounts are unchanged — status rides the tag.
const planA3Schedule: ScheduledPayment[] = [
  { dateLabel: "Wed, May 20 2026", isoDate: "2026-05-20", amount: "$3,600", tag: "Core 1 of 3", paid: true, paidOn: "Jun 1 2026 ($4,500 via Zelle)" },
  { dateLabel: "Mon, Jun 01 2026", isoDate: "2026-06-01", amount: "$4,500", tag: "Core 2 of 3", paid: true, paidOn: "Jun 24 2026 (Zelle)" },
  { dateLabel: "Wed, Jul 01 2026", isoDate: "2026-07-01", amount: "$4,500", tag: "Core 3 of 3", paid: true, paidOn: "Jul 20 + Jul 27 2026 (2 × $2,250 Zelle)" },
  { dateLabel: "Sat, Aug 01 2026", isoDate: "2026-08-01", amount: "$4,500", tag: "Records & Game 1 of 2", paid: true, paidOn: "Aug 2026 ($3,600 + $900 credit)" },
  { dateLabel: "Tue, Sep 01 2026", isoDate: "2026-09-01", amount: "$2,570", tag: "Records & Game 2 of 2 · final project payment — ongoing monthly maintenance begins Oct 1" },
];

// M7 — WholEarthRecords. New milestone appended after planC's M1-M6.
// Wrapper architecture: WholEarthRecords does NOT host or stream audio —
// it embeds SoundCloud / Bandcamp / Spotify players (audio stays on their
// infrastructure, zero streaming cost to WEI) and monetizes music as
// product types through the marketplace's existing Stripe Connect checkout.
// Frontend: Framer Motion (2D animation), NOT a Three.js/R3F 3D build —
// Framer Motion is already in the stack, so the animated single page is
// fast to build and the $7,070 budget holds.
const planA3MusicPhase: Phase = {
  number: 7,
  title: "WholEarthRecords — Music Commerce Site",
  weeks: "Aug–Sep 2026",
  requirements: [
    "WholEarthRecords brand direction — name treatment, logo, accent colors",
    "Initial roster of 5–10 music artists (name, contact, links to existing SoundCloud / Bandcamp / Spotify)",
    "Domain decision — wholearthrecords.com, a subdomain, or a /records path on the main site",
    "Pricing approach for music — fixed price, name-your-price, or both",
  ],
  deliverables: [
    "WholEarthRecords single-page site — Framer Motion-animated label-brand experience, curated artist roster, featured releases",
    "Embedded playback — SoundCloud / Bandcamp / Spotify player widgets (audio stays on their infrastructure; zero streaming cost to WEI)",
    "Music product schema — tracks, releases, and albums as product types in the existing marketplace database",
    "Music commerce — buy / support / name-your-price routed through the existing Stripe Connect 80/20 checkout",
    "Artist promotion layer — featured-artist slots and curated 'WholEarthRecords Select' drops",
    "Music artist intake — reuses the existing consent + e-sign pipeline",
    "SEO for music — artist and release pages feed the existing article engine",
    "Production launch of the running, functional v1 — QA, cross-device testing, documentation & handoff",
    "A defined upgrade path — every item in 'Not included' below can be added later as a separately-quoted paid upgrade",
  ],
  // Hard scope boundary — this is what keeps $7,070 from becoming a death
  // march. Anything below is a separate quote, never absorbed. The build
  // is a single-page WRAPPER, not a streaming platform.
  exclusions: [
    "Audio hosting, transcoding, or streaming infrastructure — playback uses embedded third-party players",
    "A custom audio player, waveform UI, or playlist engine",
    "A Three.js / R3F 3D engine build — the WholEarthRecords frontend is Framer Motion 2D animation",
    "Social features — likes, reposts, comments, or follower feeds",
    "Recommendation or music-discovery algorithms",
    "A native mobile app",
    "DRM or WEI-hosted licensed-file delivery",
  ],
  milestone: "New scope",
};

// A3 calendar — M1-M6 reuse planC's phase bodies, but planC's relative
// "Weeks 1–12" labels do not match A3's compressed timeline. Restate the
// per-phase window so the milestone timeline reads correctly.
const planA3PhaseWeeks: Record<number, string> = {
  1: "Apr 2026",
  2: "Apr–May 2026",
  3: "May 2026",
  4: "May–Jun 2026",
  5: "Jun–Jul 2026",
  6: "Jul 2026",
};

// Per-application scope-of-work sheets. One sheet per application — the two
// builds are never mixed. Checked = delivered. Unchecked = remaining work
// under this agreement. Sourced from the standing engineering scope for
// each application.
const planA3ScopeSheets: ScopeSheet[] = [
  {
    title: "WholEarth Industries — Marketplace Platform",
    subtitle:
      "wholearthindustries.com on Vercel (Next.js storefront) · store.wholearthindustries.com on WordPress/WooCommerce (GoDaddy) · automated supplier catalog pipeline between them",
    done: [
      "Domain architecture live — wholearthindustries.com (apex + www) served from the Next.js storefront on Vercel; the WooCommerce store runs at store.wholearthindustries.com",
      "Supplier catalog pipeline live end-to-end — supplier feed → pricing/markup engine → automated WooCommerce import",
      "Custom Supplier Sync WordPress plugin — automated import engine with run locking, resume cursors, and image handling",
      "48 products published; 133 more staged as drafts, ready to publish",
      "Conversion-first homepage — live products above the fold, 'Shop' as the primary call to action sitewide",
      "On-site product detail pages — image gallery, pricing, urgency indicators, structured data for search, related products, maker attribution",
      "Shop experience — sorting, hide-sold-out filtering, sold-out items sink, real scarcity indicators",
      "Makers layer — /makers hub, individual maker profiles, featured-makers module",
      "Partner vetting funnel — 'Sell with us' intake, 100-point Eco-First scoring engine (unit-tested), AI-generated vetting brief, verified live forms",
      "Lead capture live on the store — contact, newsletter, notify-me, and partner application forms with REST integration",
      "Rick copilot — streaming AI assistant live on the site",
      "42 automated unit tests passing + CI gate on the deployment branches",
    ],
    remaining: [
      "Commerce activation — payment gateway live, storefront purchasing enabled, verified end-to-end test order including a refund",
      "Full catalog rollout — publish the staged products, taking the shop from 48 to 181 live products",
      "Production resilience layer — request timeouts, graceful fallbacks, and on-demand product-data refresh across every store connection",
      "Traffic protection layer — rate limiting and spam protection on AI and form endpoints, credential lifecycle management",
      "Search optimization — canonical tags and duplicate-content control across the storefront and the store",
      "Hands-free catalog sync — 15-minute automated incremental sync running unattended",
      "Inventory integrity engine — real-time sold and stock accuracy, supplier catalog reconciliation, sync health alerting",
      "Revenue-path test suite — automated end-to-end purchase-flow testing plus unit coverage across the revenue boundary",
      "Multi-supplier expansion — parameterized catalog feed and plugin support for additional makers, each with their own markup and SKU space",
      "Maker imagery and affiliate attribution — real maker photography and referral tracking preserved through checkout",
      "Growth layer (activates at 4+ makers) — collab drops, email cadence from the notify-me list, community features sequenced by maker count",
    ],
    boundary:
      "Scope boundary — WholEarth Industries owns eco-commerce and the vendor-first professional community. The marketplace above is already built and live; nothing in this agreement re-sequences it behind WholEarth Records.",
  },
  {
    title: "WholEarthRecords — Artist Platform",
    subtitle:
      "Standalone artist platform on Vercel + Supabase + LiveKit Cloud — Three.js visual layer, AI artist manager, community, and commerce, sequenced revenue-first",
    done: [
      "Three.js visual foundation — audio-reactive lighting driven by a live audio analyser, real-time presence, and a full play-queue transport with waveform scrubbing",
      "Artist pages — handle-addressed and publish-gated, Three.js themed hero (artist backdrop and accent-colored character), orderable block hub (player, bio, tracks, shows, gallery, collabs, merch slot), persistent site-wide player",
      "Accounts — full lifecycle: pause, delete with 30-day grace, restore, GDPR export and purge",
      "Security posture — row-level security on every table, owner-gated writes, publish-gated reads, full audit trail of every agent action",
      "AI artist manager — one-brain agent with 28 scope-gated tools, versioned prompt contracts, named and briefed per artist from a 9-field owner-private brief",
      "Brand director — AI art generation in 8 structured formats with a persistent brand kit, reference-image edit mode, and automatic archiving of every generation",
      "PR/social strategist, press-kit builder (live EPK pages), and industry advisor with 7 knowledge packs",
      "Ontology-driven platform brain — one graph drives navigation, model routing, knowledge injection, and AI-search surfaces at zero LLM cost",
      "Gallery with per-album privacy (public / link-only / private)",
      "Collab Rooms — realtime chat and presence, member-gated file share with playable audio, task board, target drop dates",
      "The Wall — public per-artist feed with AI moderation screening",
      "Native calendar — shows and drops with public .ics feeds and Google Calendar export",
      "Live voice sessions — deployable voice copilot (LiveKit + Deepgram) with daily minute caps",
      "Economics instrumentation — per-artist AI-spend ledger, owner analytics (The Overlook), operator console with per-artist cost tracking",
      "AI-search optimization — llms.txt, ai-manifest, schema.org structured data, robots directives",
    ],
    remaining: [
      "Commerce launch preparation — production-tier infrastructure upgrade, transactional email, and payment-grade access-control certification across every write path (clears the platform to take payments)",
      "Commerce phase 1 (first revenue — top build priority) — Stripe Connect artist onboarding, tips and paid downloads, secure masters storage with entitlement-signed delivery, commerce agent tools, revenue reporting in the operator console",
      "Commerce phase 2 (merch) — print-quality AI-art upscaling, platform print-on-demand store integration, Market zone UI, live merch blocks on artist pages",
      "Scale layer — caching and static regeneration, high-volume reporting queries, durable background processing, platform-wide rate limiting with AI spend budgets, realtime subscription efficiency",
      "Production verification — end-to-end voice session and moderation sign-off on production",
      "Public launch — open signup, stage ticketing, plan-tier quotas, automated storage lifecycle management",
      "Three.js experience expansion — continued 3D visual development (environments, interactive spaces, richer artist-page scenes), sequenced after the revenue lanes are live",
    ],
    boundary:
      "Scope boundary — WholEarth Records is music-only: music artists, releases, music videos, shows, merch, and fan support. It does not include general culture or non-music creators, vendor networking, or the Industries social platform. The revenue-first ordering applies only within the Records scope.",
  },
  {
    title: "playthewholearthgame.org — Revamp for Live Feeds",
    subtitle:
      "Revamp of the existing playthewholearthgame.org site to carry live feeds",
    done: [],
    remaining: [
      "playthewholearthgame.org revamp for live feeds — site revamp with live feeds running on it",
    ],
    boundary:
      "Scope boundary — this sheet covers the playthewholearthgame.org revamp for live feeds and nothing else. Any other work on that site is out of scope and quoted separately.",
  },
];

// Fine print — architecture ownership carve-out and licensing frame.
// Numbered clauses, exact legal identities, order-of-precedence close.
// The signature checkbox incorporates this section by reference and never
// independently summarizes ownership.
const planA3FinePrint = {
  title: "Proprietary Architecture & Licensing",
  paragraphs: [
    "1. Ownership of deliverables. Upon payment in full, WholEarth-Commerce LLC d/b/a WholEarth Industries (“WholEarth”) owns the application source code, content, and data delivered under this agreement for the WholEarth Industries marketplace platform and the WholEarth Records artist platform.",
    "2. Architecture carve-out. DTSP-AI Technologies LLC (“DTSP-AI”; Peter W Davidsmeier, Founder & Lead Architect) retains sole and exclusive ownership of its core proprietary architecture — including, without limitation, its agent-orchestration patterns, contract-first prompt systems, ontology and knowledge-graph designs, memory architectures, pipeline designs, build methodologies, internal tooling, and all generalized frameworks and know-how used to produce the deliverables. Nothing in this agreement transfers ownership of that architecture to WholEarth or to any of its subsidiaries, affiliates, brands, or successors (including WholEarth Records LLC).",
    "3. Embedded-use license. WholEarth receives a perpetual, non-exclusive license to use DTSP-AI's proprietary architecture solely as embedded in the platforms delivered under this agreement. This license travels with the business and its subsidiaries; it does not permit extraction, resale, sublicensing, or reimplementation of the architecture outside the delivered platforms.",
    "4. Separate licensing agreement. The parties may enter into a separate licensing agreement — standalone or as part of a broader business structure between them — governing any expanded, productized, or white-label use of DTSP-AI's proprietary architecture. Until such an agreement is executed, no rights beyond the embedded-use license above are granted.",
    "5. Right to build. DTSP-AI retains the unrestricted right to use, reuse, extend, and license its proprietary architecture in current and future projects for any client or venture. Nothing in this agreement limits DTSP-AI's ability to build with its own architecture.",
    "6. Order of precedence. If any other statement in this agreement — including the signature acknowledgment, scope summaries, or marketing copy — conflicts with this section, this section controls as to ownership and licensing.",
  ],
};

// Explicit balance reconciliation — contract total, every payment applied,
// remaining balance, prior-plan amounts separately identified. The Jul 20 +
// Jul 27 split is one $4,500 application (never counted twice).
const planA3BalanceLedger: LedgerRow[] = [
  { label: "Addendum 3 contract total", value: "$19,670", emphasis: true },
  {
    label: "Received & applied — Jun 1, 2026 (Zelle)",
    value: "$4,500",
    sub: "Covers the May 20 payment ($3,600); the $900 excess is carried as a credit",
  },
  {
    label: "Received & applied — Jun 24, 2026 (Zelle)",
    value: "$4,500",
    sub: "Covers the Jun 1 payment in full",
  },
  {
    label: "Received & applied — Jul 20 + Jul 27, 2026 (Zelle, 2 × $2,250)",
    value: "$4,500",
    sub: "The two transfers together cover the Jul 1 payment in full — applied once, never double-counted",
  },
  {
    label: "Received & applied — August 2026",
    value: "$3,600",
    sub: "With the $900 credit carried from June, this covers the Aug 1 payment ($4,500) in full — the credit is now consumed",
  },
  { label: "Total applied to Addendum 3", value: "$17,100", emphasis: true },
  {
    label: "Remaining Addendum 3 balance",
    value: "$2,570",
    sub: "Due Sep 1, 2026 — the final project payment. Monthly maintenance begins Oct 1, 2026.",
    emphasis: true,
  },
  {
    label: "Prior agreement (superseded) — paid Apr 23 – May 13, 2026",
    value: "$4,500",
    sub: "Credited to the project as prior-plan value. NOT part of the $19,670 Addendum 3 total and not owed against it.",
  },
];

export const planA3: Plan = {
  ...planA,
  id: "A3",
  name: "Plan A · Addendum 3",
  tagline: "Marketplace Completion + WholEarthRecords Artist Platform",
  heroTitle: "WholEarth Industries Marketplace + WholEarthRecords",
  heroSubtitle:
    "Two platforms under one agreement, both built end-to-end by DTSP-AI. WholEarth Industries: a conversion-first Next.js storefront on the apex domain, the WordPress/WooCommerce store engine at store.wholearthindustries.com, and an automated supplier catalog pipeline feeding the shop — GoDaddy's role is hosting the store, nothing more. WholEarthRecords: a standalone artist platform — Three.js-powered artist pages, an AI artist manager with brand-art generation, collab rooms, community wall, calendar, live voice sessions, and owner analytics — sequenced revenue-first, with the commerce lanes as the top build priority. The Scope of Work sheets below list, per application, exactly what has been delivered and what remains — including the playthewholearthgame.org revamp for live feeds. $4,500 of the agreement is already paid and credited; this addendum covers the $12,600 marketplace build plus the $7,070 WholEarthRecords and playthewholearthgame.org scope, with project reviews every two weeks. A $2,250/month maintenance retainer begins October 1, 2026.",
  heroBullets: [
    "Two platforms under one agreement — the WholEarth Industries marketplace and the WholEarthRecords artist platform. DTSP-AI builds both, frontend and backend.",
    "WholEarth Industries — conversion-first Next.js storefront on wholearthindustries.com, the WordPress/WooCommerce store engine at store.wholearthindustries.com, and an automated supplier catalog pipeline between them. GoDaddy hosts the store; DTSP-AI builds everything else.",
    "Marketplace surfaces delivered — on-site product pages, makers hub and profiles, a partner vetting funnel with automated Eco-First scoring, and the Rick AI copilot.",
    "WholEarthRecords — a standalone artist platform: Three.js-powered artist pages, AI artist manager with brand-art generation, collab rooms, community wall, calendar, live voice sessions, and owner analytics. Build priority is revenue-first: the commerce lanes ship ahead of further 3D experience work.",
    "The Scope of Work sheets in this agreement list, per application, what has been delivered (checked) and what remains (unchecked). The applications are scoped separately and never mixed.",
    "playthewholearthgame.org — revamp of the existing site for live feeds, scoped on its own sheet at the end of the Scope of Work.",
    "$4,500 of the agreement is already paid and credited.",
    "This addendum covers the $12,600 marketplace scope plus the $7,070 WholEarthRecords and playthewholearthgame.org scope, with project reviews every two weeks.",
    "A $2,250 / month maintenance retainer begins October 1, 2026.",
    "DTSP-AI retains ownership of its core proprietary architecture — see Proprietary Architecture & Licensing below.",
  ],
  meta: {
    ...planA.meta,
    date: "May 2026",
    preparedFor: "WholEarth-Commerce LLC d/b/a WholEarth Industries",
    providerLegalName: "DTSP-AI Technologies LLC",
    // A3 was drawn/restructured 2026-05-16 — the provider signature is
    // dated to THIS agreement, not the original Plan C signing.
    providerSignedDate: "May 16, 2026",
    balanceLedger: planA3BalanceLedger,
    paymentStatusInternal: true,
    paypalInvoiceUrl: "https://www.paypal.com/invoice/p/#X3FCKZSDVMEZJSGV",
    projectTerm: "≈4-Month Build · Biweekly Reviews · 5 Monthly Payments",
    investmentAtSigning: "$3,600",
    perMilestone: "$2,570–$4,500",
    milestoneCount: 5,
    totalValue: "$19,670",
    paymentSchedule: planA3Schedule,
    // No conditionalBanner: A3 is the executed agreement of record — no
    // urgency framing. Supersession, the $4,500 credit, and the retainer
    // are stated in the schedule footnote and the signed terms.
    conditionalBanner: undefined,
    scheduleHeadline: "$12,600 marketplace + $7,070 records & game",
    scheduleCadenceLabel: "Monthly payments — 3 marketplace + 2 records & game",
    scheduleFootnote:
      "Full-stack delivery, frontend and backend: the WholEarth Industries marketplace scope, the WholEarth Records artist platform, and the playthewholearthgame.org revamp for live feeds. Each application's delivered and remaining work is listed in its own Scope of Work sheet above. $4,500 already paid under the prior agreement is credited toward the project. Payment status and the full balance reconciliation live in the client portal. Project reviews continue every 2 weeks. A $2,250/month maintenance retainer begins Oct 1, 2026 (billed separately).",
    termsSummary:
      "including the full project scope as set out in the Scope of Work sheets in this agreement — the WholEarth Industries marketplace platform, the WholEarth Records artist platform, and the playthewholearthgame.org revamp for live feeds. On each sheet, checked items are delivered, unchecked items are the remaining work under this agreement, and anything not listed is out of scope and quoted separately. Ownership and licensing of all deliverables and of DTSP-AI Technologies LLC's proprietary architecture are governed exclusively by the Proprietary Architecture & Licensing section of this agreement (clauses 1–6), which is incorporated by reference and controls over any other statement in this agreement. Project reviews are held every two weeks. The total is $19,670, payable in five monthly payments: $3,600 on May 20, 2026; $4,500 on June 1, 2026; $4,500 on July 1, 2026; $4,500 on August 1, 2026; and $2,570 on September 1, 2026. The $4,500 already paid under the prior agreement is credited toward the project and is not part of the $19,670. A maintenance and support retainer of $2,250 per month begins October 1, 2026 and continues until cancelled, covering debugging, testing, dependency and security updates, and routine maintenance; new features or additional development are scoped and quoted separately.",
    maintenance: {
      headline: "$2,250 / month — begins October 1, 2026",
      intro:
        "After the final project payment ($2,570 on September 1, 2026), the platform moves to an ongoing monthly maintenance plan. It is month-to-month and billed separately from the $19,670 project total.",
      covers: [
        "Bug fixes and debugging",
        "Testing and regression checks",
        "Dependency and security updates",
        "Routine monitoring, uptime checks, and upkeep",
      ],
      excluded:
        "Maintenance does NOT include new features, new integrations, design changes, or any additional development. Each new piece of work is scoped, written up, and priced separately — and approved by you — before it begins.",
    },
  },
  comparisonHeading: "DTSP-AI Builds the Platforms. GoDaddy Just Hosts the Store.",
  comparisonColumnLabel: "GoDaddy",
  comparisonIntro:
    "WholEarth is not buying a website — it is getting two platforms built. On the marketplace, the storefront lives on the apex domain, products flow in automatically from the supplier pipeline, and partners are vetted through an automated scoring funnel. On WholEarthRecords, artists get a full platform with an AI manager behind every page. DTSP-AI builds all of it, frontend and backend. GoDaddy's role is narrow and singular: it hosts the WooCommerce store at store.wholearthindustries.com. Nothing else.",
  comparisonNote:
    "DTSP-AI builds and owns the entire frontend — the Next.js storefront on the apex domain, the makers and partner surfaces, and the WholEarthRecords artist platform on its own stack. Every line of delivered application code is WEI's. GoDaddy is the store host underneath, not the builder; swap the host later and nothing about the platforms changes.",
  frontendBuiltByDtsp: true,
  scopeSheets: planA3ScopeSheets,
  finePrint: planA3FinePrint,
  hideSeoSection: true,
  hideArchitectureSection: true,
  signatureHeading:
    "Scope Acceptance — Plan A Addendum 3: WholEarth Industries and WholEarth Records",
  termsVersion: "A3-2026-08-18",
  comparisonTable: [
    { capability: "Next.js storefront (apex domain)", godaddy: "—", dtsp: "Built by DTSP-AI on Vercel — you own the code" },
    { capability: "On-site product pages", godaddy: "—", dtsp: "Built by DTSP-AI — gallery, pricing, structured data" },
    { capability: "Supplier catalog pipeline", godaddy: "—", dtsp: "Built by DTSP-AI — automated feed → WooCommerce" },
    { capability: "Supplier Sync plugin", godaddy: "—", dtsp: "Built by DTSP-AI — custom WordPress import engine" },
    { capability: "Makers hub & profiles", godaddy: "—", dtsp: "Built by DTSP-AI — maker attribution throughout" },
    { capability: "Partner vetting funnel", godaddy: "—", dtsp: "Built by DTSP-AI — 100-pt Eco-First scorer + AI brief" },
    { capability: "Rick AI copilot", godaddy: "—", dtsp: "Built by DTSP-AI — streaming AI assistant" },
    { capability: "WholEarthRecords artist platform", godaddy: "—", dtsp: "Built by DTSP-AI — Three.js frontend + AI artist manager" },
    { capability: "Source code, servers & data", godaddy: "—", dtsp: "Yours — every line, every record" },
    {
      capability: "WooCommerce store hosting",
      godaddy: "Yes — GoDaddy's only role",
      dtsp: "The store runs here; DTSP-AI builds everything on top",
    },
  ],
  phases: [
    ...planC.phases.map((p) => ({
      ...p,
      weeks: planA3PhaseWeeks[p.number] ?? p.weeks,
      milestone: p.number <= 3 ? "Complete" : "Remaining build",
    })),
    planA3MusicPhase,
  ],
};

export const plans: Record<PlanId, Plan> = {
  A: planA,
  AA: planAAddendum,
  B: planB,
  C: planC,
  CA: planCAddendum,
  CA2: planCA2,
  A3: planA3,
};

// Back-compat: default exports point at Plan C (the previously-active GoDaddy proposal)
// so existing imports keep rendering without regression.
export const proposalMeta = planC.meta;
export const comparisonTable = planC.comparisonTable;
export const phases = planC.phases;

export const seoSteps = [
  {
    step: 1,
    title: "Template",
    description:
      "A CSV template defines categories, objects, and question patterns. For WEI this means artist names, art styles, product types, and buyer intent queries like 'original watercolor paintings for sale' or 'how to buy handmade jewelry online'.",
  },
  {
    step: 2,
    title: "Permutations",
    description:
      "The Prompt Generator reads the template and produces every combination — hundreds or thousands of unique, targeted search queries. A template with 50 artists and 20 question patterns produces 1,000 distinct article prompts automatically.",
  },
  {
    step: 3,
    title: "Generation",
    description:
      "Each prompt is sent to the AI with parameters tuned for SEO — structured title, subtitle, and body extracted automatically. Articles are saved to a CSV for review and bulk upload. One run can produce hundreds of publication-ready articles in hours.",
  },
  {
    step: 4,
    title: "Domain Auth",
    description:
      "DKIM, SPF, and DMARC are configured on WEI's sending domain from day one. Every transactional email — artist onboarding, order confirmations, payout summaries — lands in inboxes and builds sender reputation.",
  },
  {
    step: 5,
    title: "Publish",
    description:
      "Articles push to WooCommerce or a connected blog. Internal linking between artist profiles, product pages, and articles compounds authority over time. The platform starts ranking while it is still being built.",
  },
];
