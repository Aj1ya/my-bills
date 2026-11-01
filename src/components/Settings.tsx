import { useEffect, useRef, useState, type ChangeEvent } from "react";
import type { ISODate } from "../lib/dates";
import { parseData } from "../lib/store";
import type { AppData } from "../lib/types";

interface Props {
  data: AppData;
  today: ISODate;
  update: (change: (d: AppData) => AppData) => void;
}

const CURRENCIES = ["AUD", "NZD", "USD", "GBP", "EUR", "CAD", "INR"];

export function Settings({ data, today, update }: Props) {
  const fileInput = useRef<HTMLInputElement>(null);
  const [pending, setPending] = useState<AppData | null>(null);
  const [message, setMessage] = useState("");
  const [persisted, setPersisted] = useState<boolean | null>(null);

  useEffect(() => {
    navigator.storage?.persisted?.().then(setPersisted, () => setPersisted(null));
  }, []);

  const exportBackup = async () => {
    const name = `my-bills-backup-${today}.json`;
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    const file = new File([blob], name, { type: "application/json" });
    try {
      if (navigator.canShare?.({ files: [file] })) {
        await navigator.share({ files: [file], title: name });
        return;
      }
    } catch (error) {
      if ((error as Error).name === "AbortError") return;
    }
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = name;
    link.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  };

  const chooseImport = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    try {
      setPending(parseData(JSON.parse(await file.text())));
      setMessage("");
    } catch (error) {
      setMessage(error instanceof SyntaxError ? "That file isn't valid JSON." : (error as Error).message);
    }
  };

  return (
    <>
      <h1>Settings</h1>

      <section className="panel">
        <label>
          Currency
          <select
            value={data.settings.currency}
            onChange={(e) => update((d) => ({ ...d, settings: { ...d.settings, currency: e.target.value } }))}
          >
            {CURRENCIES.map((c) => (
              <option key={c}>{c}</option>
            ))}
          </select>
        </label>
      </section>

      <section className="panel">
        <h2>Backup</h2>
        <p className="hint">
          Your bills are stored only on this device ({data.bills.length} bills, {data.settlements.length} payments). Export a
          backup now and then, and before deleting the app.
        </p>
        <div className="row">
          <button className="button" onClick={exportBackup}>
            Export backup
          </button>
          <button className="button secondary" onClick={() => fileInput.current?.click()}>
            Import backup
          </button>
          <input ref={fileInput} type="file" accept="application/json,.json" hidden onChange={chooseImport} />
        </div>
        {pending && (
          <div className="danger-confirm">
            <span>
              Replace everything with this backup ({pending.bills.length} bills, {pending.settlements.length} payments)?
            </span>
            <button
              className="danger"
              onClick={() => {
                update(() => pending);
                setPending(null);
                setMessage("Backup restored.");
              }}
            >
              Replace
            </button>
            <button className="link" onClick={() => setPending(null)}>
              Cancel
            </button>
          </div>
        )}
        {message && <p className="hint">{message}</p>}
      </section>

      <section className="panel">
        <h2>About</h2>
        <p className="hint">
          My Bills 0.1 · Storage {persisted ? "protected from automatic clearing" : "may be cleared by the browser if space runs low"}.
        </p>
      </section>
    </>
  );
}
