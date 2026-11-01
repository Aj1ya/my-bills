import { addDays, type ISODate } from "./dates";
import type { AppData, Bill, Settlement } from "./types";

export function newId(): string {
  // crypto.randomUUID only exists in secure contexts; LAN testing over http is not one.
  return globalThis.crypto?.randomUUID?.() ?? Date.now().toString(36) + Math.random().toString(36).slice(2);
}

const sameOccurrence = (s: Settlement, billId: string, due: ISODate) =>
  s.billId === billId && s.due === due;

export function settle(
  data: AppData,
  bill: Bill,
  due: ISODate,
  status: Settlement["status"],
  today: ISODate,
): AppData {
  const rest = data.settlements.filter((s) => !sameOccurrence(s, bill.id, due));
  return {
    ...data,
    settlements: [...rest, { billId: bill.id, due, status, settledOn: today, amount: bill.amount }],
  };
}

export function unsettle(data: AppData, billId: string, due: ISODate): AppData {
  return { ...data, settlements: data.settlements.filter((s) => !sameOccurrence(s, billId, due)) };
}

export function hasHistory(data: AppData, billId: string): boolean {
  return data.settlements.some((s) => s.billId === billId);
}

export function scheduleChanged(before: Bill, after: Bill): boolean {
  return before.anchor !== after.anchor || before.frequency !== after.frequency;
}

/**
 * Adds or updates a bill. Changing the schedule of a bill with history splits it:
 * the old series ends the day before the new anchor and keeps its settlements,
 * because those are keyed to due dates the new rule would no longer generate.
 */
export function saveBill(data: AppData, edited: Bill): AppData {
  const original = data.bills.find((b) => b.id === edited.id);
  if (!original) return { ...data, bills: [...data.bills, edited] };
  if (!scheduleChanged(original, edited) || !hasHistory(data, original.id))
    return { ...data, bills: data.bills.map((b) => (b.id === edited.id ? edited : b)) };

  const ended: Bill = { ...original, endDate: addDays(edited.anchor, -1) };
  return {
    ...data,
    bills: [...data.bills.map((b) => (b.id === original.id ? ended : b)), { ...edited, id: newId() }],
  };
}

export function deleteBill(data: AppData, billId: string): AppData {
  return {
    ...data,
    bills: data.bills.filter((b) => b.id !== billId),
    settlements: data.settlements.filter((s) => s.billId !== billId),
  };
}
