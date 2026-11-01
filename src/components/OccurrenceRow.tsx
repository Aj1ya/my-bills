import type { OccurrenceActions } from "../App";
import type { ISODate } from "../lib/dates";
import { money, relativeDue, shortDate } from "../lib/format";
import { FREQUENCY_LABELS } from "../lib/recurrence";
import type { Occurrence } from "../lib/types";

interface Props {
  occurrence: Occurrence;
  today: ISODate;
  currency: string;
  actions: OccurrenceActions;
}

export function OccurrenceRow({ occurrence, today, currency, actions }: Props) {
  const { bill, due, settlement } = occurrence;
  const state = settlement?.status ?? (due < today ? "overdue" : "due");
  const when = settlement
    ? `${settlement.status === "paid" ? "Paid" : "Skipped"} · due ${shortDate(due, today)}`
    : `${shortDate(due, today)} · ${relativeDue(due, today)}`;

  return (
    <li className={`occ ${state}`}>
      <button
        className="check"
        aria-label={settlement ? `Undo ${settlement.status} for ${bill.name}` : `Mark ${bill.name} paid`}
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
        <span className="amount">{money(settlement?.amount ?? bill.amount, currency)}</span>
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
