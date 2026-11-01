import { useState } from "react";
import type { ViewProps } from "../App";
import { monthRange } from "../lib/dates";
import { money } from "../lib/format";
import { kindOf, occurrencesInRange } from "../lib/recurrence";
import { monthSummary } from "../lib/summary";
import { MonthPicker, type MonthProps } from "./MonthPicker";
import { OccurrenceList } from "./OccurrenceRow";
import { SourcesList } from "./SourcesList";

export function IncomePage(props: ViewProps & MonthProps) {
  const { data, today, currency, actions, month } = props;
  const [mode, setMode] = useState<"month" | "all">("month");
  const items = occurrencesInRange(data, ...monthRange(...month)).filter((o) => kindOf(o.bill) === "income");
  const s = monthSummary(data, month);

  return (
    <>
      <h1>Income</h1>
      <div className="segmented">
        <button className={mode === "month" ? "active" : ""} onClick={() => setMode("month")}>
          By month
        </button>
        <button className={mode === "all" ? "active" : ""} onClick={() => setMode("all")}>
          All sources
        </button>
      </div>

      {mode === "all" ? (
        <SourcesList {...props} kind="income" />
      ) : (
        <>
          <MonthPicker {...props} />
          <div className="cards three">
            <div className="card">
              <span>Expected</span>
              <strong>{money(s.incomeExpected, currency)}</strong>
            </div>
            <div className="card">
              <span>Received</span>
              <strong className="positive">{money(s.incomeReceived, currency)}</strong>
            </div>
            <div className="card">
              <span>Pending</span>
              <strong>{money(s.incomeExpected - s.incomeReceived, currency)}</strong>
            </div>
          </div>
          {items.length ? (
            <OccurrenceList items={items} today={today} currency={currency} actions={actions} />
          ) : (
            <p className="empty">No income expected this month. Tap + to add a pay day or other income.</p>
          )}
        </>
      )}
    </>
  );
}
