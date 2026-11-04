import { useMemo, useState } from 'react';
import { SearchX } from 'lucide-react';
import { filterProjects, sortProjects } from '../../lib/projects.js';
import Card, { SectionHeader } from '../ui/Card.jsx';
import Button from '../ui/Button.jsx';
import ProjectFilters from './ProjectFilters.jsx';
import ProjectRow from './ProjectRow.jsx';

const DEFAULT_FILTERS = { query: '', status: 'all', service: 'all', sort: 'recent' };

export default function ActiveProjects({ projects }) {
  const [filters, setFilters] = useState(DEFAULT_FILTERS);

  const visible = useMemo(
    () => sortProjects(filterProjects(projects, filters), filters.sort),
    [projects, filters],
  );

  const isFiltered = filters.query || filters.status !== 'all' || filters.service !== 'all';
  const reset = () => setFilters((f) => ({ ...DEFAULT_FILTERS, sort: f.sort }));

  return (
    <section aria-labelledby="active-projects" className="flex flex-col gap-3">
      <div id="active-projects">
        <SectionHeader
          title="Active Projects"
          count={isFiltered ? `${visible.length} of ${projects.length}` : projects.length}
          action={
            isFiltered ? (
              <button type="button" onClick={reset} className="text-xs font-medium text-zinc-400 hover:text-zinc-100">
                Clear filters
              </button>
            ) : null
          }
        />
      </div>

      <ProjectFilters filters={filters} onChange={setFilters} />

      <Card className="overflow-hidden">
        {visible.length ? (
          <ul className="divide-y divide-line">
            {visible.map((p) => (
              <li key={p.id}>
                <ProjectRow project={p} />
              </li>
            ))}
          </ul>
        ) : (
          <div className="flex flex-col items-center px-6 py-14 text-center">
            <SearchX className="size-5 text-zinc-600" />
            <p className="mt-3 text-sm font-medium text-zinc-300">No projects match</p>
            <p className="mt-1 text-xs text-zinc-500">Try a different search or clear the filters.</p>
            <Button variant="secondary" className="mt-4 h-8 text-xs" onClick={reset}>
              Clear filters
            </Button>
          </div>
        )}
      </Card>
    </section>
  );
}
