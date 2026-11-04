// Pure functions that turn raw rows (clients, projects, updates) into
// what the dashboard shows. No React here, so they can be reused by
// future pages and tested on their own.

import { STATUS, ATTENTION, STATUS_ORDER, DEPOSIT } from './constants.js';
import { daysUntil, daysSince, isSameMonth, addWeeks } from './dates.js';

/**
 * Project Due Date = Deposit Received Date + Agreed Turnaround.
 * It is never stored, so it can't drift out of sync. Returns null while
 * the deposit is pending or no turnaround is set.
 */
export function computeDueDate(project) {
  if (project.depositStatus !== DEPOSIT.RECEIVED) return null;
  if (!project.depositReceivedAt || !project.turnaroundWeeks) return null;
  return addWeeks(project.depositReceivedAt, project.turnaroundWeeks);
}

/** Attach client and chronological update history to each project. */
export function buildProjectViews({ clients, projects, updates }) {
  const clientById = new Map(clients.map((c) => [c.id, c]));
  const updatesByProject = new Map();
  for (const u of updates) {
    if (!updatesByProject.has(u.projectId)) updatesByProject.set(u.projectId, []);
    updatesByProject.get(u.projectId).push(u);
  }

  return projects.map((p) => {
    const history = [...(updatesByProject.get(p.id) ?? [])].sort(
      (a, b) => new Date(a.createdAt) - new Date(b.createdAt),
    );
    const latestUpdate = history[history.length - 1] ?? null;
    return {
      ...p,
      dueDate: computeDueDate(p),
      awaitingDeposit: p.depositStatus !== DEPOSIT.RECEIVED,
      client: clientById.get(p.clientId) ?? null,
      updates: history,
      latestUpdate,
      lastUpdatedAt: latestUpdate?.createdAt ?? p.startDate,
    };
  });
}

export const isActive = (p) => p.status !== STATUS.COMPLETED;

export function getStats(projects, now = new Date()) {
  const open = projects.filter(isActive);
  return {
    active: open.filter((p) => p.status !== STATUS.ON_HOLD).length,
    onHold: open.filter((p) => p.status === STATUS.ON_HOLD).length,
    awaitingFeedback: projects.filter((p) => p.status === STATUS.AWAITING_FEEDBACK).length,
    inRevision: projects.filter((p) => p.status === STATUS.REVISIONS).length,
    completedThisMonth: projects.filter(
      (p) => p.status === STATUS.COMPLETED && p.completedAt && isSameMonth(p.completedAt, now),
    ).length,
  };
}

export function filterProjects(projects, { query = '', status = 'all', service = 'all' }) {
  const q = query.trim().toLowerCase();
  return projects.filter((p) => {
    if (status !== 'all' && p.status !== status) return false;
    if (service !== 'all' && p.serviceType !== service) return false;
    if (!q) return true;
    return [p.title, p.client?.name, p.nextAction, p.latestUpdate?.body]
      .filter(Boolean)
      .some((text) => text.toLowerCase().includes(q));
  });
}

export function sortProjects(projects, sort) {
  const list = [...projects];
  const time = (d) => new Date(d).getTime();
  switch (sort) {
    case 'oldest':
      return list.sort((a, b) => time(a.lastUpdatedAt) - time(b.lastUpdatedAt));
    case 'deadline':
      // Projects without a due date go last, most recently updated first.
      return list.sort((a, b) => {
        if (!a.dueDate && !b.dueDate) return time(b.lastUpdatedAt) - time(a.lastUpdatedAt);
        if (!a.dueDate) return 1;
        if (!b.dueDate) return -1;
        return time(a.dueDate) - time(b.dueDate);
      });
    case 'recent':
    default:
      return list.sort((a, b) => time(b.lastUpdatedAt) - time(a.lastUpdatedAt));
  }
}

/**
 * Projects that need action from the producer, each with its reasons,
 * most urgent first.
 *  - Completed and On Hold projects never appear.
 *  - Next Action deadlines (overdue or within 2 days) come first.
 *  - Awaiting Client Feedback is the client's move, so those projects
 *    only appear when a follow-up Next Action is due.
 */
export function getNeedsAttention(projects, now = new Date()) {
  const items = [];
  for (const p of projects) {
    if (p.status === STATUS.COMPLETED || p.status === STATUS.ON_HOLD) continue;
    const reasons = [];

    if (p.nextAction && p.nextActionDue) {
      const days = daysUntil(p.nextActionDue, now);
      if (days < 0) reasons.push({ type: 'actionOverdue', priority: 0, date: p.nextActionDue });
      else if (days <= ATTENTION.NEXT_ACTION_WITHIN_DAYS) reasons.push({ type: 'actionDue', priority: 1, date: p.nextActionDue });
    }

    if (p.status !== STATUS.AWAITING_FEEDBACK) {
      if (p.dueDate) {
        const days = daysUntil(p.dueDate, now);
        if (days < 0) reasons.push({ type: 'deliveryOverdue', priority: 0, date: p.dueDate });
        else if (days <= ATTENTION.DEADLINE_WITHIN_DAYS) reasons.push({ type: 'deliveryDue', priority: 2, date: p.dueDate });
      }
      if (p.status === STATUS.READY_FOR_DELIVERY) reasons.push({ type: 'deliver', priority: 2 });
      if (p.status === STATUS.REVISIONS) reasons.push({ type: 'revisions', priority: 3 });
      if (daysSince(p.lastUpdatedAt, now) >= ATTENTION.STALE_AFTER_DAYS) reasons.push({ type: 'stale', priority: 4 });
    }

    if (reasons.length) {
      reasons.sort((a, b) => a.priority - b.priority);
      items.push({ project: p, reasons });
    }
  }
  const when = (r) => (r.date ? new Date(r.date).getTime() : Number.MAX_SAFE_INTEGER);
  return items.sort((a, b) => a.reasons[0].priority - b.reasons[0].priority || when(a.reasons[0]) - when(b.reasons[0]));
}

/** All projects for one client (for the "other projects" list and future client pages). */
export function getClientProjects(projects, clientId) {
  return projects.filter((p) => p.clientId === clientId);
}

/** Existing client whose name matches, ignoring case and extra spaces. */
export function findClientByName(clients, name) {
  const norm = (n = '') => n.trim().replace(/\s+/g, ' ').toLowerCase();
  const target = norm(name);
  return target ? clients.find((c) => norm(c.name) === target) ?? null : null;
}

export function getRecentActivity({ updates, projects }, limit = 5) {
  const projectById = new Map(projects.map((p) => [p.id, p]));
  return [...updates]
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
    .slice(0, limit)
    .map((u) => ({ ...u, project: projectById.get(u.projectId) }));
}

export const activeStatusOptions = STATUS_ORDER.filter((s) => s !== STATUS.COMPLETED);
