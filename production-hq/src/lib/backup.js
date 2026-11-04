// Backups, exports and the data hand-over from the prototype.
import { SERVICE_META, STATUS_META } from './constants.js';
import { formatTime, toDateInput } from './dates.js';

/** Full copy of your records (clients, projects, updates) as JSON text. */
export function buildBackup(raw) {
  const strip = ({ pending, dueOn, ...rest }) => rest;
  return JSON.stringify(
    {
      app: 'production-hq',
      version: 1,
      exportedAt: new Date().toISOString(),
      clients: raw.clients,
      projects: raw.projects.map(strip),
      updates: raw.updates.filter((u) => !u.pending).map(strip),
    },
    null,
    2,
  );
}

/** Reads text from "Copy my data" or a backup file. Throws a readable error. */
export function parseBackup(text) {
  let data;
  try {
    data = JSON.parse(text);
  } catch {
    throw new Error('That doesn’t look like Production HQ data. Paste the whole text you copied.');
  }
  if (!Array.isArray(data?.clients) || !Array.isArray(data?.projects) || !Array.isArray(data?.updates)) {
    throw new Error('That doesn’t look like Production HQ data. Paste the whole text you copied.');
  }
  return data;
}

/** The demo's built-in sample records have short ids like "p3"; your own have longer ones. */
export const isSampleRecord = (id) => /^[cpu]\d+$/.test(id);

const csvCell = (value) => {
  const text = String(value ?? '');
  return /[",\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
};

/** One row per update, oldest first — close to the old Google Sheet. */
export function buildUpdatesCsv(projectViews) {
  const rows = [['Date', 'Time', 'Client', 'Project', 'Service', 'Status', 'Update']];
  const all = projectViews.flatMap((p) => p.updates.filter((u) => !u.pending).map((u) => ({ p, u })));
  all.sort((a, b) => new Date(a.u.createdAt) - new Date(b.u.createdAt));
  for (const { p, u } of all) {
    rows.push([
      toDateInput(u.createdAt),
      formatTime(u.createdAt),
      p.client?.name,
      p.title,
      SERVICE_META[p.serviceType]?.label,
      STATUS_META[p.status]?.label,
      u.body,
    ]);
  }
  return rows.map((r) => r.map(csvCell).join(',')).join('\n');
}

export function downloadFile(filename, content, type) {
  const url = URL.createObjectURL(new Blob([content], { type }));
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
