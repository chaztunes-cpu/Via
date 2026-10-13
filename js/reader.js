'use strict';
/* Adding a booking from an uploaded ticket.

   The ticket is read by the user's own private "ticket reader" (a small backend
   they set up, which holds the AI key). Via never contains a key and never
   guesses details: anything the reader doesn't return stays blank for the user
   to fill in, and nothing is saved until the user confirms.

   Ticket reader contract
   Request:  POST <reader address>
             Authorization: Bearer <passcode>
             { "file": { "name": "...", "type": "application/pdf" | "image/jpeg", "data": "<base64>" } }
   Response: { "segments": [ { "type": "flight|train|bus|ferry|other", "from", "to",
               "departDate": "YYYY-MM-DD", "departTime": "HH:MM", "arriveDate", "arriveTime",
               "provider", "number", "confirmation", "passenger", "seat", "gate",
               "uncertain": ["fieldName", ...] } ] }
   Any field may be missing or empty when it isn't on the ticket. */

const SEGMENT_KEYS = ['type', 'from', 'to', 'departDate', 'departTime', 'arriveDate', 'arriveTime', 'provider', 'number', 'confirmation', 'passenger', 'seat', 'gate'];
const REQUIRED_KEYS = ['type', 'from', 'to', 'departDate'];
const MAX_PDF_BYTES = 20 * 1024 * 1024;

class ReadError extends Error {}

/* ---------- Talking to the ticket reader ---------- */
async function shrinkImage(file, maxSide = 2000) {
  let bitmap;
  try {
    bitmap = await createImageBitmap(file);
  } catch {
    throw new ReadError('This photo format can’t be opened on this device. Take a screenshot of the ticket and upload that instead.');
  }
  const scale = Math.min(1, maxSide / Math.max(bitmap.width, bitmap.height));
  const canvas = document.createElement('canvas');
  canvas.width = Math.round(bitmap.width * scale);
  canvas.height = Math.round(bitmap.height * scale);
  const ctx = canvas.getContext('2d');
  ctx.fillStyle = '#fff'; // transparent screenshots read better on white
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  return new Promise((resolve) => canvas.toBlob(resolve, 'image/jpeg', 0.85));
}

async function ticketPayload(file) {
  if (file.type === 'application/pdf') {
    if (file.size > MAX_PDF_BYTES) throw new ReadError('This PDF is too large to read (the limit is 20 MB).');
    return { name: file.name, type: file.type, data: (await blobToDataURL(file)).split(',')[1] };
  }
  if (isImage(file) || /\.(heic|heif)$/i.test(file.name)) {
    const jpeg = await shrinkImage(file);
    return { name: file.name, type: 'image/jpeg', data: (await blobToDataURL(jpeg)).split(',')[1] };
  }
  throw new ReadError('Via can read PDFs, screenshots and photos. Please choose one of those.');
}

// Keep only fields Via understands, in the formats it expects. Anything malformed becomes blank.
function cleanSegments(data) {
  const list = Array.isArray(data?.segments) ? data.segments.slice(0, 12) : [];
  return list.map((raw) => {
    const seg = { uncertain: [], problems: {} };
    for (const key of SEGMENT_KEYS) seg[key] = typeof raw?.[key] === 'string' ? raw[key].trim() : '';
    if (!TYPES[seg.type]) seg.type = '';
    for (const key of ['departDate', 'arriveDate']) if (!/^\d{4}-\d{2}-\d{2}$/.test(seg[key])) seg[key] = '';
    for (const key of ['departTime', 'arriveTime']) if (!/^\d{2}:\d{2}$/.test(seg[key])) seg[key] = '';
    const uncertain = Array.isArray(raw?.uncertain) ? raw.uncertain : [];
    seg.uncertain = uncertain.filter((key) => SEGMENT_KEYS.includes(key) && seg[key]);
    return seg;
  }).filter((seg) => SEGMENT_KEYS.some((key) => seg[key]));
}

async function readTicket(file) {
  const { url, passcode } = state.reader;
  const body = JSON.stringify({ file: await ticketPayload(file) });
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 90_000);
  let res;
  try {
    res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${passcode}` },
      body,
      signal: controller.signal,
    });
  } catch {
    throw new ReadError('Via couldn’t reach your ticket reader. Check your internet connection and try again.');
  } finally {
    clearTimeout(timer);
  }
  if (res.status === 401) throw new ReadError('Your ticket reader didn’t accept the passcode. Check it in Settings → Automatic ticket reading.');
  const data = await res.json().catch(() => null);
  if (!res.ok) throw new ReadError(typeof data?.error === 'string' ? data.error : 'Your ticket couldn’t be read. Try again, or enter the details yourself.');
  const segments = cleanSegments(data);
  if (!segments.length) throw new ReadError('Via couldn’t find a journey in this document. Make sure it’s a ticket or booking confirmation.');
  return segments;
}

async function runReading() {
  const draft = state.draft;
  if (!draft?.file) return;
  draft.error = null;
  try {
    const segments = await readTicket(draft.file);
    if (state.draft !== draft) return; // the user left the flow while we were reading
    draft.segments = segments;
    draft.trip = draft.tripId || null;
    draft.tripTouched = !!draft.tripId;
    if (location.hash === '#/add/reading') go('#/add/review', { replace: true });
  } catch (err) {
    if (state.draft !== draft) return;
    draft.error = err instanceof ReadError ? err.message : 'Something went wrong while reading your ticket. Try again, or enter the details yourself.';
    if (location.hash === '#/add/reading') render();
  }
}

/* ---------- Screens ---------- */
function viewAddChooser(_, query) {
  const trip = tripById(query.get('trip'));
  state.draft = { tripId: trip?.id || '' };
  const scanHint = state.reader
    ? 'Take a photo, or choose a PDF or screenshot. Via fills in the details for you to check.'
    : 'Take a photo, or choose a PDF or screenshot. Automatic reading isn’t set up yet, so you’ll type the details and the ticket is attached.';
  return `${navbar(trip ? `#/trip/${trip.id}` : '#/', '', 'Cancel')}
    <h1 class="page-title">Add a booking</h1>
    <p class="page-sub">${trip ? `Adding to your ${esc(trip.name)} trip.` : 'A flight, train, bus or ferry.'}</p>
    <div class="add-options">
      <button class="add-option primary" data-action="pick-files">
        <span class="ao-icon">${icon('scan', 26)}</span>
        <span class="ao-text"><b>Scan or upload ticket</b><small>${scanHint}</small></span>
        ${icon('chevron-right', 20)}
      </button>
      <input type="file" accept="image/*,application/pdf" hidden data-change="scan-file">
      <a class="add-option" href="#/add/manual">
        <span class="ao-icon">${icon('pencil', 22)}</span>
        <span class="ao-text"><b>Enter manually</b><small>Type in the details yourself.</small></span>
        ${icon('chevron-right', 20)}
      </a>
    </div>
    <p class="fine">${icon('lock', 14)} Tickets are saved only on this device.${state.reader ? ' To read one, Via sends it to your private ticket reader, which doesn’t keep a copy.' : ''}</p>`;
}

function viewNoDraft() {
  return `${navbar('#/')}<div class="empty"><h2>Nothing to review</h2><p>Start by adding a booking.</p><a class="btn primary" href="#/add">Add a booking</a></div>`;
}

function viewReading() {
  const draft = state.draft;
  if (!draft?.file) return viewNoDraft();
  if (draft.error) {
    return `${navbar('#/add', '', 'Cancel')}
      <div class="reading">
        <div class="reading-icon warn">${icon('alert', 28)}</div>
        <h1 class="page-title">Couldn’t read this ticket</h1>
        <p class="page-sub">${esc(draft.error)}</p>
        <div class="stack">
          <button class="btn primary block" data-action="retry-read">Try again</button>
          <a class="btn secondary block" href="#/add/manual">Enter the details myself</a>
        </div>
        <p class="fine">If you enter the details yourself, the ticket is still attached to the booking.</p>
      </div>`;
  }
  return `${navbar('#/add', '', 'Cancel')}
    <div class="reading" role="status">
      <div class="spinner" aria-hidden="true"></div>
      <h1 class="page-title">Reading your ticket</h1>
      <p class="page-sub">${esc(draft.file.name)}</p>
      <p class="fine">This usually takes a few seconds.</p>
    </div>`;
}

function fieldState(seg, key) {
  if (seg.problems[key]) return { need: true, flag: seg.problems[key] };
  if (REQUIRED_KEYS.includes(key) && !seg[key]) return { need: true, flag: 'Needed' };
  if (seg.uncertain.includes(key)) return { check: true, flag: 'Please check' };
  return {};
}
const flagHTML = (st) => (st.flag ? `<span class="flag ${st.need ? 'need' : 'check'}">${esc(st.flag)}</span>` : '');

function reviewField(i, seg, key, label, type = 'text') {
  const st = fieldState(seg, key);
  const placeholder = st.need ? 'Not on the ticket. Please add it' : 'Not on the ticket';
  return `<div class="field ${st.need ? 'is-need' : st.check ? 'is-check' : ''}">
    <div class="label-row"><label for="r${i}-${key}">${label}</label>${flagHTML(st)}</div>
    <input id="r${i}-${key}" type="${type}" data-seg="${i}" data-key="${key}" value="${esc(seg[key])}" placeholder="${placeholder}" autocomplete="off">
  </div>`;
}

function segmentCard(seg, i, total) {
  const t = TYPES[seg.type || 'other'], typeState = fieldState(seg, 'type');
  const chips = Object.entries(TYPES).map(([k, info]) => `<label class="type-opt" style="${typeVars(k)}">
      <input type="radio" name="r${i}-type" value="${k}" data-seg="${i}" data-key="type" ${seg.type === k ? 'checked' : ''}>
      <span class="type-tile">${icon(info.icon, 18)}<span>${info.label}</span></span></label>`).join('');
  return `<section class="card-group seg">
    <div class="seg-head">
      <b>${total > 1 ? `Journey ${i + 1} of ${total}` : 'Journey'}</b>
      ${total > 1 ? `<button type="button" class="link-btn danger" data-action="remove-segment" data-id="${i}">Don’t add this one</button>` : ''}
    </div>
    <div class="field ${typeState.need ? 'is-need' : typeState.check ? 'is-check' : ''}">
      <div class="label-row"><span class="label">Type</span>${flagHTML(typeState)}</div>
      <div class="type-picker compact" role="radiogroup" aria-label="Type of transport">${chips}</div>
    </div>
    ${reviewField(i, seg, 'from', 'From')}
    ${reviewField(i, seg, 'to', 'To')}
    <div class="row">${reviewField(i, seg, 'departDate', 'Departure date', 'date')}${reviewField(i, seg, 'departTime', 'Departure time', 'time')}</div>
    <div class="row">${reviewField(i, seg, 'arriveDate', 'Arrival date', 'date')}${reviewField(i, seg, 'arriveTime', 'Arrival time', 'time')}</div>
    <div class="row">${reviewField(i, seg, 'provider', t.provider)}${reviewField(i, seg, 'number', t.number)}</div>
    ${reviewField(i, seg, 'confirmation', 'Confirmation number')}
    ${reviewField(i, seg, 'passenger', 'Passenger')}
    <div class="row">${reviewField(i, seg, 'seat', 'Seat / class')}${reviewField(i, seg, 'gate', 'Terminal / gate / platform')}</div>
  </section>`;
}

function attentionCount() {
  return state.draft.segments.reduce((n, seg) => n + SEGMENT_KEYS.filter((k) => fieldState(seg, k).flag).length, 0);
}
const attentionText = (n) => (n ? `${plural(n, 'detail')} ${n === 1 ? 'needs' : 'need'} your attention` : 'Everything was found. Give it a quick check.');

function viewReview() {
  const draft = state.draft;
  if (!draft?.segments) return viewNoDraft();
  const segs = draft.segments, n = segs.length;
  if (!n) return `${navbar('#/add', '', 'Cancel')}<div class="empty"><h2>No journeys left</h2><p>You removed every journey from this ticket.</p><a class="btn primary" href="#/add">Start again</a></div>`;
  const attention = attentionCount();
  const options = allTrips().filter((t) => t.upcoming || t.trip.id === draft.trip);
  return `${navbar('#/add', '', 'Cancel')}
    <div id="review" class="review">
      <div class="review-head">
        <span class="eyebrow">${icon('check', 14)} Ticket read</span>
        <h1 class="page-title">Review your ${n > 1 ? `${n} bookings` : 'booking'}</h1>
        <p class="page-sub">Check what Via found, fill in anything missing, then confirm. Nothing is saved until you do.</p>
        <div class="attn ${attention ? '' : 'ok'}" id="attn">${icon(attention ? 'alert' : 'check', 16)}<span>${attentionText(attention)}</span></div>
      </div>
      ${segs.map((seg, i) => segmentCard(seg, i, n)).join('')}
      <section class="card-group">
        <div class="field">
          <label for="r-trip">Trip</label>
          <select id="r-trip">
            <option value="new">New trip</option>
            ${options.map((o) => `<option value="${o.trip.id}">${esc(o.trip.name)} · ${fmtRange(o.start, o.end)}</option>`).join('')}
          </select>
          <p class="hint" id="r-trip-hint"></p>
        </div>
        <div class="field" id="r-new-trip">
          <label for="r-tripName">Trip name <span class="opt">(optional)</span></label>
          <input id="r-tripName" value="${esc(draft.tripName || '')}">
        </div>
        <div class="attached">${icon('paperclip', 16)}<span><b>${esc(draft.file.name)}</b><small>Attached to ${n > 1 ? 'each booking' : 'the booking'} so you can open it later</small></span></div>
      </section>
      <div class="form-footer">
        <p class="err" id="review-err"></p>
        <button class="btn primary block" data-action="confirm-review">${icon('check', 18)} Confirm and save${n > 1 ? ` ${n} bookings` : ''}</button>
      </div>
    </div>`;
}

function setupReview() {
  const root = $('#review'), draft = state.draft;
  if (!root) return;
  const tripSelect = $('#r-trip');

  const syncTrip = () => {
    const first = draft.segments[0];
    let matched = false;
    if (!draft.tripTouched) {
      const id = suggestTrip(first.from, toDate(first.departDate, first.departTime));
      matched = !!id && [...tripSelect.options].some((o) => o.value === id);
      draft.trip = matched ? id : 'new';
    }
    tripSelect.value = draft.trip || 'new';
    const isNew = tripSelect.value === 'new';
    $('#r-new-trip').hidden = !isNew;
    $('#r-tripName').placeholder = shortPlace(first.to) || 'e.g. Summer in Italy';
    $('#r-trip-hint').textContent = isNew ? 'A new trip will be created.' : matched ? 'Added to this trip automatically. You can change it.' : '';
  };
  const refreshAttention = () => {
    const n = attentionCount(), box = $('#attn');
    box.classList.toggle('ok', !n);
    box.innerHTML = `${icon(n ? 'alert' : 'check', 16)}<span>${attentionText(n)}</span>`;
  };

  root.addEventListener('input', (e) => {
    const { seg: i, key } = e.target.dataset;
    if (e.target.id === 'r-tripName') draft.tripName = e.target.value;
    if (i === undefined || !key || key === 'type') return;
    const seg = draft.segments[+i];
    seg[key] = e.target.value.trim();
    seg.uncertain = seg.uncertain.filter((k) => k !== key); // the user has looked at it
    delete seg.problems[key];
    const field = e.target.closest('.field'), st = fieldState(seg, key);
    field.classList.toggle('is-need', !!st.need);
    field.classList.toggle('is-check', !!st.check);
    field.querySelector('.flag')?.remove();
    field.querySelector('.label-row').insertAdjacentHTML('beforeend', flagHTML(st));
    $('#review-err').textContent = '';
    refreshAttention();
    if (+i === 0 && ['from', 'to', 'departDate', 'departTime'].includes(key)) syncTrip();
  });
  root.addEventListener('change', (e) => {
    const { seg: i, key } = e.target.dataset;
    if (key === 'type') {
      const seg = draft.segments[+i];
      seg.type = e.target.value;
      seg.uncertain = seg.uncertain.filter((k) => k !== 'type');
      render({ keepScroll: true }); // labels such as "Airline" depend on the type
    }
    if (e.target === tripSelect) {
      draft.tripTouched = true;
      draft.trip = tripSelect.value;
      syncTrip();
    }
  });
  syncTrip();
}

async function confirmReview() {
  const draft = state.draft;
  let ok = true;
  for (const seg of draft.segments) {
    seg.problems = {};
    if (seg.arriveTime && !seg.arriveDate && seg.departDate) seg.arriveDate = seg.departDate;
    if (seg.departDate && seg.arriveDate && toDate(seg.arriveDate, seg.arriveTime || '23:59') < dep(seg)) seg.problems.arriveDate = 'Before departure';
    if (REQUIRED_KEYS.some((k) => !seg[k]) || Object.keys(seg.problems).length) ok = false;
  }
  if (!ok) {
    render({ keepScroll: true });
    $('#review-err').textContent = 'Fill in the highlighted details to save.';
    document.querySelector('#review .is-need')?.scrollIntoView({ block: 'center', behavior: 'smooth' });
    return;
  }

  let tripId = draft.trip || 'new';
  if (tripId === 'new') {
    tripId = uid();
    await put('trips', { id: tripId, name: (draft.tripName || '').trim() || shortPlace(draft.segments[0].to) });
  }
  for (const seg of draft.segments) {
    const booking = { id: uid(), tripId, createdAt: Date.now(), source: 'ticket', notes: '' };
    for (const key of SEGMENT_KEYS) booking[key] = seg[key];
    await put('bookings', booking);
    await addFiles(booking.id, [draft.file]);
  }
  const n = draft.segments.length;
  state.draft = null;
  toast(n > 1 ? `${n} bookings saved` : 'Booking saved');
  leaveTo(`#/trip/${tripId}`);
}

/* ---------- Settings ---------- */
// Returns a plain-language problem, or '' when the ticket reader is ready.
async function checkReader(url, passcode) {
  let res;
  try {
    res = await fetch(url, { headers: { Authorization: `Bearer ${passcode}` } });
  } catch {
    return 'Via couldn’t reach that address. Check it’s copied exactly, and that you’re online.';
  }
  const data = await res.json().catch(() => null);
  if (res.status === 401) return 'The passcode doesn’t match the one saved in Cloudflare.';
  if (!res.ok) return data?.error || 'That address didn’t respond like a Via ticket reader.';
  if (data?.service !== 'via-reader') return 'That address isn’t a Via ticket reader. Check you copied the Worker’s address.';
  if (!data.ready) return `The ticket reader isn’t finished setting up. In Cloudflare, add: ${(data.missing || []).join(' and ')}.`;
  return '';
}

function openReaderSettings() {
  const reader = state.reader || {};
  const d = dialog('sheet', `<form class="sheet-inner" id="reader-form" novalidate>
    <div class="sheet-head"><h2>Automatic ticket reading</h2><button type="button" class="icon-btn" data-action="close-dialog" aria-label="Close">${icon('x', 18)}</button></div>
    <p class="hint">Via can fill in bookings from your tickets using your own private ticket reader. You’ll get its address and passcode when you set it up.</p>
    <div class="field"><label for="reader-url">Ticket reader address</label><input id="reader-url" type="url" inputmode="url" autocomplete="off" spellcheck="false" placeholder="https://via-reader.example.workers.dev" value="${esc(reader.url || '')}"></div>
    <div class="field"><label for="reader-pass">Passcode</label><input id="reader-pass" type="password" autocomplete="off" value="${esc(reader.passcode || '')}"></div>
    <p class="err" id="reader-err"></p>
    <div class="stack">
      <button class="btn primary block" type="submit">Save</button>
      ${reader.url ? '<button type="button" class="btn danger-text block" data-action="remove-reader">Turn off automatic reading</button>' : ''}
    </div>
    <p class="fine">${icon('lock', 14)} The passcode is stored only on this device.</p>
  </form>`);
  d.querySelector('form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const url = d.querySelector('#reader-url').value.trim(), passcode = d.querySelector('#reader-pass').value.trim();
    const err = d.querySelector('#reader-err');
    if (!/^https:\/\/\S+$/i.test(url) && !/^http:\/\/(localhost|127\.0\.0\.1)(:\d+)?(\/\S*)?$/i.test(url)) { err.textContent = 'Enter the full address, starting with https://'; return; }
    if (!passcode) { err.textContent = 'Enter the passcode.'; return; }
    const button = d.querySelector('button[type=submit]');
    button.disabled = true;
    button.textContent = 'Checking connection…';
    const problem = await checkReader(url, passcode);
    button.disabled = false;
    button.textContent = 'Save';
    if (problem) { err.textContent = problem; return; }
    state.reader = { url, passcode };
    await Store.put('meta', { key: 'reader', value: state.reader });
    d.close();
    toast('Connected. Automatic reading is on');
    render({ keepScroll: true });
  });
}
