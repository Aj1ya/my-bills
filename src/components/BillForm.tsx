import { useState, type FormEvent } from "react";
import { hasHistory, newId, scheduleChanged } from "../lib/actions";
import { addDays, type ISODate } from "../lib/dates";
import { centsToInput, parseMoney, shortDate } from "../lib/format";
import { FREQUENCY_LABELS } from "../lib/recurrence";
import type { AppData, Bill, Frequency, ItemKind } from "../lib/types";

interface Props {
  kind: ItemKind;
  bill?: Bill;
  data: AppData;
  today: ISODate;
  onSave: (bill: Bill) => void;
  onDelete: (id: string) => void;
  onCancel: () => void;
}

const FREQUENCIES = Object.keys(FREQUENCY_LABELS) as Frequency[];

export function BillForm({ kind, bill, data, today, onSave, onDelete, onCancel }: Props) {
  const noun = kind === "income" ? "income" : "bill";
  const [name, setName] = useState(bill?.name ?? "");
  const [amount, setAmount] = useState(bill ? centsToInput(bill.amount) : "");
  const [category, setCategory] = useState(bill?.category ?? "");
  const [frequency, setFrequency] = useState<Frequency>(bill?.frequency ?? "monthly");
  const [anchor, setAnchor] = useState(bill?.anchor ?? today);
  const [endDate, setEndDate] = useState(bill?.endDate ?? "");
  const [notes, setNotes] = useState(bill?.notes ?? "");
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [error, setError] = useState("");

  const categories = [
    ...new Set(data.bills.filter((b) => (b.kind ?? "bill") === kind).map((b) => b.category).filter(Boolean)),
  ].sort();
  const splits =
    bill !== undefined &&
    hasHistory(data, bill.id) &&
    scheduleChanged(bill, { ...bill, frequency, anchor });

  const submit = (event: FormEvent) => {
    event.preventDefault();
    const cents = parseMoney(amount);
    if (!name.trim()) return setError(`Give the ${noun} a name.`);
    if (cents === null) return setError("Enter an amount like 120 or 89.95.");
    if (!anchor) return setError("Choose the due date.");
    if (endDate && endDate < anchor) return setError("The end date must be on or after the due date.");
    onSave({
      id: bill?.id ?? newId(),
      kind,
      name: name.trim(),
      amount: cents,
      category: category.trim(),
      frequency,
      anchor,
      endDate: frequency === "once" || !endDate ? undefined : endDate,
      notes: notes.trim() || undefined,
    });
  };

  return (
    <div className="sheet-backdrop" onClick={onCancel}>
      <form className="sheet" onSubmit={submit} onClick={(e) => e.stopPropagation()} noValidate>
        <div className="sheet-head">
          <button type="button" className="link" onClick={onCancel}>
            Cancel
          </button>
          <h2>{bill ? `Edit ${noun}` : `New ${noun}`}</h2>
          <button type="submit" className="link strong">
            Save
          </button>
        </div>

        <label>
          Name
          <input value={name} onChange={(e) => setName(e.target.value)} placeholder={kind === "income" ? "e.g. Salary" : "e.g. Electricity"} autoFocus={!bill} />
        </label>
        <label>
          Amount
          <input value={amount} onChange={(e) => setAmount(e.target.value)} inputMode="decimal" placeholder="0.00" />
        </label>
        <label>
          Repeats
          <select value={frequency} onChange={(e) => setFrequency(e.target.value as Frequency)}>
            {FREQUENCIES.map((f) => (
              <option key={f} value={f}>
                {FREQUENCY_LABELS[f]}
              </option>
            ))}
          </select>
        </label>
        <label>
          {kind === "income"
            ? frequency === "once" ? "Expected on" : "First pay date"
            : frequency === "once" ? "Due date" : "First due date"}
          <input type="date" value={anchor} onChange={(e) => setAnchor(e.target.value)} />
        </label>
        {frequency !== "once" && (
          <label>
            Ends (optional)
            <input type="date" value={endDate} min={anchor} onChange={(e) => setEndDate(e.target.value)} />
          </label>
        )}
        <label>
          Category
          <input value={category} onChange={(e) => setCategory(e.target.value)} list="categories" placeholder={kind === "income" ? "e.g. Work" : "e.g. Utilities"} />
          <datalist id="categories">
            {categories.map((c) => (
              <option key={c} value={c} />
            ))}
          </datalist>
        </label>
        <label>
          Notes
          <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={2} />
        </label>

        {splits && anchor && (
          <p className="notice">
            The new schedule starts {shortDate(anchor, today)}. Payments up to {shortDate(addDays(anchor, -1), today)} stay
            with the old schedule, which will show under “Ended”.
          </p>
        )}
        {error && <p className="error">{error}</p>}

        {bill &&
          (confirmDelete ? (
            <div className="danger-confirm">
              <span>Delete this {noun} and its history?</span>
              <button type="button" className="danger" onClick={() => onDelete(bill.id)}>
                Delete
              </button>
              <button type="button" className="link" onClick={() => setConfirmDelete(false)}>
                Keep
              </button>
            </div>
          ) : (
            <button type="button" className="link danger-text" onClick={() => setConfirmDelete(true)}>
              Delete {noun}
            </button>
          ))}
      </form>
    </div>
  );
}
