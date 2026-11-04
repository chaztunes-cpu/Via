export default function Card({ className = '', children, ...props }) {
  return (
    <div className={`rounded-xl border border-line bg-surface ${className}`} {...props}>
      {children}
    </div>
  );
}

export function SectionHeader({ title, count, description, action }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <div className="flex min-w-0 items-baseline gap-2">
        <h2 className="text-sm font-semibold text-zinc-100">{title}</h2>
        {count != null && <span className="text-xs tabular-nums text-zinc-500">{count}</span>}
        {description && <span className="truncate text-xs text-zinc-500">{description}</span>}
      </div>
      {action}
    </div>
  );
}
