import Card from '../ui/Card.jsx';

export default function StatCard({ label, value, hint, icon: Icon, accent = 'text-zinc-400' }) {
  return (
    <Card className="p-4">
      <div className="flex items-start justify-between gap-3">
        <span className="text-2xl font-semibold tabular-nums tracking-tight text-zinc-50">{value}</span>
        <span className="flex size-7 items-center justify-center rounded-md bg-white/[0.04] ring-1 ring-inset ring-line">
          <Icon className={`size-3.5 ${accent}`} strokeWidth={2} />
        </span>
      </div>
      <p className="mt-2 text-sm text-zinc-400">{label}</p>
      {hint && <p className="mt-0.5 text-xs text-zinc-600">{hint}</p>}
    </Card>
  );
}
