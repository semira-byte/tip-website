/**
 * POST /api/subscribe
 * Provider agnostic newsletter signup for insideperspective.org (Vercel serverless function).
 *
 * The website never talks to an email provider directly. It sends { email } here,
 * this function checks it, filters bots, and hands it to whichever provider is set
 * in the SUBSCRIBE_PROVIDER environment variable. Switching providers next quarter
 * = add an adapter below (or use "webhook") and change one environment variable.
 *
 * Environment variables (Vercel > Project > Settings > Environment Variables):
 *   SUBSCRIBE_PROVIDER   "kit-form" (default), "kit-api", "webhook", or "mock"
 *   KIT_FORM_ID          Kit form id. Default 9649184 (the form already on the site)
 *   KIT_API_KEY          only for "kit-api" (Kit v4 API key)
 *   SUBSCRIBE_WEBHOOK_URL / SUBSCRIBE_WEBHOOK_TOKEN   only for "webhook"
 *   ALLOWED_ORIGINS      optional, comma separated. Defaults to the live domain + Vercel previews
 *
 * Request: JSON { email, company (honeypot), ts (form load time), source }
 *          or a plain HTML form post (works without JavaScript).
 * Response: JSON { ok: boolean, message: string } for fetch requests,
 *           or a 303 redirect back to the page for plain form posts.
 */

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const MIN_FILL_MS = 2000;           // a person can't find the field, type an email and submit in under 2s
const RATE_LIMIT = { max: 5, windowMs: 10 * 60 * 1000 };
const PROVIDER_TIMEOUT_MS = 8000;

const DEFAULT_ORIGINS = [
  'https://www.insideperspective.org',
  'https://insideperspective.org',
];

/* ---------------- Validation ---------------- */

export function normalizeEmail(value) {
  return typeof value === 'string' ? value.trim().toLowerCase() : '';
}

export function isValidEmail(email) {
  return typeof email === 'string' && email.length >= 6 && email.length <= 254 && EMAIL_RE.test(email);
}

/** Returns a reason string if this looks like a bot, otherwise null. */
export function botReason(body, now = Date.now()) {
  if (body.company && String(body.company).trim() !== '') return 'honeypot';
  const ts = Number(body.ts);
  if (ts && now - ts < MIN_FILL_MS) return 'too-fast';
  return null;
}

export function isAllowedOrigin(origin, env = process.env) {
  if (!origin) return true; // same-origin form posts and server tools may omit it
  const list = (env.ALLOWED_ORIGINS || '').split(',').map((s) => s.trim()).filter(Boolean);
  const allowed = list.length ? list : DEFAULT_ORIGINS;
  if (allowed.includes(origin)) return true;
  // Vercel preview deployments, so the form can be tested before going live
  return /^https:\/\/[a-z0-9-]+\.vercel\.app$/i.test(origin);
}

/* ---------------- Rate limiting (best effort, per warm instance) ---------------- */

const hits = new Map();
export function rateLimited(key, now = Date.now()) {
  const recent = (hits.get(key) || []).filter((t) => now - t < RATE_LIMIT.windowMs);
  recent.push(now);
  hits.set(key, recent);
  if (hits.size > 5000) hits.clear(); // keep memory bounded
  return recent.length > RATE_LIMIT.max;
}

/* ---------------- Provider adapters ----------------
   Each adapter: async (email, meta, env) => { ok: boolean, detail?: string }
   Add a new provider by adding a function here. */

async function postWithTimeout(url, init) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), PROVIDER_TIMEOUT_MS);
  try {
    return await fetch(url, { ...init, signal: controller.signal });
  } finally {
    clearTimeout(timer);
  }
}

export const providers = {
  /** Kit's public form endpoint (the same one the old embedded form used). No API key needed. */
  async 'kit-form'(email, meta, env) {
    const formId = env.KIT_FORM_ID || '9649184';
    const res = await postWithTimeout(`https://app.kit.com/forms/${encodeURIComponent(formId)}/subscriptions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded', Accept: 'application/json' },
      body: new URLSearchParams({ email_address: email }).toString(),
    });
    let data = {};
    try { data = await res.json(); } catch { /* non JSON reply */ }
    const ok = res.ok && (data.status === 'success' || data.status === 'quarantined' || data.status === undefined);
    return { ok, detail: `kit-form ${res.status} ${data.status || ''}`.trim() };
  },

  /** Kit v4 API (needs KIT_API_KEY). Creates the subscriber, then adds them to the form. */
  async 'kit-api'(email, meta, env) {
    if (!env.KIT_API_KEY) return { ok: false, detail: 'KIT_API_KEY missing' };
    const formId = env.KIT_FORM_ID || '9649184';
    const headers = { 'Content-Type': 'application/json', Accept: 'application/json', 'X-Kit-Api-Key': env.KIT_API_KEY };
    const created = await postWithTimeout('https://api.kit.com/v4/subscribers', {
      method: 'POST', headers, body: JSON.stringify({ email_address: email }),
    });
    if (!created.ok) return { ok: false, detail: `kit-api create ${created.status}` };
    const added = await postWithTimeout(`https://api.kit.com/v4/forms/${encodeURIComponent(formId)}/subscribers`, {
      method: 'POST', headers, body: JSON.stringify({ email_address: email, referrer: meta.source }),
    });
    return { ok: added.ok, detail: `kit-api form ${added.status}` };
  },

  /** Generic: sends JSON to any URL (Zapier, Make, a Google Apps Script, another ESP). */
  async webhook(email, meta, env) {
    if (!env.SUBSCRIBE_WEBHOOK_URL) return { ok: false, detail: 'SUBSCRIBE_WEBHOOK_URL missing' };
    const headers = { 'Content-Type': 'application/json' };
    if (env.SUBSCRIBE_WEBHOOK_TOKEN) headers.Authorization = `Bearer ${env.SUBSCRIBE_WEBHOOK_TOKEN}`;
    const res = await postWithTimeout(env.SUBSCRIBE_WEBHOOK_URL, {
      method: 'POST', headers, body: JSON.stringify({ email, source: meta.source, subscribedAt: new Date().toISOString() }),
    });
    return { ok: res.ok, detail: `webhook ${res.status}` };
  },

  /** For testing: accepts everything, sends nothing. */
  async mock(email) {
    console.log('[subscribe:mock]', email.replace(/(.).+(@.+)/, '$1***$2'));
    return { ok: true, detail: 'mock' };
  },
};

/* ---------------- Core (no HTTP details, easy to test) ---------------- */

export async function handleSubscribe(body, { ip = 'unknown', env = process.env, now = Date.now() } = {}) {
  const email = normalizeEmail(body.email ?? body.email_address);

  if (!isValidEmail(email)) {
    return { status: 400, ok: false, message: 'That email doesn’t look quite right. Mind checking it?' };
  }

  // Bots get a normal looking success so they don't learn what tripped them
  const bot = botReason(body, now);
  if (bot) return { status: 200, ok: true, message: 'Check your inbox to confirm your spot.', skipped: bot };

  if (rateLimited(ip, now)) {
    return { status: 429, ok: false, message: 'Too many tries in a row. Give it a few minutes and try again.' };
  }

  const name = (env.SUBSCRIBE_PROVIDER || 'kit-form').trim();
  const provider = providers[name];
  if (!provider) {
    console.error('[subscribe] unknown provider', name);
    return { status: 500, ok: false, message: 'Signups are taking a quick break. Try again soon.' };
  }

  try {
    const source = typeof body.source === 'string' ? body.source.slice(0, 200) : '';
    const result = await provider(email, { source }, env);
    if (!result.ok) {
      console.error('[subscribe] provider failed', name, result.detail);
      return { status: 502, ok: false, message: 'Something went wrong on my end. Give it another try in a minute.' };
    }
    return {
      status: 200,
      ok: true,
      message: 'Check your inbox to confirm, then you’ll hear from me when new episodes and resources drop.',
    };
  } catch (err) {
    console.error('[subscribe] provider error', name, err && err.name);
    return { status: 502, ok: false, message: 'Something went wrong on my end. Give it another try in a minute.' };
  }
}

/* ---------------- HTTP handler (Vercel) ---------------- */

function readBody(req) {
  const b = req.body;
  if (b && typeof b === 'object') return b;
  if (typeof b === 'string') {
    try { return JSON.parse(b); } catch { return Object.fromEntries(new URLSearchParams(b)); }
  }
  return {};
}

export default async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store');
  res.setHeader('X-Content-Type-Options', 'nosniff');

  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ ok: false, message: 'Method not allowed' });
  }

  if (!isAllowedOrigin(req.headers.origin)) {
    return res.status(403).json({ ok: false, message: 'Not allowed' });
  }

  const ip = String(req.headers['x-forwarded-for'] || '').split(',')[0].trim() || 'unknown';
  const body = readBody(req);
  const result = await handleSubscribe(body, { ip });

  const wantsJson = String(req.headers.accept || '').includes('application/json');
  if (wantsJson) {
    return res.status(result.status).json({ ok: result.ok, message: result.message });
  }

  // Plain HTML form post (no JavaScript): send them back to where they came from
  let back = '/';
  try {
    const ref = new URL(req.headers.referer || '', 'https://www.insideperspective.org');
    if (isAllowedOrigin(ref.origin)) back = ref.pathname;
  } catch { /* keep "/" */ }
  const flag = result.ok ? 'subscribed=1' : 'subscribe_error=1';
  res.setHeader('Location', `${back}?${flag}#subscribe`);
  return res.status(303).end();
}
