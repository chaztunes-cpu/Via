import { Disc3, MessageSquareMore, RotateCcw, CircleCheckBig } from 'lucide-react';
import StatCard from './StatCard.jsx';

export default function StatsGrid({ stats }) {
  const month = new Date().toLocaleDateString('en-US', { month: 'long' });
  const cards = [
    {
      label: 'Active Projects',
      value: stats.active,
      hint: stats.onHold ? `${stats.onHold} more on hold` : 'Currently in production',
      icon: Disc3,
      accent: 'text-sky-400',
    },
    {
      label: 'Awaiting Client Feedback',
      value: stats.awaitingFeedback,
      hint: 'Ball in the client’s court',
      icon: MessageSquareMore,
      accent: 'text-amber-400',
    },
    {
      label: 'Projects in Revision',
      value: stats.inRevision,
      hint: 'Notes to work through',
      icon: RotateCcw,
      accent: 'text-orange-400',
    },
    {
      label: 'Completed This Month',
      value: stats.completedThisMonth,
      hint: `Delivered in ${month}`,
      icon: CircleCheckBig,
      accent: 'text-violet-400',
    },
  ];

  return (
    <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
      {cards.map((c) => (
        <StatCard key={c.label} {...c} />
      ))}
    </div>
  );
}
