import type { OccurrenceActions } from "../App";
import type { ISODate } from "../lib/dates";
import { money, relativeDue, shortDate } from "../lib/format";
import { FREQUENCY_LABELS, kindOf, occurrenceState, settledLabel } from "../lib/recurrence";
import type { Occurrence } from "../lib/types";

interface Props {
  occurrence: Occurrence;
  today: ISODate;
  currency: string;
  actions: OccurrenceActions;
}

export function OccurrenceRow({ occurrence, today, currency, actions }: Props) {
  const { bill, due, settlement } = occurrence;
  const income = kindOf(bill) === "income";
  const state = occurrenceState(occurrence, today);
  const when = settlement
    ? `${settledLabel(bill, settlement.status)} · due ${shortDate(due, today)}`
    : `${shortDate(due, today)} · ${relativeDue(due, today).replace("overdue", income ? "late" : "overdue")}`;

  return (
    <li className={`occ ${state} ${income ? "income" : ""}`}>
      <button
        className="check"
        aria-label={
          settlement
            ? `Undo ${settledLabel(bill, settlement.status).toLowerCase()} for ${bill.name}`
            : `Mark ${bill.name} ${income ? "received" : "paid"}`
        }
        onClick={() => (settlement ? actions.onUndo(occurrence) : actions.onSettle(occurrence, "paid"))}
      >
        {settlement?.status === "paid" ? "✓" : settlement?.status === "skipped" ? "–" : ""}
      </button>
      <button className="occ-main" onClick={() => actions.onOpen(bill)}>
        <span className="occ-name">{bill.name}</span>
        <span className="occ-meta">
          {when} · {FREQUENCY_LABELS[bill.frequency]}
        </span>
      </button>
      <div className="occ-side">
        <span className={`amount ${income ? "positive" : ""}`}>
          {income ? "+" : ""}
          {money(settlement?.amount ?? bill.amount, currency)}
        </span>
        {!settlement && (
          <button className="link" onClick={() => actions.onSettle(occurrence, "skipped")}>
            Skip
          </button>
        )}
      </div>
    </li>
  );
}

export function OccurrenceList({ items, ...rest }: Omit<Props, "occurrence"> & { items: Occurrence[] }) {
  return (
    <ul className="list">
      {items.map((o) => (
        <OccurrenceRow key={`${o.bill.id}|${o.due}`} occurrence={o} {...rest} />
      ))}
    </ul>
  );
}
