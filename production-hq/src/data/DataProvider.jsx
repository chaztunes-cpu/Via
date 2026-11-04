import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import * as api from './api.js';
import { buildProjectViews } from '../lib/projects.js';

const DataContext = createContext(null);

/**
 * Holds the app's data and exposes actions. Every action goes through
 * api.js and then reloads, so the dashboard always reflects saved data.
 */
export function DataProvider({ children }) {
  const [raw, setRaw] = useState(null);
  const [error, setError] = useState(null);

  const reload = useCallback(() => api.fetchAll().then(setRaw).catch(setError), []);

  useEffect(() => {
    reload();
  }, [reload]);

  const actions = useMemo(() => {
    const run = (fn) => async (...args) => {
      const result = await fn(...args);
      await reload();
      return result;
    };
    return {
      addUpdate: run(api.addUpdate),
      editUpdate: run(api.editUpdate),
      deleteUpdate: run(api.deleteUpdate),
      updateProject: run(api.updateProject),
      createProject: run(api.createProject),
    };
  }, [reload]);

  const projects = useMemo(() => (raw ? buildProjectViews(raw) : []), [raw]);

  const value = useMemo(
    () => ({
      loading: !raw && !error,
      error,
      clients: raw?.clients ?? [],
      projects,
      updates: raw?.updates ?? [],
      ...actions,
    }),
    [raw, error, projects, actions],
  );

  return <DataContext.Provider value={value}>{children}</DataContext.Provider>;
}

export function useData() {
  const ctx = useContext(DataContext);
  if (!ctx) throw new Error('useData must be used inside <DataProvider>');
  return ctx;
}
