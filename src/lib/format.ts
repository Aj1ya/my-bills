import { daysBetween, parts, toLocalDate, type ISODate } from "./dates";

const moneyFormats = new Map<string, Intl.NumberFormat>();

export function money(cents: number, currency: string): string {
  let format = moneyFormats.get(currency);
  if (!format) {
    format = new Intl.NumberFormat(undefined, { style: "currency", currency });
    moneyFormats.set(currency, format);
  }
  return format.format(cents / 100);
}

/** Parses "12.50" or "1,200" into cents; null when it isn't a non-negative amount. */
export function parseMoney(text: string): number | null {
  const cleaned = text.replace(/[^\d.]/g, "");
  if (!/^\d*(\.\d{0,2})?$/.test(cleaned) || cleaned === "" || cleaned === ".") return null;
  return Math.round(Number(cleaned) * 100);
}

export function centsToInput(cents: number): string {
  return (cents / 100).toFixed(2);
}

export function shortDate(date: ISODate, today: ISODate): string {
  const sameYear = parts(date)[0] === parts(today)[0];
  return toLocalDate(date).toLocaleDateString(undefined, {
    weekday: "short",
    day: "numeric",
    month: "short",
    ...(sameYear ? {} : { year: "numeric" }),
  });
}

export function relativeDue(date: ISODate, today: ISODate): string {
  const days = daysBetween(today, date);
  if (days === 0) return "Today";
  if (days === 1) return "Tomorrow";
  if (days === -1) return "1 day overdue";
  if (days < 0) return `${-days} days overdue`;
  return `in ${days} days`;
}

export function monthTitle(year: number, month: number): string {
  return new Date(year, month - 1, 1).toLocaleDateString(undefined, { month: "long", year: "numeric" });
}
