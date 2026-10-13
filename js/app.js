'use strict';

/* ---------- Transport types ---------- */
const TYPES = {
  flight: { label: 'Flight', icon: 'plane', provider: 'Airline', providerPh: 'e.g. Delta', number: 'Flight number', numberPh: 'e.g. DL 1234', placePh: 'City or airport' },
  train: { label: 'Train', icon: 'train', provider: 'Train company', providerPh: 'e.g. Amtrak', number: 'Train number', numberPh: 'e.g. 2153', placePh: 'City or station' },
  bus: { label: 'Bus', icon: 'bus', provider: 'Bus company', providerPh: 'e.g. FlixBus', number: 'Route number', numberPh: 'e.g. 1102', placePh: 'City or stop' },
  ferry: { label: 'Ferry', icon: 'ship', provider: 'Ferry operator', providerPh: 'e.g. BC Ferries', number: 'Sailing / vessel', numberPh: 'Optional', placePh: 'City or terminal' },
  other: { label: 'Other', icon: 'ticket', provider: 'Provider', providerPh: 'e.g. Airport shuttle', number: 'Reference number', numberPh: 'Optional', placePh: 'Pickup or drop-off' },
};
const BOOKING_FIELDS = ['type', 'from', 'to', 'departDate', 'departTime', 'arriveDate', 'arriveTime', 'provider', 'number', 'confirmation', 'passenger', 'seat', 'gate', 'notes'];
const MAX_FILE_BYTES = 30 * 1024 * 1024;

// `draft` holds an add-a-booking flow in progress (the uploaded ticket and what was read from it).
// `reader` is the user's private ticket-reading service, if they've set one up.
const state = { bookings: [], trips: [], files: [], persistent: true, showPast: false, draft: null, reader: null };

/* ---------- Small helpers ---------- */
const $ = (sel) => document.querySelector(sel);
const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
const uid = () => crypto.randomUUID?.() ?? Date.now().toString(36) + Math.random().toString(36).slice(2);
const plural = (n, word) => `${n} ${word}${n === 1 ? '' : 's'}`;
const typeKey = (t) => (TYPES[t] ? t : 'other');
const typeOf = (b) => TYPES[typeKey(b.type)];
const typeVars = (t) => `--c:var(--${typeKey(t)});--cs:var(--${typeKey(t)}-solid)`;
const isImage = (f) => (f.type || '').startsWith('image/');

/* ---------- Dates ----------
   Times are stored exactly as printed on the ticket (local time at that place). */
function toDate(date, time) {
  if (!date) return null;
  const [y, m, d] = date.split('-').map(Number);
  const [hh, mm] = (time || '00:00').split(':').map(Number);
  return new Date(y, m - 1, d, hh, mm);
}
const startOfDay = (d) => new Date(d.getFullYear(), d.getMonth(), d.getDate());
const endOfDay = (d) => new Date(d.getFullYear(), d.getMonth(), d.getDate(), 23, 59);
const dep = (b) => toDate(b.departDate, b.departTime);
function endOf(b) {
  if (b.arriveDate) return b.arriveTime ? toDate(b.arriveDate, b.arriveTime) : endOfDay(toDate(b.arriveDate));
  return b.departTime ? new Date(+dep(b) + 36e5) : endOfDay(dep(b));
}
const byDep = (a, b) => dep(a) - dep(b) || (a.createdAt || 0) - (b.createdAt || 0);
const dayDiff = (d, from = new Date()) => Math.round((startOfDay(d) - startOfDay(from)) / 864e5);
const arrivalShift = (b) => (b.arriveDate && b.arriveDate !== b.departDate ? dayDiff(toDate(b.arriveDate), dep(b)) : 0);

function relDay(d) {
  const n = dayDiff(d);
  if (n === 0) return 'Today';
  if (n === 1) return 'Tomorrow';
  if (n === -1) return 'Yesterday';
  if (n < 0) return `${-n} days ago`;
  if (n < 14) return `In ${n} days`;
  if (n < 60) return `In ${Math.round(n / 7)} weeks`;
  return `In ${Math.round(n / 30)} months`;
}
function countdown(b) {
  const mins = Math.round((dep(b) - new Date()) / 6e4);
  if (b.departTime && mins < 60) return `In ${Math.max(mins, 1)} min`;
  if (b.departTime && mins < 12 * 60) return `In ${Math.floor(mins / 60)}h ${mins % 60}m`;
  return relDay(dep(b));
}
const thisYear = () => new Date().getFullYear();
const fmtDay = (d) => d.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric', ...(d.getFullYear() !== thisYear() && { year: 'numeric' }) });
const fmtTime = (t) => (t ? toDate('2000-01-01', t).toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' }) : '');
function fmtRange(a, b) {
  const year = a.getFullYear() !== thisYear() || b.getFullYear() !== a.getFullYear();
  const f = new Intl.DateTimeFormat(undefined, { month: 'short', day: 'numeric', ...(year && { year: 'numeric' }) });
  return f.formatRange ? f.formatRange(a, b) : `${f.format(a)} – ${f.format(b)}`;
}
function greeting() {
  const h = new Date().getHours();
  return h >= 5 && h < 12 ? 'Good morning' : h >= 12 && h < 18 ? 'Good afternoon' : 'Good evening';
}

/* ---------- Places ----------
   "Lisbon (LIS)" → city "Lisbon", detail "LIS". */
const shortPlace = (s) => (s || '').split(/[(,]/)[0].trim() || s || '';
const placeDetail = (s) => (s || '').match(/\(([^)]+)\)/)?.[1] || '';
const norm = (s) => shortPlace(s).toLowerCase().normalize('NFD').replace(/[^a-z0-9]+/g, ' ').trim();
function samePlace(a, b) {
  a = norm(a); b = norm(b);
  return !!a && !!b && (a === b || (a.length >= 3 && b.length >= 3 && (a.includes(b) || b.includes(a))));
}

/* ---------- Data lookups ---------- */
const tripById = (id) => state.trips.find((t) => t.id === id);
const bookingById = (id) => state.bookings.find((b) => b.id === id);
const filesFor = (id) => state.files.filter((f) => f.bookingId === id).sort((a, b) => a.addedAt - b.addedAt);

function tripInfo(trip) {
  const bookings = state.bookings.filter((b) => b.tripId === trip.id).sort(byDep);
  if (!bookings.length) return null;
  const now = new Date(), start = dep(bookings[0]), end = endOf(bookings.at(-1));
  return { trip, bookings, start, end, upcoming: end >= now, active: start <= now && end >= now };
}
const allTrips = () => state.trips.map(tripInfo).filter(Boolean).sort((a, b) => a.start - b.start);
const nextBooking = () => state.bookings.filter((b) => endOf(b) >= new Date()).sort(byDep)[0];

function routeSummary(bookings) {
  const stops = [];
  for (const b of bookings) {
    if (!stops.length || !samePlace(stops.at(-1), b.from)) stops.push(b.from);
    stops.push(b.to);
  }
  return stops.map((s) => esc(shortPlace(s))).join(' <span class="arrow">→</span> ');
}

// Guess which trip a new booking belongs to: it falls within a trip's dates,
// or it continues on from where a trip left off (e.g. the flight home).
function suggestTrip(from, when) {
  if (!when) return '';
  for (const t of allTrips()) {
    const last = t.bookings.at(-1);
    if (when >= new Date(+t.start - 2 * 864e5) && when <= new Date(+t.end + 2 * 864e5)) return t.trip.id;
    const daysAfter = (when - endOf(last)) / 864e5;
    const alreadyHome = samePlace(last.to, t.bookings[0].from);
    if (daysAfter >= 0 && daysAfter <= 30 && samePlace(from, last.to) && !alreadyHome) return t.trip.id;
  }
  return '';
}

function gapText(prev, next) {
  const place = shortPlace(prev.to), same = samePlace(prev.to, next.from);
  const nights = dayDiff(dep(next), endOf(prev));
  if (nights >= 1) return same ? `${plural(nights, 'night')} in ${place}` : plural(nights, 'night');
  const mins = Math.round((dep(next) - endOf(prev)) / 6e4);
  if (!prev.arriveTime || !next.departTime || mins <= 0) return '';
  const h = Math.floor(mins / 60), m = mins % 60;
  return `${h ? `${h}h ` : ''}${m ? `${m}m` : ''}`.trim() + (same ? ` in ${place}` : ' between bookings');
}

/* ---------- Saving data ---------- */
function upsert(list, rec) {
  const i = list.findIndex((x) => x.id === rec.id);
  if (i < 0) list.push(rec); else list[i] = rec;
}
async function put(store, rec) {
  await Store.put(store, rec);
  upsert(state[store], rec);
}
async function drop(store, id) {
  await Store.remove(store, id);
  state[store] = state[store].filter((x) => x.id !== id);
}

const urls = new Map();
function fileURL(f) {
  if (!urls.has(f.id)) urls.set(f.id, URL.createObjectURL(f.blob));
  return urls.get(f.id);
}
async function addFiles(bookingId, files) {
  let added = 0;
  for (const file of files) {
    if (file.size > MAX_FILE_BYTES) { alert(`"${file.name}" is too large. Please choose a file under 30 MB.`); continue; }
    await put('files', { id: uid(), bookingId, name: file.name, type: file.type, size: file.size, blob: file, addedAt: Date.now() });
    added++;
  }
  return added;
}
async function removeFile(id) {
  await drop('files', id);
  if (urls.has(id)) { URL.revokeObjectURL(urls.get(id)); urls.delete(id); }
}
async function cleanupTrip(tripId) {
  if (tripId && !state.bookings.some((b) => b.tripId === tripId)) await drop('trips', tripId);
}
async function deleteBooking(id) {
  const b = bookingById(id);
  if (!b) return;
  for (const f of filesFor(id)) await removeFile(f.id);
  await drop('bookings', id);
  await cleanupTrip(b.tripId);
}
// Add bookings that have no trip yet, grouping them into trips automatically.
async function addBookingsGrouped(list) {
  for (const b of [...list].sort(byDep)) {
    let tripId = suggestTrip(b.from, dep(b));
    if (!tripId) {
      tripId = uid();
      await put('trips', { id: tripId, name: shortPlace(b.to) });
    }
    await put('bookings', { ...b, tripId, createdAt: Date.now() });
  }
}
async function removeSamples() {
  for (const b of state.bookings.filter((x) => x.sample)) await deleteBooking(b.id);
}
async function loadSamples() {
  await removeSamples();
  const { trips, bookings, files } = sampleData();
  for (const t of trips) await put('trips', t);
  for (const b of bookings) await put('bookings', b);
  for (const f of files) await put('files', f);
}

/* ---------- Backups & the earlier version of Via ---------- */
function fromV1(list) {
  return list.filter((t) => t && t.depart && t.from && t.to).map((t) => ({
    id: t.id || uid(), type: typeKey(t.type), from: t.from, to: t.to,
    departDate: t.depart.slice(0, 10), departTime: t.depart.slice(11, 16),
    arriveDate: (t.arrive || '').slice(0, 10), arriveTime: (t.arrive || '').slice(11, 16),
    provider: t.carrier || '', number: t.number || '', confirmation: t.confirmation || '', seat: t.seat || '',
    notes: [t.notes, t.price && `Price: ${t.price}`, t.link].filter(Boolean).join('\n'),
  }));
}
function readLegacy() {
  try { return fromV1(JSON.parse(localStorage.getItem('via.trips.v1')) || []); } catch { return []; }
}
const blobToDataURL = (blob) => new Promise((resolve, reject) => {
  const r = new FileReader();
  r.onload = () => resolve(r.result);
  r.onerror = () => reject(r.error);
  r.readAsDataURL(blob);
});
function dataURLToBlob(url) {
  const [head, body] = url.split(',');
  const bin = atob(body), bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  return new Blob([bytes], { type: head.match(/data:([^;]*)/)?.[1] || '' });
}
async function exportBackup() {
  const files = await Promise.all(state.files.map(async ({ blob, ...f }) => ({ ...f, data: await blobToDataURL(blob) })));
  const data = { app: 'via', version: 2, exportedAt: new Date().toISOString(), trips: state.trips, bookings: state.bookings, files };
  download(`via-backup-${new Date().toISOString().slice(0, 10)}.json`, new Blob([JSON.stringify(data)], { type: 'application/json' }));
}
async function restoreBackup(data) {
  if (Array.isArray(data)) {
    const list = fromV1(data);
    await addBookingsGrouped(list);
    return list.length;
  }
  if (data?.app !== 'via') throw new Error('Not a Via backup');
  const bookings = (data.bookings || []).filter((b) => b.id && b.departDate && b.tripId);
  for (const t of data.trips || []) if (t.id) await put('trips', t);
  for (const b of bookings) await put('bookings', b);
  for (const { data: url, ...f } of data.files || []) if (f.id && url) await put('files', { ...f, blob: dataURLToBlob(url) });
  return bookings.length;
}

function download(name, blob) {
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = name;
  document.body.append(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(a.href), 2000);
}
function downloadICS(b) {
  const t = typeOf(b), p = (n) => String(n).padStart(2, '0');
  const stamp = (d) => `${d.getFullYear()}${p(d.getMonth() + 1)}${p(d.getDate())}T${p(d.getHours())}${p(d.getMinutes())}00`;
  const txt = (s) => String(s ?? '').replace(/[\\;,]/g, (m) => `\\${m}`).replace(/\n/g, '\\n');
  let when;
  if (b.departTime) {
    when = [`DTSTART:${stamp(dep(b))}`, `DTEND:${stamp(endOf(b))}`];
  } else {
    const next = new Date(dep(b));
    next.setDate(next.getDate() + 1);
    when = [`DTSTART;VALUE=DATE:${stamp(dep(b)).slice(0, 8)}`, `DTEND;VALUE=DATE:${stamp(next).slice(0, 8)}`];
  }
  const desc = [[b.provider, b.number].filter(Boolean).join(' '), b.confirmation && `Confirmation: ${b.confirmation}`, b.seat && `Seat: ${b.seat}`, b.notes].filter(Boolean).join('\n');
  const ics = ['BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//Via//Travel//EN', 'BEGIN:VEVENT',
    `UID:${b.id}@via`, `DTSTAMP:${stamp(new Date())}`, ...when,
    `SUMMARY:${txt(`${t.label}: ${shortPlace(b.from)} → ${shortPlace(b.to)}`)}`,
    `LOCATION:${txt(b.from)}`, `DESCRIPTION:${txt(desc)}`, 'END:VEVENT', 'END:VCALENDAR'].join('\r\n');
  download(`${t.label}-${shortPlace(b.from)}-to-${shortPlace(b.to)}.ics`.replace(/[^\w.-]+/g, '_'), new Blob([ics], { type: 'text/calendar' }));
}
async function copyText(text) {
  try {
    await navigator.clipboard.writeText(text);
  } catch {
    const ta = Object.assign(document.createElement('textarea'), { value: text });
    ta.style.cssText = 'position:fixed;opacity:0';
    document.body.append(ta);
    ta.select();
    document.execCommand('copy');
    ta.remove();
  }
}

/* ---------- Shared pieces of UI ---------- */
const navbar = (fallback, right = '', label = 'Back') =>
  `<div class="navbar"><button class="back" data-action="back" data-fallback="${fallback}">${icon('chevron-left', 22)}<span>${label}</span></button>${right}</div>`;

function emptyState() {
  return `<div class="empty">
    <div class="empty-icon">${icon('route', 30)}</div>
    <h2>No upcoming trips</h2>
    <p>Add a flight, train, bus or ferry booking and Via will keep everything organized in one place.</p>
    <a class="btn primary" href="#/add">${icon('plus', 18)} Add a booking</a>
  </div>`;
}

function routeHTML(b) {
  const shift = arrivalShift(b);
  const point = (place, time, extra = '') => `<div class="pt">
      <div class="time">${fmtTime(time) || '&nbsp;'}${extra}</div>
      <div class="city">${esc(shortPlace(place))}</div>
      <div class="sub">${esc(placeDetail(place)) || '&nbsp;'}</div>
    </div>`;
  return `${point(b.from, b.departTime)}
    <div class="path" aria-hidden="true"><span class="line"></span><span class="path-icon">${icon(typeOf(b).icon, 18)}</span><span class="line"></span></div>
    ${point(b.to, b.arriveTime, shift > 0 ? `<sup>+${shift}</sup>` : '')}`;
}

function ticketButton(b, cls) {
  const files = filesFor(b.id);
  if (files.length === 1) {
    const f = files[0];
    return isImage(f)
      ? `<button class="btn ${cls}" data-action="view-image" data-id="${f.id}">${icon('ticket', 18)} Open ticket</button>`
      : `<a class="btn ${cls}" href="${fileURL(f)}" target="_blank" rel="noopener">${icon('ticket', 18)} Open ticket</a>`;
  }
  if (files.length > 1) return `<a class="btn ${cls}" href="#/booking/${b.id}/tickets">${icon('ticket', 18)} Tickets (${files.length})</a>`;
  return `<a class="btn ${cls}" href="#/booking/${b.id}/tickets">${icon('paperclip', 18)} Add ticket</a>`;
}

function heroCard(b) {
  const t = typeOf(b), underway = dep(b) <= new Date();
  const status = underway ? (b.arriveTime ? `Arrives ${fmtTime(b.arriveTime)}` : 'Underway') : countdown(b);
  const meta = [
    ['Date', esc(fmtDay(dep(b)))],
    ['Type', `<span class="hero-type">${icon(t.icon, 15)}${t.label}</span>`],
    [t.provider, esc([b.provider, b.number].filter(Boolean).join(' · '))],
  ].filter((m) => m[1]);
  const ticket = filesFor(b.id).length ? ticketButton(b, 'glass') : '';
  return `<article class="hero" style="${typeVars(b.type)}">
    <div class="hero-top">
      <span class="hero-label">${underway ? 'Happening now' : 'Next departure'}</span>
      <span class="pill">${status}</span>
    </div>
    <a class="route hero-route" href="#/booking/${b.id}">${routeHTML(b)}</a>
    <div class="hero-meta">${meta.map(([k, v]) => `<div><span>${esc(k)}</span><b>${v}</b></div>`).join('')}</div>
    <div class="hero-actions">
      <a class="btn light" href="#/booking/${b.id}">View booking ${icon('chevron-right', 18)}</a>
      ${ticket}
    </div>
  </article>`;
}

// The places a trip visits, leaving out where it starts (usually home).
function destinations(bookings) {
  const home = bookings[0].from, seen = [];
  for (const b of bookings) {
    if (!samePlace(b.to, home) && !seen.some((s) => samePlace(s, b.to))) seen.push(b.to);
  }
  return (seen.length ? seen : [bookings.at(-1).to]).map(shortPlace);
}

function tripCard(info) {
  const { trip, bookings, start, end, active, upcoming } = info;
  const dots = bookings.slice(0, 4).map((b) => `<span class="type-dot" style="${typeVars(b.type)}" title="${typeOf(b).label}">${icon(typeOf(b).icon, 13)}</span>`).join('')
    + (bookings.length > 4 ? `<span class="type-dot more">+${bookings.length - 4}</span>` : '');
  const pill = active ? '<span class="pill now">Now</span>' : upcoming ? `<span class="pill soft">${relDay(start)}</span>` : '';
  return `<a class="trip-card${upcoming ? '' : ' is-past'}" href="#/trip/${trip.id}">
    <div class="trip-card-top">
      <div class="trip-card-main">
        <h3>${esc(trip.name)}</h3>
        <div class="trip-dest">${icon('map-pin', 14)}<span>${destinations(bookings).map(esc).join(' · ')}</span></div>
      </div>
      ${pill}
    </div>
    <div class="trip-card-foot">
      <span class="trip-when">${icon('calendar', 14)}${fmtRange(start, end)}</span>
      <span class="trip-count"><span class="type-stack">${dots}</span>${plural(bookings.length, 'booking')}</span>
    </div>
  </a>`;
}

function timelineHTML(bookings, { showTrip = false, gaps = false } = {}) {
  let html = '', lastDay = '';
  bookings.forEach((b, i) => {
    if (gaps && i > 0) {
      const g = gapText(bookings[i - 1], b);
      if (g) html += `<li class="tl-gap"><span class="tl-text">${icon('map-pin', 14)} ${esc(g)}</span></li>`;
    }
    if (b.departDate !== lastDay) {
      lastDay = b.departDate;
      html += `<li class="tl-day"><span class="tl-mark"></span><span class="tl-text"><b>${fmtDay(dep(b))}</b><em>${relDay(dep(b))}</em></span></li>`;
    }
    const t = typeOf(b), trip = showTrip && tripById(b.tripId), n = filesFor(b.id).length, shift = arrivalShift(b);
    const sub = [t.label, b.provider, b.number].filter(Boolean).map(esc).join(' · ');
    const arrives = b.arriveTime ? ` · arrives ${fmtTime(b.arriveTime)}${shift > 0 ? ` (+${shift})` : ''}` : '';
    const tags = (trip ? `<span class="tag">${esc(trip.name)}</span>` : '') + (n ? `<span class="tag">${icon('ticket', 12)} ${plural(n, 'ticket')}</span>` : '');
    html += `<li class="tl-item" style="${typeVars(b.type)}"><a href="#/booking/${b.id}">
      <span class="tl-time">${fmtTime(b.departTime) || '—'}</span>
      <span class="tl-node"><span class="dot" title="${t.label}">${icon(t.icon, 18)}</span></span>
      <span class="tl-card">
        <span class="tl-route">${esc(shortPlace(b.from))} <span class="arrow">→</span> ${esc(shortPlace(b.to))}</span>
        <span class="tl-sub">${sub}${arrives}</span>
        ${tags ? `<span class="tl-tags">${tags}</span>` : ''}
      </span>
    </a></li>`;
  });
  return `<ol class="timeline">${html}</ol>`;
}

function docsHTML(b) {
  const files = filesFor(b.id);
  const card = (f) => {
    const url = fileURL(f), img = isImage(f);
    const thumb = img ? `<img src="${url}" alt="">` : `<span class="doc-icon">${icon('file', 30)}<b>${f.type === 'application/pdf' ? 'PDF' : 'FILE'}</b></span>`;
    const inner = `<span class="doc-thumb">${thumb}</span><span class="doc-name">${esc(f.name)}</span>`;
    return `<div class="doc">
      ${img ? `<button class="doc-open" data-action="view-image" data-id="${f.id}">${inner}</button>` : `<a class="doc-open" href="${url}" target="_blank" rel="noopener">${inner}</a>`}
      <button class="doc-remove" data-action="remove-file" data-id="${f.id}" aria-label="Remove ${esc(f.name)}">${icon('x', 14)}</button>
    </div>`;
  };
  return `<section class="section" id="tickets">
    <div class="section-head"><h2>Tickets &amp; documents</h2></div>
    ${files.length ? `<div class="docs">${files.map(card).join('')}</div>` : '<p class="hint">Keep your boarding pass, e-ticket or confirmation here so it’s one tap away when you travel.</p>'}
    <button class="btn dashed block" data-action="pick-files">${icon('upload', 18)} Add PDF or screenshot</button>
    <input type="file" accept="image/*,application/pdf" multiple hidden data-change="add-files" data-id="${b.id}">
  </section>`;
}

/* ---------- Screens ---------- */
function viewHome() {
  const trips = allTrips();
  const upcoming = trips.filter((t) => t.upcoming);
  const past = trips.filter((t) => !t.upcoming).reverse();
  const next = nextBooking();
  const hasSamples = state.bookings.some((b) => b.sample);
  return `
    <header class="topbar">
      <div class="brand"><span class="brand-mark">${icon('route', 18)}</span>Via</div>
      <button class="icon-btn" data-action="settings" aria-label="Settings">${icon('settings')}</button>
    </header>
    <div class="greeting">
      <h1>${greeting()}</h1>
      <p>${upcoming.length ? `You have ${plural(upcoming.length, 'upcoming trip')}.` : 'Nothing booked yet.'}</p>
    </div>
    ${state.persistent ? '' : '<div class="banner warn"><div><b>Changes won’t be saved</b><p>Your browser is blocking storage (often because of private browsing). Open Via in a normal window to keep your trips.</p></div></div>'}
    ${hasSamples ? `<div class="banner"><div><b>These are sample trips</b><p>They show how Via works. Remove them when you’re ready to add your own.</p></div><button class="btn secondary small" data-action="remove-samples">Remove</button></div>` : ''}
    ${next ? heroCard(next) : emptyState()}
    ${upcoming.length ? `<section class="section">
      <div class="section-head"><h2>Upcoming trips</h2><a class="link-btn" href="#/timeline">View timeline</a></div>
      ${upcoming.map(tripCard).join('')}
    </section>` : ''}
    ${past.length ? `<section class="section">
      <button class="past-toggle" data-action="toggle-past" aria-expanded="${state.showPast}">${icon(state.showPast ? 'chevron-up' : 'chevron-down', 18)} ${state.showPast ? 'Hide' : 'Show'} past trips (${past.length})</button>
      ${state.showPast ? past.map(tripCard).join('') : ''}
    </section>` : ''}`;
}

function viewTimeline() {
  const now = new Date();
  const list = state.bookings.filter((b) => endOf(b) >= now).sort(byDep);
  return `<header class="topbar"><h1 class="page-title">Timeline</h1></header>
    <p class="page-sub">Every upcoming departure, in order.</p>
    ${list.length ? timelineHTML(list, { showTrip: true }) : emptyState()}`;
}

function viewTrip(id) {
  const trip = tripById(id), info = trip && tripInfo(trip);
  if (!info) return viewMissing('trip');
  const nFiles = info.bookings.reduce((n, b) => n + filesFor(b.id).length, 0);
  const status = info.active ? 'Happening now' : info.upcoming ? relDay(info.start) : 'Completed';
  return `${navbar('#/', `<button class="icon-btn" data-action="rename-trip" data-id="${id}" aria-label="Rename trip">${icon('pencil', 18)}</button>`)}
    <div class="trip-header">
      <div class="trip-when">${fmtRange(info.start, info.end)} · ${status}</div>
      <h1 class="page-title">${esc(trip.name)}</h1>
      <p class="page-sub">${routeSummary(info.bookings)}</p>
      <div class="stats"><span>${plural(info.bookings.length, 'booking')}</span><span>${plural(nFiles, 'ticket')} attached</span></div>
    </div>
    ${timelineHTML(info.bookings, { gaps: true })}
    <div class="stack">
      <a class="btn secondary block" href="#/add?trip=${id}">${icon('plus', 18)} Add a booking to this trip</a>
      <button class="btn danger-text block" data-action="delete-trip" data-id="${id}">Delete trip</button>
    </div>`;
}

function viewBooking(id) {
  const b = bookingById(id);
  if (!b) return viewMissing('booking');
  const t = typeOf(b), trip = tripById(b.tripId), now = new Date();
  const status = endOf(b) < now ? 'Completed' : dep(b) <= now ? 'Now' : relDay(dep(b));
  const fields = [
    ['Confirmation number', b.confirmation && `<span class="mono">${esc(b.confirmation)}</span><button class="copy" data-action="copy" data-text="${esc(b.confirmation)}">${icon('copy', 14)} Copy</button>`, 'full'],
    ['Departs', `${fmtDay(dep(b))}${b.departTime ? `, ${fmtTime(b.departTime)}` : ''}`],
    ['Arrives', b.arriveDate && `${fmtDay(toDate(b.arriveDate))}${b.arriveTime ? `, ${fmtTime(b.arriveTime)}` : ''}`],
    [t.number, b.number && esc(b.number)],
    ['Passenger', b.passenger && esc(b.passenger)],
    ['Seat / class', b.seat && esc(b.seat)],
    ['Terminal, gate or platform', b.gate && esc(b.gate)],
  ].filter((f) => f[1]);
  return `${navbar(trip ? `#/trip/${trip.id}` : '#/')}
    <article class="ticket" style="${typeVars(b.type)}">
      <div class="ticket-head">
        <span class="badge">${icon(t.icon, 20)}</span>
        <div class="ticket-title"><b>${esc(b.provider || t.label)}</b><span>${t.label}${b.number ? ` · ${esc(b.number)}` : ''}</span></div>
        <span class="pill">${status}</span>
      </div>
      <div class="route ticket-route">${routeHTML(b)}</div>
      <div class="ticket-perf"></div>
      <dl class="fields">${fields.map(([k, v, cls]) => `<div class="${cls || ''}"><dt>${k}</dt><dd>${v}</dd></div>`).join('')}
        ${b.notes ? `<div class="full"><dt>Notes</dt><dd class="notes">${esc(b.notes)}</dd></div>` : ''}
      </dl>
    </article>
    ${docsHTML(b)}
    <div class="actions">
      <a class="btn secondary" href="#/edit/${b.id}">${icon('pencil', 18)} Edit</a>
      <button class="btn secondary" data-action="ics" data-id="${b.id}">${icon('calendar', 18)} Add to calendar</button>
    </div>
    ${trip ? `<a class="trip-link" href="#/trip/${trip.id}"><span><small>Part of trip</small><b>${esc(trip.name)}</b></span>${icon('chevron-right', 20)}</a>` : ''}
    <button class="btn danger-text block" data-action="delete-booking" data-id="${b.id}">${icon('trash', 18)} Delete booking</button>`;
}

function viewMissing(what) {
  return `${navbar('#/')}<div class="empty"><h2>Not found</h2><p>This ${what} may have been deleted.</p><a class="btn primary" href="#/">Go to Home</a></div>`;
}

const field = (name, label, value, attrs = '') =>
  `<div class="field"><label for="f-${name}" id="l-${name}">${label}</label><input id="f-${name}" name="${name}" value="${value}" ${attrs}><div class="err" data-err="${name}"></div></div>`;

function viewForm(id, query) {
  const editing = id ? bookingById(id) : null;
  if (id && !editing) return viewMissing('booking');
  const presetTrip = !editing && tripById(query.get('trip') || state.draft?.tripId);
  const fromTicket = !editing && state.draft?.file;
  const presetLegs = presetTrip ? tripInfo(presetTrip)?.bookings || [] : [];
  const lastLeg = presetLegs.at(-1);
  // Start the next leg where the trip left off, unless the trip already returns home.
  const continueFrom = lastLeg && !samePlace(lastLeg.to, presetLegs[0].from) ? lastLeg.to : '';
  const b = editing || { type: lastLeg?.type || 'flight', from: continueFrom };
  const currentTrip = editing?.tripId || presetTrip?.id || '';
  const options = allTrips().filter((t) => t.upcoming || t.trip.id === currentTrip);
  const v = (k) => esc(b[k] || '');
  const back = editing ? `#/booking/${editing.id}` : '#/add';
  return `${navbar(back, '', editing ? 'Cancel' : 'Back')}
  <h1 class="page-title">${editing ? 'Edit booking' : 'New booking'}</h1>
  ${fromTicket ? `<div class="banner form-banner"><div><b>${state.reader ? 'Enter the details' : 'Automatic reading isn’t set up yet'}</b><p>Your ticket is attached below. Type the details from it, then save.</p></div></div>` : ''}
  <form id="booking-form" class="form" novalidate autocomplete="off">
    <div class="type-picker" role="radiogroup" aria-label="Type of transport">
      ${Object.entries(TYPES).map(([k, t]) => `<label class="type-opt" style="${typeVars(k)}"><input type="radio" name="type" value="${k}" ${typeKey(b.type) === k ? 'checked' : ''}><span class="type-tile">${icon(t.icon, 22)}<span>${t.label}</span></span></label>`).join('')}
    </div>

    <div class="card-group">
      ${field('from', 'From', v('from'), 'enterkeyhint="next"')}
      <div class="field">
        <div class="label-row"><label for="f-to">To</label><button type="button" class="swap" data-swap>${icon('swap', 14)} Swap</button></div>
        <input id="f-to" name="to" value="${v('to')}" enterkeyhint="next"><div class="err" data-err="to"></div>
      </div>
    </div>

    <div class="card-group">
      <div>
        <div class="label">Departure</div>
        <div class="row">
          <input type="date" name="departDate" aria-label="Departure date" value="${v('departDate')}">
          <input type="time" name="departTime" aria-label="Departure time" value="${v('departTime')}">
        </div>
        <div class="err" data-err="departDate"></div>
      </div>
      <div>
        <div class="label">Arrival <span class="opt">(optional)</span></div>
        <div class="row">
          <input type="date" name="arriveDate" aria-label="Arrival date" value="${v('arriveDate')}">
          <input type="time" name="arriveTime" aria-label="Arrival time" value="${v('arriveTime')}">
        </div>
        <div class="err" data-err="arriveDate"></div>
      </div>
    </div>

    <div class="card-group">
      <div class="row">${field('provider', 'Provider', v('provider'))}${field('number', 'Number', v('number'))}</div>
      ${field('confirmation', 'Confirmation number', v('confirmation'), 'placeholder="e.g. X7KQ2P" autocapitalize="characters" spellcheck="false"')}
      <details class="more" ${b.seat || b.notes || b.passenger || b.gate ? 'open' : ''}>
        <summary>${icon('chevron-down', 16)} More details <span class="opt">passenger, seat, gate, notes</span></summary>
        <div class="more-body">
          ${field('passenger', 'Passenger', v('passenger'), 'placeholder="Name on the ticket" autocomplete="off"')}
          <div class="row">${field('seat', 'Seat / class', v('seat'), 'placeholder="e.g. 14C"')}${field('gate', 'Terminal / gate / platform', v('gate'), 'placeholder="e.g. Terminal 2"')}</div>
          <div class="field"><label for="f-notes">Notes</label><textarea id="f-notes" name="notes" rows="3" placeholder="Terminal, baggage, check-in reminders…">${v('notes')}</textarea></div>
        </div>
      </details>
    </div>

    <div class="card-group">
      <div class="field">
        <label for="f-trip">Trip</label>
        <select id="f-trip" name="trip">
          <option value="new">New trip</option>
          ${options.map((o) => `<option value="${o.trip.id}" ${o.trip.id === currentTrip ? 'selected' : ''}>${esc(o.trip.name)} · ${fmtRange(o.start, o.end)}</option>`).join('')}
        </select>
        <p class="hint" id="trip-hint"></p>
      </div>
      <div class="field" id="new-trip-field">
        <label for="f-tripName">Trip name <span class="opt">(optional)</span></label>
        <input id="f-tripName" name="tripName">
      </div>
    </div>

    ${editing ? '' : `<div class="card-group">
      <div class="label">Ticket or confirmation <span class="opt">(optional)</span></div>
      <ul class="pending" id="pending"></ul>
      <button type="button" class="btn dashed block" data-pick>${icon('paperclip', 18)} Attach PDF or screenshot</button>
      <input type="file" id="pending-input" accept="image/*,application/pdf" multiple hidden>
    </div>`}

    <div class="form-footer"><button class="btn primary block" type="submit">${editing ? 'Save changes' : 'Save booking'}</button></div>
  </form>`;
}

function setupForm(editing) {
  const form = $('#booking-form');
  if (!form) return;
  const el = form.elements;
  // A ticket uploaded on the Add screen comes along to be attached to this booking.
  const pending = !editing && state.draft?.file ? [state.draft.file] : [];
  let tripTouched = el.trip.value !== 'new';
  let lastDepart = el.departDate.value;

  const applyType = () => {
    const t = TYPES[el.type.value];
    $('#l-provider').textContent = t.provider;
    $('#l-number').textContent = t.number;
    el.provider.placeholder = t.providerPh;
    el.number.placeholder = t.numberPh;
    el.from.placeholder = el.to.placeholder = t.placePh;
  };
  const syncTrip = () => {
    let matched = false;
    if (!tripTouched) {
      const id = suggestTrip(el.from.value, toDate(el.departDate.value, el.departTime.value));
      matched = !!id && [...el.trip.options].some((o) => o.value === id);
      el.trip.value = matched ? id : 'new';
    }
    const isNew = el.trip.value === 'new';
    $('#new-trip-field').hidden = !isNew;
    el.tripName.placeholder = shortPlace(el.to.value) || 'e.g. Summer in Italy';
    $('#trip-hint').textContent = isNew ? 'A new trip will be created for this booking.' : matched ? 'Added to this trip automatically. You can change it.' : '';
  };
  const renderPending = () => {
    $('#pending').innerHTML = pending.map((f, i) => `<li>${icon(isImage(f) ? 'image' : 'file', 16)}<span>${esc(f.name)}</span><button type="button" data-unpend="${i}" aria-label="Remove ${esc(f.name)}">${icon('x', 14)}</button></li>`).join('');
  };
  const onDates = () => {
    if (!el.arriveDate.value || el.arriveDate.value === lastDepart) el.arriveDate.value = el.departDate.value;
    lastDepart = el.departDate.value;
  };
  const showErrors = (errors) => {
    form.querySelectorAll('[data-err]').forEach((n) => {
      const msg = errors[n.dataset.err] || '';
      n.textContent = msg;
      el[n.dataset.err]?.classList.toggle('invalid', !!msg);
    });
    const first = Object.keys(errors)[0];
    if (first) el[first].focus();
  };

  form.addEventListener('click', (e) => {
    if (e.target.closest('[data-swap]')) {
      [el.from.value, el.to.value] = [el.to.value, el.from.value];
      syncTrip();
    }
    if (e.target.closest('[data-pick]')) $('#pending-input').click();
    const un = e.target.closest('[data-unpend]');
    if (un) { pending.splice(+un.dataset.unpend, 1); renderPending(); }
  });
  const onEdit = (e) => {
    const name = e.target.name;
    if (form.querySelector(`[data-err="${name}"]`)?.textContent) showErrors({});
    if (name === 'departDate') onDates();
    if (['from', 'to', 'departDate', 'departTime'].includes(name)) syncTrip();
  };
  form.addEventListener('input', onEdit);
  form.addEventListener('change', (e) => {
    onEdit(e);
    if (e.target.name === 'type') applyType();
    if (e.target.name === 'trip') { tripTouched = true; syncTrip(); }
    if (e.target.id === 'pending-input') { pending.push(...e.target.files); e.target.value = ''; renderPending(); }
  });

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const data = Object.fromEntries(BOOKING_FIELDS.map((k) => [k, (el[k].value || '').trim()]));
    if (data.arriveTime && !data.arriveDate) data.arriveDate = data.departDate;
    const errors = {};
    if (!data.from) errors.from = 'Where does this journey start?';
    if (!data.to) errors.to = 'Where are you going?';
    if (!data.departDate) errors.departDate = 'Choose a departure date.';
    else if (data.arriveDate && toDate(data.arriveDate, data.arriveTime || '23:59') < dep(data)) errors.arriveDate = 'Arrival can’t be before departure.';
    if (Object.keys(errors).length) return showErrors(errors);

    let tripId = el.trip.value;
    if (tripId === 'new') {
      tripId = uid();
      await put('trips', { id: tripId, name: el.tripName.value.trim() || shortPlace(data.to) });
    }
    const booking = { ...editing, ...data, tripId, id: editing?.id || uid(), createdAt: editing?.createdAt || Date.now() };
    await put('bookings', booking);
    if (pending.length) await addFiles(booking.id, pending);
    if (editing) await cleanupTrip(editing.tripId);
    state.draft = null;
    toast(editing ? 'Changes saved' : 'Booking added');
    leaveTo(editing ? `#/booking/${booking.id}` : `#/trip/${tripId}`);
  });

  applyType();
  syncTrip();
  if (pending.length) renderPending();
}

/* ---------- Dialogs & toast ---------- */
function dialog(cls, html) {
  const d = document.createElement('dialog');
  d.className = cls;
  d.innerHTML = html;
  d.addEventListener('close', () => d.remove());
  d.addEventListener('click', (e) => { if (e.target === d || e.target.classList.contains('viewer-body')) d.close(); });
  document.body.append(d);
  d.showModal();
  return d;
}
const closeDialogs = () => document.querySelectorAll('dialog[open]').forEach((d) => d.close());

function showImage(f) {
  if (!f) return;
  dialog('viewer', `<div class="viewer-bar">
      <span>${esc(f.name)}</span>
      <a class="btn glass small" href="${fileURL(f)}" target="_blank" rel="noopener">${icon('external', 16)} Open</a>
      <button class="icon-btn dark" data-action="close-dialog" aria-label="Close">${icon('x', 20)}</button>
    </div>
    <div class="viewer-body"><img src="${fileURL(f)}" alt="${esc(f.name)}"></div>`);
}

function openSettings() {
  const hasSamples = state.bookings.some((b) => b.sample);
  dialog('sheet', `<div class="sheet-inner">
    <div class="sheet-head"><h2>Settings</h2><button class="icon-btn" data-action="close-dialog" aria-label="Close">${icon('x', 18)}</button></div>
    <button class="menu-item" data-action="reader-settings"><span class="mi-icon">${icon('scan')}</span><span><b>Automatic ticket reading</b><small>${state.reader ? 'On' : 'Not set up yet'}</small></span></button>
    <button class="menu-item" data-action="export"><span class="mi-icon">${icon('download')}</span><span><b>Back up my trips</b><small>Save a file with all your bookings and tickets</small></span></button>
    <button class="menu-item" data-action="pick-files"><span class="mi-icon">${icon('upload')}</span><span><b>Restore from a backup</b><small>Load a backup file you saved earlier</small></span></button>
    <input type="file" accept="application/json,.json" hidden data-change="import">
    <button class="menu-item" data-action="${hasSamples ? 'remove-samples' : 'load-samples'}"><span class="mi-icon">${icon('ticket')}</span><span><b>${hasSamples ? 'Remove sample trips' : 'Show sample trips'}</b><small>${hasSamples ? 'Clear the examples and start fresh' : 'Add example trips to explore the app'}</small></span></button>
    <p class="fine">${icon('lock', 14)} Your trips and tickets are stored privately on this device and are available even without internet.</p>
  </div>`);
}

let toastTimer;
function toast(msg) {
  const t = $('#toast');
  t.innerHTML = `${icon('check', 16)}<span>${esc(msg)}</span>`;
  t.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => t.classList.remove('show'), 2400);
}

/* ---------- Navigation ---------- */
const navStack = [];
let pendingLeave = null; // set while stepping back out of the add-a-booking flow
function parseHash() {
  const [path, qs] = location.hash.replace(/^#\/?/, '').split('?');
  const [route = '', id = '', sub = ''] = path.split('/');
  return { route, id, sub, query: new URLSearchParams(qs) };
}
// Keeps a list of the screens visited, so Back can return to the right place.
// Returns false when it has sent the browser straight on to another screen.
function trackNav() {
  const h = location.hash || '#/';
  if (pendingLeave) {
    const { steps, landing, target } = pendingLeave;
    pendingLeave = null;
    if (h === landing) navStack.splice(navStack.length - steps);
    else navStack.splice(0, navStack.length, h); // history wasn't where we expected; start afresh
    if (h === target) return true;
    if (h === landing) { location.hash = target; return false; }
    history.replaceState(null, '', target);
    navStack[navStack.length - 1] = target;
    return true;
  }
  if (navStack.at(-2) === h) navStack.pop();
  else if (navStack.at(-1) !== h) navStack.push(h);
  return true;
}
function go(hash, { replace = false } = {}) {
  if (!replace) { location.hash = hash; return; }
  history.replaceState(null, '', hash);
  navStack[Math.max(navStack.length - 1, 0)] = hash;
  render();
}
// Leave the current screen for `hash`, stepping back in history if that's where we came from.
// Screens of the add-a-booking flow are skipped over, so Back never returns to a finished form.
function leaveTo(hash) {
  let steps = 1;
  while (navStack.length - 1 - steps > 0 && navStack.at(-1 - steps).startsWith('#/add')) steps++;
  const landing = navStack.at(-1 - steps);
  if (landing === hash || (landing && steps > 1)) {
    pendingLeave = { steps, landing, target: hash };
    history.go(-steps);
  } else go(hash, { replace: true });
}

const ADD_STEPS = { '': viewAddChooser, manual: (_, query) => viewForm(null, query), reading: viewReading, review: viewReview };
const VIEWS = { '': viewHome, timeline: viewTimeline, trip: viewTrip, booking: viewBooking, add: (id, query) => (ADD_STEPS[id] || viewAddChooser)(id, query), edit: viewForm };
const TITLES = { '': 'Via', timeline: 'Timeline · Via', trip: 'Trip · Via', booking: 'Booking · Via', add: 'Add a booking · Via', edit: 'Edit booking · Via' };

function render({ keepScroll = false } = {}) {
  let { route, id, sub, query } = parseHash();
  if (!VIEWS[route]) route = '';
  const y = window.scrollY;
  const app = $('#app');
  app.innerHTML = VIEWS[route](id, query);
  // Fade a screen in when you arrive on it, but not on quiet refreshes of the same screen.
  app.classList.toggle('view-in', !keepScroll);
  document.body.dataset.route = route || 'home';
  document.title = TITLES[route];
  const tab = route === 'timeline' ? 'timeline' : ['', 'trip', 'booking'].includes(route) ? 'home' : '';
  document.querySelectorAll('.tab[data-tab]').forEach((t) => {
    const on = t.dataset.tab === tab;
    t.classList.toggle('active', on);
    if (on) t.setAttribute('aria-current', 'page'); else t.removeAttribute('aria-current');
  });
  if (route === 'edit') setupForm(bookingById(id));
  if (route === 'add' && id === 'manual') setupForm(null);
  if (route === 'add' && id === 'review') setupReview();
  if (keepScroll) window.scrollTo(0, y);
  else if (sub === 'tickets') $('#tickets')?.scrollIntoView();
  else window.scrollTo(0, 0);
}

/* ---------- Buttons ---------- */
const actions = {
  back: (el) => (navStack.length > 1 ? history.back() : go(el.dataset.fallback || '#/', { replace: true })),
  settings: openSettings,
  'close-dialog': (el) => el.closest('dialog').close(),
  'toggle-past': () => { state.showPast = !state.showPast; render({ keepScroll: true }); },
  'pick-files': (el) => el.nextElementSibling.click(),
  'view-image': (el) => showImage(state.files.find((f) => f.id === el.dataset.id)),
  async 'remove-file'(el) {
    const f = state.files.find((x) => x.id === el.dataset.id);
    if (!f || !confirm(`Remove "${f.name}"?`)) return;
    await removeFile(f.id);
    render({ keepScroll: true });
    toast('Document removed');
  },
  async copy(el) { await copyText(el.dataset.text); toast('Copied'); },
  ics: (el) => downloadICS(bookingById(el.dataset.id)),
  async 'delete-booking'(el) {
    const b = bookingById(el.dataset.id);
    if (!b || !confirm(`Delete the ${typeOf(b).label.toLowerCase()} from ${shortPlace(b.from)} to ${shortPlace(b.to)}? Any attached tickets will be removed too.`)) return;
    await deleteBooking(b.id);
    toast('Booking deleted');
    leaveTo(tripById(b.tripId) ? `#/trip/${b.tripId}` : '#/');
  },
  async 'delete-trip'(el) {
    const info = tripById(el.dataset.id) && tripInfo(tripById(el.dataset.id));
    if (!info || !confirm(`Delete "${info.trip.name}" and its ${plural(info.bookings.length, 'booking')}? This can’t be undone.`)) return;
    for (const b of info.bookings) await deleteBooking(b.id);
    toast('Trip deleted');
    leaveTo('#/');
  },
  async 'rename-trip'(el) {
    const trip = tripById(el.dataset.id);
    const name = trip && prompt('Trip name', trip.name)?.trim();
    if (!name) return;
    await put('trips', { ...trip, name });
    render({ keepScroll: true });
  },
  async 'remove-samples'() {
    if (!confirm('Remove all sample trips?')) return;
    await removeSamples();
    closeDialogs();
    toast('Sample trips removed');
    go('#/', { replace: true });
  },
  async 'load-samples'() {
    await loadSamples();
    closeDialogs();
    toast('Sample trips added');
    go('#/', { replace: true });
  },
  async export() { await exportBackup(); toast('Backup saved'); },
  'reader-settings': () => { closeDialogs(); openReaderSettings(); },
  async 'remove-reader'() {
    await Store.remove('meta', 'reader');
    state.reader = null;
    closeDialogs();
    toast('Automatic reading turned off');
    render({ keepScroll: true });
  },
  'retry-read': () => { state.draft.error = null; render(); runReading(); },
  'remove-segment': (el) => {
    state.draft.segments.splice(+el.dataset.id, 1);
    render({ keepScroll: true });
  },
  'confirm-review': confirmReview,
};

document.addEventListener('click', async (e) => {
  const el = e.target.closest('[data-action]');
  if (!el || !actions[el.dataset.action]) return;
  e.preventDefault();
  await actions[el.dataset.action](el);
});

document.addEventListener('change', async (e) => {
  const el = e.target, files = [...(el.files || [])];
  if (!files.length) return;
  if (el.dataset.change === 'add-files') {
    el.value = '';
    const n = await addFiles(el.dataset.id, files);
    render({ keepScroll: true });
    if (n) toast(n === 1 ? 'Ticket added' : `${n} documents added`);
  }
  if (el.dataset.change === 'scan-file') {
    el.value = '';
    state.draft = { ...state.draft, file: files[0], segments: null, error: null };
    if (state.reader) {
      go('#/add/reading');
      runReading();
    } else {
      go('#/add/manual');
    }
  }
  if (el.dataset.change === 'import') {
    el.value = '';
    try {
      const n = await restoreBackup(JSON.parse(await files[0].text()));
      closeDialogs();
      toast(`Restored ${plural(n, 'booking')}`);
      go('#/', { replace: true });
    } catch {
      alert('That file couldn’t be read. Please choose a backup file saved from Via.');
    }
  }
});

window.addEventListener('hashchange', () => { if (trackNav()) render(); });

// Keep countdowns fresh, without disturbing someone who's typing.
function refresh() {
  const { route } = parseHash();
  if (document.hidden || route === 'add' || route === 'edit' || document.querySelector('dialog[open]')) return;
  render({ keepScroll: true });
}
setInterval(refresh, 60_000);
document.addEventListener('visibilitychange', refresh);

/* ---------- Start ---------- */
async function init() {
  $('#tabbar').innerHTML = `
    <a class="tab" data-tab="home" href="#/">${icon('home', 22)}<span>Home</span></a>
    <a class="tab tab-add" href="#/add" aria-label="Add a booking" title="Add a booking"><span class="add-circle">${icon('plus', 26)}</span></a>
    <a class="tab" data-tab="timeline" href="#/timeline">${icon('timeline', 22)}<span>Timeline</span></a>`;

  state.persistent = await Store.init();
  state.reader = (await Store.get('meta', 'reader'))?.value || null;
  [state.bookings, state.trips, state.files] = await Promise.all(['bookings', 'trips', 'files'].map((n) => Store.all(n)));

  if (!(await Store.get('meta', 'seeded'))) {
    const legacy = readLegacy();
    if (legacy.length) await addBookingsGrouped(legacy);
    else await loadSamples();
    await Store.put('meta', { key: 'seeded', value: true });
  }
  trackNav();
  render();
}
init();
