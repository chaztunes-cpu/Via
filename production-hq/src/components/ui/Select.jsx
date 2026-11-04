import { ChevronDown } from 'lucide-react';

/** Native select styled to match the app; accessible and mobile-friendly. */
export default function Select({ id, label, value, onChange, options, icon: Icon, leading, className = '' }) {
  return (
    <label className={`relative flex items-center ${className}`}>
      <span className="sr-only">{label}</span>
      {Icon && <Icon className="pointer-events-none absolute left-2.5 size-3.5 text-zinc-500" />}
      {leading && <span className="pointer-events-none absolute left-3 flex items-center">{leading}</span>}
      <select
        id={id}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={`h-9 w-full cursor-pointer appearance-none rounded-lg border border-line bg-white/[0.02] pr-8 text-sm text-zinc-300 transition-colors hover:border-line-strong focus:border-zinc-500 focus:outline-none ${Icon || leading ? 'pl-8' : 'pl-3'}`}
      >
        {options.map((o) => (
          <option key={o.value} value={o.value} className="bg-surface-raised">
            {o.label}
          </option>
        ))}
      </select>
      <ChevronDown className="pointer-events-none absolute right-2.5 size-3.5 text-zinc-500" />
    </label>
  );
}
