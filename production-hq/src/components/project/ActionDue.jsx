import { Clock } from 'lucide-react';
import { daysUntil, formatDayName } from '../../lib/dates.js';
import { ATTENTION } from '../../lib/constants.js';

/** Small due label for a Next Action: "Due today", "Overdue · Mon, Nov 2", "Due Fri, Nov 6". */
export default function ActionDue({ date }) {
  if (!date) return null;
  const days = daysUntil(date);
  const tone =
    days < 0 ? 'text-rose-400' : days <= ATTENTION.NEXT_ACTION_WITHIN_DAYS ? 'text-amber-300/90' : 'text-zinc-500';
  const text = days < 0 ? `Overdue · ${formatDayName(date)}` : `Due ${formatDayName(date).replace(/^(Today|Tomorrow)$/, (m) => m.toLowerCase())}`;
  return (
    <span className={`inline-flex items-center gap-1 whitespace-nowrap text-xs ${tone}`}>
      <Clock className="size-3" strokeWidth={2} />
      {text}
    </span>
  );
}
