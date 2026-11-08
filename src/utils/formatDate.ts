const DAY_MS = 24 * 60 * 60 * 1000;

function startOfDay(ms: number): number {
  const d = new Date(ms);
  d.setHours(0, 0, 0, 0);
  return d.getTime();
}

/** "Today", "Yesterday", "Oct 28", or "Oct 28, 2025" for other years. */
export function formatRelativeDay(ms: number, now: number = Date.now()): string {
  const diffDays = Math.round((startOfDay(now) - startOfDay(ms)) / DAY_MS);
  if (diffDays === 0) return "Today";
  if (diffDays === 1) return "Yesterday";

  const sameYear = new Date(ms).getFullYear() === new Date(now).getFullYear();
  return new Date(ms).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    ...(sameYear ? {} : { year: "numeric" }),
  });
}
