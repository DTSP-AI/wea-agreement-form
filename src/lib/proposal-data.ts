// Plan A = Full-stack build with 3D Interactive Site (DTSP-AI builds custom 3D frontend + intelligence layer)
// Plan B = Full-stack build with 2D React web site (DTSP-AI builds custom 2D frontend + intelligence layer)
// Plan C = Intelligence layer only (GoDaddy handles the storefront, we handle the backend)
//
// All plans run 12 weeks with 6 milestones, one milestone every 2 weeks.
// Math:
//   Plan A: $5,400 at signing + (6 × $2,000) = $5,400 + $12,000 = $17,400
//   Plan B: $4,400 at signing + (6 × $2,000) = $4,400 + $12,000 = $16,400
//   Plan C: $3,600 at signing + (6 × $1,800) = $3,600 + $10,800 = $14,400

export type PlanId = "A" | "B" | "C";

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
  zelleEmail: string;
  paypalHandle: string;
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
  deliverables: string[];
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
  zelleEmail: "combatperformfit@gmail.com",
  paypalHandle: "dtspdigitalmedia@gmail.com",
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
      deliverables: [
        "Etsy/Shopify OAuth ingestion agents",
        "AI listing enhancement (Claude Sonnet)",
        "CRM integration (GoHighLevel)",
      ],
      milestone: "$1,800",
    },
    {
      number: 5,
      title: "Artist Onboarding",
      weeks: "Weeks 9–10",
      deliverables: [
        "Artist onboarding flow (consent → listing)",
        "Automated payout testing (80/20 split)",
        "SEO article publishing pipeline",
        "Admin console for marketplace management",
      ],
      milestone: "$1,800",
    },
    {
      number: 6,
      title: "Launch & Scale",
      weeks: "Weeks 11–12",
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

export const plans: Record<PlanId, Plan> = {
  A: planA,
  B: planB,
  C: planC,
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
