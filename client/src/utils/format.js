/** "danes", "jutri", "čez 3 dni", "včeraj", "pred 2 dnevoma", "pred 5 dnevi". */
export function relativeDays(days) {
  if (days === 0) return 'danes';
  if (days === 1) return 'jutri';
  if (days === -1) return 'včeraj';
  if (days > 1) return `čez ${days} dni`;
  if (days === -2) return 'pred 2 dnevoma';
  return `pred ${-days} dnevi`;
}

/** 95 -> "1 h 35 min", 40 -> "40 min", 0 -> "0 min". */
export function formatMinutes(total) {
  const h = Math.floor(total / 60);
  const m = total % 60;
  if (h === 0) return `${m} min`;
  return m === 0 ? `${h} h` : `${h} h ${m} min`;
}

/** Seconds -> "MM:SS" for the study timer. */
export function formatClock(seconds) {
  const s = Math.max(0, Math.floor(seconds));
  return `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;
}

/** ISO string -> "7. 10. 2026" */
export function formatDate(iso) {
  const d = new Date(iso);
  return `${d.getDate()}. ${d.getMonth() + 1}. ${d.getFullYear()}`;
}

/** ISO string -> value for <input type="datetime-local"> in local time. */
export function toLocalInput(iso) {
  const d = new Date(iso);
  const pad = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export const STATUS_LABELS = { todo: 'Za narediti', in_progress: 'V teku', done: 'Opravljeno' };
export const TYPE_LABELS = { assignment: 'Naloga', exam: 'Izpit', project: 'Projekt' };
export const PRIORITY_LABELS = { low: 'Nizka', medium: 'Srednja', high: 'Visoka' };
