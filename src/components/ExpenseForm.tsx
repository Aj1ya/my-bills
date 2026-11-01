import { useState, type FormEvent } from "react";
import { newId } from "../lib/actions";
import type { ISODate } from "../lib/dates";
import { centsToInput, parseMoney } from "../lib/format";
import type { AppData, Expense } from "../lib/types";

interface Props {
  expense?: Expense;
  data: AppData;
  today: ISODate;
  onSave: (expense: Expense) => void;
  onDelete: (id: string) => void;
  onCancel: () => void;
}

export function ExpenseForm({ expense, data, today, onSave, onDelete, onCancel }: Props) {
  const [name, setName] = useState(expense?.name ?? "");
  const [amount, setAmount] = useState(expense ? centsToInput(expense.amount) : "");
  const [category, setCategory] = useState(expense?.category ?? "");
  const [date, setDate] = useState(expense?.date ?? today);
  const [notes, setNotes] = useState(expense?.notes ?? "");
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [error, setError] = useState("");

  const categories = [...new Set(data.expenses.map((e) => e.category).filter(Boolean))].sort();

  const submit = (event: FormEvent) => {
    event.preventDefault();
    const cents = parseMoney(amount);
    if (!name.trim()) return setError("What was it for?");
    if (cents === null) return setError("Enter an amount like 45 or 12.80.");
    if (!date) return setError("Choose the date.");
    onSave({
      id: expense?.id ?? newId(),
      name: name.trim(),
      amount: cents,
      category: category.trim(),
      date,
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
          <h2>{expense ? "Edit expense" : "New expense"}</h2>
          <button type="submit" className="link strong">
            Save
          </button>
        </div>

        <label>
          What for
          <input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Groceries" autoFocus={!expense} />
        </label>
        <label>
          Amount
          <input value={amount} onChange={(e) => setAmount(e.target.value)} inputMode="decimal" placeholder="0.00" />
        </label>
        <label>
          Date
          <input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
        </label>
        <label>
          Category
          <input value={category} onChange={(e) => setCategory(e.target.value)} list="expense-categories" placeholder="e.g. Food" />
          <datalist id="expense-categories">
            {categories.map((c) => (
              <option key={c} value={c} />
            ))}
          </datalist>
        </label>
        <label>
          Notes
          <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={2} />
        </label>
        {error && <p className="error">{error}</p>}

        {expense &&
          (confirmDelete ? (
            <div className="danger-confirm">
              <span>Delete this expense?</span>
              <button type="button" className="danger" onClick={() => onDelete(expense.id)}>
                Delete
              </button>
              <button type="button" className="link" onClick={() => setConfirmDelete(false)}>
                Keep
              </button>
            </div>
          ) : (
            <button type="button" className="link danger-text" onClick={() => setConfirmDelete(true)}>
              Delete expense
            </button>
          ))}
      </form>
    </div>
  );
}
