import type { OccurrenceActions } from "../App";
import { addDays, type ISODate } from "../lib/dates";
import { money } from "../lib/format";
import { occurrencesInRange, overdue, recentlySettled } from "../lib/recurrence";
import type { AppData, Occurrence } from "../lib/types";
import { OccurrenceList } from "./OccurrenceRow";

export interface ViewProps {
  data: AppData;
  today: ISODate;
  currency: string;
  actions: OccurrenceActions;
}

const total = (items: Occurrence[]) => items.reduce((sum, o) => sum + o.bill.amount, 0);
const count = (items: Occurrence[]) => `${items.length} ${items.length === 1 ? "bill" : "bills"}`;

export function Upcoming({ data, today, currency, actions }: ViewProps) {
  const late = overdue(data, today);
  const soon = occurrencesInRange(data, today, addDays(today, 30)).filter((o) => !o.settlement);
  const recent = recentlySettled(data, addDays(today, -7));
  const list = { today, currency, actions };

  if (data.bills.length === 0)
    return (
      <>
        <h1>Upcoming</h1>
        <p className="empty">No bills yet. Tap + to add your first bill.</p>
      </>
    );

  return (
    <>
      <h1>Upcoming</h1>
      <div className="cards">
        <div className={`card ${late.length ? "alert" : ""}`}>
          <span>Overdue</span>
          <strong>{money(total(late), currency)}</strong>
          <small>{count(late)}</small>
        </div>
        <div className="card">
          <span>Next 30 days</span>
          <strong>{money(total(soon), currency)}</strong>
          <small>{count(soon)}</small>
        </div>
      </div>

      {late.length > 0 && (
        <section>
          <h2>Overdue</h2>
          <OccurrenceList items={late} {...list} />
        </section>
      )}
      <section>
        <h2>Due in the next 30 days</h2>
        {soon.length ? <OccurrenceList items={soon} {...list} /> : <p className="empty">Nothing due. Nice.</p>}
      </section>
      {recent.length > 0 && (
        <section>
          <h2>Settled this week</h2>
          <OccurrenceList items={recent} {...list} />
        </section>
      )}
    </>
  );
}
