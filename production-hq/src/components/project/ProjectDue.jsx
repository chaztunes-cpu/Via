import { Hourglass, CalendarDays } from 'lucide-react';
import { ATTENTION } from '../../lib/constants.js';
import { daysUntil, formatLongDate } from '../../lib/dates.js';

/** Read-only Project Due Date: deposit date + turnaround, or why there isn't one yet. */
export default function ProjectDue({ dueDate, awaitingDeposit, className = '' }) {
  let icon = CalendarDays;
  let text;
  let tone = 'text-zinc-200';

  if (awaitingDeposit) {
    icon = Hourglass;
    text = 'Pending deposit';
    tone = 'text-zinc-400';
  } else if (!dueDate) {
    text = 'Set a turnaround';
    tone = 'text-zinc-500';
  } else {
    const days = daysUntil(dueDate);
    text = formatLongDate(dueDate);
    if (days < 0) tone = 'text-rose-400';
    else if (days <= ATTENTION.DEADLINE_WITHIN_DAYS) tone = 'text-amber-300/90';
  }

  const Icon = icon;
  return (
    <div className={`flex h-9 items-center gap-2 rounded-lg bg-white/[0.03] px-3 text-sm ${tone} ${className}`}>
      <Icon className="size-3.5 shrink-0 opacity-80" strokeWidth={2} />
      <span className="truncate">{text}</span>
    </div>
  );
}
