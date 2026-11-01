import { useState } from "react";
import { monthRange, parts } from "../lib/dates";
import { money, monthTitle } from "../lib/format";
import { occurrencesInRange } from "../lib/recurrence";
import { OccurrenceList } from "./OccurrenceRow";
import type { ViewProps } from "./Upcoming";

export function MonthView({ data, today, currency, actions }: ViewProps) {
  const [[year, month], setMonth] = useState(() => parts(today).slice(0, 2) as [number, number]);
  const shift = (delta: number) => {
    const index = year * 12 + (month - 1) + delta;
    setMonth([Math.floor(index / 12), (index % 12) + 1]);
  };

  const items = occurrencesInRange(data, ...monthRange(year, month));
  const due = items.filter((o) => o.settlement?.status !== "skipped");
  const dueTotal = due.reduce((sum, o) => sum + (o.settlement?.amount ?? o.bill.amount), 0);
  const paidTotal = due.reduce((sum, o) => sum + (o.settlement ? o.settlement.amount : 0), 0);

  return (
    <>
      <div className="month-head">
        <button aria-label="Previous month" onClick={() => shift(-1)}>‹</button>
        <h1>{monthTitle(year, month)}</h1>
        <button aria-label="Next month" onClick={() => shift(1)}>›</button>
      </div>
      <div className="cards three">
        <div className="card">
          <span>Due</span>
          <strong>{money(dueTotal, currency)}</strong>
        </div>
        <div className="card">
          <span>Paid</span>
          <strong>{money(paidTotal, currency)}</strong>
        </div>
        <div className="card">
          <span>Remaining</span>
          <strong>{money(dueTotal - paidTotal, currency)}</strong>
        </div>
      </div>
      {items.length ? (
        <OccurrenceList items={items} today={today} currency={currency} actions={actions} />
      ) : (
        <p className="empty">No bills fall due this month.</p>
      )}
    </>
  );
}
