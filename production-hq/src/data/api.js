// Data access layer. The UI only talks to these functions, never to the
// sample data directly. To connect Supabase later, replace each function
// body with the matching query and keep the returned shapes the same.
//
// For now the data lives in memory and is saved to this browser's
// localStorage so your test updates survive a page reload.

import * as sample from './sampleData.js';
import { STATUS } from '../lib/constants.js';

const STORAGE_KEY = 'production-hq:data:v2';

let db = load();

function load() {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY));
    if (saved?.clients && saved?.projects && saved?.updates) return saved;
  } catch {
    // Storage unavailable or corrupt: fall back to the sample data.
  }
  return structuredClone({ clients: sample.clients, projects: sample.projects, updates: sample.updates });
}

function persist() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(db));
  } catch {
    // Private mode or full storage: keep working in memory.
  }
}

function newId(prefix) {
  return `${prefix}_${Date.now().toString(36)}${Math.random().toString(36).slice(2, 7)}`;
}

/** Names are compared without case or extra spaces, so "nova  kade" = "Nova Kade". */
export function normalizeName(name = '') {
  return name.trim().replace(/\s+/g, ' ').toLowerCase();
}

// ── Reads ───────────────────────────────────────────────────────────

export async function fetchAll() {
  return structuredClone(db);
}

/** For the future client profile page: one client with all their projects. */
export async function fetchClientWithProjects(clientId) {
  const client = db.clients.find((c) => c.id === clientId);
  if (!client) return null;
  return structuredClone({ ...client, projects: db.projects.filter((p) => p.clientId === clientId) });
}

// ── Updates (the chronological log for each project) ───────────────

export async function addUpdate(projectId, body) {
  const update = { id: newId('u'), projectId, body: body.trim(), createdAt: new Date().toISOString(), editedAt: null };
  db.updates.push(update);
  persist();
  return update;
}

export async function editUpdate(updateId, body) {
  const update = db.updates.find((u) => u.id === updateId);
  if (!update) throw new Error('Update not found');
  update.body = body.trim();
  update.editedAt = new Date().toISOString();
  persist();
  return update;
}

export async function deleteUpdate(updateId) {
  db.updates = db.updates.filter((u) => u.id !== updateId);
  persist();
}

// ── Projects ────────────────────────────────────────────────────────

const EDITABLE_PROJECT_FIELDS = ['title', 'serviceType', 'status', 'dueDate', 'nextAction', 'nextActionDue'];

export async function updateProject(projectId, patch) {
  const project = db.projects.find((p) => p.id === projectId);
  if (!project) throw new Error('Project not found');
  for (const key of EDITABLE_PROJECT_FIELDS) {
    if (key in patch) project[key] = patch[key];
  }
  if ('status' in patch) {
    project.completedAt = patch.status === STATUS.COMPLETED ? project.completedAt ?? new Date().toISOString() : null;
  }
  persist();
  return project;
}

/**
 * Create a project for an existing client (clientId) or a new one
 * (newClientName). A new name that matches an existing client is
 * attached to that client instead of creating a duplicate.
 */
export async function createProject({ clientId, newClientName, firstUpdate, ...fields }) {
  const client = clientId ? db.clients.find((c) => c.id === clientId) : await createClient(newClientName);
  if (!client) throw new Error('Choose a client for this project');

  const project = {
    id: newId('p'),
    clientId: client.id,
    title: fields.title.trim(),
    serviceType: fields.serviceType,
    status: fields.status ?? STATUS.NOT_STARTED,
    startDate: new Date().toISOString(),
    dueDate: fields.dueDate ?? null,
    nextAction: fields.nextAction?.trim() || null,
    nextActionDue: fields.nextActionDue ?? null,
    completedAt: null,
  };
  db.projects.push(project);
  persist();
  if (firstUpdate?.trim()) await addUpdate(project.id, firstUpdate);
  return project;
}

// ── Clients ─────────────────────────────────────────────────────────

/** Returns the existing client when the name already exists. */
export async function createClient(name) {
  const clean = name?.trim().replace(/\s+/g, ' ');
  if (!clean) throw new Error('Client name is required');
  const existing = db.clients.find((c) => normalizeName(c.name) === normalizeName(clean));
  if (existing) return existing;
  const client = { id: newId('c'), name: clean, contactName: clean, email: '' };
  db.clients.push(client);
  persist();
  return client;
}
