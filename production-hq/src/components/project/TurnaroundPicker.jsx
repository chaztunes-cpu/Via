import { useState } from 'react';
import { TURNAROUND_PRESETS } from '../../lib/constants.js';
import { inputClass } from '../ui/Field.jsx';

/** Quick-pick weeks (2, 3, 4, 6, 8) or type any number of weeks. */
export default function TurnaroundPicker({ id, value, onChange }) {
  const isPreset = TURNAROUND_PRESETS.includes(value);
  const [custom, setCustom] = useState(value && !isPreset ? String(value) : '');

  const pick = (weeks) => {
    setCustom('');
    onChange(value === weeks ? null : weeks);
  };

  const type = (text) => {
    const clean = text.replace(/[^\d]/g, '').slice(0, 2);
    setCustom(clean);
    onChange(clean ? Number(clean) : null);
  };

  return (
    <div className="flex flex-wrap items-center gap-1.5" role="group" aria-labelledby={`${id}-label`}>
      {TURNAROUND_PRESETS.map((weeks) => {
        const selected = value === weeks && !custom;
        return (
          <button
            key={weeks}
            type="button"
            aria-pressed={selected}
            onClick={() => pick(weeks)}
            className={`h-8 min-w-11 rounded-lg px-2.5 text-xs font-medium tabular-nums ring-1 ring-inset transition-colors ${
              selected
                ? 'bg-zinc-100 text-zinc-900 ring-zinc-100'
                : 'bg-white/[0.02] text-zinc-400 ring-line hover:text-zinc-100 hover:ring-line-strong'
            }`}
          >
            {weeks} wk
          </button>
        );
      })}
      <label className="flex items-center gap-1.5">
        <span className="sr-only">Other number of weeks</span>
        <input
          id={id}
          inputMode="numeric"
          value={custom}
          onChange={(e) => type(e.target.value)}
          placeholder="Other"
          className={`h-8 px-2.5 text-center text-xs tabular-nums ${inputClass} !w-16`}
        />
        <span className="text-xs text-zinc-500">weeks</span>
      </label>
    </div>
  );
}
