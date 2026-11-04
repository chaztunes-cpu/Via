import { Link } from 'react-router-dom';
import { ChevronRight } from 'lucide-react';
import { SERVICE_META } from '../../lib/constants.js';
import { formatRelativeDay } from '../../lib/dates.js';
import StatusBadge from '../ui/StatusBadge.jsx';
import ClientAvatar from '../ui/ClientAvatar.jsx';
import DueDate from './DueDate.jsx';

export default function ProjectRow({ project }) {
  const { client, latestUpdate } = project;
  return (
    <Link
      to={{ search: `?project=${project.id}` }}
      className="group flex gap-3.5 px-4 py-4 transition-colors hover:bg-white/[0.025] focus-visible:bg-white/[0.03] focus-visible:outline-none sm:px-5"
    >
      <ClientAvatar name={client?.name} />

      <div className="min-w-0 flex-1">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h3 className="truncate text-sm font-medium text-zinc-100">{project.title}</h3>
            <p className="mt-0.5 truncate text-xs text-zinc-500">
              <span className="text-zinc-300">{client?.name}</span>
              <span className="mx-1.5 text-zinc-700">·</span>
              {SERVICE_META[project.serviceType].label}
              {project.nextAction && (
                <span className="hidden sm:inline">
                  <span className="mx-1.5 text-zinc-700">·</span>
                  <span className="text-zinc-600">Next:</span> <span className="text-zinc-400">{project.nextAction}</span>
                </span>
              )}
            </p>
          </div>
          <div className="hidden shrink-0 sm:block">
            <StatusBadge status={project.status} />
          </div>
        </div>

        <div className="mt-2.5 flex items-end justify-between gap-4">
          <p className="line-clamp-2 min-w-0 text-[13px] leading-relaxed text-zinc-400 sm:line-clamp-1">
            <span className="font-medium text-zinc-500">{formatRelativeDay(project.lastUpdatedAt)}</span>
            <span className="mx-1.5 text-zinc-700">—</span>
            {latestUpdate?.body ?? 'No updates yet.'}
          </p>
          <div className="hidden shrink-0 sm:block">
            <DueDate date={project.dueDate} />
          </div>
        </div>

        {/* Mobile: status and deadline under the text */}
        <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-2 sm:hidden">
          <StatusBadge status={project.status} compact />
          <DueDate date={project.dueDate} />
        </div>
      </div>

      <ChevronRight className="mt-2 hidden size-4 shrink-0 text-zinc-700 transition-colors group-hover:text-zinc-400 md:block" />
    </Link>
  );
}
