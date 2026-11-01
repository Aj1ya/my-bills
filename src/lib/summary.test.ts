import { describe, expect, it } from "vitest";
import { saveExpense, settle } from "./actions";
import { occurrenceState, overdue } from "./recurrence";
import { emptyData, parseData } from "./store";
import { byCategory, monthSummary } from "./summary";
import type { AppData, Bill } from "./types";

const rent: Bill = { id: "rent", name: "Rent", amount: 120_000, category: "Housing", frequency: "monthly", anchor: "2026-11-01" };
const insurance: Bill = { ...rent, id: "ins", name: "Insurance", amount: 42_000, frequency: "quarterly", anchor: "2026-11-15" };
const salary: Bill = { ...rent, id: "pay", kind: "income", name: "Salary", amount: 300_000, category: "Work", frequency: "fortnightly", anchor: "2026-11-05" };

const sample = (): AppData => {
  let data: AppData = { ...emptyData(), bills: [rent, insurance, salary] };
  data = settle(data, rent, "2026-11-01", "paid", "2026-11-01");
  data = settle(data, salary, "2026-11-05", "paid", "2026-11-05");
  data = saveExpense(data, { id: "e1", name: "Groceries", amount: 8_550, category: "Food", date: "2026-11-03" });
  data = saveExpense(data, { id: "e2", name: "Fuel", amount: 6_000, category: "Transport", date: "2026-11-04" });
  data = saveExpense(data, { id: "e3", name: "Takeaway", amount: 2_500, category: "Food", date: "2026-12-02" });
  return data;
};

describe("month summary", () => {
  it("totals bills, income and spending for the month", () => {
    expect(monthSummary(sample(), [2026, 11])).toEqual({
      billCount: 2,
      billsPaidCount: 1,
      billsDue: 162_000,
      billsPaid: 120_000,
      incomeExpected: 600_000, // paydays 5 and 19 Nov
      incomeReceived: 300_000,
      spent: 14_550,
      net: 600_000 - 162_000 - 14_550,
    });
  });

  it("leaves quarterly bills out of the months they don't fall in", () => {
    const december = monthSummary(sample(), [2026, 12]);
    expect(december.billCount).toBe(1);
    expect(december.spent).toBe(2_500);
  });

  it("groups spending by category, largest first", () => {
    expect(byCategory(sample().expenses)).toEqual([
      { category: "Food", total: 11_050 },
      { category: "Transport", total: 6_000 },
    ]);
  });
});

describe("states and kinds", () => {
  it("classifies occurrences for the calendar dots", () => {
    const today = "2026-11-15";
    expect(occurrenceState({ bill: rent, due: "2026-11-10" }, today)).toBe("overdue");
    expect(occurrenceState({ bill: rent, due: today }, today)).toBe("today");
    expect(occurrenceState({ bill: rent, due: "2026-11-20" }, today)).toBe("upcoming");
    const data = sample();
    expect(occurrenceState({ bill: rent, due: "2026-11-01", settlement: data.settlements[0] }, today)).toBe("paid");
  });

  it("keeps late income out of overdue bills", () => {
    expect(overdue(sample(), "2026-11-25").map((o) => o.bill.name)).toEqual(["Insurance"]);
    expect(overdue(sample(), "2026-11-25", "income").map((o) => o.due)).toEqual(["2026-11-19"]);
  });

  it("loads data saved before income and expenses existed", () => {
    const old = { version: 1, bills: [rent], settlements: [], settings: { currency: "AUD" } };
    expect(parseData(old).expenses).toEqual([]);
  });
});
