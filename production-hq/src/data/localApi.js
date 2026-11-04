// Demo-mode data source: sample data kept in memory and saved to this
// browser through localStore.js, so changes survive a page refresh.
// supabaseApi.js offers the same functions for the live app.

import * as sample from './sampleData.js';
import { loadStore, saveStore } from './localStore.js';
import { STATUS, DEPOSIT } from '../lib/constants.js';
import { EDITABLE_PROJECT_FIELDS, normalizeProject, normalizeName } from '../lib/projects.js';

// Three separate record types, like three database tables.
let db = loadStore() ?? structuredClone({ clients: sample.clients, projects: sample.projects, updates: sample.updates });

function persist() {
  saveStore(db);
}

function newId(prefix) {
  return `${prefix}_${Date.now().toString(36)}${Math.random().toString(36).slice(2, 7)}`;
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

export async function updateProject(projectId, patch) {
  const project = db.projects.find((p) => p.id === projectId);
  if (!project) throw new Error('Project not found');
  for (const key of EDITABLE_PROJECT_FIELDS) {
    if (key in patch) project[key] = patch[key];
  }
  Object.assign(project, normalizeProject(project));
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
    depositStatus: fields.depositStatus ?? DEPOSIT.AWAITING,
    depositReceivedAt: fields.depositReceivedAt ?? null,
    turnaroundWeeks: fields.turnaroundWeeks ?? null,
    nextAction: fields.nextAction?.trim() || null,
    nextActionDue: fields.nextActionDue ?? null,
    completedAt: null,
  };
  Object.assign(project, normalizeProject(project));
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
