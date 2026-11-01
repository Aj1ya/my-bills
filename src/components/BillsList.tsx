import { money, shortDate } from "../lib/format";
import { FREQUENCY_LABELS, indexSettlements, monthlyEquivalent, nextDue } from "../lib/recurrence";
import type { ViewProps } from "./Upcoming";

export function BillsList({ data, today, currency, actions }: ViewProps) {
  const index = indexSettlements(data.settlements);
  const rows = data.bills.map((bill) => ({ bill, next: nextDue(bill, index) }));
  const active = rows.filter((r) => r.next).sort((a, b) => a.next!.localeCompare(b.next!));
  const ended = rows.filter((r) => !r.next).sort((a, b) => a.bill.name.localeCompare(b.bill.name));
  const perMonth = active.reduce((sum, r) => sum + monthlyEquivalent(r.bill), 0);

  const row = ({ bill, next }: (typeof rows)[number]) => (
    <li key={bill.id}>
      <button className="bill-row" onClick={() => actions.onOpen(bill)}>
        <span className="occ-name">{bill.name}</span>
        <span className="amount">{money(bill.amount, currency)}</span>
        <span className="occ-meta">
          {FREQUENCY_LABELS[bill.frequency]}
          {bill.category && ` · ${bill.category}`}
        </span>
        <span className="occ-meta right">{next ? `Next ${shortDate(next, today)}` : "Ended"}</span>
      </button>
    </li>
  );

  return (
    <>
      <h1>Bills</h1>
      {data.bills.length === 0 ? (
        <p className="empty">No bills yet. Tap + to add one.</p>
      ) : (
        <>
          <div className="cards">
            <div className="card">
              <span>Recurring cost</span>
              <strong>{money(Math.round(perMonth), currency)}</strong>
              <small>per month, on average</small>
            </div>
            <div className="card">
              <span>Active bills</span>
              <strong>{active.length}</strong>
            </div>
          </div>
          <ul className="list">{active.map(row)}</ul>
          {ended.length > 0 && (
            <section>
              <h2>Ended or fully paid</h2>
              <ul className="list muted">{ended.map(row)}</ul>
            </section>
          )}
        </>
      )}
    </>
  );
}
