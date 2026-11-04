import { Link } from 'react-router-dom';
import { Hammer } from 'lucide-react';

export default function ComingSoon({ title }) {
  return (
    <div className="mx-auto flex min-h-[70dvh] max-w-md flex-col items-center justify-center px-6 text-center">
      <div className="mb-4 flex size-10 items-center justify-center rounded-xl border border-line bg-surface">
        <Hammer className="size-4 text-zinc-500" />
      </div>
      <h1 className="text-base font-semibold text-zinc-100">{title}</h1>
      <p className="mt-1.5 text-sm text-zinc-500">This page hasn't been built yet.</p>
      <Link to="/" className="mt-5 text-sm font-medium text-zinc-300 hover:text-white">
        ← Back to dashboard
      </Link>
    </div>
  );
}
