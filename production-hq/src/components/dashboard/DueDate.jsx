import { CalendarDays } from 'lucide-react';
import { daysUntil, formatDue } from '../../lib/dates.js';
import { ATTENTION } from '../../lib/constants.js';

export default function DueDate({ date }) {
  if (!date) {
    return <span className="text-xs text-zinc-600">No deadline</span>;
  }
  const days = daysUntil(date);
  const tone =
    days < 0 ? 'text-rose-400' : days <= ATTENTION.DEADLINE_WITHIN_DAYS ? 'text-amber-300/90' : 'text-zinc-500';
  return (
    <span className={`inline-flex items-center gap-1 whitespace-nowrap text-xs ${tone}`}>
      <CalendarDays className="size-3" strokeWidth={2} />
      {formatDue(date)}
    </span>
  );
}
