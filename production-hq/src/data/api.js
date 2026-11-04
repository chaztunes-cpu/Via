// The one place the UI gets data from. It forwards each call to the
// live Supabase source or, in demo mode, to sample data in this browser.
// Both offer the same functions and return the same shapes.

import { DEMO_MODE } from './config.js';
import * as local from './localApi.js';
import * as live from './supabaseApi.js';

const source = DEMO_MODE ? local : live;

export const fetchAll = () => source.fetchAll();
export const fetchClientWithProjects = (clientId) => source.fetchClientWithProjects(clientId);
export const addUpdate = (projectId, body) => source.addUpdate(projectId, body);
export const editUpdate = (updateId, body) => source.editUpdate(updateId, body);
export const deleteUpdate = (updateId) => source.deleteUpdate(updateId);
export const updateProject = (projectId, project) => source.updateProject(projectId, project);
export const createProject = (input) => source.createProject(input);

// Live-only features (sign in, live sync, importing prototype data).
export const getSession = () => live.getSession();
export const onAuthChange = (callback) => live.onAuthChange(callback);
export const signIn = (email, password) => live.signIn(email, password);
export const signOut = () => live.signOut();
export const subscribeToChanges = (onChange) => (DEMO_MODE ? () => {} : live.subscribeToChanges(onChange));
export const importData = (source_, projectIds) => live.importData(source_, projectIds);
export const friendlyError = (error) => (DEMO_MODE ? 'Something went wrong. Please try again.' : live.friendlyError(error));
