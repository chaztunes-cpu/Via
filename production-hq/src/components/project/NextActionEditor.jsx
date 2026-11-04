import { useState } from 'react';
import { Pencil, Plus } from 'lucide-react';
import { fromDateInput, toDateInput } from '../../lib/dates.js';
import { FieldLabel, TextInput, DateInput } from '../ui/Field.jsx';
import Button from '../ui/Button.jsx';
import ActionDue from './ActionDue.jsx';

export default function NextActionEditor({ project, onSave }) {
  const [editing, setEditing] = useState(false);
  const [text, setText] = useState('');
  const [due, setDue] = useState('');
  const [saving, setSaving] = useState(false);

  const startEdit = () => {
    setText(project.nextAction ?? '');
    setDue(toDateInput(project.nextActionDue));
    setEditing(true);
  };

  const save = async () => {
    setSaving(true);
    const clean = text.trim();
    try {
      await onSave({ nextAction: clean || null, nextActionDue: clean ? fromDateInput(due) : null });
      setEditing(false);
    } catch {
      // Stay in edit mode so nothing typed is lost.
    } finally {
      setSaving(false);
    }
  };

  const onKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      save();
    } else if (e.key === 'Escape') {
      e.preventDefault();
      setEditing(false);
    }
  };

  if (editing) {
    return (
      <div className="flex flex-col gap-2">
        <FieldLabel htmlFor="next-action-text">Next action</FieldLabel>
        <TextInput
          id="next-action-text"
          autoFocus
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={onKeyDown}
          placeholder="e.g. Send V2 to client"
          maxLength={140}
        />
        <div className="flex flex-wrap items-center gap-2">
          <label htmlFor="next-action-due" className="text-xs text-zinc-500">
            Due
          </label>
          <DateInput
            id="next-action-due"
            value={due}
            onChange={(e) => setDue(e.target.value)}
            onKeyDown={onKeyDown}
            className="!h-8 w-auto text-xs"
          />
          {due && (
            <button type="button" onClick={() => setDue('')} className="text-xs text-zinc-500 hover:text-zinc-200">
              No date
            </button>
          )}
          <div className="ml-auto flex gap-1.5">
            <Button variant="ghost" size="sm" onClick={() => setEditing(false)}>
              Cancel
            </Button>
            <Button size="sm" onClick={save} disabled={saving}>
              Save
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-2">
      <FieldLabel as="p">Next action</FieldLabel>
      {project.nextAction ? (
        <div className="group flex items-start gap-3 rounded-lg border border-line bg-white/[0.02] px-3 py-2.5">
          <div className="min-w-0 flex-1">
            <p className="text-sm text-zinc-100">{project.nextAction}</p>
            {project.nextActionDue && (
              <div className="mt-1">
                <ActionDue date={project.nextActionDue} />
              </div>
            )}
          </div>
          <button
            type="button"
            onClick={startEdit}
            aria-label="Edit next action"
            className="rounded-md p-1 text-zinc-500 transition-colors hover:bg-white/[0.06] hover:text-zinc-200"
          >
            <Pencil className="size-3.5" />
          </button>
        </div>
      ) : (
        <button
          type="button"
          onClick={startEdit}
          className="flex items-center gap-1.5 rounded-lg border border-dashed border-line-strong px-3 py-2.5 text-sm text-zinc-500 transition-colors hover:border-zinc-500 hover:text-zinc-300"
        >
          <Plus className="size-3.5" /> Add next action
        </button>
      )}
    </div>
  );
}
