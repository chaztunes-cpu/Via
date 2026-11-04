import { Link } from 'react-router-dom';
import { AlarmClock, CalendarClock, PackageCheck, RotateCcw, Hourglass, CircleCheck } from 'lucide-react';
import { daysSince, formatDue } from '../../lib/dates.js';
import Card, { SectionHeader } from '../ui/Card.jsx';

const REASONS = {
  overdue: { icon: AlarmClock, tone: 'text-rose-400', label: (p) => formatDue(p.dueDate) },
  deadline: { icon: CalendarClock, tone: 'text-amber-300', label: (p) => formatDue(p.dueDate) },
  deliver: { icon: PackageCheck, tone: 'text-emerald-400', label: () => 'Ready to deliver' },
  revisions: { icon: RotateCcw, tone: 'text-orange-400', label: () => 'Revisions requested' },
  stale: { icon: Hourglass, tone: 'text-zinc-400', label: (p) => `No update in ${daysSince(p.lastUpdatedAt)} days` },
};

export default function NeedsAttention({ items, limit = 5 }) {
  const shown = items.slice(0, limit);
  return (
    <section aria-labelledby="needs-attention" className="flex flex-col gap-3">
      <div id="needs-attention">
        <SectionHeader title="Needs Attention" count={items.length} />
      </div>
      <Card>
        {shown.length ? (
          <ul className="divide-y divide-line">
            {shown.map(({ project, reasons }) => {
              const primary = REASONS[reasons[0].type];
              const Icon = primary.icon;
              const extra = reasons.slice(1).map((r) => REASONS[r.type].label(project));
              return (
                <li key={project.id}>
                  <Link
                    to={`/projects/${project.id}`}
                    className="flex items-start gap-3 px-4 py-3 transition-colors hover:bg-white/[0.025]"
                  >
                    <Icon className={`mt-0.5 size-4 shrink-0 ${primary.tone}`} strokeWidth={1.75} />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-baseline justify-between gap-3">
                        <p className="truncate text-sm font-medium text-zinc-200">{project.title}</p>
                        <span className={`shrink-0 text-xs ${primary.tone}`}>{primary.label(project)}</span>
                      </div>
                      <p className="mt-0.5 truncate text-xs text-zinc-500">
                        {project.client?.name}
                        {extra.length > 0 && <span className="text-zinc-600"> · {extra.join(' · ')}</span>}
                      </p>
                    </div>
                  </Link>
                </li>
              );
            })}
          </ul>
        ) : (
          <div className="flex items-center gap-2.5 px-4 py-5 text-sm text-zinc-500">
            <CircleCheck className="size-4 text-emerald-400" /> You're all caught up.
          </div>
        )}
        {items.length > limit && (
          <p className="border-t border-line px-4 py-2.5 text-xs text-zinc-500">+{items.length - limit} more</p>
        )}
      </Card>
    </section>
  );
}
