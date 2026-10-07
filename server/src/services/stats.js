const DAY_MS = 24 * 60 * 60 * 1000;

/** Start of the ISO week (Monday 00:00 UTC) containing `date`. */
export function startOfWeek(date) {
  const d = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
  const day = (d.getUTCDay() + 6) % 7; // Monday = 0
  return new Date(d.getTime() - day * DAY_MS);
}

/** Whole days from `now` until `dueDate` (negative when overdue). */
export function daysUntil(dueDate, now = new Date()) {
  const due = new Date(dueDate);
  const startToday = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate());
  const startDue = Date.UTC(due.getUTCFullYear(), due.getUTCMonth(), due.getUTCDate());
  return Math.round((startDue - startToday) / DAY_MS);
}

/**
 * Sums study minutes per day for the 7 days of the week starting at `weekStart`.
 * Returns `[{ date: 'YYYY-MM-DD', minutes }]` with exactly 7 entries.
 */
export function minutesPerDay(sessions, weekStart) {
  const days = Array.from({ length: 7 }, (_, i) => ({
    date: new Date(weekStart.getTime() + i * DAY_MS).toISOString().slice(0, 10),
    minutes: 0,
  }));
  for (const s of sessions) {
    const key = new Date(s.started_at).toISOString().slice(0, 10);
    const day = days.find((d) => d.date === key);
    if (day) day.minutes += s.duration_minutes;
  }
  return days;
}
