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
