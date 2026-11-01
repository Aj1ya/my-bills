import { useState } from "react";
import { BillForm } from "./components/BillForm";
import { BillsPage } from "./components/BillsPage";
import { CalendarPage } from "./components/CalendarPage";
import { ExpenseForm } from "./components/ExpenseForm";
import { ExpensesPage } from "./components/ExpensesPage";
import { Home } from "./components/Home";
import { IncomePage } from "./components/IncomePage";
import { Settings } from "./components/Settings";
import { deleteBill, deleteExpense, saveBill, saveExpense, settle, unsettle } from "./lib/actions";
import { parts, type ISODate, type YearMonth } from "./lib/dates";
import { useAppData, useToday } from "./lib/store";
import type { AppData, Bill, Expense, ItemKind, Occurrence, Settlement } from "./lib/types";

type Tab = "home" | "bills" | "calendar" | "income" | "expenses" | "settings";

const TABS: { id: Tab; label: string; icon: string }[] = [
  { id: "home", label: "Home", icon: "◔" },
  { id: "bills", label: "Bills", icon: "≡" },
  { id: "calendar", label: "Calendar", icon: "▦" },
  { id: "income", label: "Income", icon: "↓" },
  { id: "expenses", label: "Expenses", icon: "↑" },
];

/** Callbacks shared by every list of occurrences and expenses. */
export interface OccurrenceActions {
  onSettle: (o: Occurrence, status: Settlement["status"]) => void;
  onUndo: (o: Occurrence) => void;
  onOpen: (bill: Bill) => void;
  onOpenExpense: (expense: Expense) => void;
}

export interface ViewProps {
  data: AppData;
  today: ISODate;
  currency: string;
  actions: OccurrenceActions;
}

type Editing =
  | { type: "item"; kind: ItemKind; bill?: Bill }
  | { type: "expense"; expense?: Expense; date?: ISODate }
  | null;

export default function App() {
  const [data, update] = useAppData();
  const today = useToday();
  const [tab, setTab] = useState<Tab>("home");
  const [month, setMonth] = useState<YearMonth>(() => parts(today).slice(0, 2) as YearMonth);
  const [editing, setEditing] = useState<Editing>(null);

  const actions: OccurrenceActions = {
    onSettle: (o, status) => update((d) => settle(d, o.bill, o.due, status, today)),
    onUndo: (o) => update((d) => unsettle(d, o.bill.id, o.due)),
    onOpen: (bill) => setEditing({ type: "item", kind: bill.kind ?? "bill", bill }),
    onOpenExpense: (expense) => setEditing({ type: "expense", expense }),
  };
  const view = { data, today, currency: data.settings.currency, actions };
  const paged = { ...view, month, onMonth: setMonth };

  const add = () =>
    setEditing(
      tab === "expenses"
        ? { type: "expense" }
        : { type: "item", kind: tab === "income" ? "income" : "bill" },
    );

  return (
    <div className="app">
      <main className="content">
        {tab === "home" && <Home {...view} onSettings={() => setTab("settings")} />}
        {tab === "bills" && <BillsPage {...paged} />}
        {tab === "calendar" && <CalendarPage {...paged} />}
        {tab === "income" && <IncomePage {...paged} />}
        {tab === "expenses" && <ExpensesPage {...paged} />}
        {tab === "settings" && (
          <Settings data={data} today={today} update={update} onBack={() => setTab("home")} />
        )}
      </main>

      {tab !== "settings" && (
        <button className="fab" aria-label="Add" onClick={add}>
          +
        </button>
      )}

      <nav className="tabbar">
        {TABS.map((t) => (
          <button key={t.id} className={tab === t.id ? "active" : ""} onClick={() => setTab(t.id)}>
            <span aria-hidden>{t.icon}</span>
            {t.label}
          </button>
        ))}
      </nav>

      {editing?.type === "item" && (
        <BillForm
          kind={editing.kind}
          bill={editing.bill}
          data={data}
          today={today}
          onCancel={() => setEditing(null)}
          onSave={(bill) => {
            update((d) => saveBill(d, bill));
            setEditing(null);
          }}
          onDelete={(id) => {
            update((d) => deleteBill(d, id));
            setEditing(null);
          }}
        />
      )}
      {editing?.type === "expense" && (
        <ExpenseForm
          expense={editing.expense}
          data={data}
          today={today}
          onCancel={() => setEditing(null)}
          onSave={(expense) => {
            update((d) => saveExpense(d, expense));
            setEditing(null);
          }}
          onDelete={(id) => {
            update((d) => deleteExpense(d, id));
            setEditing(null);
          }}
        />
      )}
    </div>
  );
}
