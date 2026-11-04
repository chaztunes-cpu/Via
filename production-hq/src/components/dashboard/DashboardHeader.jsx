import { Plus } from 'lucide-react';
import Button from '../ui/Button.jsx';

export default function DashboardHeader({ onNewProject }) {
  const today = new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });
  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <p className="mb-1.5 text-xs font-medium text-zinc-500">{today}</p>
        <h1 className="text-2xl font-semibold tracking-tight text-zinc-50">Project Dashboard</h1>
        <p className="mt-1 text-sm text-zinc-500">Manage your production projects and keep everything moving.</p>
      </div>
      <Button icon={Plus} onClick={onNewProject} className="self-start sm:self-auto">
        New Project
      </Button>
    </div>
  );
}
