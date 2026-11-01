import { useState } from "react";
import type { ViewProps } from "../App";
import { makeDate, monthRange, parts, toLocalDate, type ISODate } from "../lib/dates";
import { money } from "../lib/format";
import { kindOf, occurrencesInRange, occurrenceState } from "../lib/recurrence";
import { expensesInMonth } from "../lib/summary";
import type { Occurrence } from "../lib/types";
import { MonthPicker, type MonthProps } from "./MonthPicker";
import { OccurrenceList } from "./OccurrenceRow";

const WEEKDAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const MAX_DOTS = 4;

export function CalendarPage(props: ViewProps & MonthProps) {
  const { data, today, currency, actions, month } = props;
  const [first, last] = monthRange(...month);
  const [picked, setPicked] = useState<ISODate | null>(null);
  // Keep the selection inside the visible month; default to today when it's this month.
  const selected = picked && picked >= first && picked <= last ? picked : today >= first && today <= last ? today : first;

  const byDay = new Map<ISODate, Occurrence[]>();
  for (const o of occurrencesInRange(data, first, last)) byDay.set(o.due, [...(byDay.get(o.due) ?? []), o]);
  const expenses = expensesInMonth(data, month);
  const spentOn = new Set(expenses.map((e) => e.date));

  const leading = (toLocalDate(first).getDay() + 6) % 7; // Monday-first grid
  const days = parts(last)[2];
  const cells: (ISODate | null)[] = [
    ...Array<null>(leading).fill(null),
    ...Array.from({ length: days }, (_, i) => makeDate(month[0], month[1], i + 1)),
  ];

  const dayItems = byDay.get(selected) ?? [];
  const dayExpenses = expenses.filter((e) => e.date === selected);

  return (
    <>
      <h1>Calendar</h1>
      <div className="calendar">
        <MonthPicker {...props} />
        <div className="cal-grid">
          {WEEKDAYS.map((d) => (
            <span key={d} className="cal-weekday">
              {d}
            </span>
          ))}
          {cells.map((date, i) => {
            if (!date) return <span key={`blank-${i}`} />;
            const items = byDay.get(date) ?? [];
            const classes = ["cal-day", date === today && "today", date === selected && "selected"];
            return (
              <button key={date} className={classes.filter(Boolean).join(" ")} onClick={() => setPicked(date)}>
                <span>{parts(date)[2]}</span>
                <span className="dots">
                  {items.slice(0, spentOn.has(date) ? MAX_DOTS - 1 : MAX_DOTS).map((o) => (
                    <i key={o.bill.id} className={`dot ${occurrenceState(o, today)} ${kindOf(o.bill)}`} />
                  ))}
                  {spentOn.has(date) && <i className="dot spent" />}
                  {items.length + (spentOn.has(date) ? 1 : 0) > MAX_DOTS && <b>+</b>}
                </span>
              </button>
            );
          })}
        </div>
        <div className="legend">
          <span><i className="dot overdue" />Overdue</span>
          <span><i className="dot today" />Due today</span>
          <span><i className="dot upcoming" />Upcoming</span>
          <span><i className="dot paid" />Paid</span>
          <span><i className="dot income upcoming" />Income</span>
          <span><i className="dot spent" />Spending</span>
        </div>
      </div>

      <section>
        <h2>
          {toLocalDate(selected).toLocaleDateString(undefined, { weekday: "long", day: "numeric", month: "long" })}
        </h2>
        {dayItems.length === 0 && dayExpenses.length === 0 && <p className="empty">Nothing on this day.</p>}
        {dayItems.length > 0 && <OccurrenceList items={dayItems} today={today} currency={currency} actions={actions} />}
        {dayExpenses.length > 0 && (
          <ul className="list spaced">
            {dayExpenses.map((e) => (
              <li key={e.id}>
                <button className="bill-row" onClick={() => actions.onOpenExpense(e)}>
                  <span className="occ-name">{e.name}</span>
                  <span className="amount">{money(e.amount, currency)}</span>
                  <span className="occ-meta">Expense{e.category && ` · ${e.category}`}</span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>
    </>
  );
}
