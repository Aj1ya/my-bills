import { describe, expect, it } from "vitest";
import { saveBill, settle } from "./actions";
import { indexSettlements, nextDue, occurrencesBetween, occurrencesInRange, overdue } from "./recurrence";
import { emptyData } from "./store";
import type { AppData, Bill, Frequency } from "./types";

const bill = (frequency: Frequency, anchor: string, extra: Partial<Bill> = {}): Bill => ({
  id: "b1",
  name: "Test",
  amount: 10_000,
  category: "",
  frequency,
  anchor,
  ...extra,
});
const withBills = (...bills: Bill[]): AppData => ({ ...emptyData(), bills });
const next = (data: AppData, b: Bill) => nextDue(b, indexSettlements(data.settlements));

describe("schedule", () => {
  it("steps quarterly bills by three months", () => {
    expect(occurrencesBetween(bill("quarterly", "2026-11-15"), "2026-11-01", "2027-11-30")).toEqual([
      "2026-11-15",
      "2027-02-15",
      "2027-05-15",
      "2027-08-15",
      "2027-11-15",
    ]);
  });

  it("steps yearly, half-yearly, weekly and fortnightly bills", () => {
    expect(occurrencesBetween(bill("yearly", "2026-11-20"), "2026-01-01", "2028-12-31")).toEqual([
      "2026-11-20",
      "2027-11-20",
      "2028-11-20",
    ]);
    expect(occurrencesBetween(bill("half-yearly", "2026-12-01"), "2026-01-01", "2027-12-31")).toEqual([
      "2026-12-01",
      "2027-06-01",
      "2027-12-01",
    ]);
    expect(occurrencesBetween(bill("weekly", "2026-12-28"), "2026-12-01", "2027-01-12")).toEqual([
      "2026-12-28",
      "2027-01-04",
      "2027-01-11",
    ]);
    expect(occurrencesBetween(bill("fortnightly", "2026-11-03"), "2026-11-10", "2026-12-31")).toEqual([
      "2026-11-17",
      "2026-12-01",
      "2026-12-15",
      "2026-12-29",
    ]);
  });

  it("clamps month-end dates without drifting", () => {
    expect(occurrencesBetween(bill("monthly", "2027-01-31"), "2027-01-01", "2027-05-31")).toEqual([
      "2027-01-31",
      "2027-02-28",
      "2027-03-31",
      "2027-04-30",
      "2027-05-31",
    ]);
    expect(occurrencesBetween(bill("monthly", "2028-01-31"), "2028-02-01", "2028-02-29")).toEqual(["2028-02-29"]);
  });

  it("keeps a 29 Feb yearly bill on the last day of February", () => {
    expect(occurrencesBetween(bill("yearly", "2028-02-29"), "2028-01-01", "2032-12-31")).toEqual([
      "2028-02-29",
      "2029-02-28",
      "2030-02-28",
      "2031-02-28",
      "2032-02-29",
    ]);
  });

  it("finds occurrences in a window that starts mid-series", () => {
    expect(occurrencesBetween(bill("quarterly", "2026-11-15"), "2027-03-01", "2027-06-30")).toEqual(["2027-05-15"]);
    expect(occurrencesBetween(bill("quarterly", "2026-11-15"), "2027-03-01", "2027-04-30")).toEqual([]);
  });

  it("respects end dates and one-off bills", () => {
    expect(
      occurrencesBetween(bill("monthly", "2026-11-05", { endDate: "2027-01-05" }), "2026-01-01", "2027-12-31"),
    ).toEqual(["2026-11-05", "2026-12-05", "2027-01-05"]);
    expect(occurrencesBetween(bill("once", "2026-11-05"), "2026-11-01", "2026-11-30")).toEqual(["2026-11-05"]);
    expect(occurrencesBetween(bill("once", "2026-11-05"), "2026-12-01", "2026-12-31")).toEqual([]);
  });
});

describe("settling (the reference app's bug)", () => {
  it("paying a quarterly bill moves it to next quarter, not next week or month", () => {
    const q = bill("quarterly", "2026-11-15");
    const paid = settle(withBills(q), q, "2026-11-15", "paid", "2026-11-14");
    expect(next(paid, q)).toBe("2027-02-15");
    expect(occurrencesInRange(paid, "2026-11-16", "2027-01-31")).toEqual([]);
  });

  it("paying a yearly bill early keeps the anniversary", () => {
    const y = bill("yearly", "2026-11-30");
    const paid = settle(withBills(y), y, "2026-11-30", "paid", "2026-11-01");
    expect(next(paid, y)).toBe("2027-11-30");
  });

  it("shows a quarterly bill only in its own months", () => {
    const data = withBills(bill("quarterly", "2026-11-15"));
    const months = ["2026-11", "2026-12", "2027-01", "2027-02"].map(
      (m) => occurrencesInRange(data, `${m}-01`, `${m}-31`).length,
    );
    expect(months).toEqual([1, 0, 0, 1]);
  });

  it("skipping counts as settled, and overdue lists only unsettled past occurrences", () => {
    const m = bill("monthly", "2026-08-10");
    let data = withBills(m);
    data = settle(data, m, "2026-08-10", "paid", "2026-08-10");
    data = settle(data, m, "2026-09-10", "skipped", "2026-09-10");
    expect(overdue(data, "2026-11-01").map((o) => o.due)).toEqual(["2026-10-10"]);
    expect(next(data, m)).toBe("2026-10-10");
  });
});

describe("editing", () => {
  it("splits a series when its schedule changes after payments", () => {
    const m = bill("monthly", "2026-08-10");
    let data = settle(withBills(m), m, "2026-08-10", "paid", "2026-08-10");
    data = saveBill(data, { ...m, frequency: "quarterly", anchor: "2026-12-01" });
    const [ended, current] = data.bills;
    expect(ended.endDate).toBe("2026-11-30");
    expect(current.id).not.toBe(m.id);
    expect(current.frequency).toBe("quarterly");
    expect(data.settlements).toHaveLength(1);
  });

  it("edits in place when only the amount changes", () => {
    const m = bill("monthly", "2026-08-10");
    let data = settle(withBills(m), m, "2026-08-10", "paid", "2026-08-10");
    data = saveBill(data, { ...m, amount: 12_000 });
    expect(data.bills).toHaveLength(1);
    expect(data.bills[0].amount).toBe(12_000);
    expect(data.settlements[0].amount).toBe(10_000);
  });
});
