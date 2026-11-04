import { Link } from 'react-router-dom';
import { formatDateTime } from '../../lib/dates.js';
import Card, { SectionHeader } from '../ui/Card.jsx';
import { StatusDot } from '../ui/StatusBadge.jsx';

export default function RecentActivity({ entries }) {
  return (
    <section aria-labelledby="recent-activity" className="flex flex-col gap-3">
      <div id="recent-activity">
        <SectionHeader title="Recent Activity" description="Latest updates across all projects" />
      </div>
      <Card className="px-4 py-4">
        {entries.length === 0 && <p className="text-sm text-zinc-500">Updates you add to projects will appear here.</p>}
        <ol className="relative">
          {entries.map((u, i) => (
            <li key={u.id} className="relative flex gap-3 pb-5 last:pb-0">
              {i < entries.length - 1 && (
                <span className="absolute left-[3px] top-3 -bottom-0 w-px bg-line-strong" aria-hidden="true" />
              )}
              <StatusDot status={u.project.status} className="relative mt-[7px] size-[7px] ring-4 ring-surface" />
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-baseline justify-between gap-x-3">
                  <Link
                    to={{ search: `?project=${u.project.id}` }}
                    className="min-w-0 truncate text-sm text-zinc-200 hover:text-white"
                  >
                    <span className="font-medium">{u.project.client?.name}</span>
                    <span className="text-zinc-600"> / </span>
                    <span className="text-zinc-400">{u.project.title}</span>
                  </Link>
                </div>
                <time dateTime={u.createdAt} className="mt-0.5 block text-xs text-zinc-600">
                  {formatDateTime(u.createdAt)}
                </time>
                <p className="mt-1.5 line-clamp-3 text-[13px] leading-relaxed text-zinc-400">{u.body}</p>
              </div>
            </li>
          ))}
        </ol>
      </Card>
    </section>
  );
}
