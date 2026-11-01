import type { ViewProps } from "../App";
import { money, shortDate } from "../lib/format";
import { FREQUENCY_LABELS, indexSettlements, kindOf, monthlyEquivalent, nextDue } from "../lib/recurrence";
import type { ItemKind } from "../lib/types";

/** Every bill or income source with its next due date: the master list. */
export function SourcesList({ data, today, currency, actions, kind }: ViewProps & { kind: ItemKind }) {
  const index = indexSettlements(data.settlements);
  const rows = data.bills.filter((b) => kindOf(b) === kind).map((bill) => ({ bill, next: nextDue(bill, index) }));
  const active = rows.filter((r) => r.next).sort((a, b) => a.next!.localeCompare(b.next!));
  const ended = rows.filter((r) => !r.next).sort((a, b) => a.bill.name.localeCompare(b.bill.name));
  const perMonth = active.reduce((sum, r) => sum + monthlyEquivalent(r.bill), 0);
  const noun = kind === "income" ? "income sources" : "bills";

  if (rows.length === 0) return <p className="empty">No {noun} yet. Tap + to add one.</p>;

  const row = ({ bill, next }: (typeof rows)[number]) => (
    <li key={bill.id}>
      <button className="bill-row" onClick={() => actions.onOpen(bill)}>
        <span className="occ-name">{bill.name}</span>
        <span className={`amount ${kind === "income" ? "positive" : ""}`}>{money(bill.amount, currency)}</span>
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
      <p className="hint">
        {active.length} active {noun} · about {money(Math.round(perMonth), currency)} a month on average
      </p>
      <ul className="list">{active.map(row)}</ul>
      {ended.length > 0 && (
        <section>
          <h2>Ended</h2>
          <ul className="list muted">{ended.map(row)}</ul>
        </section>
      )}
    </>
  );
}
