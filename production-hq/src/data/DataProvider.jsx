import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import * as api from './api.js';
import { DEMO_MODE } from './config.js';
import { buildProjectViews, normalizeProject, EDITABLE_PROJECT_FIELDS } from '../lib/projects.js';
import { useToast } from '../components/ui/Toast.jsx';

const DataContext = createContext(null);

// The last data loaded on this device, shown instantly on the next visit
// while fresh data loads. Kept per account.
const cacheKey = (userId) => `production-hq:cache:${userId}`;
function readCache(userId) {
  if (!userId) return null;
  try {
    return JSON.parse(localStorage.getItem(cacheKey(userId)));
  } catch {
    return null;
  }
}
function writeCache(userId, data) {
  if (!userId) return;
  try {
    localStorage.setItem(cacheKey(userId), JSON.stringify(data));
  } catch {
    // Storage full or blocked: the app works without the cache.
  }
}

/**
 * Holds the app's data and exposes actions.
 *  - Changes appear instantly, then are saved. If saving fails, the
 *    change is undone and a short message explains why.
 *  - In the live app, changes made on other devices arrive automatically.
 */
export function DataProvider({ userId = null, userEmail = null, children }) {
  const { notify } = useToast();
  const [raw, setRaw] = useState(() => readCache(userId));
  const [error, setError] = useState(null);
  const rawRef = useRef(raw);
  rawRef.current = raw;

  const reload = useCallback(async () => {
    try {
      const data = await api.fetchAll();
      setRaw(data);
      setError(null);
      writeCache(userId, data);
    } catch (err) {
      // Keep showing what we have; only show the error screen if there's nothing.
      if (!rawRef.current) setError(err);
    }
  }, [userId]);

  useEffect(() => {
    reload();
  }, [reload]);

  // Live sync: other devices' changes, plus a refresh when you come back to the tab.
  useEffect(() => {
    if (DEMO_MODE) return undefined;
    let timer;
    const soon = () => {
      clearTimeout(timer);
      timer = setTimeout(reload, 300);
    };
    const onVisible = () => document.visibilityState === 'visible' && soon();
    const unsubscribe = api.subscribeToChanges(soon);
    document.addEventListener('visibilitychange', onVisible);
    window.addEventListener('online', soon);
    return () => {
      clearTimeout(timer);
      unsubscribe();
      document.removeEventListener('visibilitychange', onVisible);
      window.removeEventListener('online', soon);
    };
  }, [reload]);

  /** Show `optimistic(data)` right away, save with `call`, undo on failure. */
  const mutate = useCallback(
    async (optimistic, call, { quiet = false } = {}) => {
      const before = rawRef.current;
      if (optimistic && before) setRaw(optimistic(before));
      try {
        const result = await call();
        await reload();
        return result;
      } catch (err) {
        setRaw(before);
        if (!quiet) notify(err.message || api.friendlyError(err));
        reload();
        throw err;
      }
    },
    [notify, reload],
  );

  const actions = useMemo(
    () => ({
      addUpdate: (projectId, body) => {
        const temp = {
          id: `pending-${Date.now()}`,
          projectId,
          body: body.trim(),
          createdAt: new Date().toISOString(),
          editedAt: null,
          pending: true,
        };
        return mutate(
          (d) => ({ ...d, updates: [...d.updates, temp] }),
          () => api.addUpdate(projectId, body),
        );
      },

      editUpdate: (updateId, body) =>
        mutate(
          (d) => ({
            ...d,
            updates: d.updates.map((u) =>
              u.id === updateId ? { ...u, body: body.trim(), editedAt: new Date().toISOString() } : u,
            ),
          }),
          () => api.editUpdate(updateId, body),
        ),

      deleteUpdate: (updateId) =>
        mutate(
          (d) => ({ ...d, updates: d.updates.filter((u) => u.id !== updateId) }),
          () => api.deleteUpdate(updateId),
        ),

      updateProject: (projectId, patch) => {
        const current = rawRef.current?.projects.find((p) => p.id === projectId);
        if (!current) return Promise.reject(new Error('Project not found'));
        const editable = Object.fromEntries(EDITABLE_PROJECT_FIELDS.map((k) => [k, current[k]]));
        const next = normalizeProject({ ...editable, ...patch });
        return mutate(
          (d) => ({ ...d, projects: d.projects.map((p) => (p.id === projectId ? { ...p, ...next } : p)) }),
          () => api.updateProject(projectId, next),
        );
      },

      // These two show their errors inside their own forms.
      createProject: (input) => mutate(null, () => api.createProject(input), { quiet: true }),

      importData: (source, projectIds) => mutate(null, () => api.importData(source, projectIds), { quiet: true }),
    }),
    [mutate],
  );

  const projects = useMemo(() => (raw ? buildProjectViews(raw) : []), [raw]);

  const value = useMemo(
    () => ({
      mode: DEMO_MODE ? 'demo' : 'live',
      userEmail,
      loading: !raw && !error,
      error,
      retry: () => {
        setError(null);
        reload();
      },
      raw,
      clients: raw?.clients ?? [],
      projects,
      updates: raw?.updates ?? [],
      ...actions,
    }),
    [raw, error, projects, actions, userEmail, reload],
  );

  return <DataContext.Provider value={value}>{children}</DataContext.Provider>;
}

export function useData() {
  const ctx = useContext(DataContext);
  if (!ctx) throw new Error('useData must be used inside <DataProvider>');
  return ctx;
}
