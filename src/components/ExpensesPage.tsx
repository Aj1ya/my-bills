import type { ViewProps } from "../App";
import { money, shortDate } from "../lib/format";
import { byCategory, expensesInMonth } from "../lib/summary";
import type { Expense } from "../lib/types";
import { MonthPicker, type MonthProps } from "./MonthPicker";

export function ExpensesPage(props: ViewProps & MonthProps) {
  const { data, today, currency, actions, month } = props;
  const expenses = expensesInMonth(data, month);
  const total = expenses.reduce((sum, e) => sum + e.amount, 0);
  const categories = byCategory(expenses);
  const largest = categories[0]?.total ?? 0;

  const byDate = new Map<string, Expense[]>();
  for (const e of expenses) byDate.set(e.date, [...(byDate.get(e.date) ?? []), e]);

  return (
    <>
      <h1>Expenses</h1>
      <MonthPicker {...props} />
      <div className="cards">
        <div className="card">
          <span>Spent</span>
          <strong>{money(total, currency)}</strong>
          <small>
            {expenses.length} {expenses.length === 1 ? "purchase" : "purchases"}
          </small>
        </div>
        <div className="card">
          <span>Top category</span>
          <strong className="truncate">{categories[0]?.category ?? "—"}</strong>
          <small>{categories[0] ? money(categories[0].total, currency) : "nothing yet"}</small>
        </div>
      </div>

      {expenses.length === 0 ? (
        <p className="empty">No spending logged this month. Tap + to add a purchase.</p>
      ) : (
        <>
          <section className="panel">
            <h2>By category</h2>
            {categories.map((c) => (
              <div key={c.category} className="cat-row">
                <div className="cat-label">
                  <span>{c.category}</span>
                  <span>
                    {money(c.total, currency)} · {Math.round((c.total / total) * 100)}%
                  </span>
                </div>
                <div className="bar">
                  <div style={{ width: `${(c.total / largest) * 100}%` }} />
                </div>
              </div>
            ))}
          </section>

          {[...byDate].map(([date, list]) => (
            <section key={date}>
              <h2 className="group-head">
                <span>{shortDate(date, today)}</span>
                <span>{money(list.reduce((t, e) => t + e.amount, 0), currency)}</span>
              </h2>
              <ul className="list">
                {list.map((e) => (
                  <li key={e.id}>
                    <button className="bill-row" onClick={() => actions.onOpenExpense(e)}>
                      <span className="occ-name">{e.name}</span>
                      <span className="amount">{money(e.amount, currency)}</span>
                      <span className="occ-meta">{e.category || "Uncategorised"}</span>
                    </button>
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </>
      )}
    </>
  );
}
