import Card from '../ui/Card.jsx';

const Bar = ({ className = '' }) => <div className={`rounded bg-white/[0.05] ${className}`} />;

/** Faint placeholder in the dashboard's own layout while data loads. */
export default function DashboardSkeleton() {
  return (
    <div className="flex flex-col gap-8 motion-safe:animate-pulse" aria-busy="true" aria-label="Loading projects">
      <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
        {[0, 1, 2, 3].map((i) => (
          <Card key={i} className="p-4">
            <Bar className="h-7 w-10" />
            <Bar className="mt-3 h-3.5 w-32" />
            <Bar className="mt-2 h-3 w-24" />
          </Card>
        ))}
      </div>
      <div className="grid gap-8 xl:grid-cols-[minmax(0,1fr)_360px]">
        <div className="flex flex-col gap-3">
          <Bar className="h-4 w-28" />
          <Bar className="h-9 w-full" />
          <Card className="divide-y divide-line">
            {[0, 1, 2, 3, 4].map((i) => (
              <div key={i} className="flex gap-3.5 px-5 py-4">
                <Bar className="size-8 rounded-full" />
                <div className="flex-1">
                  <Bar className="h-3.5 w-40" />
                  <Bar className="mt-2 h-3 w-56" />
                  <Bar className="mt-3.5 h-3 w-full max-w-md" />
                </div>
              </div>
            ))}
          </Card>
        </div>
        <div className="hidden flex-col gap-3 xl:flex">
          <Bar className="h-4 w-32" />
          <Card className="h-64" />
        </div>
      </div>
    </div>
  );
}
