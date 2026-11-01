import { useState } from "react";
import { BillForm } from "./components/BillForm";
import { BillsList } from "./components/BillsList";
import { MonthView } from "./components/MonthView";
import { Settings } from "./components/Settings";
import { Upcoming } from "./components/Upcoming";
import { deleteBill, saveBill, settle, unsettle } from "./lib/actions";
import { useAppData, useToday } from "./lib/store";
import type { Bill, Occurrence, Settlement } from "./lib/types";

type Tab = "upcoming" | "month" | "bills" | "settings";

const TABS: { id: Tab; label: string; icon: string }[] = [
  { id: "upcoming", label: "Upcoming", icon: "◷" },
  { id: "month", label: "Month", icon: "▦" },
  { id: "bills", label: "Bills", icon: "≡" },
  { id: "settings", label: "Settings", icon: "⚙" },
];

/** Callbacks shared by every list of occurrences. */
export interface OccurrenceActions {
  onSettle: (o: Occurrence, status: Settlement["status"]) => void;
  onUndo: (o: Occurrence) => void;
  onOpen: (bill: Bill) => void;
}

export default function App() {
  const [data, update] = useAppData();
  const today = useToday();
  const [tab, setTab] = useState<Tab>("upcoming");
  const [editing, setEditing] = useState<Bill | "new" | null>(null);

  const actions: OccurrenceActions = {
    onSettle: (o, status) => update((d) => settle(d, o.bill, o.due, status, today)),
    onUndo: (o) => update((d) => unsettle(d, o.bill.id, o.due)),
    onOpen: (bill) => setEditing(bill),
  };
  const view = { data, today, currency: data.settings.currency, actions };

  return (
    <div className="app">
      <main className="content">
        {tab === "upcoming" && <Upcoming {...view} />}
        {tab === "month" && <MonthView {...view} />}
        {tab === "bills" && <BillsList {...view} />}
        {tab === "settings" && <Settings data={data} today={today} update={update} />}
      </main>

      {tab !== "settings" && (
        <button className="fab" aria-label="Add bill" onClick={() => setEditing("new")}>
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

      {editing && (
        <BillForm
          bill={editing === "new" ? undefined : editing}
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
    </div>
  );
}
