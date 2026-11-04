// Data access layer. The UI only talks to these functions, never to the
// sample data directly. To connect Supabase later, replace the bodies
// here with queries (e.g. supabase.from('projects').select(...)) and keep
// the returned shapes the same.

import { clients, projects, updates } from './sampleData.js';

export async function fetchClients() {
  return clients;
}

export async function fetchProjects() {
  return projects;
}

export async function fetchUpdates() {
  return updates;
}

export async function fetchDashboardData() {
  const [c, p, u] = await Promise.all([fetchClients(), fetchProjects(), fetchUpdates()]);
  return { clients: c, projects: p, updates: u };
}
