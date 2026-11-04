import { useMemo, useState } from 'react';
import { X } from 'lucide-react';
import { useData } from '../../data/DataProvider.jsx';
import { SERVICE, SERVICE_META, STATUS, DEPOSIT } from '../../lib/constants.js';
import { fromDateInput, todayInput } from '../../lib/dates.js';
import { computeDueDate, findClientByName } from '../../lib/projects.js';
import TimelineFields from './TimelineFields.jsx';
import ProjectDue from './ProjectDue.jsx';
import SlideOver from '../ui/SlideOver.jsx';
import Select from '../ui/Select.jsx';
import Button from '../ui/Button.jsx';
import { Field, TextInput, Textarea, DateInput } from '../ui/Field.jsx';
import StatusSelect from './StatusSelect.jsx';

const NEW_CLIENT = '__new__';
const serviceOptions = Object.entries(SERVICE_META).map(([value, m]) => ({ value, label: m.label }));

const EMPTY = {
  clientId: '',
  newClientName: '',
  title: '',
  serviceType: SERVICE.GHOST,
  status: STATUS.NOT_STARTED,
  depositStatus: DEPOSIT.AWAITING,
  depositDate: '',
  turnaroundWeeks: 4,
  nextAction: '',
  nextActionDue: '',
  firstUpdate: '',
};

export default function NewProjectPanel({ open, onClose, onCreated }) {
  return (
    <SlideOver open={open} onClose={onClose} labelledBy="new-project-title">
      {open && <NewProjectForm onClose={onClose} onCreated={onCreated} />}
    </SlideOver>
  );
}

function NewProjectForm({ onClose, onCreated }) {
  const { clients, projects, createProject } = useData();
  const [form, setForm] = useState(EMPTY);
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);
  const set = (key) => (value) => setForm((f) => ({ ...f, [key]: value }));

  const clientOptions = useMemo(() => {
    const count = (id) => projects.filter((p) => p.clientId === id).length;
    return [
      { value: '', label: 'Select a client…' },
      ...[...clients]
        .sort((a, b) => a.name.localeCompare(b.name))
        .map((c) => ({ value: c.id, label: `${c.name} (${count(c.id)} project${count(c.id) === 1 ? '' : 's'})` })),
      { value: NEW_CLIENT, label: '+ New client…' },
    ];
  }, [clients, projects]);

  const isNewClient = form.clientId === NEW_CLIENT;
  const received = form.depositStatus === DEPOSIT.RECEIVED;
  const previewDue = computeDueDate({
    depositStatus: form.depositStatus,
    depositReceivedAt: fromDateInput(form.depositDate),
    turnaroundWeeks: form.turnaroundWeeks,
  });

  const changeTimeline = (patch) =>
    setForm((f) => {
      const next = { ...f, ...patch };
      // Default the deposit date to today when the deposit is marked received.
      if (patch.depositStatus === DEPOSIT.RECEIVED && !f.depositDate) next.depositDate = todayInput();
      return next;
    });
  const existingMatch = isNewClient ? findClientByName(clients, form.newClientName) : null;

  const submit = async (e) => {
    e.preventDefault();
    const next = {};
    if (!form.clientId) next.client = 'Choose a client.';
    if (isNewClient && !form.newClientName.trim()) next.client = 'Enter the new client’s name.';
    if (!form.title.trim()) next.title = 'Give the project a name.';
    setErrors(next);
    if (Object.keys(next).length) return;

    setSaving(true);
    const project = await createProject({
      // A typed name that matches an existing client reuses that client.
      clientId: isNewClient ? existingMatch?.id : form.clientId,
      newClientName: isNewClient && !existingMatch ? form.newClientName : undefined,
      title: form.title,
      serviceType: form.serviceType,
      status: form.status,
      depositStatus: form.depositStatus,
      depositReceivedAt: form.depositStatus === DEPOSIT.RECEIVED ? fromDateInput(form.depositDate) : null,
      turnaroundWeeks: form.turnaroundWeeks,
      nextAction: form.nextAction,
      nextActionDue: form.nextAction.trim() ? fromDateInput(form.nextActionDue) : null,
      firstUpdate: form.firstUpdate,
    });
    onCreated(project.id);
  };

  return (
    <form onSubmit={submit} className="flex min-h-0 flex-1 flex-col" noValidate>
      <header className="flex items-start justify-between gap-3 border-b border-line px-5 py-4">
        <div>
          <h2 id="new-project-title" className="text-lg font-semibold tracking-tight text-zinc-50">
            New project
          </h2>
          <p className="mt-0.5 text-xs text-zinc-500">Add a track for a new or existing client.</p>
        </div>
        <button
          type="button"
          onClick={onClose}
          aria-label="Close panel"
          className="-mr-1.5 rounded-md p-1.5 text-zinc-500 transition-colors hover:bg-white/[0.06] hover:text-zinc-100"
        >
          <X className="size-4" />
        </button>
      </header>

      <div className="flex flex-1 flex-col gap-5 overflow-y-auto px-5 py-5">
        <Field id="np-client" label="Client" error={errors.client}>
          <Select id="np-client" label="Client" value={form.clientId} onChange={set('clientId')} options={clientOptions} />
          {isNewClient && (
            <TextInput
              id="np-client-name"
              autoFocus
              value={form.newClientName}
              onChange={(e) => set('newClientName')(e.target.value)}
              placeholder="Artist or client name"
              aria-label="New client name"
            />
          )}
          {existingMatch && (
            <p className="text-xs text-amber-300/90">
              {existingMatch.name} is already a client. This project will be added to their existing record.
            </p>
          )}
        </Field>

        <Field id="np-title" label="Project name" error={errors.title}>
          <TextInput
            id="np-title"
            value={form.title}
            onChange={(e) => set('title')(e.target.value)}
            placeholder="Track or project name"
          />
        </Field>

        <div className="grid grid-cols-2 gap-3">
          <Field id="np-service" label="Service">
            <Select id="np-service" label="Service type" value={form.serviceType} onChange={set('serviceType')} options={serviceOptions} />
          </Field>
          <Field id="np-status" label="Status">
            <StatusSelect id="np-status" value={form.status} onChange={set('status')} />
          </Field>
        </div>

        <div className="flex flex-col gap-3">
          <TimelineFields
            idPrefix="np"
            depositStatus={form.depositStatus}
            depositDate={form.depositDate}
            turnaroundWeeks={form.turnaroundWeeks}
            onChange={changeTimeline}
          />
          <Field label="Project due" hint={received ? 'Deposit date + agreed turnaround' : 'Calculated once the deposit is received'}>
            <ProjectDue dueDate={previewDue} awaitingDeposit={!received} />
          </Field>
        </div>

        <div className="grid grid-cols-[minmax(0,1fr)_auto] items-start gap-3">
          <Field id="np-next" label="Next action" hint="Optional. Its due date is separate from the project due date.">
            <TextInput
              id="np-next"
              value={form.nextAction}
              onChange={(e) => set('nextAction')(e.target.value)}
              placeholder="e.g. Finish arrangement"
            />
          </Field>
          <Field id="np-next-due" label="Due">
            <DateInput
              id="np-next-due"
              value={form.nextActionDue}
              onChange={(e) => set('nextActionDue')(e.target.value)}
              disabled={!form.nextAction.trim()}
              className="w-[9.5rem] disabled:opacity-40"
            />
          </Field>
        </div>

        <Field id="np-first-update" label="First update" hint="Optional. Kickoff notes, references, BPM, key…">
          <Textarea
            id="np-first-update"
            rows={3}
            value={form.firstUpdate}
            onChange={(e) => set('firstUpdate')(e.target.value)}
            placeholder="What’s the brief?"
          />
        </Field>
      </div>

      <footer className="flex justify-end gap-2 border-t border-line px-5 py-3">
        <Button variant="ghost" onClick={onClose}>
          Cancel
        </Button>
        <Button type="submit" disabled={saving}>
          Create Project
        </Button>
      </footer>
    </form>
  );
}
