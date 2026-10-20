// ============================================================================
// Portal notices — pure derivation of the next payment due and the open
// client action items. Shared by the portal's Due Next card and its toasts,
// so the two can never disagree. Twin of the Haul proposal's lib/notify.ts.
// ============================================================================

import type { ProposalMeta } from "@/lib/proposal-data";

export const TOAST_DUE_SOON_DAYS = 7;
const BUSINESS_TZ = "America/New_York";

export interface PaymentDue {
  amount: string;
  isoDate: string;
  dateLabel: string;
  tag?: string;
  /** Short name for notice copy, e.g. "Monthly maintenance retainer". */
  label: string;
}

export type NoticeKind = "overdue" | "due-soon" | "action";

export interface PortalNotice {
  kind: NoticeKind;
  /** Stable per event — used to remember a dismissal. */
  key: string;
  title: string;
  text: string;
  /** Element id the toast scrolls to. */
  anchor: string;
}

/** Today's calendar date in the business timezone, YYYY-MM-DD. */
export function todayISO(now: Date = new Date()): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: BUSINESS_TZ }).format(now);
}

function toUTC(iso: string): number {
  const [y, m, d] = iso.split("-").map(Number);
  return Date.UTC(y, m - 1, d);
}

export function daysBetween(fromISO: string, toISO: string): number {
  return Math.round((toUTC(toISO) - toUTC(fromISO)) / 86_400_000);
}

/** "2026-10-01" → "Thu, Oct 01 2026" — same shape as the schedule's dateLabel. */
export function dateLabel(iso: string): string {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: "UTC",
    weekday: "short",
    month: "short",
    day: "2-digit",
    year: "numeric",
  }).formatToParts(new Date(toUTC(iso)));
  const get = (t: string) => parts.find((p) => p.type === t)?.value ?? "";
  return `${get("weekday")}, ${get("month")} ${get("day")} ${get("year")}`;
}

function addMonth(iso: string): string {
  const [y, m, d] = iso.split("-").map(Number);
  const next = new Date(Date.UTC(y, m, d));
  return next.toISOString().slice(0, 10);
}

function addDays(iso: string, days: number): string {
  return new Date(toUTC(iso) + days * 86_400_000).toISOString().slice(0, 10);
}

/** Which occurrence of its weekday this date is within its month (1–5). */
function weekdayOrdinalInMonth(iso: string): number {
  return Math.ceil(Number(iso.slice(8, 10)) / 7);
}

/** Weekly installment due dates: every 7 days from `firstDueIso`, keeping
 *  only the first `perMonth` occurrences of that weekday in each calendar
 *  month (a fifth Friday is skipped so the month totals exactly
 *  `perMonth × amount`). Returns the first `count` dates strictly after
 *  `afterIso` (or from `firstDueIso` when `afterIso` is null). */
export function weeklyInstallmentDates(
  firstDueIso: string,
  perMonth: number,
  count: number,
  afterIso: string | null = null
): string[] {
  const out: string[] = [];
  let d = firstDueIso;
  while (out.length < count) {
    const skip =
      weekdayOrdinalInMonth(d) > perMonth || (afterIso !== null && d <= afterIso);
    if (!skip) out.push(d);
    d = addDays(d, 7);
  }
  return out;
}

/** The oldest payment not yet received: the first open scheduled payment,
 *  otherwise the retainer — its monthly draw until that is received, then
 *  the next weekly installment after the last one received (or the next
 *  retainer month when the plan has no weekly installments). */
export function nextPaymentDue(meta: ProposalMeta): PaymentDue | null {
  const open = (meta.paymentSchedule ?? []).find((p) => !p.paid);
  if (open) {
    return {
      amount: open.amount,
      isoDate: open.isoDate,
      dateLabel: open.dateLabel,
      tag: open.tag,
      label: "Scheduled payment",
    };
  }
  const r = meta.retainer;
  if (!r) return null;
  if (r.paidThroughIso && r.weekly) {
    const w = r.weekly;
    const [isoDate] = weeklyInstallmentDates(
      w.firstDueIso,
      w.perMonth,
      1,
      w.paidThroughIso ?? null
    );
    return {
      amount: w.amount,
      isoDate,
      dateLabel: dateLabel(isoDate),
      tag: w.label,
      label: w.label,
    };
  }
  const isoDate = r.paidThroughIso ? addMonth(r.paidThroughIso) : r.firstDueIso;
  return {
    amount: r.amount,
    isoDate,
    dateLabel: dateLabel(isoDate),
    tag: r.label,
    label: r.label,
  };
}

function whenText(days: number): string {
  if (days === 0) return "today";
  if (days === 1) return "tomorrow";
  return `in ${days} days`;
}

/** Notices in display order: the next payment (past due, or due within the
 *  week), then every open client action. */
export function portalNotices(meta: ProposalMeta, today: string): PortalNotice[] {
  const out: PortalNotice[] = [];

  const due = nextPaymentDue(meta);
  let payment: PortalNotice | null = null;
  if (due) {
    const days = daysBetween(today, due.isoDate);
    if (days < 0) {
      payment = {
        kind: "overdue",
        key: `wea-overdue-${due.isoDate}`,
        title: "Payment past due",
        text: `${due.label} — ${due.amount} was due ${due.dateLabel}.`,
        anchor: "payment-schedule",
      };
    } else if (days <= TOAST_DUE_SOON_DAYS) {
      payment = {
        kind: "due-soon",
        key: `wea-due-soon-${due.isoDate}`,
        title: days === 0 ? "Payment due today" : "Payment coming up",
        text: `${due.label} — ${due.amount} due ${due.dateLabel} (${whenText(days)}).`,
        anchor: "payment-schedule",
      };
    }
  }

  if (payment) out.push(payment);
  for (const a of meta.clientActions ?? []) {
    if (a.resolved) continue;
    out.push({
      kind: "action",
      key: `wea-action-${a.id}`,
      title: a.title,
      text: a.detail,
      anchor: "due-next",
    });
  }
  return out;
}
