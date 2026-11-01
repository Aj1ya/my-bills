import { useState } from "react";
import type { ViewProps } from "../App";
import { monthRange } from "../lib/dates";
import { money } from "../lib/format";
import { kindOf, occurrencesInRange } from "../lib/recurrence";
import { monthSummary } from "../lib/summary";
import type { Occurrence } from "../lib/types";
import { MonthPicker, type MonthProps } from "./MonthPicker";
import { OccurrenceList } from "./OccurrenceRow";
import { SourcesList } from "./SourcesList";

export function BillsPage(props: ViewProps & MonthProps) {
  const { data, today, currency, actions, month } = props;
  const [mode, setMode] = useState<"month" | "all">("month");

  const items = occurrencesInRange(data, ...monthRange(...month)).filter((o) => kindOf(o.bill) === "bill");
  const groups = new Map<string, Occurrence[]>();
  for (const o of items) {
    const category = o.bill.category || "Uncategorised";
    groups.set(category, [...(groups.get(category) ?? []), o]);
  }
  const s = monthSummary(data, month);

  return (
    <>
      <h1>Bills</h1>
      <div className="segmented">
        <button className={mode === "month" ? "active" : ""} onClick={() => setMode("month")}>
          By month
        </button>
        <button className={mode === "all" ? "active" : ""} onClick={() => setMode("all")}>
          All bills
        </button>
      </div>

      {mode === "all" ? (
        <SourcesList {...props} kind="bill" />
      ) : (
        <>
          <MonthPicker {...props} />
          <div className="cards three">
            <div className="card">
              <span>Due</span>
              <strong>{money(s.billsDue, currency)}</strong>
            </div>
            <div className="card">
              <span>Paid</span>
              <strong className="positive">{money(s.billsPaid, currency)}</strong>
            </div>
            <div className="card">
              <span>Left</span>
              <strong>{money(s.billsDue - s.billsPaid, currency)}</strong>
            </div>
          </div>
          {items.length === 0 && <p className="empty">No bills fall due this month.</p>}
          {[...groups].map(([category, list]) => (
            <section key={category}>
              <h2 className="group-head">
                <span>
                  {category} · {list.length}
                </span>
                <span>{money(list.reduce((t, o) => t + (o.settlement?.amount ?? o.bill.amount), 0), currency)}</span>
              </h2>
              <OccurrenceList items={list} today={today} currency={currency} actions={actions} />
            </section>
          ))}
        </>
      )}
    </>
  );
}
