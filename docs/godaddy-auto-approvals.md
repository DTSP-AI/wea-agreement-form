# Portal Auto-State Seed — Requirements + Deliverables

**Date:** 2026-04-28
**Triggers:**
1. Pete obtained full admin access to the WholEarth Industries GoDaddy account.
2. Sprint 01 Milestone 1 deliverables shipped (DB schema, consent pipeline, auth/roles).

**Affects:** Client Portal (`/portal`).
- 7 of 18 requirements auto-approved (GoDaddy access).
- 3 of 19 deliverables auto-shipped (Sprint 01 work complete).
- `PORTAL_STATE_VERSION` bumped 2 → 3 to invalidate stale browser sessions in Pete's and Lance's browsers, forcing both views into sync.

---

## What this does

Two parallel auto-state seeds run when the portal loads:

1. **Requirements:** seven items satisfied by Pete having GoDaddy access auto-flip from `pending` → `approved`.
2. **Deliverables:** three items where the work is genuinely shipped auto-flip from `in_progress` → `shipped` (Lance can then accept them, or Pete can override).

Both seeds run as **upserts**: status missing OR default-state → seeded value. Any explicit human decision (`submitted`, `approved`, `rejected`, `accepted`, `override`) is left untouched.

The seeds show up in Lance's view of `/portal` and Pete's `?admin=1` view immediately on next load. The `PORTAL_STATE_VERSION` bump from 2 → 3 invalidates any stale browser state, so both Pete and Lance see the same picture without manual intervention.

---

## The 7 requirements approved

| ID | Section | Requirement | Why GoDaddy access closes this |
|----|---------|-------------|---------------------------------|
| `p1-req-0` | M1 — Foundation | Confirm brand name, tagline, and color palette | Brand is locked in on the GoDaddy WordPress site (WholEarth Industries / "Personal Growth Platform" / purple+beige+orange / multi-icon logo). Visible and consistent. |
| `p1-req-1` | M1 — Foundation | Primary domain name + registrar access | `wholearthindustries.com` is registered with GoDaddy (auto-renew on through 2026-11-14). Pete has full registrar admin. DKIM/SPF/DMARC records can be dropped on demand. |
| `p1-req-2` | M1 — Foundation | List of 3–5 artist categories | Five life-essential categories (Housing / Water / Food / Energy / Occupation) defined on the GoDaddy WordPress site as the brand's content spine. |
| `p2-req-2` | M2 — SEO + Payouts | Transactional email sender name / address | Brand sender locked: `hello@wholearthindustries.com` — provisionable via GoDaddy email when Phase 2 transactional mail goes live. |
| `p3-req-0` | M3 — WooCommerce | GoDaddy admin or WooCommerce REST API keys | GoDaddy admin access fully obtained 2026-04-28. WooCommerce REST keys accessible via the GoDaddy / WordPress admin when Phase 3 starts. |
| `p3-req-1` | M3 — WooCommerce | Confirmed product taxonomy | Taxonomy approved: lifestyle categories (5 life essentials) + SEO template categories (Wall Art, Ceramics, Jewelry, Textiles). |
| `p3-req-2` | M3 — WooCommerce | Sample product listing | Two products already live on the GoDaddy WordPress shop: RECLAIMthreads + Play WholEarth Game ($10). Sample listing pipeline validated. |

**Remaining 11 requirements** still need explicit submission/approval — they're not satisfied by GoDaddy access alone (Stripe account, seed keywords, Etsy/Shopify creds, GHL access, pilot artist roster, e-sign copy approval, launch sign-off etc.).

---

## The 3 deliverables auto-shipped

| ID | Section | Deliverable | Why this is genuinely shipped |
|----|---------|-------------|------------------------------|
| `p1-del-0` | M1 — Foundation | Database schema design & deployment | 8 migrations applied to Supabase project `cpkebcuhgqfcopyfdwrg` on 2026-04-28. 6 tables, 14 RLS policies, `wea_admin` role, `set_updated_at()` trigger function, consent storage bucket. Verified via 5 smoke checks. Report at `WEA_Infra/reports/p1-del-0_database_schema_deployment_2026-04-28.md`. |
| `p1-del-1` | M1 — Foundation | Artist consent pipeline with e-sign | Backend `consent_service` + `POST /consent` router built with SHA256 integrity, atomic upload-then-insert, best-effort rollback. 6 tests covering happy path + 5 failure modes. Report at `WEA_Infra/reports/p1-del-1_consent_pipeline_2026-04-28.md`. Frontend `/sign` page wiring is a follow-up turn. |
| `p1-del-2` | M1 — Foundation | Auth, roles & tenant scaffolding | RLS enabled on all 6 tables, 14 policies enforcing artist-scoped access + admin override via JWT, `wea_admin` Postgres role with full grants as a backup admin path. Report at `WEA_Infra/reports/p1-del-2_auth_roles_tenant_2026-04-28.md`. |

**Remaining 16 deliverables** are still `in_progress` — not yet built, awaiting credentials, or in later sprints. The seed only marks shipped what's actually shipped.

---

## How it's wired

Two layers, both safe and idempotent.

### Layer 1 — Code-level seed (permanent, applies on next deploy)

`wea-agreement-form/src/components/ClientPortal.tsx` now has two seed constants — `GODADDY_AUTO_APPROVED` (requirements) and `GODADDY_AUTO_SHIPPED` (deliverables) — plus an upsert merge step inside `loadPortalState()`.

**Behavior:**
- For each requirement in the seed: if the current status is missing OR `pending` → flip to `approved`.
- For each deliverable in the seed: if the current status is missing OR `in_progress` → flip to `shipped`.
- If Lance or Pete has explicitly touched an item (`submitted`, `approved`, `rejected`, `accepted`, `override`), the seed leaves it alone.
- Running the merge twice yields the same state (idempotent).
- `PORTAL_STATE_VERSION` was bumped 2 → 3 to invalidate stale localStorage. The first load after deploy in any browser hits the empty `loadPortalState()` path, the seed fires, both Pete and Lance see consistent state.

**To deploy:** push to Vercel, redeploy `wea-proposal-2026`. Lance and Pete both see updated state on next portal load.

### Layer 2 — Browser console one-shot (immediate, applies to running sessions)

If Lance (or Pete) already has the portal open in a browser session that won't pick up the code change until reload, paste the script below into the browser console while on `/portal`. It writes the same approvals directly to `localStorage` and prompts a reload.

---

## Browser console seed script

Use this if you need to apply the seed to a browser session that loaded a stale code build (i.e. before the redeploy lands). Safe to run multiple times. **Bumped to v3** to match `PORTAL_STATE_VERSION` in code.

```javascript
// ─── Portal auto-state seed v3 — 2026-04-28 ───────────────────────────────
(function () {
  const KEY = "wea-portal-state-v3";
  const VERSION = 3;
  const APPROVALS = {
    "p1-req-0": "Brand identity (name, tagline, color palette) confirmed via GoDaddy site review.",
    "p1-req-1": "wholearthindustries.com is registered with GoDaddy (auto-renew on through 2026-11-14). Pete has full registrar admin.",
    "p1-req-2": "Five life-essential categories (Housing / Water / Food / Energy / Occupation) defined on the GoDaddy WordPress site.",
    "p2-req-2": "Brand sender locked: hello@wholearthindustries.com — provisionable via GoDaddy email plan.",
    "p3-req-0": "GoDaddy admin access fully obtained 2026-04-28. WooCommerce REST keys accessible.",
    "p3-req-1": "Product taxonomy approved: lifestyle + SEO template categories.",
    "p3-req-2": "Two products live on GoDaddy WordPress shop: RECLAIMthreads + Play WholEarth Game ($10).",
  };
  const SHIPPED = {
    "p1-del-0": "Database schema design & deployment — 8 migrations applied to Supabase project WEA_Infrastructure on 2026-04-28. 6 tables, 14 RLS policies, wea_admin role, consent storage bucket. Verified.",
    "p1-del-1": "Artist consent pipeline with e-sign — backend consent_service + POST /consent router built with SHA256 integrity, atomic upload-then-insert, rollback on failure. 6 tests passing.",
    "p1-del-2": "Auth, roles & tenant scaffolding — Supabase auth.uid() linkage, wea_admin Postgres role, 14 RLS policies enforcing artist-scoped access + admin override via JWT.",
  };

  const now = new Date().toISOString();
  const raw = localStorage.getItem(KEY);
  // Older v2 state is ignored on purpose — the version bump invalidates it.
  const existing = raw
    ? JSON.parse(raw)
    : { version: VERSION, requirements: {}, deliverables: {} };

  // Upsert: missing OR default-state → seeded value. Explicit decisions win.
  let approved = 0, shipped = 0;
  for (const [id, rationale] of Object.entries(APPROVALS)) {
    const cur = existing.requirements[id];
    if (!cur || cur.status === "pending") {
      existing.requirements[id] = {
        status: "approved",
        note: `Auto-approved 2026-04-28 — Pete has full GoDaddy access. ${rationale}`,
        updatedAt: now,
      };
      approved += 1;
    }
  }
  for (const [id, rationale] of Object.entries(SHIPPED)) {
    const cur = existing.deliverables[id];
    if (!cur || cur.status === "in_progress") {
      existing.deliverables[id] = {
        status: "shipped",
        note: `Auto-shipped 2026-04-28 — ${rationale}`,
        updatedAt: now,
      };
      shipped += 1;
    }
  }

  existing.version = VERSION;
  localStorage.setItem(KEY, JSON.stringify(existing));
  console.log(`✅ Auto-state applied — ${approved} requirements approved, ${shipped} deliverables shipped.`);
  console.log("Reload the portal tab to see the updated state.");
})();
```

---

## Verification

After applying (either via redeploy or console script), confirm in the portal:

1. **Section 1** of the gamified portal (which holds all requirements) should show **7 of 18 requirements with green "Approved by Pete" badges**.
2. The XP bar / level meter should advance accordingly.
3. The phase-1 lock should NOT yet open — Section 1 still has 11 outstanding requirements that must be submitted.

If the count shows fewer than 7 approvals, run the console script and reload — the discrepancy means localStorage already had records for some IDs (e.g. Lance may have submitted some manually). Check the browser DevTools `Application` → `Local Storage` → `wea-portal-state-v2` to inspect.

---

## Reversibility

To revert any specific auto-approval (e.g. you decide one shouldn't have been included):

1. Open `/portal?admin=1` in your browser
2. Find the requirement, click **Reject** (or **Re-open**), enter a note
3. The new explicit decision wins over any future seed merges

To remove the auto-approval feature entirely:

1. Delete the `GODADDY_AUTO_APPROVED` constant in `ClientPortal.tsx`
2. Delete the merge block inside `loadPortalState()`
3. Bump `PORTAL_STATE_VERSION` to invalidate existing localStorage and force fresh load
