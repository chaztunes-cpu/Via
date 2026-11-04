import { useMemo, useRef, useState } from 'react';
import { Copy, Download, FileSpreadsheet, LogOut, Upload } from 'lucide-react';
import { useData } from '../data/DataProvider.jsx';
import { signOut } from '../data/api.js';
import { buildBackup, buildUpdatesCsv, downloadFile, isSampleRecord, parseBackup } from '../lib/backup.js';
import { toDateInput } from '../lib/dates.js';
import { STATUS_META } from '../lib/constants.js';
import Card from '../components/ui/Card.jsx';
import Button from '../components/ui/Button.jsx';
import { Textarea } from '../components/ui/Field.jsx';
import { StatusDot } from '../components/ui/StatusBadge.jsx';
import { useToast } from '../components/ui/Toast.jsx';

function Section({ title, description, children }) {
  return (
    <Card className="p-5">
      <h2 className="text-sm font-semibold text-zinc-100">{title}</h2>
      {description && <p className="mt-1 max-w-prose text-sm text-zinc-500">{description}</p>}
      <div className="mt-4">{children}</div>
    </Card>
  );
}

export default function Settings() {
  const { mode, userEmail, raw, projects } = useData();
  const live = mode === 'live';

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-6 px-4 py-6 sm:px-6 lg:px-10 lg:py-10">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-zinc-50">Settings</h1>
        <p className="mt-1 text-sm text-zinc-500">Your account, backups and data.</p>
      </div>

      <Section title="Account">
        {live ? (
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="text-sm text-zinc-400">
              Signed in as <span className="text-zinc-200">{userEmail}</span>
            </p>
            <Button variant="secondary" icon={LogOut} onClick={() => signOut()}>
              Sign out
            </Button>
          </div>
        ) : (
          <p className="text-sm text-zinc-400">
            Demo mode. These projects are sample data saved only in this browser.
          </p>
        )}
      </Section>

      <Section
        title="Backup & export"
        description="Download a copy of everything at any time. The backup file can be imported again; the spreadsheet opens in Excel, Numbers or Google Sheets."
      >
        <div className="flex flex-wrap gap-2">
          <Button
            variant="secondary"
            icon={Download}
            disabled={!raw}
            onClick={() => downloadFile(`production-hq-backup-${toDateInput(new Date().toISOString())}.json`, buildBackup(raw), 'application/json')}
          >
            Download full backup
          </Button>
          <Button
            variant="secondary"
            icon={FileSpreadsheet}
            disabled={!raw}
            onClick={() => downloadFile(`production-hq-updates-${toDateInput(new Date().toISOString())}.csv`, buildUpdatesCsv(projects), 'text/csv')}
          >
            Download updates spreadsheet
          </Button>
        </div>
      </Section>

      {live ? <ImportSection /> : <CopySection raw={raw} />}
    </div>
  );
}

/** Demo / prototype: copy everything as text so it can be pasted into the live app. */
function CopySection({ raw }) {
  const { notify } = useToast();
  const [fallback, setFallback] = useState('');
  const fallbackRef = useRef(null);

  const copy = async () => {
    const text = buildBackup(raw);
    try {
      await navigator.clipboard.writeText(text);
      setFallback('');
      notify('Copied. Paste it into Settings → Import in the live app.', 'success');
    } catch {
      setFallback(text);
      setTimeout(() => fallbackRef.current?.select(), 0);
    }
  };

  return (
    <Section
      title="Move my data to the live app"
      description="Copies every client, project and update in this browser as text. In the live app, open Settings → Import and paste it."
    >
      <Button variant="secondary" icon={Copy} onClick={copy} disabled={!raw}>
        Copy my data
      </Button>
      {fallback && (
        <div className="mt-3 flex flex-col gap-2">
          <p className="text-xs text-zinc-500">Your browser blocked copying. The text is selected below. Copy it with Ctrl/⌘ + C.</p>
          <Textarea id="copy-fallback" ref={fallbackRef} readOnly rows={6} value={fallback} className="font-mono text-xs" />
        </div>
      )}
    </Section>
  );
}

/** Live app: paste data copied from the prototype, choose projects, import. */
function ImportSection() {
  const { importData } = useData();
  const { notify } = useToast();
  const [text, setText] = useState('');
  const [source, setSource] = useState(null);
  const [selected, setSelected] = useState(new Set());
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const review = () => {
    try {
      const data = parseBackup(text);
      setSource(data);
      setSelected(new Set(data.projects.filter((p) => !isSampleRecord(p.id)).map((p) => p.id)));
      setError('');
    } catch (err) {
      setError(err.message);
    }
  };

  const groups = useMemo(() => {
    if (!source) return [];
    const counts = new Map();
    for (const u of source.updates) counts.set(u.projectId, (counts.get(u.projectId) ?? 0) + 1);
    return source.clients
      .map((c) => ({
        client: c,
        projects: source.projects
          .filter((p) => p.clientId === c.id)
          .map((p) => ({ ...p, updateCount: counts.get(p.id) ?? 0 })),
      }))
      .filter((g) => g.projects.length);
  }, [source]);

  const toggle = (id) =>
    setSelected((s) => {
      const next = new Set(s);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });

  const run = async () => {
    setBusy(true);
    setError('');
    try {
      const result = await importData(source, [...selected]);
      const skipped = result.skipped.length ? ` Skipped ${result.skipped.length} already in your workspace.` : '';
      notify(`Imported ${result.projects} projects and ${result.updates} updates.${skipped}`, 'success');
      setSource(null);
      setText('');
    } catch (err) {
      setError(`${err.message} Nothing was imported.`);
    } finally {
      setBusy(false);
    }
  };

  return (
    <Section
      title="Import from the prototype"
      description="In the prototype, open Settings → Copy my data, then paste the text here. You'll choose which projects to bring over before anything is saved."
    >
      {!source ? (
        <div className="flex flex-col gap-3">
          <Textarea
            id="import-text"
            rows={5}
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Paste the copied text here"
            className="font-mono text-xs"
          />
          {error && <p className="text-sm text-rose-400">{error}</p>}
          <div>
            <Button variant="secondary" icon={Upload} onClick={review} disabled={!text.trim()}>
              Review data
            </Button>
          </div>
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          <p className="text-xs text-zinc-500">
            Sample projects from the demo start unticked. Clients already in your workspace are reused, and projects
            you’ve already imported are skipped.
          </p>
          <div className="flex flex-col gap-4">
            {groups.map(({ client, projects }) => (
              <div key={client.id}>
                <p className="text-xs font-medium text-zinc-400">{client.name}</p>
                <ul className="mt-1.5 flex flex-col">
                  {projects.map((p) => (
                    <li key={p.id}>
                      <label className="-mx-2 flex cursor-pointer items-center gap-3 rounded-md px-2 py-1.5 text-sm text-zinc-300 hover:bg-white/[0.03]">
                        <input
                          type="checkbox"
                          checked={selected.has(p.id)}
                          onChange={() => toggle(p.id)}
                          className="size-4 accent-zinc-200"
                        />
                        <StatusDot status={p.status} />
                        <span className="min-w-0 flex-1 truncate">{p.title}</span>
                        <span className="shrink-0 text-xs text-zinc-600">
                          {isSampleRecord(p.id) ? 'Sample · ' : ''}
                          {p.updateCount} update{p.updateCount === 1 ? '' : 's'} · {STATUS_META[p.status]?.label}
                        </span>
                      </label>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
          {error && <p className="text-sm text-rose-400">{error}</p>}
          <div className="flex flex-wrap gap-2">
            <Button onClick={run} disabled={busy || selected.size === 0}>
              {busy ? 'Importing…' : `Import ${selected.size} project${selected.size === 1 ? '' : 's'}`}
            </Button>
            <Button variant="ghost" onClick={() => setSource(null)} disabled={busy}>
              Back
            </Button>
          </div>
        </div>
      )}
    </Section>
  );
}
