import { addDays, addMonths, daysBetween, monthsBetween, type ISODate } from "./dates";
import type { AppData, Bill, Frequency, ItemKind, Occurrence, Settlement } from "./types";

export const kindOf = (bill: Bill): ItemKind => bill.kind ?? "bill";

export type OccurrenceState = "paid" | "skipped" | "overdue" | "today" | "upcoming";

/** Drives the row styling and the calendar dots. */
export function occurrenceState(o: Occurrence, today: ISODate): OccurrenceState {
  if (o.settlement) return o.settlement.status;
  return o.due < today ? "overdue" : o.due === today ? "today" : "upcoming";
}

export function settledLabel(bill: Bill, status: Settlement["status"]): string {
  if (status === "skipped") return "Skipped";
  return kindOf(bill) === "income" ? "Received" : "Paid";
}

type Step = { unit: "day" | "month"; size: number };

// Every repeating frequency must have an explicit step: adding a Frequency without
// one is a type error, so nothing can silently fall back to "+1 month".
const STEPS: Record<Exclude<Frequency, "once">, Step> = {
  weekly: { unit: "day", size: 7 },
  fortnightly: { unit: "day", size: 14 },
  monthly: { unit: "month", size: 1 },
  quarterly: { unit: "month", size: 3 },
  "half-yearly": { unit: "month", size: 6 },
  yearly: { unit: "month", size: 12 },
};

export const FREQUENCY_LABELS: Record<Frequency, string> = {
  once: "One-off",
  weekly: "Weekly",
  fortnightly: "Fortnightly",
  monthly: "Monthly",
  quarterly: "Quarterly",
  "half-yearly": "Half-yearly",
  yearly: "Yearly",
};

const PER_MONTH: Record<Frequency, number> = {
  once: 0,
  weekly: 52 / 12,
  fortnightly: 26 / 12,
  monthly: 1,
  quarterly: 1 / 3,
  "half-yearly": 1 / 6,
  yearly: 1 / 12,
};

export function monthlyEquivalent(bill: Bill): number {
  return bill.amount * PER_MONTH[bill.frequency];
}

/** The n-th due date, always computed from the anchor so month-end dates never drift. */
export function occurrence(bill: Bill, n: number): ISODate {
  if (bill.frequency === "once") return bill.anchor;
  const step = STEPS[bill.frequency];
  return step.unit === "day"
    ? addDays(bill.anchor, n * step.size)
    : addMonths(bill.anchor, n * step.size);
}

function firstIndexOnOrAfter(bill: Bill, date: ISODate): number {
  if (date <= bill.anchor || bill.frequency === "once") return 0;
  const step = STEPS[bill.frequency];
  let n =
    step.unit === "day"
      ? Math.floor(daysBetween(bill.anchor, date) / step.size)
      : Math.floor(monthsBetween(bill.anchor, date) / step.size);
  while (occurrence(bill, n) < date) n++;
  return n;
}

/** Due dates of `bill` within [from, to], inclusive. */
export function occurrencesBetween(bill: Bill, from: ISODate, to: ISODate): ISODate[] {
  const last = bill.endDate && bill.endDate < to ? bill.endDate : to;
  if (bill.frequency === "once")
    return bill.anchor >= from && bill.anchor <= last ? [bill.anchor] : [];
  const dates: ISODate[] = [];
  for (let n = firstIndexOnOrAfter(bill, from); ; n++) {
    const due = occurrence(bill, n);
    if (due > last) break;
    dates.push(due);
  }
  return dates;
}

const key = (billId: string, due: ISODate) => `${billId}|${due}`;

export function indexSettlements(settlements: Settlement[]): Map<string, Settlement> {
  return new Map(settlements.map((s) => [key(s.billId, s.due), s]));
}

/** The earliest unsettled due date, or null once the series has ended and is fully settled. */
export function nextDue(bill: Bill, index: Map<string, Settlement>): ISODate | null {
  const limit = bill.frequency === "once" ? 1 : 10_000;
  for (let n = 0; n < limit; n++) {
    const due = occurrence(bill, n);
    if (bill.endDate && due > bill.endDate) return null;
    if (!index.has(key(bill.id, due))) return due;
  }
  return null;
}

const byDue = (a: Occurrence, b: Occurrence) =>
  a.due.localeCompare(b.due) || a.bill.name.localeCompare(b.bill.name);

export function occurrencesInRange(data: AppData, from: ISODate, to: ISODate): Occurrence[] {
  const index = indexSettlements(data.settlements);
  return data.bills
    .flatMap((bill) =>
      occurrencesBetween(bill, from, to).map((due) => ({
        bill,
        due,
        settlement: index.get(key(bill.id, due)),
      })),
    )
    .sort(byDue);
}

export function overdue(data: AppData, today: ISODate, kind: ItemKind = "bill"): Occurrence[] {
  const index = indexSettlements(data.settlements);
  const yesterday = addDays(today, -1);
  return data.bills
    .filter((bill) => kindOf(bill) === kind)
    .flatMap((bill) =>
      occurrencesBetween(bill, bill.anchor, yesterday)
        .filter((due) => !index.has(key(bill.id, due)))
        .map((due) => ({ bill, due })),
    )
    .sort(byDue);
}

export function recentlySettled(data: AppData, since: ISODate): Occurrence[] {
  const bills = new Map(data.bills.map((b) => [b.id, b]));
  return data.settlements
    .filter((s) => s.settledOn >= since && bills.has(s.billId))
    .map((s) => ({ bill: bills.get(s.billId)!, due: s.due, settlement: s }))
    .sort((a, b) => b.settlement.settledOn.localeCompare(a.settlement.settledOn) || byDue(a, b));
}
