import { useMemo } from 'react';
import { useDashboardData } from '../hooks/useDashboardData.js';
import { getNeedsAttention, getRecentActivity, getStats, isActive } from '../lib/projects.js';
import DashboardHeader from '../components/dashboard/DashboardHeader.jsx';
import StatsGrid from '../components/dashboard/StatsGrid.jsx';
import ActiveProjects from '../components/dashboard/ActiveProjects.jsx';
import NeedsAttention from '../components/dashboard/NeedsAttention.jsx';
import RecentActivity from '../components/dashboard/RecentActivity.jsx';

export default function Dashboard() {
  const { loading, error, projects, updates } = useDashboardData();

  const stats = useMemo(() => getStats(projects), [projects]);
  const activeProjects = useMemo(() => projects.filter(isActive), [projects]);
  const attention = useMemo(() => getNeedsAttention(projects), [projects]);
  const activity = useMemo(() => getRecentActivity({ updates, projects }, 5), [updates, projects]);

  return (
    <div className="mx-auto flex max-w-[1400px] flex-col gap-8 px-4 py-6 sm:px-6 lg:px-10 lg:py-10">
      <DashboardHeader onNewProject={() => {}} />

      {error ? (
        <p className="text-sm text-rose-400">Couldn't load projects.</p>
      ) : loading ? (
        <p className="text-sm text-zinc-500">Loading…</p>
      ) : (
        <>
          <StatsGrid stats={stats} />
          {/* Desktop: projects on the left, side panels on the right.
              Mobile: Needs Attention first (it's short), then projects, then activity. */}
          <div className="grid gap-8 xl:grid-cols-[minmax(0,1fr)_360px] xl:grid-rows-[auto_1fr]">
            <div className="order-2 xl:order-none xl:col-start-1 xl:row-span-2 xl:row-start-1">
              <ActiveProjects projects={activeProjects} />
            </div>
            <div className="order-1 xl:order-none xl:col-start-2 xl:row-start-1">
              <NeedsAttention items={attention} />
            </div>
            <div className="order-3 self-start xl:order-none xl:col-start-2 xl:row-start-2">
              <RecentActivity entries={activity} />
            </div>
          </div>
        </>
      )}
    </div>
  );
}
