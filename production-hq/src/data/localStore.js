// Browser storage for the prototype. This is the only file that touches
// localStorage. When Supabase is connected, api.js stops using this file
// and queries the clients, projects and project_updates tables instead.

const STORAGE_KEY = 'production-hq:data:v2';

/** Returns the saved { clients, projects, updates }, or null if nothing valid is saved. */
export function loadStore() {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY));
    if (Array.isArray(saved?.clients) && Array.isArray(saved?.projects) && Array.isArray(saved?.updates)) {
      return migrate(saved);
    }
  } catch {
    // Storage unavailable or corrupt: the caller falls back to sample data.
  }
  return null;
}

export function saveStore(data) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch {
    // Private mode or full storage: the app keeps working in memory.
  }
}

/** Forget saved changes and start again from the sample data on next load. */
export function clearStore() {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    // Nothing to clear.
  }
}

/**
 * Upgrades data saved by older versions of the app. Projects that only
 * had a manual due date are treated as "deposit received" with a 4-week
 * turnaround ending on that same date, so nothing moves.
 */
function migrate(data) {
  for (const p of data.projects) {
    if ('depositStatus' in p) continue;
    if (p.dueDate) {
      p.depositStatus = 'received';
      p.turnaroundWeeks = 4;
      const start = new Date(p.dueDate);
      start.setDate(start.getDate() - 28);
      p.depositReceivedAt = start.toISOString();
    } else {
      p.depositStatus = 'received';
      p.depositReceivedAt = p.startDate ?? null;
      p.turnaroundWeeks = null;
    }
    delete p.dueDate;
  }
  return data;
}
