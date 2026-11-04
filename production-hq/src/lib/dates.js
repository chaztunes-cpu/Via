const DAY = 24 * 60 * 60 * 1000;

function startOfDay(date) {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
}

/** Whole calendar days from today to `date` (negative = past). */
export function daysUntil(date, now = new Date()) {
  return Math.round((startOfDay(date) - startOfDay(now)) / DAY);
}

export function daysSince(date, now = new Date()) {
  return -daysUntil(date, now);
}

export function formatShortDate(date, now = new Date()) {
  const d = new Date(date);
  const opts = { month: 'short', day: 'numeric' };
  if (d.getFullYear() !== now.getFullYear()) opts.year = 'numeric';
  return d.toLocaleDateString('en-US', opts);
}

export function formatTime(date) {
  return new Date(date).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
}

/** "Today", "Yesterday", "3 days ago", or a short date. */
export function formatRelativeDay(date, now = new Date()) {
  const days = daysSince(date, now);
  if (days <= 0) return 'Today';
  if (days === 1) return 'Yesterday';
  if (days < 7) return `${days} days ago`;
  return formatShortDate(date, now);
}

/** "Today, 9:42 AM" / "Yesterday, 7:20 PM" / "Oct 28, 4:30 PM" */
export function formatDateTime(date, now = new Date()) {
  const days = daysSince(date, now);
  const day = days <= 0 ? 'Today' : days === 1 ? 'Yesterday' : formatShortDate(date, now);
  return `${day}, ${formatTime(date)}`;
}

/** Label for a delivery date: "Overdue by 2 days", "Due today", "Due in 3 days", "Due Nov 20". */
export function formatDue(date, now = new Date()) {
  const days = daysUntil(date, now);
  if (days < 0) return `Overdue by ${-days} day${days === -1 ? '' : 's'}`;
  if (days === 0) return 'Due today';
  if (days === 1) return 'Due tomorrow';
  if (days <= 7) return `Due in ${days} days`;
  return `Due ${formatShortDate(date, now)}`;
}

export function isSameMonth(a, b) {
  const x = new Date(a);
  const y = new Date(b);
  return x.getFullYear() === y.getFullYear() && x.getMonth() === y.getMonth();
}

const pad = (n) => String(n).padStart(2, '0');

/** ISO timestamp → "YYYY-MM-DD" for <input type="date">. */
export function toDateInput(iso) {
  if (!iso) return '';
  const d = new Date(iso);
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

/** "YYYY-MM-DD" → ISO timestamp (5 PM local), or null when empty. */
export function fromDateInput(value) {
  if (!value) return null;
  const [y, m, d] = value.split('-').map(Number);
  return new Date(y, m - 1, d, 17, 0, 0, 0).toISOString();
}

/** "Today", "Tomorrow", "Yesterday", or "Fri, Nov 6". */
export function formatDayName(date, now = new Date()) {
  const days = daysUntil(date, now);
  if (days === 0) return 'Today';
  if (days === 1) return 'Tomorrow';
  if (days === -1) return 'Yesterday';
  const opts = { weekday: 'short', month: 'short', day: 'numeric' };
  if (new Date(date).getFullYear() !== now.getFullYear()) opts.year = 'numeric';
  return new Date(date).toLocaleDateString('en-US', opts);
}
