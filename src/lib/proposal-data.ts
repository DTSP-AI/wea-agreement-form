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

export type PlanId = "A" | "AA" | "B" | "C" | "CA" | "CA2";

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
  milestone: string;
}

export interface Plan {
  id: PlanId;
  name: string;
  tagline: string;
  heroTitle: string;
  heroSubtitle: string;
  meta: ProposalMeta;
  comparisonTable: ComparisonRow[];
  phases: Phase[];
  comparisonHeading: string;
  comparisonColumnLabel: string;
  showParallelSection: boolean;
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
  { dateLabel: "Wed, Aug 12 2026", isoDate: "2026-08-12", amount: "$900", tag: "Payment 17" },
  { dateLabel: "Wed, Aug 19 2026", isoDate: "2026-08-19", amount: "$900", tag: "Payment 18" },
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

export const plans: Record<PlanId, Plan> = {
  A: planA,
  AA: planAAddendum,
  B: planB,
  C: planC,
  CA: planCAddendum,
  CA2: planCA2,
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
