// QA for the maintenance-retainer payment math and the portal's next-payment
// derivation. Runs the real TypeScript module under Node's native type
// stripping (Node 22.6+). Run: npm run qa:retainer
// Fails loudly (exit 1) on any violated assertion.

import {
  nextPaymentDue,
  portalNotices,
  weeklyInstallmentDates,
} from "../src/lib/portal-notices.ts";
import type { ProposalMeta } from "../src/lib/proposal-data.ts";

let failures = 0;
const assert = (cond: boolean, name: string) => {
  if (cond) console.log("  PASS  " + name);
  else {
    failures++;
    console.error("  FAIL  " + name);
  }
};

console.log("\n== Arithmetic ==");
assert(4 * 562.5 === 2250, "4 × $562.50 = $2,250 — the weekly split equals the monthly retainer exactly");
assert(2250 / 4 === 562.5, "$2,250 / 4 = $562.50 with no rounding");

console.log("\n== Friday installment calendar ==");
const friday = (iso: string) => new Date(iso + "T00:00:00Z").getUTCDay() === 5;
assert(friday("2026-11-06"), "Nov 6, 2026 is a Friday");
const first8 = weeklyInstallmentDates("2026-11-06", 4, 8);
assert(
  first8.join(",") ===
    "2026-11-06,2026-11-13,2026-11-20,2026-11-27,2026-12-04,2026-12-11,2026-12-18,2026-12-25",
  "First eight installments: Nov 6/13/20/27 and Dec 4/11/18/25, 2026"
);
assert(first8.every(friday), "Every generated installment lands on a Friday");
const jan = weeklyInstallmentDates("2026-11-06", 4, 12).filter((d) => d.startsWith("2027-01"));
assert(
  jan.join(",") === "2027-01-01,2027-01-08,2027-01-15,2027-01-22",
  "January 2027 bills its first four Fridays and skips the fifth (Jan 29)"
);
assert(
  !weeklyInstallmentDates("2026-11-06", 4, 20).includes("2027-01-29"),
  "The fifth Friday (Jan 29, 2027) is never billed — the month stays at 4 × $562.50"
);
assert(
  weeklyInstallmentDates("2026-11-06", 4, 1, "2026-11-13")[0] === "2026-11-20",
  "After the Nov 13 installment is received, the next due is Nov 20"
);

console.log("\n== Portal next-payment derivation ==");
const meta = (overrides: Partial<NonNullable<ProposalMeta["retainer"]>> = {}) =>
  ({
    paymentSchedule: [
      { dateLabel: "x", isoDate: "2026-09-01", amount: "$2,570", paid: true },
    ],
    retainer: {
      amount: "$2,250",
      label: "Monthly maintenance retainer — October 2026",
      firstDueIso: "2026-10-20",
      weekly: {
        amount: "$562.50",
        label: "Weekly maintenance installment",
        firstDueIso: "2026-11-06",
        perMonth: 4,
      },
      ...overrides,
    },
  }) as unknown as ProposalMeta;

const octOpen = nextPaymentDue(meta());
assert(
  octOpen?.amount === "$2,250" && octOpen.isoDate === "2026-10-20",
  "Before October is received: $2,250 due Oct 20, 2026"
);
assert(
  portalNotices(meta(), "2026-10-20")[0]?.title === "Payment due today",
  "On Oct 20 the portal toast reads 'Payment due today' for the $2,250"
);
const afterOct = nextPaymentDue(meta({ paidThroughIso: "2026-10-20" }));
assert(
  afterOct?.amount === "$562.50" && afterOct.isoDate === "2026-11-06",
  "Once October is received: $562.50 due Fri Nov 6, 2026"
);
assert(afterOct?.dateLabel === "Fri, Nov 06 2026", "Next-payment label reads 'Fri, Nov 06 2026'");
const afterNov13 = nextPaymentDue(
  meta({
    paidThroughIso: "2026-10-20",
    weekly: {
      amount: "$562.50",
      label: "Weekly maintenance installment",
      firstDueIso: "2026-11-06",
      perMonth: 4,
      paidThroughIso: "2026-11-13",
    },
  })
);
assert(afterNov13?.isoDate === "2026-11-20", "Two installments received → next is Nov 20");
const overdue = portalNotices(meta({ paidThroughIso: "2026-10-20" }), "2026-11-09");
assert(
  overdue[0]?.kind === "overdue" && overdue[0].text.includes("$562.50"),
  "A missed Friday installment surfaces as a past-due toast for $562.50"
);

console.log("");
if (failures > 0) {
  console.error(`${failures} assertion(s) FAILED`);
  process.exit(1);
}
console.log("All retainer assertions passed.");
