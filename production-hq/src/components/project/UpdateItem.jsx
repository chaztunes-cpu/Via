import { useState } from 'react';
import { Pencil, Trash2 } from 'lucide-react';
import { formatDateTime } from '../../lib/dates.js';
import { Textarea } from '../ui/Field.jsx';
import Button from '../ui/Button.jsx';

export default function UpdateItem({ update, isLast, onEdit, onDelete }) {
  const [mode, setMode] = useState('view'); // view | edit | confirmDelete
  const [draft, setDraft] = useState(update.body);
  const [busy, setBusy] = useState(false);

  const saveEdit = async () => {
    if (!draft.trim()) return;
    setBusy(true);
    try {
      await onEdit(update.id, draft);
      setMode('view');
    } catch {
      // Keep the edit box open with the text so it can be retried.
    } finally {
      setBusy(false);
    }
  };

  const confirmDelete = async () => {
    setBusy(true);
    try {
      await onDelete(update.id);
    } catch {
      setBusy(false);
      setMode('view');
    }
  };

  const onKeyDown = (e) => {
    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
      e.preventDefault();
      saveEdit();
    } else if (e.key === 'Escape') {
      e.preventDefault();
      setDraft(update.body);
      setMode('view');
    }
  };

  return (
    <li className="group relative flex gap-3 pb-5 last:pb-0">
      {!isLast && <span className="absolute left-[3px] top-3 bottom-0 w-px bg-line-strong" aria-hidden="true" />}
      <span className="relative mt-[7px] size-[7px] shrink-0 rounded-full bg-zinc-500 ring-4 ring-surface" />

      <div className="min-w-0 flex-1">
        <div className="flex items-center justify-between gap-2">
          <time dateTime={update.createdAt} className="text-xs text-zinc-500">
            {formatDateTime(update.createdAt)}
            {update.editedAt && <span className="text-zinc-600"> · edited</span>}
            {update.pending && <span className="text-zinc-600"> · Saving…</span>}
          </time>
          {mode === 'view' && !update.pending && (
            <div className="flex gap-0.5 opacity-0 transition-opacity group-hover:opacity-100 focus-within:opacity-100 [@media(hover:none)]:opacity-100">
              <button
                type="button"
                onClick={() => {
                  setDraft(update.body);
                  setMode('edit');
                }}
                aria-label="Edit update"
                className="rounded-md p-1 text-zinc-500 hover:bg-white/[0.06] hover:text-zinc-200"
              >
                <Pencil className="size-3.5" />
              </button>
              <button
                type="button"
                onClick={() => setMode('confirmDelete')}
                aria-label="Delete update"
                className="rounded-md p-1 text-zinc-500 hover:bg-white/[0.06] hover:text-rose-400"
              >
                <Trash2 className="size-3.5" />
              </button>
            </div>
          )}
        </div>

        {mode === 'edit' ? (
          <div className="mt-1.5 flex flex-col gap-2">
            <Textarea
              id={`edit-${update.id}`}
              autoFocus
              rows={3}
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              onKeyDown={onKeyDown}
              aria-label="Edit update text"
            />
            <div className="flex justify-end gap-1.5">
              <Button variant="ghost" size="sm" onClick={() => setMode('view')}>
                Cancel
              </Button>
              <Button size="sm" onClick={saveEdit} disabled={!draft.trim() || busy}>
                Save
              </Button>
            </div>
          </div>
        ) : (
          <p className="mt-1 whitespace-pre-wrap break-words text-[13px] leading-relaxed text-zinc-300">{update.body}</p>
        )}

        {mode === 'confirmDelete' && (
          <div className="mt-2 flex items-center justify-between gap-3 rounded-lg border border-rose-500/20 bg-rose-500/[0.06] px-3 py-2">
            <span className="text-xs text-rose-300">Delete this update?</span>
            <div className="flex gap-1.5">
              <Button variant="ghost" size="sm" onClick={() => setMode('view')}>
                Cancel
              </Button>
              <Button
                size="sm"
                onClick={confirmDelete}
                disabled={busy}
                className="!bg-rose-500/90 !text-white hover:!bg-rose-500"
              >
                Delete
              </Button>
            </div>
          </div>
        )}
      </div>
    </li>
  );
}
