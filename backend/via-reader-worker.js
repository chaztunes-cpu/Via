/* Via ticket reader: a Cloudflare Worker.

   Via sends it an uploaded ticket (PDF or image). It asks Claude to read the
   booking details and returns them to Via. It keeps nothing: no tickets, no
   results, no logs of what it reads.

   Settings (add in Cloudflare under the Worker's Settings → Variables and Secrets):
     ANTHROPIC_API_KEY  (Secret)  your Anthropic API key
     VIA_PASSCODE       (Secret)  a long passcode you make up; enter the same one in Via
     ALLOWED_ORIGIN     (Text, optional)  the website allowed to use this reader.
                        Defaults to https://chaztunes-cpu.github.io

   This file talks to the Anthropic API over plain HTTPS, because Cloudflare's
   in-browser editor can't install the Anthropic SDK package. */

const MODEL = 'claude-haiku-5-5';
const DEFAULT_ORIGIN = 'https://chaztunes-cpu.github.io';
const MAX_FILE_BYTES = 20 * 1024 * 1024;
const FILE_TYPES = ['application/pdf', 'image/jpeg', 'image/png', 'image/webp', 'image/gif'];

const FIELDS = ['type', 'from', 'to', 'departDate', 'departTime', 'arriveDate', 'arriveTime',
  'provider', 'number', 'confirmation', 'passenger', 'seat', 'gate'];

const SEGMENT_SCHEMA = {
  type: 'object',
  additionalProperties: false,
  required: [...FIELDS, 'uncertain'],
  properties: {
    type: { type: 'string', enum: ['flight', 'train', 'bus', 'ferry', 'other', ''] },
    from: { type: 'string' },
    to: { type: 'string' },
    departDate: { type: 'string' },
    departTime: { type: 'string' },
    arriveDate: { type: 'string' },
    arriveTime: { type: 'string' },
    provider: { type: 'string' },
    number: { type: 'string' },
    confirmation: { type: 'string' },
    passenger: { type: 'string' },
    seat: { type: 'string' },
    gate: { type: 'string' },
    uncertain: { type: 'array', items: { type: 'string', enum: FIELDS } },
  },
};
const RESULT_SCHEMA = {
  type: 'object',
  additionalProperties: false,
  required: ['segments'],
  properties: { segments: { type: 'array', items: SEGMENT_SCHEMA } },
};

const INSTRUCTIONS = `You read travel tickets and booking confirmations for Via, a travel organizer app. Extract each journey in the document so the traveler can review it before saving.

Accuracy matters more than completeness. The traveler relies on these details to catch a flight or train, so a wrong detail is far worse than a blank one:
- Only report what is printed in the document. Never guess, assume, or fill in from general knowledge. For example, don't supply a city name for an airport code, a terminal, or an arrival time that isn't shown.
- If a detail isn't in the document, return an empty string for it.
- If a detail is printed but hard to read, partly cut off, or ambiguous (for example 03/04/2026 could be March 4 or April 3), give your best reading and list the field name in "uncertain".

One segment per journey leg: a round trip has two segments, and a connection (e.g. Boston to Lisbon via Newark) is two segments. If several passengers share a journey, return it once and put all their names in "passenger", separated by commas. Ignore hotels, car hire, insurance, adverts and anything that isn't a transport journey. If the document contains no transport journey, return an empty "segments" list.

Field formats:
- type: flight, train, bus, ferry, or other (e.g. a shuttle or cable car). Empty if unclear.
- from / to: the place as printed. When both a name and a code are printed, use "Name (CODE)", e.g. "Lisbon (LIS)" or "Porto (Campanhã)". If only a code is printed, give just the code.
- departDate / arriveDate: YYYY-MM-DD. If the year isn't printed next to the date, use a year printed elsewhere in the document (such as the booking or issue date) only when it clearly applies, and list the field in "uncertain"; if no year appears anywhere, leave the date empty.
- departTime / arriveTime: 24-hour HH:MM, the local time exactly as printed. Don't convert time zones.
- provider: the airline, rail, bus or ferry company operating the journey.
- number: flight, train, route or sailing number, e.g. "TP 218".
- confirmation: the booking reference, confirmation number or PNR.
- seat: seat and/or class as printed, e.g. "23A · Economy".
- gate: terminal, gate or platform, as printed.`;

const json = (body, status, headers) => new Response(JSON.stringify(body), {
  status, headers: { 'Content-Type': 'application/json', ...headers },
});

async function sameSecret(a, b) {
  const enc = new TextEncoder();
  const [x, y] = await Promise.all([a, b].map((s) => crypto.subtle.digest('SHA-256', enc.encode(s))));
  return crypto.subtle.timingSafeEqual(x, y);
}

async function readTicket(file, apiKey) {
  const source = { type: 'base64', media_type: file.type, data: file.data };
  const content = [
    file.type === 'application/pdf' ? { type: 'document', source } : { type: 'image', source },
    { type: 'text', text: 'Extract the journeys from this ticket.' },
  ];
  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-api-key': apiKey, 'anthropic-version': '2023-06-01' },
    body: JSON.stringify({
      model: MODEL,
      max_tokens: 16000,
      system: INSTRUCTIONS,
      output_config: { effort: 'medium', format: { type: 'json_schema', schema: RESULT_SCHEMA } },
      messages: [{ role: 'user', content }],
    }),
  });

  if (!res.ok) {
    if (res.status === 401 || res.status === 403) throw new ReaderError(502, 'The ticket reader’s Anthropic API key isn’t working. Check ANTHROPIC_API_KEY in Cloudflare.');
    if (res.status === 429 || res.status === 529) throw new ReaderError(503, 'The ticket reader is busy. Try again in a minute.');
    if (res.status === 400) {
      const detail = (await res.json().catch(() => null))?.error?.message || '';
      if (/credit|billing|balance/i.test(detail)) throw new ReaderError(502, 'Your Anthropic account is out of credit. Add credit at console.anthropic.com.');
      throw new ReaderError(422, 'This file couldn’t be opened. Try a clearer photo or a screenshot.');
    }
    throw new ReaderError(502, 'The ticket couldn’t be read right now. Try again shortly.');
  }

  const message = await res.json();
  if (message.stop_reason === 'refusal') throw new ReaderError(422, 'This document couldn’t be read. Please enter the details yourself.');
  if (message.stop_reason === 'max_tokens') throw new ReaderError(422, 'This document is too long to read in one go. Try uploading just the page with the journey.');
  const text = message.content.filter((block) => block.type === 'text').map((block) => block.text).join('');
  let result;
  try { result = JSON.parse(text); } catch { throw new ReaderError(502, 'The ticket couldn’t be read right now. Try again shortly.'); }
  return { segments: Array.isArray(result.segments) ? result.segments : [] };
}

class ReaderError extends Error {
  constructor(status, message) { super(message); this.status = status; }
}

export default {
  async fetch(request, env) {
    const origin = env.ALLOWED_ORIGIN || DEFAULT_ORIGIN;
    const requestOrigin = request.headers.get('Origin');
    const cors = {
      'Access-Control-Allow-Origin': origin,
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      'Access-Control-Max-Age': '86400',
      Vary: 'Origin',
    };
    if (request.method === 'OPTIONS') return new Response(null, { status: 204, headers: cors });
    if (requestOrigin && requestOrigin !== origin) return json({ error: 'This website isn’t allowed to use this ticket reader.' }, 403, cors);

    const missing = ['ANTHROPIC_API_KEY', 'VIA_PASSCODE'].filter((name) => !env[name]);
    const auth = request.headers.get('Authorization') || '';
    const passcode = auth.startsWith('Bearer ') ? auth.slice(7) : '';

    // Opening the address in a browser (or Via's connection test) shows whether setup is complete.
    if (request.method === 'GET') {
      if (passcode && env.VIA_PASSCODE && !(await sameSecret(passcode, env.VIA_PASSCODE))) {
        return json({ error: 'The passcode doesn’t match.' }, 401, cors);
      }
      return json({ service: 'via-reader', ready: !missing.length, missing }, 200, cors);
    }
    if (request.method !== 'POST') return json({ error: 'Not supported.' }, 405, cors);

    if (missing.length) return json({ error: `The ticket reader isn’t finished setting up (missing ${missing.join(' and ')} in Cloudflare).` }, 500, cors);
    if (!passcode || !(await sameSecret(passcode, env.VIA_PASSCODE))) return json({ error: 'The passcode doesn’t match.' }, 401, cors);

    const body = await request.json().catch(() => null);
    const file = body?.file;
    if (!file || typeof file.data !== 'string' || !FILE_TYPES.includes(file.type)) {
      return json({ error: 'Please upload a PDF or an image.' }, 400, cors);
    }
    if (file.data.length * 0.75 > MAX_FILE_BYTES) return json({ error: 'This file is too large to read (the limit is 20 MB).' }, 413, cors);

    try {
      return json(await readTicket(file, env.ANTHROPIC_API_KEY), 200, cors);
    } catch (err) {
      if (err instanceof ReaderError) return json({ error: err.message }, err.status, cors);
      return json({ error: 'The ticket couldn’t be read right now. Try again shortly.' }, 502, cors);
    }
  },
};
