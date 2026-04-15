export const proposalMeta = {
  preparedFor: "Whole Earth Advertising",
  preparedBy: "DTSP-AI Technologies",
  contact: "combatperformfit@gmail.com",
  projectTerm: "12 Weeks — 6 Milestones",
  investmentAtSigning: "$3,600",
  perMilestone: "$1,800",
  totalValue: "$14,400",
  date: "April 2026",
  clientName: "Alanson Charles",
  zelleEmail: "combatperformfit@gmail.com",
};

export const comparisonTable = [
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
];

export const phases = [
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
];

export const seoSteps = [
  {
    step: 1,
    title: "Template",
    description:
      "A CSV template defines categories, objects, and question patterns. For WEA this means artist names, art styles, product types, and buyer intent queries like 'original watercolor paintings for sale' or 'how to buy handmade jewelry online'.",
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
      "DKIM, SPF, and DMARC are configured on WEA's sending domain from day one. Every transactional email — artist onboarding, order confirmations, payout summaries — lands in inboxes and builds sender reputation.",
  },
  {
    step: 5,
    title: "Publish",
    description:
      "Articles push to WooCommerce or a connected blog. Internal linking between artist profiles, product pages, and articles compounds authority over time. The platform starts ranking while it is still being built.",
  },
];
