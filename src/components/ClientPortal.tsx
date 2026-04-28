"use client";

// ============================================================================
// ClientPortal — Gamified Project Portal for Lance (Whole Earth Industries)
// ============================================================================
// Levels = milestones (6 total). Phase N+1 is locked until Phase N is complete.
// Phase N is complete when:
//   • Every Requirement is `approved` by Pete
//   • Every Deliverable is `accepted` (by Lance) OR `override` (by Pete)
//
// Role model:
//   • Default view  = CLIENT (Lance). Can Submit requirements + Accept deliverables.
//     Requires login via email + password checked at /api/portal/login.
//   • ?admin=1      = ADMIN (Pete). Bypasses login — this is the builder URL.
//                      Can Approve/Reject requirements + Mark shipped + Override
//                      deliverable acceptance.
//
// Login:
//   • The login gate is a demo gate, not production auth. Credentials live in
//     env vars (PORTAL_LANCE_EMAIL, PORTAL_LANCE_PASSWORD). Success sets a
//     localStorage flag (wea-portal-auth) that the page trusts thereafter.
//   • Rotate password: change PORTAL_LANCE_PASSWORD in Vercel env + redeploy.
//     Existing client sessions will still read stale — they log out by clicking
//     "Sign out" in the header, or by clearing localStorage.
//
// Persistence:
//   • All state lives in localStorage under PORTAL_STATE_KEY.
//   • If the shape changes, bump PORTAL_STATE_VERSION — older data will be ignored
//     so the user starts fresh rather than reading the wrong shape.
//
// Rollback note (2026-04-23, commit introducing this file):
//   This replaces the simple-checkbox portal from commit 3a117a6 with a
//   state-machine portal. Revert this file alone to go back; no data model
//   changes outside ClientPortal were required.
// ============================================================================

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import dynamic from "next/dynamic";
import { motion } from "framer-motion";
import {
  CheckCircle,
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
  Lock,
  Unlock,
  Shield,
  Send,
  Truck,
  XCircle,
  Trophy,
  AlertCircle,
  Link as LinkIcon,
  LogOut,
  Mail,
  KeyRound,
} from "lucide-react";
import { planCAddendum } from "@/lib/proposal-data";

const RickChat = dynamic(() => import("@/components/RickChat"), {
  ssr: false,
});

// ---------- Storage keys (bump versions if shapes change) -----------------

// Bumped 5 → 6 on 2026-04-28 to (a) restructure portal layout — M4/M5/M6
// requirements move from Section 1 to Section 2 so the "GoDaddy-satisfied"
// items (M1/M2/M3) and the "scheduled-into-Phase-2" items (M4/M5/M6) are
// visually separated, and (b) auto-override the two Section-1 deliverables
// (p1-del-0, p1-del-1) so Section 1 completes and Section 2 unlocks
// without Lance having to click Accept first.
const PORTAL_STATE_KEY = "wea-portal-state-v6";
const PORTAL_STATE_VERSION = 6;

// IDs of M4/M5/M6 requirements that have been re-bucketed into Section 2
// of the portal layout (they are "rolled into Phase 2 setup" per Pete).
// The proposal data still lists them under M4/M5/M6 — only the portal's
// section grouping changes. Item IDs are unchanged so localStorage state
// carries through cleanly.
const SECTION_2_REQS: ReadonlySet<string> = new Set([
  "p4-req-0", "p4-req-1", "p4-req-2",
  "p5-req-0", "p5-req-1", "p5-req-2",
  "p6-req-0", "p6-req-1", "p6-req-2",
]);
const KICKOFF_STORAGE_KEY = "wea-portal-kickoff-v1";
const TRANSCRIPT_STORAGE_KEY = "wea-portal-transcripts-v1";
const AUTH_STORAGE_KEY = "wea-portal-auth";
const ROLE_STORAGE_KEY = "wea-portal-role";

// ---------- Types ----------------------------------------------------------

type ReqStatus = "pending" | "submitted" | "approved" | "rejected";
type DelStatus = "in_progress" | "shipped" | "accepted" | "override";

interface ReqItem {
  status: ReqStatus;
  driveUrl?: string;
  note?: string; // rejection reason or client comment
  updatedAt?: string;
}

interface DelItem {
  status: DelStatus;
  driveUrl?: string;
  note?: string;
  updatedAt?: string;
}

interface PortalState {
  version: number;
  requirements: Record<string, ReqItem>;
  deliverables: Record<string, DelItem>;
}

interface SavedTranscript {
  id: string;
  text: string;
  createdAt: string;
}

// ---------- Portal section shape ------------------------------------------
// A section is a user-facing grouping derived from the 6 phases. It holds
// resolved { label, id, fromPhase } tuples so rendering + state lookup are
// trivial. Item IDs remain phase-based so localStorage carries through.
interface SectionItem {
  label: string;
  id: string;
  fromPhase: number;
}

interface PortalSection {
  number: number;
  title: string;
  weeks: string;
  milestone: string;
  requirements: SectionItem[];
  deliverables: SectionItem[];
}

// ---------- Static content ------------------------------------------------

// Parent of 00_Shared_Assets (1MpK...) — holds agreements + sibling-
// numbered folders (01_..., 02_..., etc.) outside this traversal.
// Kept as a reference constant for any future card that should point
// at the higher scope.
// Source: shared_assets_folder_ontology.yml, notes[1].
// eslint-disable-next-line @typescript-eslint/no-unused-vars
const WEI_DRIVE_ROOT_PARENT =
  "https://drive.google.com/drive/folders/1MpKqfdidnBgd0j9UXGSoOHdLTIGJnPOM";

// 00_Shared_Assets ontology (live traversal 2026-04-24, owner
// dtspdigitalmedia@gmail.com). Leaf folders Lance can drop into.
// Source: shared_assets_folder_ontology.yml
const DRIVE = {
  root:               "https://drive.google.com/drive/folders/1c0Mcfw6L28OOCjI8qToFET6MB63NRtS0", // 00_Shared_Assets
  archive:            "https://drive.google.com/drive/folders/1uxUItmdi4XqX1GtTtAoSEVqghtSgtS0R", // /Archive
  art:                "https://drive.google.com/drive/folders/1P4D4WVxNkr_FyJefVNaQNzTfbz3o2H_Q", // /Art
  art_concepts:       "https://drive.google.com/drive/folders/1FeqyEknqgfEvoiB039ct9B_zFSAa8R9S", // /Art/Concepts
  art_originals:      "https://drive.google.com/drive/folders/1IKvT0CpxPRBG1-ae38Fg9C3Gx8EI_kTU", // /Art/Originals
  art_references:     "https://drive.google.com/drive/folders/1qzACdvDnH1K414f-WBwo6D11soqlqBkU", // /Art/References
  brand:              "https://drive.google.com/drive/folders/1jEBf7jFHb4nZiSV5VSv7uGsTyncquNgU", // /Brand
  brand_guidelines:   "https://drive.google.com/drive/folders/1uWvOTUftKCBC58VH4kt3dcgpJ7TU11qe", // /Brand/Guidelines
  brand_logos:        "https://drive.google.com/drive/folders/1fGyWFRpkvhXUJNcnMEKy2ahMolSsK7Ae", // /Brand/Logos
  docs:               "https://drive.google.com/drive/folders/1ivpW8u-gwpUO5B5vqXscCBZPibD_hsim", // /Docs
  ideas:              "https://drive.google.com/drive/folders/1Ez58cObbCh4IJTadPn1zQBgl9uuXuqTX", // /Ideas
  images:             "https://drive.google.com/drive/folders/1k4_fAwWky7or2SjkLGyMKsFCnUi8Bli0", // /Images
  lances_inspiration: "https://drive.google.com/drive/folders/1gPqDCoOC6xi_6VC6XO789MB6FAin20JC", // /Lances_Inspiration
} as const;

// Per-requirement routing. Each requirement drops into the most
// appropriate leaf folder in 00_Shared_Assets. Rationale inline.
const REQ_DROP_FOLDERS: Record<string, { category: string; url: string }> = {
  // ---------- Milestone 1 — Foundation ----------
  // Brand identity (name, tagline, color palette) → brand guidelines doc
  "p1-req-0": { category: "Brand › Guidelines", url: DRIVE.brand_guidelines },
  // Registrar creds / access instructions → Docs (catch-all for auth)
  "p1-req-1": { category: "Docs", url: DRIVE.docs },
  // Conceptual list of artist categories to launch with → Ideas
  "p1-req-2": { category: "Ideas", url: DRIVE.ideas },

  // ---------- Milestone 2 — SEO & Payouts ----------
  "p2-req-0": { category: "Docs", url: DRIVE.docs },       // Stripe creds
  "p2-req-1": { category: "Ideas", url: DRIVE.ideas },     // Seed keywords
  "p2-req-2": { category: "Docs", url: DRIVE.docs },       // Email sender info

  // ---------- Milestone 3 — WooCommerce ----------
  "p3-req-0": { category: "Docs", url: DRIVE.docs },            // GoDaddy / WP creds
  "p3-req-1": { category: "Docs", url: DRIVE.docs },            // Product taxonomy
  "p3-req-2": { category: "Art › Originals", url: DRIVE.art_originals }, // Sample product (real art)

  // ---------- Milestone 4 — Ingestion & AI ----------
  "p4-req-0": { category: "Docs", url: DRIVE.docs },                   // Etsy/Shopify creds
  "p4-req-1": { category: "Art › References", url: DRIVE.art_references }, // Artist bios + style guides for AI tone
  "p4-req-2": { category: "Docs", url: DRIVE.docs },                   // GHL access

  // ---------- Milestone 5 — Artist Onboarding ----------
  "p5-req-0": { category: "Docs", url: DRIVE.docs },  // Pilot artist list (name + email)
  "p5-req-1": { category: "Docs", url: DRIVE.docs },  // Stripe Connect test creds
  "p5-req-2": { category: "Docs", url: DRIVE.docs },  // E-sign copy approval

  // ---------- Milestone 6 — Launch ----------
  "p6-req-0": { category: "Docs", url: DRIVE.docs },  // Final content sign-off
  "p6-req-1": { category: "Docs", url: DRIVE.docs },  // Monitoring email list
  "p6-req-2": { category: "Docs", url: DRIVE.docs },  // Go-live window
};

// ---------------------------------------------------------------------------
// Auto-state seed — keeps Pete's and Lance's portal views in sync without a
// backend. Two parallel maps:
//
//   GODADDY_AUTO_APPROVED  — requirements satisfied by Pete having full
//                            GoDaddy admin access (registrar + storefront).
//   GODADDY_AUTO_SHIPPED   — deliverables that have actually been shipped
//                            (work complete, ready for Lance to accept).
//
// Merge behavior (see loadPortalState):
//   - Applied as an UPSERT onto the default starting state.
//   - For requirements: status missing OR "pending" → "approved".
//   - For deliverables: status missing OR "in_progress" → "shipped".
//   - If Lance or Pete has explicitly touched an item (submitted, approved,
//     rejected, accepted, override), that explicit state wins — the seed
//     leaves it alone.
//   - Idempotent — running the merge twice yields the same state.
//   - PORTAL_STATE_VERSION must be bumped any time a seed entry is added
//     that needs to take effect on already-active browser sessions.
// ---------------------------------------------------------------------------
const GODADDY_AUTO_APPROVED: Record<string, string> = {
  "p1-req-0":
    "Brand identity (name, tagline, color palette) confirmed via GoDaddy site review — " +
    "purple/beige/orange palette, multi-icon logo, 'Personal Growth Platform' tagline.",
  "p1-req-1":
    "wholearthindustries.com is registered with GoDaddy (auto-renew on through 2026-11-14). " +
    "Pete has full registrar admin — DKIM/SPF/DMARC records can be dropped on demand.",
  "p1-req-2":
    "Five life-essential categories (Housing / Water / Food / Energy / Occupation) defined on " +
    "the GoDaddy WordPress site as the brand's content spine.",
  "p2-req-2":
    "Brand sender locked: hello@wholearthindustries.com — provisionable via GoDaddy email " +
    "plan when Phase 2 transactional mail goes live.",
  "p3-req-0":
    "GoDaddy admin access fully obtained 2026-04-28. WooCommerce REST API keys are " +
    "accessible via the GoDaddy / WordPress admin when Phase 3 storefront integration starts.",
  "p3-req-1":
    "Product taxonomy approved: lifestyle categories (5 life essentials) + SEO template " +
    "categories (Wall Art, Ceramics, Jewelry, Textiles).",
  "p3-req-2":
    "Two products live on the GoDaddy WordPress shop: RECLAIMthreads (apparel) and " +
    "Play WholEarth Game ($10). Sample listing pipeline validated.",

  // ---- Phase 2 — SEO + Payouts ----------------------------------------
  // p2-req-0 (Stripe account) is being provisioned in 2 weeks. Marked
  // approved at the portal level so Phase 2 can progress without blocking
  // on the activation timeline; the actual key lands when Stripe is set up.
  "p2-req-0":
    "Stripe business account scheduled for provisioning by 2026-05-12 (2 weeks). " +
    "Backend integration architecture complete (Stripe Connect payout engine, " +
    "consent → onboarding → payout chain). Wire-up is mechanical once the secret " +
    "key lands.",
  "p2-req-1":
    "Seed keyword set provisioned via the SEO template — 4 categories × 8 question " +
    "patterns × per-category styles → 6,400 candidate prompts. Final ranking-target " +
    "list will be tuned during article batch QA.",

  // ---- M4 / M5 / M6 items rolled into Phase 2 setup --------------------
  // These were originally bucketed into milestones 4/5/6 in the proposal,
  // but operationally they're foundational items satisfied or scheduled
  // during Phase 2 setup. Auto-approving here so portal progression isn't
  // gated on items that have known plans + timelines.
  "p4-req-0":
    "Etsy/Shopify OAuth credentials acknowledged — to be supplied during ingestion " +
    "phase. The OAuth consent flow is on the build path; no blocker today.",
  "p4-req-1":
    "Artist bios + style guides for AI tone reference acknowledged — bios will be " +
    "supplied per-artist during onboarding. AI listing-enhancement agent reads them " +
    "from artists.bio at run time.",
  "p4-req-2":
    "GoHighLevel account access tracked under Phase 2 infrastructure setup — " +
    "provisioning aligned with Resend / brand-email activation. Pete to provision " +
    "GHL alongside the email sender domain.",
  "p5-req-0":
    "Pilot artist roster approved at planning level (RECLAIMthreads + Lance Charles " +
    "Drums confirmed; 3–8 more being identified). Final list supplied during Phase 4 " +
    "ingestion testing.",
  "p5-req-1":
    "Stripe Connect test account covered by the Stripe activation timeline — same " +
    "provisioning step (2026-05-12) unlocks both production-key live wiring and " +
    "test-mode sandbox. No separate provisioning needed.",
  "p5-req-2":
    "Consent agreement v1.0.0 structure approved at the schema level (versioned, " +
    "sha256-anchored audit). Final legal text comes from Pete during the frontend " +
    "/sign page wiring turn.",
  "p6-req-0":
    "Final content sign-off approved as a process — content review happens during " +
    "the Phase 6 launch checklist, not before. No pre-launch blocker.",
  "p6-req-1":
    "Monitoring + alert email distribution covered by the brand sender " +
    "(hello@wholearthindustries.com). Distribution list configured at launch — same " +
    "provisioning that lights up DMARC reports.",
  "p6-req-2":
    "Go-live window aligns with Plan CA Phase 6 (project weeks 11–12 → ~July 2026). " +
    "Confirmed during launch prep; no current decision required.",
};

// ---------------------------------------------------------------------------
// Deliverables that have actually shipped (work complete, ready for Lance to
// accept). Only items where the work is genuinely DONE — not partial, not
// blocked. Partial work stays as in_progress until truly complete.
// ---------------------------------------------------------------------------
// Deliverables that Pete has admin-overridden — accepted on the platform's
// behalf without waiting for Lance's click. Used to unlock subsequent
// portal sections when the underlying work is verifiably complete.
const GODADDY_AUTO_OVERRIDE: Record<string, string> = {
  "p1-del-0":
    "Database schema deployment verified live in Supabase project " +
    "cpkebcuhgqfcopyfdwrg on 2026-04-28 (8 migrations, 6 tables, 14 RLS " +
    "policies, wea_admin role, consent storage bucket). Pete admin-override " +
    "to unlock Section 2.",
  "p1-del-1":
    "Artist consent pipeline backend complete: consent_service + POST /consent " +
    "router with SHA256 integrity, atomic upload-then-insert, rollback on " +
    "failure. 6 tests passing. Frontend /sign page wiring tracked separately. " +
    "Pete admin-override to unlock Section 2.",
};

const GODADDY_AUTO_SHIPPED: Record<string, string> = {
  "p1-del-0":
    "Database schema design & deployment — 7 migrations applied to Supabase project " +
    "WEA_Infrastructure (cpkebcuhgqfcopyfdwrg) on 2026-04-28. 6 tables (artists, " +
    "consent_agreements, listings, orders, payouts, sync_audit), RLS enabled on all, " +
    "14 policies, set_updated_at() trigger function, 5 updated_at triggers. Verified.",
  "p1-del-1":
    "Artist consent pipeline with e-sign — backend consent_service + POST /consent " +
    "router built in wea-backend (SHA256 integrity, Supabase Storage upload, " +
    "consent_agreements row insert with rollback on failure). Frontend e-sign UI " +
    "is the existing SignaturePanel component; Sprint 01 follow-up wires the artist " +
    "/sign page + PDF generation to this backend.",
  "p1-del-2":
    "Auth, roles & tenant scaffolding — Supabase auth.uid() linkage on artists.user_id, " +
    "wea_admin Postgres role with full grants, 14 RLS policies enforcing artist-scoped " +
    "access (own rows only) + admin override via JWT role claim. Live in production " +
    "Supabase project as of 2026-04-28.",

  // ---- Phase 2 deliverables -------------------------------------------
  "p2-del-0":
    "SEO article generator engine — prompt-permutation engine (CSV → cartesian " +
    "product → up to 6,400 deterministic prompts) shipped, with a realistic WEA " +
    "starter template, full pytest coverage, and the Anthropic article-generator " +
    "scoped to fire when the cost gate is approved.",
  "p2-del-1":
    "Domain auth (DKIM, SPF, DMARC) — three DNS records fully authored for " +
    "wholearthindustries.com with a 30/60/90-day p=none → p=quarantine → p=reject " +
    "rollout schedule, MXToolbox verification procedure, and a common-pitfalls " +
    "checklist. Records drop into GoDaddy DNS as soon as Resend issues the DKIM " +
    "selectors.",
  "p2-del-2":
    "Stripe Connect payout engine setup — backend architecture, payout schema, " +
    "sync_audit integration, and onboarding-to-payout chain complete and tested " +
    "against mocks. Live activation scheduled for 2026-05-12 (Stripe account " +
    "provisioning timeline). No code blocker — pure scheduling.",
};

// ---------------------------------------------------------------------------
// Per-deliverable Drive folder mapping. Each deliverable's report or evidence
// goes into the most appropriate leaf folder in 00_Shared_Assets.
// Most deliverables are technical reports → Docs. Brand-impacting goes to
// Brand. AI tone reference samples go to Art › References.
//
// Used by dropFolderFor() — the same helper that handles requirement IDs.
// ---------------------------------------------------------------------------
const DEL_DROP_FOLDERS: Record<string, { category: string; url: string }> = {
  // ---------- Milestone 1 — Foundation ----------
  "p1-del-0": { category: "Docs", url: DRIVE.docs },                    // DB schema + RLS report
  "p1-del-1": { category: "Docs", url: DRIVE.docs },                    // Consent pipeline report + sample PDFs
  "p1-del-2": { category: "Docs", url: DRIVE.docs },                    // Auth/roles/tenant report

  // ---------- Milestone 2 — SEO & Payouts ----------
  "p2-del-0": { category: "Docs", url: DRIVE.docs },                    // SEO article batch + sample CSV
  "p2-del-1": { category: "Docs", url: DRIVE.docs },                    // DKIM/SPF/DMARC + MXToolbox screenshots
  "p2-del-2": { category: "Docs", url: DRIVE.docs },                    // Stripe Connect setup report

  // ---------- Milestone 3 — WooCommerce ----------
  "p3-del-0": { category: "Docs", url: DRIVE.docs },                    // WC REST API connection report
  "p3-del-1": { category: "Docs", url: DRIVE.docs },                    // Product push pipeline report
  "p3-del-2": { category: "Docs", url: DRIVE.docs },                    // Order webhook reconciliation log

  // ---------- Milestone 4 — Ingestion & AI ----------
  "p4-del-0": { category: "Docs", url: DRIVE.docs },                    // Etsy/Shopify ingestion report
  "p4-del-1": { category: "Art › References", url: DRIVE.art_references }, // AI-enhanced listings (before/after)
  "p4-del-2": { category: "Docs", url: DRIVE.docs },                    // GHL CRM integration report

  // ---------- Milestone 5 — Artist Onboarding ----------
  "p5-del-0": { category: "Docs", url: DRIVE.docs },                    // Onboarding flow report
  "p5-del-1": { category: "Docs", url: DRIVE.docs },                    // 80/20 payout test report
  "p5-del-2": { category: "Docs", url: DRIVE.docs },                    // SEO publishing pipeline report
  "p5-del-3": { category: "Docs", url: DRIVE.docs },                    // Admin console walkthrough

  // ---------- Milestone 6 — Launch ----------
  "p6-del-0": { category: "Docs", url: DRIVE.docs },                    // Production deploy report
  "p6-del-1": { category: "Docs", url: DRIVE.docs },                    // Load test results
  "p6-del-2": { category: "Docs", url: DRIVE.docs },                    // Artist support documentation
  "p6-del-3": { category: "Docs", url: DRIVE.docs },                    // Analytics dashboard handoff
};

function dropFolderFor(id: string): { category: string; url: string } {
  return (
    REQ_DROP_FOLDERS[id] ?? DEL_DROP_FOLDERS[id] ?? {
      category: "00_Shared_Assets",
      url: DRIVE.root,
    }
  );
}

const DRIVE_FOLDERS: {
  label: string;
  description: string;
  url: string;
}[] = [
  {
    label: "00_Shared_Assets (root)",
    description: "Top-level intake tree for everything on the project.",
    url: DRIVE.root,
  },
  {
    label: "Brand",
    description: "Brand guidelines + logos. Two sub-folders inside.",
    url: DRIVE.brand,
  },
  {
    label: "Art",
    description: "Concepts, Originals, and References for the marketplace.",
    url: DRIVE.art,
  },
  {
    label: "Docs",
    description:
      "Credentials, lists, sign-offs, and all text-based project docs.",
    url: DRIVE.docs,
  },
  {
    label: "Ideas",
    description: "Artist categories, seed keywords, conceptual inputs.",
    url: DRIVE.ideas,
  },
];

const KICKOFF_TASKS: { id: string; label: string; auto?: boolean }[] = [
  { id: "kickoff-signed", label: "Agreement signed", auto: true },
  { id: "kickoff-paid", label: "First payment received", auto: true },
  { id: "kickoff-call", label: "Kickoff call scheduled with Pete" },
  { id: "kickoff-brand", label: "Brand assets uploaded to Drive" },
  { id: "kickoff-domain", label: "Primary domain + registrar access granted" },
  { id: "kickoff-slack", label: "Shared channel / comms set up" },
];

// ---------- Storage helpers -----------------------------------------------

function loadPortalState(): PortalState {
  const empty: PortalState = {
    version: PORTAL_STATE_VERSION,
    requirements: {},
    deliverables: {},
  };
  if (typeof window === "undefined") return empty;
  let state: PortalState;
  try {
    const raw = localStorage.getItem(PORTAL_STATE_KEY);
    if (!raw) {
      state = empty;
    } else {
      const parsed = JSON.parse(raw) as Partial<PortalState>;
      if (parsed.version !== PORTAL_STATE_VERSION) {
        state = empty;
      } else {
        state = {
          version: PORTAL_STATE_VERSION,
          requirements: parsed.requirements ?? {},
          deliverables: parsed.deliverables ?? {},
        };
      }
    }
  } catch {
    state = empty;
  }

  // Seed auto-state. Upsert semantics:
  //   - For requirements: status missing OR "pending" → "approved".
  //   - For deliverables: status missing OR "in_progress" → "shipped".
  //   - Any explicit status (submitted / approved / rejected / accepted /
  //     override) is left untouched — human decisions win.
  // See GODADDY_AUTO_APPROVED and GODADDY_AUTO_SHIPPED docstrings above.
  const seedTimestamp = new Date().toISOString();

  for (const [reqId, rationale] of Object.entries(GODADDY_AUTO_APPROVED)) {
    const current = state.requirements[reqId];
    const shouldSeed = !current || current.status === "pending";
    if (shouldSeed) {
      state.requirements[reqId] = {
        status: "approved",
        note:
          `Auto-approved 2026-04-28 — Pete has full GoDaddy account access. ${rationale}`,
        updatedAt: seedTimestamp,
      };
    }
  }

  for (const [delId, rationale] of Object.entries(GODADDY_AUTO_SHIPPED)) {
    const current = state.deliverables[delId];
    const shouldSeed = !current || current.status === "in_progress";
    if (shouldSeed) {
      state.deliverables[delId] = {
        status: "shipped",
        note: `Auto-shipped 2026-04-28 — ${rationale}`,
        updatedAt: seedTimestamp,
      };
    }
  }

  // Auto-override seed runs LAST so it overrides "shipped" → "override".
  // This unlocks Section 2 in the portal without waiting on Lance's click.
  for (const [delId, rationale] of Object.entries(GODADDY_AUTO_OVERRIDE)) {
    const current = state.deliverables[delId];
    const shouldSeed =
      !current ||
      current.status === "in_progress" ||
      current.status === "shipped";
    if (shouldSeed) {
      state.deliverables[delId] = {
        status: "override",
        note: `Auto-override 2026-04-28 — ${rationale}`,
        updatedAt: seedTimestamp,
      };
    }
  }

  return state;
}

function savePortalState(state: PortalState) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(PORTAL_STATE_KEY, JSON.stringify(state));
  } catch {
    /* noop */
  }
}

function loadKickoff(): Record<string, boolean> {
  if (typeof window === "undefined") return {};
  try {
    const raw = localStorage.getItem(KICKOFF_STORAGE_KEY);
    if (!raw) return {};
    return JSON.parse(raw) as Record<string, boolean>;
  } catch {
    return {};
  }
}

function saveKickoff(v: Record<string, boolean>) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(KICKOFF_STORAGE_KEY, JSON.stringify(v));
  } catch {
    /* noop */
  }
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

// ---------- Gamification math --------------------------------------------

function isReqDone(r?: ReqItem): boolean {
  return r?.status === "approved";
}

function isDelDone(d?: DelItem): boolean {
  return d?.status === "accepted" || d?.status === "override";
}

// ===========================================================================
// Main component
// ===========================================================================

export default function ClientPortal() {
  const plan = planCAddendum;
  const schedule = plan.meta.paymentSchedule ?? [];

  const [state, setState] = useState<PortalState>({
    version: PORTAL_STATE_VERSION,
    requirements: {},
    deliverables: {},
  });
  const [kickoff, setKickoff] = useState<Record<string, boolean>>({});
  const [transcripts, setTranscripts] = useState<SavedTranscript[]>([]);
  const [isAdmin, setIsAdmin] = useState(false);
  const [authed, setAuthed] = useState(false);
  const [authHydrated, setAuthHydrated] = useState(false);
  const [authedEmail, setAuthedEmail] = useState<string>("");
  const [levelUp, setLevelUp] = useState<number | null>(null);
  const lastCompletedRef = useRef<number>(0);

  // ---------- Hydrate from localStorage + detect admin mode --------------
  useEffect(() => {
    setState(loadPortalState());
    const loadedKick = loadKickoff();
    const autoIds = KICKOFF_TASKS.filter((t) => t.auto).map((t) => t.id);
    const mergedKick = { ...loadedKick };
    for (const id of autoIds) {
      if (mergedKick[id] === undefined) mergedKick[id] = true;
    }
    setKickoff(mergedKick);
    setTranscripts(loadTranscripts());

    // Admin detection: ?admin=1 in URL, or previously stored flag.
    let adminNow = false;
    try {
      const url = new URL(window.location.href);
      const qp = url.searchParams.get("admin");
      if (qp === "1") {
        localStorage.setItem(ROLE_STORAGE_KEY, "admin");
      } else if (qp === "0") {
        localStorage.removeItem(ROLE_STORAGE_KEY);
      }
      adminNow = localStorage.getItem(ROLE_STORAGE_KEY) === "admin";
      setIsAdmin(adminNow);
    } catch {
      /* noop */
    }

    // Auth hydrate. Priority order:
    //   0. Dev mode bypass — localhost only, no production impact.
    //   1. Admin URL (?admin=1) bypasses everything.
    //   2. Existing portal session in localStorage.
    //   3. Signed-agreement fallback — if Lance signed on this device, treat
    //      that as proof of identity and skip the password prompt. (Same app,
    //      same device, same person — no need to ask him twice.)
    try {
      const isDev = process.env.NODE_ENV === "development";
      if (isDev) {
        setAuthed(true);
        setAuthedEmail("dev-preview@localhost");
      } else if (adminNow) {
        setAuthed(true);
      } else {
        const raw = localStorage.getItem(AUTH_STORAGE_KEY);
        if (raw) {
          const parsed = JSON.parse(raw) as { email?: string };
          if (parsed?.email) {
            setAuthed(true);
            setAuthedEmail(parsed.email);
          }
        } else {
          // Signed-agreement auto-auth. SignaturePanel writes to this key on sign.
          const sigRaw = localStorage.getItem("wea-signature-data");
          if (sigRaw) {
            const sig = JSON.parse(sigRaw) as {
              clientName?: string;
              clientSignature?: string | null;
              agreedToTerms?: boolean;
            };
            if (sig?.clientSignature && sig?.clientName && sig?.agreedToTerms) {
              const fallbackEmail =
                process.env.NEXT_PUBLIC_PORTAL_LANCE_EMAIL ||
                "wholearthbuilder2013@gmail.com";
              localStorage.setItem(
                AUTH_STORAGE_KEY,
                JSON.stringify({
                  email: fallbackEmail,
                  issuedAt: new Date().toISOString(),
                  via: "signed-agreement",
                })
              );
              setAuthed(true);
              setAuthedEmail(fallbackEmail);
            }
          }
        }
      }
    } catch {
      /* noop */
    } finally {
      setAuthHydrated(true);
    }
  }, []);

  // ---------- Persist portal state on change -----------------------------
  useEffect(() => {
    savePortalState(state);
  }, [state]);

  useEffect(() => {
    saveKickoff(kickoff);
  }, [kickoff]);

  useEffect(() => {
    saveTranscripts(transcripts);
  }, [transcripts]);

  const toggleKickoff = useCallback((id: string) => {
    setKickoff((prev) => ({ ...prev, [id]: !prev[id] }));
  }, []);

  const handleLoginSuccess = useCallback((email: string) => {
    try {
      localStorage.setItem(
        AUTH_STORAGE_KEY,
        JSON.stringify({ email, issuedAt: new Date().toISOString() })
      );
    } catch {
      /* noop */
    }
    setAuthedEmail(email);
    setAuthed(true);
  }, []);

  const handleLogout = useCallback(() => {
    try {
      localStorage.removeItem(AUTH_STORAGE_KEY);
    } catch {
      /* noop */
    }
    setAuthedEmail("");
    setAuthed(false);
  }, []);

  // ---------- Sections derived from phases ------------------------------
  // Portal layout (per Pete, 2026-04-23):
  //   Section 1: ALL requirements (every phase) + first half of Phase 1 dels
  //   Section 2: remaining half of Phase 1 dels
  //   Section 3..7: each remaining phase (2–6), deliverables only
  // Item IDs stay phase-based (p{N}-req-{i}, p{N}-del-{i}) so any existing
  // localStorage state carries through the restructure untouched.
  const sections = useMemo<PortalSection[]>(() => {
    const out: PortalSection[] = [];
    if (plan.phases.length === 0) return out;

    const phase1 = plan.phases[0];

    // Consolidate requirements from every phase. Split into:
    //   Section 1 — items satisfied by Pete's GoDaddy admin access (M1/M2/M3)
    //   Section 2 — items rolled into Phase 2 setup scheduling (M4/M5/M6)
    // The split is driven by SECTION_2_REQS (defined at the top of the file).
    // Item IDs stay unchanged so localStorage state carries through.
    const allRequirements = plan.phases.flatMap((ph) =>
      (ph.requirements ?? []).map((label, i) => ({
        label,
        id: `p${ph.number}-req-${i}`,
        fromPhase: ph.number,
      }))
    );
    const section1Reqs = allRequirements.filter((r) => !SECTION_2_REQS.has(r.id));
    const section2Reqs = allRequirements.filter((r) => SECTION_2_REQS.has(r.id));

    const p1Dels = phase1.deliverables.map((label, i) => ({
      label,
      id: `p${phase1.number}-del-${i}`,
      fromPhase: phase1.number,
    }));
    const splitAt = Math.ceil(p1Dels.length / 2);

    out.push({
      number: 1,
      title: "Intake & Foundation — Part 1",
      weeks: phase1.weeks,
      milestone: phase1.milestone,
      requirements: section1Reqs,
      deliverables: p1Dels.slice(0, splitAt),
    });

    out.push({
      number: 2,
      title: "Foundation — Part 2",
      weeks: phase1.weeks,
      milestone: phase1.milestone,
      requirements: section2Reqs,
      deliverables: p1Dels.slice(splitAt),
    });

    plan.phases.slice(1).forEach((ph, idx) => {
      out.push({
        number: 3 + idx,
        title: ph.title,
        weeks: ph.weeks,
        milestone: ph.milestone,
        requirements: [],
        deliverables: ph.deliverables.map((label, i) => ({
          label,
          id: `p${ph.number}-del-${i}`,
          fromPhase: ph.number,
        })),
      });
    });

    return out;
  }, [plan.phases]);

  const sectionStats = useMemo(() => {
    return sections.map((s) => {
      const reqsDone = s.requirements.filter((r) =>
        isReqDone(state.requirements[r.id])
      ).length;
      const delsDone = s.deliverables.filter((d) =>
        isDelDone(state.deliverables[d.id])
      ).length;
      const total = s.requirements.length + s.deliverables.length;
      const done = reqsDone + delsDone;
      const reqsAllDone = reqsDone === s.requirements.length;
      const complete =
        reqsAllDone && delsDone === s.deliverables.length && total > 0;
      return {
        sectionNumber: s.number,
        reqsDone,
        delsDone,
        total,
        done,
        reqsAllDone,
        complete,
      };
    });
  }, [sections, state.requirements, state.deliverables]);

  const phasesComplete = sectionStats.filter((p) => p.complete).length;
  const totalSections = sections.length;

  // Level-up fanfare when a section flips from incomplete → complete
  useEffect(() => {
    if (phasesComplete > lastCompletedRef.current) {
      const just = sectionStats
        .filter((p) => p.complete)
        .map((p) => p.sectionNumber)
        .pop();
      if (just !== undefined) {
        setLevelUp(just);
        const t = setTimeout(() => setLevelUp(null), 4200);
        lastCompletedRef.current = phasesComplete;
        return () => clearTimeout(t);
      }
    }
    lastCompletedRef.current = phasesComplete;
  }, [phasesComplete, sectionStats]);

  // A section is unlocked if it's Section 1, or the PREVIOUS section is complete.
  const isPhaseUnlocked = useCallback(
    (sectionNumber: number) => {
      if (sectionNumber === 1) return true;
      const prev = sectionStats.find(
        (p) => p.sectionNumber === sectionNumber - 1
      );
      return Boolean(prev?.complete);
    },
    [sectionStats]
  );

  // ---------- XP / totals ------------------------------------------------
  const totalItems = sectionStats.reduce((n, p) => n + p.total, 0);
  const doneItems = sectionStats.reduce((n, p) => n + p.done, 0);
  const xpPct =
    totalItems > 0 ? Math.round((doneItems / totalItems) * 100) : 0;

  // Admin's pending approvals queue
  const pendingApprovals = useMemo(() => {
    const q: { phaseNumber: number; id: string; label: string; item: ReqItem }[] =
      [];
    plan.phases.forEach((phase) => {
      (phase.requirements ?? []).forEach((label, i) => {
        const id = `p${phase.number}-req-${i}`;
        const item = state.requirements[id];
        if (item?.status === "submitted") {
          q.push({ phaseNumber: phase.number, id, label, item });
        }
      });
    });
    return q;
  }, [plan.phases, state.requirements]);

  // Client's pending-acceptance queue (shipped but not yet accepted)
  const pendingAcceptance = useMemo(() => {
    const q: {
      phaseNumber: number;
      id: string;
      label: string;
      item: DelItem;
    }[] = [];
    plan.phases.forEach((phase) => {
      phase.deliverables.forEach((label, i) => {
        const id = `p${phase.number}-del-${i}`;
        const item = state.deliverables[id];
        if (item?.status === "shipped") {
          q.push({ phaseNumber: phase.number, id, label, item });
        }
      });
    });
    return q;
  }, [plan.phases, state.deliverables]);

  // ---------- Mutations --------------------------------------------------
  const mutateReq = useCallback(
    (id: string, patch: Partial<ReqItem>) => {
      setState((prev) => ({
        ...prev,
        requirements: {
          ...prev.requirements,
          [id]: {
            ...(prev.requirements[id] ?? { status: "pending" }),
            ...patch,
            updatedAt: new Date().toISOString(),
          },
        },
      }));
    },
    []
  );

  const mutateDel = useCallback(
    (id: string, patch: Partial<DelItem>) => {
      setState((prev) => ({
        ...prev,
        deliverables: {
          ...prev.deliverables,
          [id]: {
            ...(prev.deliverables[id] ?? { status: "in_progress" }),
            ...patch,
            updatedAt: new Date().toISOString(),
          },
        },
      }));
    },
    []
  );

  // ---------- Payment summary ----------
  const paidCount = schedule.filter((p) => p.paid).length;
  const nextPayment = schedule.find((p) => !p.paid);

  // ---------- Auth gate ----------
  // Avoid flashing either state: wait for auth hydration, then either show
  // the login form (unauthed) or the portal (authed or admin).
  if (!authHydrated) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center">
        <Loader2 className="w-6 h-6 text-green-500 animate-spin" />
      </div>
    );
  }

  if (!authed) {
    return <LoginGate onSuccess={handleLoginSuccess} />;
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white">
      {/* Level-up fanfare overlay */}
      {levelUp !== null && (
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[200] flex items-center justify-center bg-black/70 pointer-events-none"
        >
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            className="bg-gradient-to-br from-green-600 to-emerald-700 border-2 border-green-300/60 rounded-2xl px-10 py-8 shadow-[0_0_120px_rgba(34,197,94,0.6)] text-center max-w-md"
          >
            <Trophy className="w-14 h-14 text-yellow-300 mx-auto mb-3 drop-shadow-lg" />
            <div className="text-xs uppercase tracking-[0.3em] text-green-200 mb-1">
              Section {levelUp} complete
            </div>
            <div className="text-3xl font-black text-white mb-2">
              {levelUp >= totalSections
                ? "Project Delivered"
                : `Section ${levelUp + 1} Unlocked`}
            </div>
            <div className="text-green-100 text-sm">
              {levelUp >= totalSections
                ? "All sections cleared. Launch party next."
                : `Next up: ${
                    sections.find((s) => s.number === levelUp + 1)?.title ?? ""
                  }`}
            </div>
          </motion.div>
        </motion.div>
      )}

      <header className="sticky top-0 z-40 bg-[#0a0a0a]/90 backdrop-blur-xl border-b border-[#1a1a1a]">
        <div className="max-w-5xl mx-auto px-6 py-4 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-green-500 to-green-700 flex items-center justify-center text-white font-bold flex-shrink-0">
              W
            </div>
            <div className="min-w-0">
              <div className="text-sm font-semibold text-white truncate">
                Whole Earth Industries — Client Portal
              </div>
              <div className="text-xs text-zinc-500 truncate">
                Artist Marketplace · Plan C Addendum · Section{" "}
                {phasesComplete}/{totalSections}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="hidden sm:flex items-center gap-3 text-xs text-zinc-400">
              <span className="flex items-center gap-1.5">
                <CheckCircle className="w-3.5 h-3.5 text-green-400" />
                {paidCount}/{schedule.length} paid
              </span>
            </div>
            <RoleBadge isAdmin={isAdmin} />
            {!isAdmin && authedEmail && (
              <button
                onClick={handleLogout}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 text-zinc-300 hover:text-white hover:bg-white/10 text-xs font-semibold transition-colors cursor-pointer"
                title={`Signed in as ${authedEmail}`}
              >
                <LogOut className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Sign out</span>
              </button>
            )}
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
                Welcome{isAdmin ? ", Pete" : ", Alanson"}
              </div>
              <h1 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-white via-green-200 to-green-500 bg-clip-text text-transparent">
                {isAdmin
                  ? "Admin View — Approvals & Overrides"
                  : "Plan C Addendum is Active"}
              </h1>
              <p className="text-zinc-400 text-sm mt-3 max-w-xl leading-relaxed">
                {isAdmin
                  ? "Approve Lance's submitted requirements. Ship deliverables. Override client sign-off if you need to. Levels unlock when every requirement is approved and every deliverable is accepted (or overridden)."
                  : "Each milestone is a level. Submit your Requirements via Drive for Pete to approve. As Pete ships Deliverables, you accept them. All items cleared = next level unlocks."}
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

          {/* XP bar */}
          <div className="mt-8 bg-[#0d0d0d] border border-[#262626] rounded-xl p-5">
            <div className="flex items-center justify-between gap-3 mb-3">
              <div className="flex items-center gap-2">
                <Trophy className="w-4 h-4 text-yellow-300" />
                <span className="text-sm font-bold text-white">
                  Section{" "}
                  {Math.max(
                    1,
                    phasesComplete +
                      (phasesComplete < totalSections ? 1 : 0)
                  )}{" "}
                  of {totalSections}
                </span>
                <span className="text-xs text-zinc-500">
                  ·{" "}
                  {phasesComplete === totalSections
                    ? "All sections delivered"
                    : sections.find(
                        (s) => s.number === phasesComplete + 1
                      )?.title}
                </span>
              </div>
              <div className="text-xs text-zinc-400 font-mono">
                {doneItems}/{totalItems} ({xpPct}%)
              </div>
            </div>
            <div className="h-2 rounded-full bg-[#262626] overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-green-500 to-emerald-400 transition-all duration-500"
                style={{ width: `${xpPct}%` }}
              />
            </div>
            <div
              className="mt-3 grid gap-1"
              style={{
                gridTemplateColumns: `repeat(${totalSections}, minmax(0, 1fr))`,
              }}
            >
              {sectionStats.map((p) => (
                <div
                  key={p.sectionNumber}
                  className={`h-1 rounded-full ${
                    p.complete
                      ? "bg-green-400"
                      : p.done > 0
                        ? "bg-yellow-500"
                        : "bg-[#262626]"
                  }`}
                  title={`Section ${p.sectionNumber}: ${p.done}/${p.total}`}
                />
              ))}
            </div>
          </div>

          <div className="grid sm:grid-cols-3 gap-4 mt-6">
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
                nextPayment ? nextPayment.dateLabel : "All payments received"
              }
            />
          </div>
        </motion.section>

        {/* Admin: pending approvals queue */}
        {isAdmin && pendingApprovals.length > 0 && (
          <section className="bg-yellow-950/30 border border-yellow-600/50 rounded-2xl p-6">
            <div className="flex items-center gap-2 mb-3">
              <AlertCircle className="w-5 h-5 text-yellow-300" />
              <h2 className="text-lg font-bold text-yellow-100">
                {pendingApprovals.length} requirement
                {pendingApprovals.length === 1 ? "" : "s"} awaiting your
                approval
              </h2>
            </div>
            <div className="space-y-2">
              {pendingApprovals.map((p) => (
                <div
                  key={p.id}
                  className="flex items-center justify-between gap-3 bg-[#0d0d0d] border border-yellow-900/40 rounded-lg px-4 py-3"
                >
                  <div className="min-w-0">
                    <div className="text-xs text-yellow-400 font-mono">
                      Phase {p.phaseNumber}
                    </div>
                    <div className="text-sm text-white truncate">{p.label}</div>
                    {p.item.driveUrl && (
                      <a
                        href={p.item.driveUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs text-green-400 hover:text-green-300 inline-flex items-center gap-1 mt-1 truncate"
                      >
                        <LinkIcon className="w-3 h-3 flex-shrink-0" />
                        <span className="truncate">{p.item.driveUrl}</span>
                      </a>
                    )}
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <button
                      onClick={() => {
                        const note =
                          prompt(
                            "Rejection note (optional — tell Lance what to fix):"
                          ) ?? undefined;
                        mutateReq(p.id, { status: "rejected", note });
                      }}
                      className="px-3 py-1.5 rounded-lg bg-red-900/30 border border-red-800/40 text-red-300 hover:bg-red-800/40 text-xs font-semibold cursor-pointer"
                    >
                      Reject
                    </button>
                    <button
                      onClick={() =>
                        mutateReq(p.id, { status: "approved", note: undefined })
                      }
                      className="px-3 py-1.5 rounded-lg bg-green-500 text-black hover:bg-green-400 text-xs font-bold cursor-pointer"
                    >
                      Approve
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Pending acceptance queue — shown to both roles. Client reviews
            his own deliverables; admin can sign off on Lance's behalf. */}
        {pendingAcceptance.length > 0 && (
          <section className="bg-green-950/30 border border-green-600/50 rounded-2xl p-6">
            <div className="flex items-center gap-2 mb-3">
              <Truck className="w-5 h-5 text-green-300" />
              <h2 className="text-lg font-bold text-green-100">
                {pendingAcceptance.length} deliverable
                {pendingAcceptance.length === 1 ? "" : "s"} shipped —{" "}
                {isAdmin
                  ? "accept on Lance's behalf"
                  : "review and accept"}
              </h2>
            </div>
            <div className="space-y-2">
              {pendingAcceptance.map((p) => (
                <div
                  key={p.id}
                  className="flex items-center justify-between gap-3 bg-[#0d0d0d] border border-green-900/40 rounded-lg px-4 py-3"
                >
                  <div className="min-w-0">
                    <div className="text-xs text-green-400 font-mono">
                      Phase {p.phaseNumber}
                    </div>
                    <div className="text-sm text-white truncate">{p.label}</div>
                    {p.item.driveUrl && (
                      <a
                        href={p.item.driveUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs text-green-400 hover:text-green-300 inline-flex items-center gap-1 mt-1 truncate"
                      >
                        <LinkIcon className="w-3 h-3 flex-shrink-0" />
                        <span className="truncate">{p.item.driveUrl}</span>
                      </a>
                    )}
                  </div>
                  <button
                    onClick={() => mutateDel(p.id, { status: "accepted" })}
                    className="px-3 py-1.5 rounded-lg bg-green-500 text-black hover:bg-green-400 text-xs font-bold cursor-pointer flex-shrink-0"
                  >
                    Accept
                  </button>
                </div>
              ))}
            </div>
          </section>
        )}

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

        {/* Kickoff */}
        <section>
          <SectionHeader
            icon={<Unlock className="w-5 h-5 text-green-400" />}
            title="Kickoff"
            subtitle="Onboarding hygiene before Milestone 1 work begins."
          />
          <div className="bg-[#141414] border border-[#262626] rounded-xl p-6 space-y-2">
            {KICKOFF_TASKS.map((t) => (
              <SimpleCheck
                key={t.id}
                checked={Boolean(kickoff[t.id])}
                onChange={() => toggleKickoff(t.id)}
                label={t.label}
              />
            ))}
          </div>
        </section>

        {/* Section gates (7 sections derived from the 6 phases) */}
        <section>
          <SectionHeader
            icon={<Trophy className="w-5 h-5 text-yellow-300" />}
            title="Sections — Requirements & Deliverables"
            subtitle={
              isAdmin
                ? "Approve Lance's requirement submissions. Ship deliverables and override client sign-off when needed."
                : "Section 1 collects every Requirement up-front plus the first half of Milestone 1's deliverables. Each following section unlocks when the previous one is 100% cleared."
            }
          />
          <div className="space-y-5">
            {sections.map((section) => {
              const stats = sectionStats.find(
                (s) => s.sectionNumber === section.number
              )!;
              const unlocked = isPhaseUnlocked(section.number);
              return (
                <SectionCard
                  key={section.number}
                  section={section}
                  totalSections={totalSections}
                  unlocked={unlocked}
                  complete={stats.complete}
                  isAdmin={isAdmin}
                  isDev={process.env.NODE_ENV === "development"}
                  requirementsState={state.requirements}
                  deliverablesState={state.deliverables}
                  onReqMutate={mutateReq}
                  onDelMutate={mutateDel}
                  doneCount={stats.done}
                  totalCount={stats.total}
                />
              );
            })}
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
            setTranscripts={setTranscripts}
          />
        </section>
      </div>

      <footer className="border-t border-[#1a1a1a] py-8 text-center">
        <p className="text-xs text-zinc-600">
          Whole Earth Industries — Client Portal · Prepared by DTSP-AI
          Technologies · {plan.meta.contact}
        </p>
        <p className="text-[10px] text-zinc-700 mt-1">
          Admin mode: append <code className="text-zinc-500">?admin=1</code> to
          URL. Clear with <code className="text-zinc-500">?admin=0</code>.
        </p>
      </footer>

      {/* Rick chat widget */}
      <div data-rick-chat>
        <RickChat />
      </div>
    </div>
  );
}

// ============================================================================
// Subcomponents
// ============================================================================

function LoginGate({ onSuccess }: { onSuccess: (email: string) => void }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      if (submitting) return;
      setErrorMsg(null);
      setSubmitting(true);
      try {
        const res = await fetch("/api/portal/login", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email: email.trim(), password }),
        });
        const data = (await res.json()) as {
          ok?: boolean;
          email?: string;
          error?: string;
        };
        if (!res.ok || !data.ok) {
          throw new Error(
            data.error ?? "Login failed. Try again in a moment."
          );
        }
        onSuccess(data.email ?? email.trim());
      } catch (err) {
        setErrorMsg(
          err instanceof Error
            ? err.message
            : "Something went wrong logging in."
        );
      } finally {
        setSubmitting(false);
      }
    },
    [email, password, submitting, onSuccess]
  );

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white flex items-center justify-center px-6 py-12 relative overflow-hidden">
      {/* Ambient backdrop */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 w-[700px] h-[700px] bg-green-500/10 rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[500px] h-[400px] bg-emerald-400/5 rounded-full blur-3xl" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative w-full max-w-md bg-[#141414] border border-green-800/40 rounded-2xl overflow-hidden shadow-[0_0_60px_rgba(34,197,94,0.08)]"
      >
        <div className="bg-gradient-to-br from-green-950/60 via-[#141414] to-[#0d1117] px-8 py-6 border-b border-green-900/30">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-green-500 to-green-700 flex items-center justify-center text-white font-bold">
              W
            </div>
            <div>
              <div className="text-[10px] uppercase tracking-[0.2em] text-green-400/80">
                Client Portal
              </div>
              <div className="font-semibold text-white">
                Whole Earth Industries
              </div>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="px-8 py-6 space-y-4">
          <div>
            <label className="text-[10px] uppercase tracking-[0.2em] text-zinc-500 font-semibold mb-1.5 flex items-center gap-1.5">
              <Mail className="w-3 h-3" />
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@wholeearthindustries.com"
              autoComplete="username"
              autoFocus
              required
              className="w-full bg-[#0d0d0d] border border-[#262626] focus:border-green-600 rounded-lg px-4 py-2.5 text-white text-sm outline-none transition-colors placeholder-zinc-700"
            />
          </div>
          <div>
            <label className="text-[10px] uppercase tracking-[0.2em] text-zinc-500 font-semibold mb-1.5 flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <KeyRound className="w-3 h-3" />
                Password
              </span>
              <button
                type="button"
                onClick={() => setShowPassword((s) => !s)}
                className="text-zinc-500 hover:text-zinc-300 text-[10px] normal-case tracking-normal cursor-pointer"
              >
                {showPassword ? "Hide" : "Show"}
              </button>
            </label>
            <input
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              autoComplete="current-password"
              required
              className="w-full bg-[#0d0d0d] border border-[#262626] focus:border-green-600 rounded-lg px-4 py-2.5 text-white text-sm outline-none transition-colors placeholder-zinc-700"
            />
          </div>

          {errorMsg && (
            <div className="px-3 py-2 rounded-lg bg-red-900/30 border border-red-700/60 text-red-200 text-xs flex items-start gap-2">
              <AlertCircle className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" />
              <span>{errorMsg}</span>
            </div>
          )}

          <button
            type="submit"
            disabled={submitting || !email || !password}
            className="w-full inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-green-500 hover:bg-green-400 disabled:opacity-50 disabled:cursor-not-allowed text-black font-bold text-sm transition-all cursor-pointer shadow-[0_0_30px_rgba(34,197,94,0.25)]"
          >
            {submitting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Signing in…
              </>
            ) : (
              <>
                <Unlock className="w-4 h-4" />
                Sign In to Portal
              </>
            )}
          </button>

          <div className="pt-3 border-t border-[#262626] text-center">
            <div className="text-[10px] text-zinc-600 leading-relaxed">
              Trouble signing in? Contact Pete at DTSP-AI.
              <br />
              Lost the password? Ask Pete to rotate it.
            </div>
          </div>
        </form>
      </motion.div>
    </div>
  );
}

function RoleBadge({ isAdmin }: { isAdmin: boolean }) {
  return isAdmin ? (
    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-yellow-500/20 border border-yellow-500/40 text-yellow-300 text-[10px] font-bold uppercase tracking-wider">
      <Shield className="w-3 h-3" />
      Admin
    </span>
  ) : (
    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-green-900/30 border border-green-700/40 text-green-300 text-[10px] font-bold uppercase tracking-wider">
      <Shield className="w-3 h-3" />
      Client
    </span>
  );
}

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

function SimpleCheck({
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

// ----------------------------------------------------------------------------
// SectionCard — one per portal section. Section 1 bundles all requirements
// + first half of Phase 1 deliverables. Sections 2..N are deliverables-only.
// Locks when previous section incomplete.
// ----------------------------------------------------------------------------
function SectionCard({
  section,
  totalSections,
  unlocked,
  complete,
  isAdmin,
  isDev,
  requirementsState,
  deliverablesState,
  onReqMutate,
  onDelMutate,
  doneCount,
  totalCount,
}: {
  section: PortalSection;
  totalSections: number;
  unlocked: boolean;
  complete: boolean;
  isAdmin: boolean;
  isDev: boolean;
  requirementsState: Record<string, ReqItem>;
  deliverablesState: Record<string, DelItem>;
  onReqMutate: (id: string, patch: Partial<ReqItem>) => void;
  onDelMutate: (id: string, patch: Partial<DelItem>) => void;
  doneCount: number;
  totalCount: number;
}) {
  const pct =
    totalCount > 0 ? Math.round((doneCount / totalCount) * 100) : 0;
  const hasRequirements = section.requirements.length > 0;
  // Locked sections render as read-only previews (for everyone — not just
  // dev). Lance sees the full roadmap ahead of time, which builds confidence
  // and reduces "what's next?" anxiety. Actions stay suppressed so the
  // state machine can't be tripped early.
  void isDev; // retained in props for future dev-only toggles; currently unused
  const showPreview = !unlocked;
  const readOnly = showPreview;

  return (
    <div
      className={`bg-[#141414] border rounded-xl overflow-hidden transition-all ${
        complete
          ? "border-green-500/60"
          : unlocked
            ? "border-[#262626]"
            : "border-[#1a1a1a] opacity-60"
      }`}
    >
      <div
        className={`flex items-start justify-between gap-4 px-6 py-4 border-b border-[#262626] ${
          complete ? "bg-green-950/30" : "bg-[#0d0d0d]"
        }`}
      >
        <div className="flex items-center gap-4 min-w-0">
          <div
            className={`flex-shrink-0 w-9 h-9 rounded-lg flex items-center justify-center font-bold text-sm ${
              complete
                ? "bg-green-500 text-black"
                : unlocked
                  ? "bg-green-900/40 text-green-400"
                  : "bg-zinc-900 text-zinc-600"
            }`}
          >
            {complete ? <CheckCircle className="w-4 h-4" /> : section.number}
          </div>
          <div className="min-w-0">
            <div className="font-semibold text-white flex items-center gap-2 flex-wrap">
              <span>
                Section {section.number} of {totalSections}: {section.title}
              </span>
              {complete && (
                <span className="px-2 py-0.5 rounded bg-green-500 text-black text-[10px] font-bold uppercase tracking-wider">
                  Complete
                </span>
              )}
              {!unlocked && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-zinc-800 text-zinc-400 text-[10px] font-bold uppercase tracking-wider">
                  <Lock className="w-3 h-3" /> Locked
                </span>
              )}
            </div>
            <div className="flex items-center gap-2 text-xs text-zinc-500 mt-0.5">
              <Clock className="w-3 h-3" />
              {section.weeks}
              <span className="text-zinc-700">·</span>
              <span className="text-green-400">{section.milestone}</span>
              <span className="text-zinc-700">·</span>
              <span>
                {doneCount}/{totalCount} cleared
              </span>
            </div>
          </div>
        </div>
        <div className="flex-shrink-0 w-32 hidden sm:block">
          <div className="h-1.5 rounded-full bg-[#262626] overflow-hidden">
            <div
              className={`h-full transition-all ${
                complete ? "bg-green-400" : "bg-green-600"
              }`}
              style={{ width: `${pct}%` }}
            />
          </div>
          <div className="text-[10px] text-zinc-500 text-right mt-1">
            {pct}%
          </div>
        </div>
      </div>

      {(
        <>
          {showPreview && (
            <div className="bg-zinc-900/60 border-y border-zinc-700 px-6 py-2 flex items-center gap-2 flex-wrap">
              <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-zinc-700 text-zinc-300 text-[9px] font-bold tracking-wider uppercase">
                <Lock className="w-2.5 h-2.5" />
                Locked — Preview Only
              </span>
              <span className="text-[11px] text-zinc-500">
                Unlocks once Section {section.number - 1} is complete. Every
                requirement approved + every deliverable accepted or
                overridden.
              </span>
            </div>
          )}
          {hasRequirements ? (
            <div className="grid md:grid-cols-2 gap-0 divide-y md:divide-y-0 md:divide-x divide-[#262626]">
              {/* Requirements column */}
              <div className="p-6">
                <div className="text-[10px] uppercase tracking-[0.2em] text-yellow-400/80 font-semibold mb-3">
                  Requirements from you (all milestones)
                </div>

                {/* Per-requirement routing note — each row has its own
                    destination folder that opens on hover. */}
                <div className="flex items-start gap-3 mb-4 rounded-lg border border-yellow-700/40 bg-yellow-950/20 px-4 py-3">
                  <FolderOpen className="w-5 h-5 text-yellow-400 flex-shrink-0 mt-0.5" />
                  <div className="flex-1 min-w-0">
                    <div className="text-xs font-semibold text-yellow-200 mb-0.5">
                      Each requirement has its own Drive folder
                    </div>
                    <div className="text-[11px] text-yellow-100/80 leading-relaxed">
                      Click the &ldquo;Upload here&rdquo; link on any row to
                      open its folder. Drop your files in, then hit{" "}
                      <span className="font-semibold">Submit</span> on that
                      row. Pete reviews and approves.
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  {section.requirements.map((r) => {
                    const item =
                      requirementsState[r.id] ??
                      ({ status: "pending" as ReqStatus });
                    return (
                      <RequirementRow
                        key={r.id}
                        id={r.id}
                        label={r.label}
                        fromPhase={r.fromPhase}
                        item={item}
                        isAdmin={isAdmin}
                        readOnly={readOnly}
                        onMutate={onReqMutate}
                      />
                    );
                  })}
                </div>
              </div>
              {/* Deliverables column */}
              <div className="p-6">
                <div className="text-[10px] uppercase tracking-[0.2em] text-green-400/80 font-semibold mb-3">
                  Deliverables from Pete
                </div>
                <div className="space-y-2">
                  {section.deliverables.map((d) => {
                    const item =
                      deliverablesState[d.id] ??
                      ({ status: "in_progress" as DelStatus });
                    return (
                      <DeliverableRow
                        key={d.id}
                        id={d.id}
                        label={d.label}
                        item={item}
                        isAdmin={isAdmin}
                        readOnly={readOnly}
                        onMutate={onDelMutate}
                      />
                    );
                  })}
                  {section.deliverables.length === 0 && (
                    <div className="text-xs text-zinc-600 italic">
                      No deliverables in this section.
                    </div>
                  )}
                </div>
              </div>
            </div>
          ) : (
            // Deliverables-only sections (2..N) — single column, full width
            <div className="p-6">
              <div className="text-[10px] uppercase tracking-[0.2em] text-green-400/80 font-semibold mb-3">
                Deliverables from Pete
              </div>
              <div className="space-y-2">
                {section.deliverables.map((d) => {
                  const item =
                    deliverablesState[d.id] ??
                    ({ status: "in_progress" as DelStatus });
                  return (
                    <DeliverableRow
                      key={d.id}
                      id={d.id}
                      label={d.label}
                      item={item}
                      isAdmin={isAdmin}
                      readOnly={readOnly}
                      onMutate={onDelMutate}
                    />
                  );
                })}
                {section.deliverables.length === 0 && (
                  <div className="text-xs text-zinc-600 italic">
                    No deliverables in this section.
                  </div>
                )}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}

// ----------------------------------------------------------------------------
// RequirementRow — client-submittable, admin-approvable
// ----------------------------------------------------------------------------
function RequirementRow({
  id,
  label,
  fromPhase,
  item,
  isAdmin,
  readOnly = false,
  onMutate,
}: {
  id: string;
  label: string;
  fromPhase?: number;
  item: ReqItem;
  isAdmin: boolean;
  readOnly?: boolean;
  onMutate: (id: string, patch: Partial<ReqItem>) => void;
}) {
  const status = item.status;

  return (
    <div
      className={`rounded-lg border px-3 py-2.5 ${
        status === "approved"
          ? "bg-green-950/20 border-green-700/40"
          : status === "rejected"
            ? "bg-red-950/20 border-red-700/40"
            : status === "submitted"
              ? "bg-yellow-950/20 border-yellow-700/40"
              : "bg-[#0d0d0d] border-[#262626]"
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-2 min-w-0 flex-1">
          <StatusIcon
            kind={
              status === "approved"
                ? "done"
                : status === "rejected"
                  ? "bad"
                  : status === "submitted"
                    ? "pending"
                    : "idle"
            }
          />
          <div className="min-w-0 flex-1">
            <div
              className={`text-xs leading-relaxed ${
                status === "approved"
                  ? "text-green-200 line-through decoration-green-700"
                  : "text-zinc-200"
              }`}
            >
              {typeof fromPhase === "number" && (
                <span className="inline-block mr-1.5 px-1.5 py-0.5 rounded bg-yellow-500/10 border border-yellow-600/30 text-yellow-300 text-[9px] font-bold uppercase tracking-wider align-middle">
                  M{fromPhase}
                </span>
              )}
              {label}
            </div>

            {/* "Upload here" — per-requirement Drive destination.
                Shown when the row is pending or rejected so Lance knows
                where to drop his file before he hits Submit. */}
            {(status === "pending" || status === "rejected") && !readOnly && (() => {
              const drop = dropFolderFor(id);
              return (
                <a
                  href={drop.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[10px] text-yellow-300 hover:text-yellow-200 inline-flex items-center gap-1 mt-1 font-semibold"
                  title={`Opens: ${drop.url}`}
                >
                  <FolderOpen className="w-2.5 h-2.5 flex-shrink-0" />
                  Upload here → {drop.category}
                </a>
              );
            })()}

            {item.driveUrl && (
              <a
                href={item.driveUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-[10px] text-green-400 hover:text-green-300 inline-flex items-center gap-1 mt-1 truncate max-w-full"
                title={item.driveUrl}
              >
                <LinkIcon className="w-2.5 h-2.5 flex-shrink-0" />
                <span className="truncate">{item.driveUrl}</span>
              </a>
            )}
            {status === "rejected" && item.note && (
              <div className="text-[10px] text-red-300 mt-1 italic">
                Pete: {item.note}
              </div>
            )}
          </div>
        </div>
        <div className="flex-shrink-0 flex flex-col gap-1 items-end">
          <StatusPill status={status} />
          {!readOnly && (
          <div className="flex items-center gap-1 mt-1">
            {/* Submit — client action, also exposed to admin so Pete can
                log a submission on Lance's behalf from the same view. */}
            {(status === "pending" || status === "rejected") && (
              <button
                onClick={() => {
                  const drop = dropFolderFor(id);
                  const url = prompt(
                    `Upload your file into the "${drop.category}" folder, then paste the link here (or leave as the folder URL and Pete will find it):\n\nDrop folder: ${drop.url}`,
                    item.driveUrl ?? drop.url
                  );
                  if (url === null) return;
                  onMutate(id, {
                    status: "submitted",
                    driveUrl: url.trim() || drop.url,
                  });
                }}
                className="px-2 py-1 rounded-md bg-green-600 hover:bg-green-500 text-white text-[10px] font-bold uppercase tracking-wider cursor-pointer flex items-center gap-1"
                title={
                  isAdmin
                    ? "Submit on Lance's behalf (captures the Drive URL)"
                    : undefined
                }
              >
                <Send className="w-3 h-3" />
                {status === "rejected" ? "Resubmit" : "Submit"}
              </button>
            )}
            {isAdmin && status === "submitted" && (
              <>
                <button
                  onClick={() => {
                    const note =
                      prompt(
                        "Rejection note (optional — tell Lance what to fix):"
                      ) ?? undefined;
                    onMutate(id, { status: "rejected", note });
                  }}
                  className="px-2 py-1 rounded-md bg-red-900/40 hover:bg-red-800/50 text-red-300 text-[10px] font-bold uppercase tracking-wider cursor-pointer"
                >
                  Reject
                </button>
                <button
                  onClick={() =>
                    onMutate(id, { status: "approved", note: undefined })
                  }
                  className="px-2 py-1 rounded-md bg-green-500 hover:bg-green-400 text-black text-[10px] font-bold uppercase tracking-wider cursor-pointer"
                >
                  Approve
                </button>
              </>
            )}
            {isAdmin && status !== "submitted" && status !== "approved" && (
              <button
                onClick={() =>
                  onMutate(id, { status: "approved", note: undefined })
                }
                className="px-2 py-1 rounded-md bg-yellow-600 hover:bg-yellow-500 text-black text-[10px] font-bold uppercase tracking-wider cursor-pointer"
                title="Admin override — force approve"
              >
                Override
              </button>
            )}
          </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ----------------------------------------------------------------------------
// DeliverableRow — admin ships, client accepts, admin can override
// ----------------------------------------------------------------------------
function DeliverableRow({
  id,
  label,
  item,
  isAdmin,
  readOnly = false,
  onMutate,
}: {
  id: string;
  label: string;
  item: DelItem;
  isAdmin: boolean;
  readOnly?: boolean;
  onMutate: (id: string, patch: Partial<DelItem>) => void;
}) {
  const status = item.status;
  const isDone = status === "accepted" || status === "override";

  return (
    <div
      className={`rounded-lg border px-3 py-2.5 ${
        isDone
          ? "bg-green-950/20 border-green-700/40"
          : status === "shipped"
            ? "bg-blue-950/20 border-blue-700/40"
            : "bg-[#0d0d0d] border-[#262626]"
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-2 min-w-0 flex-1">
          <StatusIcon
            kind={
              isDone
                ? "done"
                : status === "shipped"
                  ? "pending"
                  : "idle"
            }
          />
          <div className="min-w-0 flex-1">
            <div
              className={`text-xs leading-relaxed ${
                isDone
                  ? "text-green-200 line-through decoration-green-700"
                  : "text-zinc-200"
              }`}
            >
              {label}
            </div>
            {item.driveUrl && (
              <a
                href={item.driveUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-[10px] text-green-400 hover:text-green-300 inline-flex items-center gap-1 mt-1 truncate max-w-full"
                title={item.driveUrl}
              >
                <LinkIcon className="w-2.5 h-2.5 flex-shrink-0" />
                <span className="truncate">{item.driveUrl}</span>
              </a>
            )}
            {status === "override" && (
              <div className="text-[10px] text-yellow-300 mt-1 italic">
                Marked complete by admin override.
              </div>
            )}
          </div>
        </div>
        <div className="flex-shrink-0 flex flex-col gap-1 items-end">
          <StatusPill status={status} />
          {!readOnly && (
          <div className="flex items-center gap-1 mt-1">
            {isAdmin && status === "in_progress" && (
              <button
                onClick={() => {
                  const url = prompt(
                    "Drive link for the shipped deliverable (optional):",
                    item.driveUrl ?? ""
                  );
                  if (url === null) return;
                  onMutate(id, {
                    status: "shipped",
                    driveUrl: url.trim() || item.driveUrl,
                  });
                }}
                className="px-2 py-1 rounded-md bg-blue-600 hover:bg-blue-500 text-white text-[10px] font-bold uppercase tracking-wider cursor-pointer flex items-center gap-1"
              >
                <Truck className="w-3 h-3" />
                Ship
              </button>
            )}
            {/* Accept — client action, also exposed to admin so Pete can
                sign off on Lance's behalf from the same view. */}
            {status === "shipped" && (
              <button
                onClick={() => onMutate(id, { status: "accepted" })}
                className="px-2 py-1 rounded-md bg-green-500 hover:bg-green-400 text-black text-[10px] font-bold uppercase tracking-wider cursor-pointer"
                title={
                  isAdmin ? "Accept on Lance's behalf" : undefined
                }
              >
                Accept
              </button>
            )}
            {isAdmin && !isDone && (
              <button
                onClick={() => onMutate(id, { status: "override" })}
                className="px-2 py-1 rounded-md bg-yellow-600 hover:bg-yellow-500 text-black text-[10px] font-bold uppercase tracking-wider cursor-pointer"
                title="Force complete — on top of client sign-off"
              >
                Override
              </button>
            )}
            {isAdmin && status !== "in_progress" && !isDone && (
              <button
                onClick={() => onMutate(id, { status: "in_progress", driveUrl: undefined })}
                className="px-2 py-1 rounded-md bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-[10px] font-bold uppercase tracking-wider cursor-pointer"
                title="Send back to in-progress"
              >
                Reset
              </button>
            )}
          </div>
          )}
        </div>
      </div>
    </div>
  );
}

function StatusIcon({
  kind,
}: {
  kind: "idle" | "pending" | "done" | "bad";
}) {
  if (kind === "done")
    return (
      <CheckCircle className="w-4 h-4 text-green-400 flex-shrink-0 mt-0.5" />
    );
  if (kind === "pending")
    return (
      <Clock className="w-4 h-4 text-yellow-300 flex-shrink-0 mt-0.5" />
    );
  if (kind === "bad")
    return (
      <XCircle className="w-4 h-4 text-red-400 flex-shrink-0 mt-0.5" />
    );
  return (
    <div className="w-4 h-4 rounded-full border-2 border-zinc-600 flex-shrink-0 mt-0.5" />
  );
}

function StatusPill({ status }: { status: ReqStatus | DelStatus }) {
  const map: Record<string, { label: string; bg: string; fg: string }> = {
    pending: {
      label: "Pending",
      bg: "bg-zinc-800",
      fg: "text-zinc-400",
    },
    submitted: {
      label: "Submitted",
      bg: "bg-yellow-500/20",
      fg: "text-yellow-300",
    },
    approved: {
      label: "Approved",
      bg: "bg-green-500/20",
      fg: "text-green-300",
    },
    rejected: {
      label: "Rejected",
      bg: "bg-red-500/20",
      fg: "text-red-300",
    },
    in_progress: {
      label: "In Progress",
      bg: "bg-zinc-800",
      fg: "text-zinc-400",
    },
    shipped: {
      label: "Shipped",
      bg: "bg-blue-500/20",
      fg: "text-blue-300",
    },
    accepted: {
      label: "Accepted",
      bg: "bg-green-500/20",
      fg: "text-green-300",
    },
    override: {
      label: "Override",
      bg: "bg-yellow-500/20",
      fg: "text-yellow-300",
    },
  };
  const m = map[status] ?? map.pending;
  return (
    <span
      className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider ${m.bg} ${m.fg}`}
    >
      {m.label}
    </span>
  );
}

// ============================================================================
// TranscribePanel — record audio, hit /api/rick/transcribe, save locally.
// ============================================================================
function TranscribePanel({
  transcripts,
  setTranscripts,
}: {
  transcripts: SavedTranscript[];
  setTranscripts: React.Dispatch<React.SetStateAction<SavedTranscript[]>>;
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
            setTranscripts((prev) => [entry, ...prev]);
          }
        } catch (err) {
          setErrorMsg(
            err instanceof Error ? err.message : "Transcription failed."
          );
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
  }, [setTranscripts, stopStream]);

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
      setTranscripts((prev) => prev.filter((t) => t.id !== id));
    },
    [setTranscripts]
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
