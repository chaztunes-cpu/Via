import { ArrowUpDown } from 'lucide-react';
import { STATUS_META, SERVICE_META, SORT_OPTIONS } from '../../lib/constants.js';
import { activeStatusOptions } from '../../lib/projects.js';
import SearchInput from '../ui/SearchInput.jsx';
import Select from '../ui/Select.jsx';

const statusOptions = [
  { value: 'all', label: 'All statuses' },
  ...activeStatusOptions.map((s) => ({ value: s, label: STATUS_META[s].label })),
];

const serviceOptions = [
  { value: 'all', label: 'All services' },
  ...Object.entries(SERVICE_META).map(([value, m]) => ({ value, label: m.label })),
];

export default function ProjectFilters({ filters, onChange }) {
  const set = (key) => (value) => onChange({ ...filters, [key]: value });
  return (
    <div className="flex flex-col gap-2 md:flex-row md:items-center">
      <SearchInput
        value={filters.query}
        onChange={set('query')}
        placeholder="Search projects, clients, updates…"
        className="md:min-w-56 md:flex-1"
      />
      <div className="grid grid-cols-2 gap-2 md:flex">
        <Select label="Filter by status" value={filters.status} onChange={set('status')} options={statusOptions} className="md:w-36" />
        <Select label="Filter by service" value={filters.service} onChange={set('service')} options={serviceOptions} className="md:w-36" />
        <Select
          label="Sort projects"
          value={filters.sort}
          onChange={set('sort')}
          options={SORT_OPTIONS}
          icon={ArrowUpDown}
          className="col-span-2 md:w-48"
        />
      </div>
    </div>
  );
}
