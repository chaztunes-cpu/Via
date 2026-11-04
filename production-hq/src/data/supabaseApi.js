// Live data source: reads and writes the Supabase tables
//   clients, projects, project_updates   (see supabase/schema.sql)
// and converts between the database's field names (snake_case, plain
// calendar dates) and the shapes the app uses (camelCase, ISO times).
// It offers the same functions as localApi.js.

import { supabase } from './supabaseClient.js';
import { STATUS, DEPOSIT } from '../lib/constants.js';
import { fromDateInput, toDateInput } from '../lib/dates.js';
import { normalizeProject, normalizeName } from '../lib/projects.js';

// ── Converting rows ────────────────────────────────────────────────

const isoFromDate = (date) => (date ? fromDateInput(date) : null);
const dateFromIso = (iso) => (iso ? toDateInput(iso) : null);

const toClient = (r) => ({
  id: r.id,
  name: r.name,
  contactName: r.contact_name,
  email: r.email,
  notes: r.notes,
  createdAt: r.created_at,
});

const toProject = (r) => ({
  id: r.id,
  clientId: r.client_id,
  title: r.title,
  serviceType: r.service_type,
  status: r.status,
  startDate: r.started_at,
  depositStatus: r.deposit_status,
  depositReceivedAt: isoFromDate(r.deposit_received_on),
  turnaroundWeeks: r.turnaround_weeks,
  dueOn: isoFromDate(r.due_on), // calculated by the database
  nextAction: r.next_action,
  nextActionDue: isoFromDate(r.next_action_due_on),
  completedAt: r.completed_at,
});

const toUpdate = (r) => ({
  id: r.id,
  projectId: r.project_id,
  body: r.body,
  createdAt: r.created_at,
  editedAt: r.edited_at,
});

/** App-shaped project → database columns (only the editable ones). */
function projectColumns(p) {
  return {
    title: p.title,
    service_type: p.serviceType,
    status: p.status,
    deposit_status: p.depositStatus,
    deposit_received_on: dateFromIso(p.depositReceivedAt),
    turnaround_weeks: p.turnaroundWeeks,
    next_action: p.nextAction,
    next_action_due_on: dateFromIso(p.nextActionDue),
    completed_at: p.completedAt,
  };
}

// ── Errors in plain language ──────────────────────────────────────

export function friendlyError(error) {
  const msg = String(error?.message ?? error ?? '');
  if (error?.code === '23505') return 'That already exists.';
  if (/JWT|session|not authenticated|401/i.test(msg) || error?.status === 401) {
    return 'You’ve been signed out. Please sign in again.';
  }
  if (/fetch|network|Failed to fetch|Load failed|timeout/i.test(msg) || !navigator.onLine) {
    return 'Couldn’t reach the server. Check your internet connection and try again.';
  }
  return 'Something went wrong while saving. Please try again.';
}

function check({ data, error }) {
  if (error) {
    const err = new Error(friendlyError(error));
    err.cause = error;
    err.code = error.code;
    throw err;
  }
  return data;
}

/** Reads every row of a table, 1000 at a time. */
async function selectAll(table, order) {
  const rows = [];
  for (let from = 0; ; from += 1000) {
    const page = check(
      await supabase().from(table).select('*').order(order, { ascending: true }).range(from, from + 999),
    );
    rows.push(...page);
    if (page.length < 1000) return rows;
  }
}

// ── Sign in ─────────────────────────────────────────────────────────

export async function getSession() {
  const { data } = await supabase().auth.getSession();
  return data.session;
}

export function onAuthChange(callback) {
  const { data } = supabase().auth.onAuthStateChange((_event, session) => callback(session));
  return () => data.subscription.unsubscribe();
}

export async function signIn(email, password) {
  const { error } = await supabase().auth.signInWithPassword({ email: email.trim(), password });
  if (error) {
    if (/invalid login credentials/i.test(error.message)) throw new Error('Email or password is incorrect.');
    throw new Error(friendlyError(error));
  }
}

export async function signOut() {
  await supabase().auth.signOut();
}

// ── Reads ───────────────────────────────────────────────────────────

export async function fetchAll() {
  const [clients, projects, updates] = await Promise.all([
    selectAll('clients', 'created_at'),
    selectAll('projects', 'created_at'),
    selectAll('project_updates', 'created_at'),
  ]);
  return { clients: clients.map(toClient), projects: projects.map(toProject), updates: updates.map(toUpdate) };
}

export async function fetchClientWithProjects(clientId) {
  const data = check(await supabase().from('clients').select('*, projects(*)').eq('id', clientId).maybeSingle());
  return data ? { ...toClient(data), projects: data.projects.map(toProject) } : null;
}

/** Calls `onChange` whenever any of your records change (on any device). */
export function subscribeToChanges(onChange) {
  const channel = supabase().channel('production-hq-changes');
  for (const table of ['clients', 'projects', 'project_updates']) {
    channel.on('postgres_changes', { event: '*', schema: 'public', table }, onChange);
  }
  channel.subscribe();
  return () => supabase().removeChannel(channel);
}

// ── Updates ─────────────────────────────────────────────────────────

export async function addUpdate(projectId, body) {
  const row = check(
    await supabase().from('project_updates').insert({ project_id: projectId, body: body.trim() }).select().single(),
  );
  return toUpdate(row);
}

export async function editUpdate(updateId, body) {
  const row = check(
    await supabase()
      .from('project_updates')
      .update({ body: body.trim(), edited_at: new Date().toISOString() })
      .eq('id', updateId)
      .select()
      .single(),
  );
  return toUpdate(row);
}

export async function deleteUpdate(updateId) {
  check(await supabase().from('project_updates').delete().eq('id', updateId));
}

// ── Projects ────────────────────────────────────────────────────────

/** `project` is the full, already-normalized project (see DataProvider). */
export async function updateProject(projectId, project) {
  const row = check(
    await supabase().from('projects').update(projectColumns(project)).eq('id', projectId).select().single(),
  );
  return toProject(row);
}

export async function createProject({ clientId, newClientName, firstUpdate, ...fields }) {
  const client = clientId ? { id: clientId } : await createClient(newClientName);
  const project = normalizeProject({
    title: fields.title.trim(),
    serviceType: fields.serviceType,
    status: fields.status ?? STATUS.NOT_STARTED,
    depositStatus: fields.depositStatus ?? DEPOSIT.AWAITING,
    depositReceivedAt: fields.depositReceivedAt ?? null,
    turnaroundWeeks: fields.turnaroundWeeks ?? null,
    nextAction: fields.nextAction,
    nextActionDue: fields.nextActionDue ?? null,
    completedAt: null,
  });
  const row = check(
    await supabase()
      .from('projects')
      .insert({ ...projectColumns(project), client_id: client.id })
      .select()
      .single(),
  );
  if (firstUpdate?.trim()) await addUpdate(row.id, firstUpdate);
  return toProject(row);
}

// ── Clients ─────────────────────────────────────────────────────────

/** Returns the existing client when the name already exists. */
export async function createClient(name) {
  const clean = name?.trim().replace(/\s+/g, ' ');
  if (!clean) throw new Error('Client name is required');
  const findExisting = async () => {
    const all = check(await supabase().from('clients').select('*'));
    return all.find((c) => normalizeName(c.name) === normalizeName(clean));
  };
  const existing = await findExisting();
  if (existing) return toClient(existing);
  const { data, error } = await supabase().from('clients').insert({ name: clean, contact_name: clean }).select().single();
  if (error?.code === '23505') return toClient(await findExisting()); // added a moment ago elsewhere
  return toClient(check({ data, error }));
}

// ── Importing data copied from the prototype ───────────────────────

/**
 * Adds the chosen projects (with their clients and every update) from a
 * prototype export. Clients that already exist by name are reused, and
 * projects already in the database (same client and name) are skipped.
 * If any step fails, everything added by this import is removed again.
 */
export async function importData(source, projectIds) {
  const wanted = new Set(projectIds);
  const [existingClients, existingProjects] = await Promise.all([
    selectAll('clients', 'created_at'),
    selectAll('projects', 'created_at'),
  ]);

  const clientByName = new Map(existingClients.map((c) => [normalizeName(c.name), c.id]));
  const existingKeys = new Set(existingProjects.map((p) => `${p.client_id}|${normalizeName(p.title)}`));
  const sourceClients = new Map(source.clients.map((c) => [c.id, c]));

  const newClients = [];
  const newProjects = [];
  const newUpdates = [];
  const skipped = [];
  const projectIdMap = new Map();

  for (const p of source.projects) {
    if (!wanted.has(p.id)) continue;
    const sourceClient = sourceClients.get(p.clientId);
    if (!sourceClient) continue;

    const key = normalizeName(sourceClient.name);
    let clientId = clientByName.get(key);
    if (!clientId) {
      clientId = crypto.randomUUID();
      clientByName.set(key, clientId);
      newClients.push({
        id: clientId,
        name: sourceClient.name.trim().replace(/\s+/g, ' '),
        contact_name: sourceClient.contactName || null,
        email: sourceClient.email || null,
      });
    }

    if (existingKeys.has(`${clientId}|${normalizeName(p.title)}`)) {
      skipped.push(p.title);
      continue;
    }
    existingKeys.add(`${clientId}|${normalizeName(p.title)}`);

    const id = crypto.randomUUID();
    projectIdMap.set(p.id, id);
    const clean = normalizeProject(p);
    newProjects.push({
      id,
      client_id: clientId,
      ...projectColumns(clean),
      started_at: p.startDate ?? new Date().toISOString(),
    });
  }

  for (const u of source.updates) {
    const projectId = projectIdMap.get(u.projectId);
    if (!projectId || !u.body?.trim()) continue;
    newUpdates.push({
      project_id: projectId,
      body: u.body.trim(),
      created_at: u.createdAt,
      edited_at: u.editedAt ?? null,
    });
  }

  const db = supabase();
  const undo = async () => {
    if (newProjects.length) await db.from('projects').delete().in('id', newProjects.map((p) => p.id));
    if (newClients.length) await db.from('clients').delete().in('id', newClients.map((c) => c.id));
  };

  try {
    if (newClients.length) check(await db.from('clients').insert(newClients));
    if (newProjects.length) check(await db.from('projects').insert(newProjects));
    for (let i = 0; i < newUpdates.length; i += 500) {
      check(await db.from('project_updates').insert(newUpdates.slice(i, i + 500)));
    }
  } catch (err) {
    await undo().catch(() => {});
    throw err;
  }

  return { clients: newClients.length, projects: newProjects.length, updates: newUpdates.length, skipped };
}
