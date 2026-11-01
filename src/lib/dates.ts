/** A calendar date as `YYYY-MM-DD`, with no time or time zone. These strings sort chronologically. */
export type ISODate = string;

const DAY_MS = 86_400_000;

export function parts(date: ISODate): [year: number, month: number, day: number] {
  const [y, m, d] = date.split("-").map(Number);
  return [y, m, d];
}

export function makeDate(year: number, month: number, day: number): ISODate {
  return `${String(year).padStart(4, "0")}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

export function daysInMonth(year: number, month: number): number {
  return new Date(Date.UTC(year, month, 0)).getUTCDate();
}

export function todayISO(now = new Date()): ISODate {
  return makeDate(now.getFullYear(), now.getMonth() + 1, now.getDate());
}

const toUtc = (date: ISODate) => {
  const [y, m, d] = parts(date);
  return Date.UTC(y, m - 1, d);
};

export function addDays(date: ISODate, days: number): ISODate {
  const t = new Date(toUtc(date) + days * DAY_MS);
  return makeDate(t.getUTCFullYear(), t.getUTCMonth() + 1, t.getUTCDate());
}

export function daysBetween(from: ISODate, to: ISODate): number {
  return Math.round((toUtc(to) - toUtc(from)) / DAY_MS);
}

/** Moves `months` from `date`, landing on `day` (default: date's day) clamped to that month's length. */
export function addMonths(date: ISODate, months: number, day = parts(date)[2]): ISODate {
  const [y, m] = parts(date);
  const index = y * 12 + (m - 1) + months;
  const year = Math.floor(index / 12);
  const month = (index % 12) + 1;
  return makeDate(year, month, Math.min(day, daysInMonth(year, month)));
}

export function monthsBetween(from: ISODate, to: ISODate): number {
  const [fy, fm] = parts(from);
  const [ty, tm] = parts(to);
  return (ty - fy) * 12 + (tm - fm);
}

export function monthRange(year: number, month: number): [first: ISODate, last: ISODate] {
  return [makeDate(year, month, 1), makeDate(year, month, daysInMonth(year, month))];
}

export function toLocalDate(date: ISODate): Date {
  const [y, m, d] = parts(date);
  return new Date(y, m - 1, d);
}
