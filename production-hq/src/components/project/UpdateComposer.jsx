import { useEffect, useRef, useState } from 'react';
import { FieldLabel, Textarea } from '../ui/Field.jsx';
import Button from '../ui/Button.jsx';

const isMac = typeof navigator !== 'undefined' && /Mac|iPhone|iPad/.test(navigator.platform);

export default function UpdateComposer({ onSave }) {
  const [text, setText] = useState('');
  const [saving, setSaving] = useState(false);
  const ref = useRef(null);

  // On desktop, focus the box so an update can be typed right away.
  useEffect(() => {
    if (window.matchMedia?.('(pointer: fine)').matches) ref.current?.focus();
  }, []);

  const save = async () => {
    if (!text.trim() || saving) return;
    setSaving(true);
    try {
      await onSave(text);
      setText('');
    } catch {
      // Saving failed: a message is shown and the text stays in the box.
    } finally {
      setSaving(false);
      ref.current?.focus();
    }
  };

  const onKeyDown = (e) => {
    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
      e.preventDefault();
      save();
    } else if (e.key === 'Escape' && text) {
      // Keep the panel open so a draft isn't lost.
      e.preventDefault();
      ref.current?.blur();
    }
  };

  return (
    <div className="flex flex-col gap-2">
      <FieldLabel htmlFor="new-update">Add update</FieldLabel>
      <Textarea
        id="new-update"
        ref={ref}
        rows={3}
        value={text}
        onChange={(e) => setText(e.target.value)}
        onKeyDown={onKeyDown}
        placeholder="What happened on this project?"
      />
      <div className="flex items-center justify-between gap-3">
        <span className="hidden text-xs text-zinc-600 sm:inline">
          {isMac ? '⌘' : 'Ctrl'} + Enter to save · timestamped automatically
        </span>
        <Button size="sm" onClick={save} disabled={!text.trim() || saving} className="ml-auto">
          Save Update
        </Button>
      </div>
    </div>
  );
}
