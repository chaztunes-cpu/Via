// Sample data shaped like the future Supabase tables:
//   clients  (id, name, contact_name, email)
//   projects (id, client_id, title, service_type, status, start_date, due_date, completed_at)
//   updates  (id, project_id, body, created_at)
// Dates are generated relative to "now" so the sample always looks current.
// Replace this file (via src/data/api.js) when the database is connected.

import { STATUS, SERVICE } from '../lib/constants.js';

const DAY = 24 * 60 * 60 * 1000;
const now = new Date();

function daysAgo(days, hour = 12, minute = 0) {
  const d = new Date(now.getTime() - days * DAY);
  d.setHours(hour, minute, 0, 0);
  return d.toISOString();
}

function daysFromNow(days) {
  const d = new Date(now.getTime() + days * DAY);
  d.setHours(17, 0, 0, 0);
  return d.toISOString();
}

export const clients = [
  { id: 'c1', name: 'Nova Kade', contactName: 'Nova Kade', email: 'nova@novakade.music' },
  { id: 'c2', name: 'Marlowe', contactName: 'James Marlowe', email: 'mgmt@marlowe.fm' },
  { id: 'c3', name: 'Saint Rue', contactName: 'Rue Delacroix', email: 'saintrue@protonmail.com' },
  { id: 'c4', name: 'Kairo Vance', contactName: 'Kairo Vance', email: 'kairo@vancemusic.co' },
  { id: 'c5', name: 'Luma Collective', contactName: 'Priya Shah', email: 'priya@lumacollective.com' },
  { id: 'c6', name: 'Ezra Bloom', contactName: 'Ezra Bloom', email: 'ezra.bloom@gmail.com' },
  { id: 'c7', name: 'Halcyon Drift', contactName: 'Tom Adeyemi', email: 'tom@halcyondrift.net' },
  { id: 'c8', name: 'Ivy Rhodes', contactName: 'Ivy Rhodes', email: 'ivy@ivyrhodes.com' },
  { id: 'c9', name: 'Theo March', contactName: 'Theo March', email: 'theo@marchrecords.uk' },
];

export const projects = [
  { id: 'p1', clientId: 'c1', title: 'Midnight Static', serviceType: SERVICE.GHOST, status: STATUS.IN_PROGRESS, startDate: daysAgo(21), dueDate: daysFromNow(5) },
  { id: 'p2', clientId: 'c2', title: 'Glass Houses (VIP Mix)', serviceType: SERVICE.REMIX, status: STATUS.AWAITING_FEEDBACK, startDate: daysAgo(18), dueDate: daysFromNow(12) },
  { id: 'p3', clientId: 'c3', title: 'Low Tide', serviceType: SERVICE.FINISHING, status: STATUS.REVISIONS, startDate: daysAgo(30), dueDate: daysFromNow(3) },
  { id: 'p4', clientId: 'c4', title: 'Afterglow EP — Track 2', serviceType: SERVICE.ORIGINAL, status: STATUS.IN_PROGRESS, startDate: daysAgo(40), dueDate: daysFromNow(24) },
  { id: 'p5', clientId: 'c5', title: 'Parallel Lines', serviceType: SERVICE.GHOST, status: STATUS.READY_FOR_DELIVERY, startDate: daysAgo(35), dueDate: daysFromNow(2) },
  { id: 'p6', clientId: 'c6', title: 'Paper Moons', serviceType: SERVICE.FINISHING, status: STATUS.NOT_STARTED, startDate: daysAgo(6), dueDate: daysFromNow(19) },
  { id: 'p7', clientId: 'c7', title: 'Northern Lights (Remix)', serviceType: SERVICE.REMIX, status: STATUS.IN_PROGRESS, startDate: daysAgo(28), dueDate: null },
  { id: 'p8', clientId: 'c8', title: 'Velvet Hour', serviceType: SERVICE.ORIGINAL, status: STATUS.AWAITING_FEEDBACK, startDate: daysAgo(25), dueDate: daysFromNow(9) },
  { id: 'p9', clientId: 'c9', title: 'Signal Fire', serviceType: SERVICE.GHOST, status: STATUS.ON_HOLD, startDate: daysAgo(50), dueDate: null },
  { id: 'p10', clientId: 'c1', title: 'Silver Lining', serviceType: SERVICE.GHOST, status: STATUS.REVISIONS, startDate: daysAgo(14), dueDate: daysFromNow(15) },
  { id: 'p11', clientId: 'c4', title: 'Afterglow EP — Track 3', serviceType: SERVICE.ORIGINAL, status: STATUS.NOT_STARTED, startDate: daysAgo(2), dueDate: daysFromNow(38) },

  // Completed
  { id: 'p12', clientId: 'c2', title: 'Coastline', serviceType: SERVICE.FINISHING, status: STATUS.COMPLETED, startDate: daysAgo(30), dueDate: daysAgo(2), completedAt: daysAgo(2, 15, 40) },
  { id: 'p13', clientId: 'c5', title: 'Daybreak', serviceType: SERVICE.GHOST, status: STATUS.COMPLETED, startDate: daysAgo(45), dueDate: daysAgo(1), completedAt: daysAgo(1, 11, 5) },
  { id: 'p14', clientId: 'c7', title: 'Open Water', serviceType: SERVICE.REMIX, status: STATUS.COMPLETED, startDate: daysAgo(60), dueDate: daysAgo(20), completedAt: daysAgo(21, 18, 0) },
];

export const updates = [
  // p1 — Midnight Static
  { id: 'u1', projectId: 'p1', createdAt: daysAgo(21, 10, 15), body: 'Kickoff call done. Reference: chopped vocal house, 128 BPM, F minor.' },
  { id: 'u2', projectId: 'p1', createdAt: daysAgo(12, 16, 30), body: 'Sent first sketch (v1). Client loves the breakdown, wants the drop to hit harder.' },
  { id: 'u3', projectId: 'p1', createdAt: daysAgo(0, 9, 42), body: 'Rebuilt the drop with a layered reese bass and new drum bus. Arrangement locked, starting mixdown today.' },

  // p2 — Glass Houses VIP
  { id: 'u4', projectId: 'p2', createdAt: daysAgo(18, 13, 0), body: 'Stems received from label. Tempo 124, going for a darker, more driving VIP.' },
  { id: 'u5', projectId: 'p2', createdAt: daysAgo(1, 19, 20), body: 'Sent v2 with extended intro for DJs and the new synth lead. Waiting on notes from Marlowe and the label.' },

  // p3 — Low Tide
  { id: 'u6', projectId: 'p3', createdAt: daysAgo(30, 11, 0), body: 'Project files received (Ableton 12). Needs full mix and master, vocal tuning on chorus.' },
  { id: 'u7', projectId: 'p3', createdAt: daysAgo(6, 14, 10), body: 'Delivered mix v1 for review.' },
  { id: 'u8', projectId: 'p3', createdAt: daysAgo(1, 10, 5), body: 'Revision notes in: vocals up 1 dB in verse 2, less sidechain on pads, brighter master overall.' },

  // p4 — Afterglow EP Track 2
  { id: 'u9', projectId: 'p4', createdAt: daysAgo(40, 15, 0), body: 'EP planning session. Track 2 is the melodic house single — 122 BPM.' },
  { id: 'u10', projectId: 'p4', createdAt: daysAgo(3, 17, 45), body: 'Topline session with Kairo booked for Friday. Chord progression and groove finished.' },

  // p5 — Parallel Lines
  { id: 'u11', projectId: 'p5', createdAt: daysAgo(9, 12, 30), body: 'Final mix approved by Luma Collective. Mastering next.' },
  { id: 'u12', projectId: 'p5', createdAt: daysAgo(1, 16, 55), body: 'Master finished (−7 LUFS club, −9 LUFS streaming). Exporting stems, instrumental and extended mix for delivery.' },

  // p6 — Paper Moons
  { id: 'u13', projectId: 'p6', createdAt: daysAgo(6, 9, 0), body: 'Deposit received. Waiting on Ezra to upload the session to Drive.' },

  // p7 — Northern Lights Remix
  { id: 'u14', projectId: 'p7', createdAt: daysAgo(28, 10, 30), body: 'Remix brief: keep the vocal, flip it into UK garage. No hard deadline.' },
  { id: 'u15', projectId: 'p7', createdAt: daysAgo(16, 20, 0), body: 'Drums and bassline sketched. Vocal chopped into new hook.' },

  // p8 — Velvet Hour
  { id: 'u16', projectId: 'p8', createdAt: daysAgo(25, 14, 0), body: 'Writing session with Ivy — R&B/neo-soul, live keys.' },
  { id: 'u17', projectId: 'p8', createdAt: daysAgo(4, 18, 15), body: 'Sent rough mix with two bridge options. Ivy is reviewing with her A&R this week.' },

  // p9 — Signal Fire
  { id: 'u18', projectId: 'p9', createdAt: daysAgo(22, 11, 0), body: 'Paused at client request — label release schedule moved to Q1.' },

  // p10 — Silver Lining
  { id: 'u19', projectId: 'p10', createdAt: daysAgo(14, 13, 20), body: 'Started from Nova\'s demo. Keeping the piano motif, rebuilding everything else.' },
  { id: 'u20', projectId: 'p10', createdAt: daysAgo(2, 11, 30), body: 'Nova wants a different drop — less big-room, more minimal. Second revision round.' },

  // p11 — Afterglow EP Track 3
  { id: 'u21', projectId: 'p11', createdAt: daysAgo(2, 15, 0), body: 'Added to the EP schedule. Starting after Track 2 vocals are recorded.' },

  // Completed
  { id: 'u22', projectId: 'p12', createdAt: daysAgo(2, 15, 40), body: 'Final master delivered with WAV + MP3. Invoice sent.' },
  { id: 'u23', projectId: 'p13', createdAt: daysAgo(1, 11, 5), body: 'Delivered all files and signed ghost production agreement. Project closed.' },
  { id: 'u24', projectId: 'p14', createdAt: daysAgo(21, 18, 0), body: 'Remix released on the label. Delivered.' },
];
