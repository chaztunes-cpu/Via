import { useEffect, useMemo, useState } from 'react';
import { fetchDashboardData } from '../data/api.js';
import { buildProjectViews } from '../lib/projects.js';

/** Loads raw data through the API layer and joins it for the UI. */
export function useDashboardData() {
  const [raw, setRaw] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelled = false;
    fetchDashboardData()
      .then((data) => !cancelled && setRaw(data))
      .catch((err) => !cancelled && setError(err));
    return () => {
      cancelled = true;
    };
  }, []);

  const projects = useMemo(() => (raw ? buildProjectViews(raw) : []), [raw]);

  return { loading: !raw && !error, error, projects, updates: raw?.updates ?? [] };
}
