import type { ViewProps } from "../App";
import { addDays, parts, type YearMonth } from "../lib/dates";
import { money, monthTitle } from "../lib/format";
import { kindOf, occurrencesInRange, overdue, recentlySettled } from "../lib/recurrence";
import { monthSummary } from "../lib/summary";
import { OccurrenceList } from "./OccurrenceRow";

const greeting = () => {
  const hour = new Date().getHours();
  return hour < 12 ? "Good morning" : hour < 18 ? "Good afternoon" : "Good evening";
};

export function Home({ data, today, currency, actions, onSettings }: ViewProps & { onSettings: () => void }) {
  const month = parts(today).slice(0, 2) as YearMonth;
  const s = monthSummary(data, month);
  const attention = [
    ...overdue(data, today),
    ...occurrencesInRange(data, today, addDays(today, 7)).filter((o) => !o.settlement && kindOf(o.bill) === "bill"),
  ];
  const recent = recentlySettled(data, addDays(today, -7));
  const progress = s.billCount ? Math.round((s.billsPaidCount / s.billCount) * 100) : 0;
  const list = { today, currency, actions };

  return (
    <>
      <div className="page-head">
        <h1>Home</h1>
        <button className="icon-button" aria-label="Settings" onClick={onSettings}>
          ⚙
        </button>
      </div>
      <p className="lede">
        {greeting()}. {monthTitle(...month)}: {s.billCount - s.billsPaidCount} of {s.billCount} bills left to pay.
      </p>

      <div className="progress-card">
        <div className="progress-label">
          <span>Bills paid this month</span>
          <strong>
            {s.billsPaidCount}/{s.billCount}
          </strong>
        </div>
        <div className="bar">
          <div style={{ width: `${progress}%` }} />
        </div>
      </div>

      <div className="cards">
        <div className="card">
          <span>Income</span>
          <strong className="positive">{money(s.incomeExpected, currency)}</strong>
          <small>{money(s.incomeReceived, currency)} received</small>
        </div>
        <div className="card">
          <span>Bills</span>
          <strong>{money(s.billsDue, currency)}</strong>
          <small>{money(s.billsDue - s.billsPaid, currency)} left to pay</small>
        </div>
        <div className="card">
          <span>Expenses</span>
          <strong>{money(s.spent, currency)}</strong>
          <small>spent this month</small>
        </div>
        <div className="card">
          <span>Net</span>
          <strong className={s.net < 0 ? "negative" : "positive"}>{money(s.net, currency)}</strong>
          <small>income − bills − expenses</small>
        </div>
      </div>

      {data.bills.length === 0 && data.expenses.length === 0 ? (
        <p className="empty">Nothing here yet. Tap + to add your first bill.</p>
      ) : (
        <>
          <section>
            <h2>Needs attention</h2>
            {attention.length ? (
              <OccurrenceList items={attention} {...list} />
            ) : (
              <p className="empty">Nothing overdue or due this week.</p>
            )}
          </section>
          {recent.length > 0 && (
            <section>
              <h2>Settled this week</h2>
              <OccurrenceList items={recent} {...list} />
            </section>
          )}
        </>
      )}
    </>
  );
}
