import { monthRange, type YearMonth } from "./dates";
import { kindOf, occurrencesInRange } from "./recurrence";
import type { AppData, Expense, Occurrence } from "./types";

const amountOf = (o: Occurrence) => o.settlement?.amount ?? o.bill.amount;
const sum = (items: Occurrence[]) => items.reduce((total, o) => total + amountOf(o), 0);

export function expensesInMonth(data: AppData, month: YearMonth): Expense[] {
  const [from, to] = monthRange(...month);
  return data.expenses
    .filter((e) => e.date >= from && e.date <= to)
    .sort((a, b) => b.date.localeCompare(a.date) || a.name.localeCompare(b.name));
}

/** Totals for one month. Skipped occurrences count as neither due nor paid. */
export function monthSummary(data: AppData, month: YearMonth) {
  const occurrences = occurrencesInRange(data, ...monthRange(...month)).filter(
    (o) => o.settlement?.status !== "skipped",
  );
  const bills = occurrences.filter((o) => kindOf(o.bill) === "bill");
  const income = occurrences.filter((o) => kindOf(o.bill) === "income");
  const paidBills = bills.filter((o) => o.settlement);
  const spent = expensesInMonth(data, month).reduce((total, e) => total + e.amount, 0);
  const billsDue = sum(bills);
  const incomeExpected = sum(income);

  return {
    billCount: bills.length,
    billsPaidCount: paidBills.length,
    billsDue,
    billsPaid: sum(paidBills),
    incomeExpected,
    incomeReceived: sum(income.filter((o) => o.settlement)),
    spent,
    net: incomeExpected - billsDue - spent,
  };
}

/** Totals per category, largest first. */
export function byCategory<T extends { category: string; amount: number }>(items: T[]) {
  const totals = new Map<string, number>();
  for (const item of items) {
    const category = item.category || "Uncategorised";
    totals.set(category, (totals.get(category) ?? 0) + item.amount);
  }
  return [...totals].map(([category, total]) => ({ category, total })).sort((a, b) => b.total - a.total);
}
