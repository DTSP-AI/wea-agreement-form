// QA assertions for Plan A Addendum 3 — agreement integrity, not compilation.
// Run: npm run qa:a3
// Fails loudly (exit 1) on any violated assertion.

import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const read = (p) => readFileSync(join(root, p), "utf8");

const data = read("src/lib/proposal-data.ts");
const sigPanel = read("src/components/SignaturePanel.tsx");
const portal = read("src/components/ClientPortal.tsx");
const content = read("src/components/ProposalContent.tsx");

let failures = 0;
const assert = (cond, name) => {
  if (cond) {
    console.log("  PASS  " + name);
  } else {
    failures++;
    console.error("  FAIL  " + name);
  }
};

// ---------- Slice out the A3 region of proposal-data.ts ----------
const a3Start = data.indexOf("PLAN A3");
const a3End = data.indexOf("export const plans");
const a3 = data.slice(a3Start, a3End);
assert(a3Start > 0 && a3End > a3Start, "A3 block located in proposal-data.ts");

const sheetsStart = a3.indexOf("planA3ScopeSheets");
const recordsStart = a3.indexOf("WholEarthRecords — Artist Platform", sheetsStart);
const sheetsEnd = a3.indexOf("planA3FinePrint");
const industriesSheet = a3.slice(sheetsStart, recordsStart);
const recordsSheet = a3.slice(recordsStart, sheetsEnd);

console.log("\n== Entity & IP language ==");
assert(!/Whole Earth /.test(a3), "A3 block never uses 'Whole Earth' (with space)");
assert(a3.includes("WholEarth-Commerce LLC d/b/a WholEarth Industries"), "Exact identity: WholEarth-Commerce LLC d/b/a WholEarth Industries");
assert(a3.includes("WholEarth Records LLC"), "Exact identity: WholEarth Records LLC");
assert(a3.includes("DTSP-AI Technologies LLC"), "Exact identity: DTSP-AI Technologies LLC");
assert(a3.includes("6. Order of precedence"), "Fine print carries the order-of-precedence clause");
assert(
  ["1. Ownership of deliverables", "2. Architecture carve-out", "3. Embedded-use license", "4. Separate licensing agreement", "5. Right to build"].every((c) => a3.includes(c)),
  "All five licensing clauses present and numbered"
);
assert(a3.includes("governed exclusively by the Proprietary Architecture & Licensing section"), "termsSummary defers to fine print by reference (no independent ownership summary)");
assert(sigPanel.includes("incorporated by reference and controls over any"), "Checkbox incorporates fine print by reference");
assert(!sigPanel.includes("belong to Whole"), "Checkbox no longer independently summarizes ownership");

console.log("\n== Scope boundaries (Industries vs Records) ==");
assert(industriesSheet.includes("owns eco-commerce and the vendor-first professional community"), "Industries owns eco-commerce + vendor-first professional community");
assert(recordsSheet.includes("music-only"), "Records is declared music-only");
assert(recordsSheet.includes("does not include general culture or non-music creators, vendor networking, or the Industries social platform"), "Records explicitly excludes general culture / non-music creators / vendor networking / Industries social");
assert(recordsSheet.includes("revenue-first ordering applies only within the Records scope"), "Revenue-first scoped to Records only");
assert(!/revenue-first/i.test(industriesSheet), "Industries sheet carries no revenue-first language");
assert(industriesSheet.includes("nothing in this agreement re-sequences it behind WholEarth Records"), "Boundary states Records does not launch ahead of the built Industries marketplace");
assert(!/Milestone /.test(industriesSheet) && !/Milestone /.test(recordsSheet), "No M1-M7 milestone language leaks into the scope sheets");

console.log("\n== Payment arithmetic ==");
const schedStart = a3.indexOf("planA3Schedule");
const schedEnd = a3.indexOf("];", schedStart);
const sched = a3.slice(schedStart, schedEnd);
const amounts = [...sched.matchAll(/amount: "\$([\d,]+)"/g)].map((m) => Number(m[1].replace(/,/g, "")));
const total = amounts.reduce((a, b) => a + b, 0);
assert(amounts.length === 5, "Exactly five scheduled payments");
assert(total === 18920, `Scheduled payments sum to $18,920 (got $${total.toLocaleString()})`);
const paidRows = [...sched.matchAll(/paid: true/g)].length;
assert(paidRows === 3, "Exactly three payments marked paid (core build)");
const paidSum = amounts.slice(0, 3).reduce((a, b) => a + b, 0);
assert(paidSum === 12600, "Paid core-build rows sum to $12,600");
assert(13500 - paidSum === 900, "Received $13,500 − $12,600 applied = $900 credit");
assert(3750 - 900 === 2850, "Sep 1: $3,750 − $900 credit = $2,850 due");
assert(2850 + 2570 === 5420, "Remaining balance $5,420 = $2,850 + $2,570");
const aug1Rows = [...sched.matchAll(/2026-08-01/g)].length;
assert(aug1Rows === 1, "Jul 20 + Jul 27 split maps to ONE Aug 1 row (never double-counted)");
const ledger = a3.slice(a3.indexOf("planA3BalanceLedger"), a3.indexOf("export const planA3"));
assert(ledger.includes('"$13,500"') && ledger.includes('"$5,420"') && ledger.includes('"$900"'), "Ledger states applied total, credit, and remaining balance explicitly");
assert(ledger.includes("NOT part of the $18,920"), "Prior-plan $4,500 separately identified and excluded from the A3 total");

console.log("\n== Payment status is internal-only ==");
assert(a3.includes("paymentStatusInternal: true"), "A3 flags payment status as internal");
assert(content.includes("!proposalMeta.paymentStatusInternal"), "Proposal page suppresses PAID badges when internal");
assert(portal.includes("balanceLedger"), "Portal renders the balance ledger (Lance's side)");
assert(!a3.includes("received in full — $13,500"), "Client-facing banner/footnote carries no payment-status claims");

console.log("\n== Signature & acceptance record ==");
assert(!sigPanel.includes("Artist\n            Marketplace Platform") && !sigPanel.includes("Artist Marketplace Platform project"), "No hardcoded 'Artist Marketplace Platform' signature header");
assert(a3.includes("Scope Acceptance — Plan A Addendum 3: WholEarth Industries and WholEarth Records"), "A3 signature heading generated from plan metadata");
assert(sigPanel.includes("sha256Hex") && sigPanel.includes("canonicalDocument"), "Acceptance record hashes the canonical document");
assert(sigPanel.includes("signedAtIso") && sigPanel.includes("representedEntity") && sigPanel.includes("termsVersion"), "Acceptance record carries timestamp, entity, and terms version");
assert(sigPanel.includes("submittedRef"), "Double-submit idempotency guard present");
assert(a3.includes('termsVersion: "A3-'), "A3 declares a terms version");

console.log("\n== Portal contradiction guard ==");
assert(portal.includes("LEGACY_CHECKLIST_VISIBLE = false"), "Legacy M1-M7 checklist suppressed");
assert(portal.includes("/plan_a_addendum_3#scope"), "Portal points to the A3 Scope of Work as source of truth");

console.log("\n== Corp filing separation ==");
const corpScope = read("src/components/CorpStructureScope.tsx");
assert(!corpScope.includes("plan_a_addendum_3") && !corpScope.includes("planA3"), "Corp structure scope has no A3 references");
assert(!a3.includes("corp-structure-scope") && !a3.includes("corp-formation"), "A3 has no corp-filing references");

console.log("");
if (failures > 0) {
  console.error(`${failures} assertion(s) FAILED`);
  process.exit(1);
}
console.log("All A3 agreement-integrity assertions passed.");
