import { X } from 'lucide-react';
import { useData } from '../../data/DataProvider.jsx';
import { SERVICE_META } from '../../lib/constants.js';
import { fromDateInput, toDateInput } from '../../lib/dates.js';
import { getClientProjects } from '../../lib/projects.js';
import SlideOver from '../ui/SlideOver.jsx';
import ClientAvatar from '../ui/ClientAvatar.jsx';
import { Field, FieldLabel } from '../ui/Field.jsx';
import { StatusDot } from '../ui/StatusBadge.jsx';
import StatusSelect from './StatusSelect.jsx';
import NextActionEditor from './NextActionEditor.jsx';
import UpdateComposer from './UpdateComposer.jsx';
import UpdateItem from './UpdateItem.jsx';
import TimelineFields from './TimelineFields.jsx';
import ProjectDue from './ProjectDue.jsx';

function CloseButton({ onClose }) {
  return (
    <button
      type="button"
      onClick={onClose}
      aria-label="Close panel"
      className="-mr-1.5 rounded-md p-1.5 text-zinc-500 transition-colors hover:bg-white/[0.06] hover:text-zinc-100"
    >
      <X className="size-4" />
    </button>
  );
}

/** Slide-out panel for one project: status, next action, quick updates and history. */
export default function ProjectPanel({ projectId, onClose, onOpenProject }) {
  const { projects, loading } = useData();
  const project = projects.find((p) => p.id === projectId);
  if (loading) return null;

  return (
    <SlideOver open={Boolean(projectId)} onClose={onClose} labelledBy="project-panel-title">
      {project ? (
        <PanelContent key={project.id} project={project} onClose={onClose} onOpenProject={onOpenProject} />
      ) : (
        <div className="flex flex-1 flex-col">
          <div className="flex justify-end px-5 py-4">
            <CloseButton onClose={onClose} />
          </div>
          <p id="project-panel-title" className="px-5 text-sm text-zinc-500">
            This project couldn't be found.
          </p>
        </div>
      )}
    </SlideOver>
  );
}

function PanelContent({ project, onClose, onOpenProject }) {
  const { projects, addUpdate, editUpdate, deleteUpdate, updateProject } = useData();
  const history = [...project.updates].reverse(); // newest first
  const otherProjects = getClientProjects(projects, project.clientId).filter((p) => p.id !== project.id);
  const saveOrThrow = (patch) => updateProject(project.id, patch);
  // Status, deposit and turnaround save instantly; on failure the change is undone and a message shown.
  const save = (patch) => saveOrThrow(patch).catch(() => {});

  return (
    <>
      <header className="flex items-start gap-3 border-b border-line px-5 py-4">
        <div className="min-w-0 flex-1">
          <p className="flex min-w-0 items-center gap-2 text-xs text-zinc-500">
            <ClientAvatar name={project.client?.name} size="sm" />
            <span className="truncate">
              <span className="font-medium text-zinc-300">{project.client?.name}</span>
              <span className="mx-1.5 text-zinc-700">·</span>
              {SERVICE_META[project.serviceType].label}
            </span>
          </p>
          <h2 id="project-panel-title" className="mt-2.5 text-lg font-semibold tracking-tight text-zinc-50">
            {project.title}
          </h2>
        </div>
        <CloseButton onClose={onClose} />
      </header>

      <div className="flex-1 overflow-y-auto">
        <div className="flex flex-col gap-4 border-b border-line px-5 py-4">
          <div className="grid grid-cols-2 gap-3">
            <Field id="panel-status" label="Status">
              <StatusSelect id="panel-status" value={project.status} onChange={(status) => save({ status })} />
            </Field>
            <Field label="Project due">
              <ProjectDue dueDate={project.dueDate} awaitingDeposit={project.awaitingDeposit} />
            </Field>
          </div>
          <TimelineFields
            idPrefix="panel"
            depositStatus={project.depositStatus}
            depositDate={toDateInput(project.depositReceivedAt)}
            turnaroundWeeks={project.turnaroundWeeks}
            onChange={({ depositDate, ...rest }) =>
              save(depositDate ? { ...rest, depositReceivedAt: fromDateInput(depositDate) } : rest)
            }
          />
        </div>

        <div className="border-b border-line px-5 py-4">
          <NextActionEditor project={project} onSave={saveOrThrow} />
        </div>

        <div className="border-b border-line px-5 py-4">
          <UpdateComposer onSave={(body) => addUpdate(project.id, body)} />
        </div>

        <section className="px-5 py-4" aria-labelledby="panel-updates">
          <div className="mb-3 flex items-baseline gap-2">
            <FieldLabel as="h3">
              <span id="panel-updates">Updates</span>
            </FieldLabel>
            <span className="text-xs tabular-nums text-zinc-600">{history.length}</span>
          </div>
          {history.length ? (
            <ol>
              {history.map((u, i) => (
                <UpdateItem
                  key={u.id}
                  update={u}
                  isLast={i === history.length - 1}
                  onEdit={editUpdate}
                  onDelete={deleteUpdate}
                />
              ))}
            </ol>
          ) : (
            <p className="text-sm text-zinc-500">No updates yet. Add the first one above.</p>
          )}
        </section>

        {otherProjects.length > 0 && (
          <section className="border-t border-line px-5 py-4">
            <FieldLabel as="h3">Other projects for {project.client?.name}</FieldLabel>
            <ul className="mt-2 flex flex-col">
              {otherProjects.map((p) => (
                <li key={p.id}>
                  <button
                    type="button"
                    onClick={() => onOpenProject(p.id)}
                    className="-mx-2 flex w-[calc(100%+1rem)] items-center gap-2.5 rounded-md px-2 py-1.5 text-left text-sm text-zinc-300 transition-colors hover:bg-white/[0.04] hover:text-zinc-100"
                  >
                    <StatusDot status={p.status} />
                    <span className="truncate">{p.title}</span>
                  </button>
                </li>
              ))}
            </ul>
          </section>
        )}
      </div>
    </>
  );
}
