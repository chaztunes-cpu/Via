import { STATUS_META } from '../../lib/constants.js';

export function StatusDot({ status, className = '' }) {
  return <span className={`inline-block size-1.5 shrink-0 rounded-full ${STATUS_META[status].dot} ${className}`} />;
}

export default function StatusBadge({ status, compact = false }) {
  const meta = STATUS_META[status];
  return (
    <span
      className={`inline-flex items-center gap-1.5 whitespace-nowrap rounded-md px-2 py-0.5 text-xs font-medium ring-1 ring-inset ${meta.badge}`}
    >
      <StatusDot status={status} />
      {compact && meta.short ? meta.short : meta.label}
    </span>
  );
}
