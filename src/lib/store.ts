import { useCallback, useEffect, useState } from "react";
import { todayISO } from "./dates";
import type { AppData } from "./types";

const KEY = "my-bills/v1";

export const emptyData = (): AppData => ({
  version: 1,
  bills: [],
  settlements: [],
  settings: { currency: "AUD" },
});

/** Validates stored or imported data enough to trust its shape. */
export function parseData(raw: unknown): AppData {
  const d = raw as Partial<AppData> | null;
  if (!d || typeof d !== "object" || d.version !== 1 || !Array.isArray(d.bills) || !Array.isArray(d.settlements))
    throw new Error("This isn't a My Bills backup file.");
  return {
    version: 1,
    bills: d.bills,
    settlements: d.settlements,
    settings: { currency: d.settings?.currency ?? "AUD" },
  };
}

function load(): AppData {
  let stored: string | null = null;
  try {
    stored = localStorage.getItem(KEY);
    return stored ? parseData(JSON.parse(stored)) : emptyData();
  } catch {
    // Keep unreadable data aside rather than overwriting it on the next save.
    if (stored) localStorage.setItem(`${KEY}/unreadable-${Date.now()}`, stored);
    return emptyData();
  }
}

export function useAppData() {
  const [data, setData] = useState(load);
  useEffect(() => {
    localStorage.setItem(KEY, JSON.stringify(data));
  }, [data]);
  const update = useCallback((change: (d: AppData) => AppData) => setData(change), []);
  return [data, update] as const;
}

/** Today's date, refreshed when the app comes back to the foreground on a new day. */
export function useToday() {
  const [today, setToday] = useState(todayISO);
  useEffect(() => {
    const refresh = () => setToday(todayISO());
    document.addEventListener("visibilitychange", refresh);
    const timer = setInterval(refresh, 60_000);
    return () => {
      document.removeEventListener("visibilitychange", refresh);
      clearInterval(timer);
    };
  }, []);
  return today;
}
