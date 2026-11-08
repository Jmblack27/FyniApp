export interface MonthRange {
  /** Inclusive, local midnight on the 1st, epoch ms */
  start: number;
  /** Exclusive, local midnight on the 1st of the next month, epoch ms */
  end: number;
}

export function monthRange(now: number = Date.now()): MonthRange {
  const d = new Date(now);
  const start = new Date(d.getFullYear(), d.getMonth(), 1).getTime();
  const end = new Date(d.getFullYear(), d.getMonth() + 1, 1).getTime();
  return { start, end };
}

/** "November 2026" */
export function formatMonth(now: number = Date.now()): string {
  return new Date(now).toLocaleDateString("en-US", {
    month: "long",
    year: "numeric",
  });
}

/** Whole days left in the month, counting today. */
export function daysLeftInMonth(now: number = Date.now()): number {
  const d = new Date(now);
  const lastDay = new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate();
  return lastDay - d.getDate() + 1;
}
