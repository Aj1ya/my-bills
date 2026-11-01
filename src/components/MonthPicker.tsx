import { shiftMonth, type YearMonth } from "../lib/dates";
import { monthTitle } from "../lib/format";

export interface MonthProps {
  month: YearMonth;
  onMonth: (month: YearMonth) => void;
}

export function MonthPicker({ month, onMonth }: MonthProps) {
  return (
    <div className="month-head">
      <button aria-label="Previous month" onClick={() => onMonth(shiftMonth(month, -1))}>
        ‹
      </button>
      <span className="month-title">{monthTitle(...month)}</span>
      <button aria-label="Next month" onClick={() => onMonth(shiftMonth(month, 1))}>
        ›
      </button>
    </div>
  );
}
