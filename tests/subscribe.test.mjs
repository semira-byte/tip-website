import { test } from 'node:test';
import assert from 'node:assert/strict';
import handler, { handleSubscribe, isValidEmail, isAllowedOrigin, providers } from '../api/subscribe.js';

const env = { SUBSCRIBE_PROVIDER: 'mock' };
const old = Date.now() - 10_000;

function mockRes() {
  const r = { headers: {}, statusCode: 200, body: undefined, ended: false };
  r.setHeader = (k, v) => { r.headers[k.toLowerCase()] = v; };
  r.status = (c) => { r.statusCode = c; return r; };
  r.json = (b) => { r.body = b; r.ended = true; return r; };
  r.end = () => { r.ended = true; return r; };
  return r;
}

test('email validation', () => {
  assert.ok(isValidEmail('insider@example.com'));
  for (const bad of ['', 'nope', 'a@b', 'a b@c.com', '@x.com', 'x@.c', 'a'.repeat(250) + '@x.com']) assert.equal(isValidEmail(bad), false, bad);
});

test('valid email succeeds and is normalized', async () => {
  const r = await handleSubscribe({ email: '  Insider@Example.COM ', ts: old }, { env, ip: '1' });
  assert.equal(r.status, 200); assert.equal(r.ok, true);
});

test('invalid email is a 400', async () => {
  const r = await handleSubscribe({ email: 'not-an-email' }, { env, ip: '2' });
  assert.equal(r.status, 400); assert.equal(r.ok, false);
});

test('honeypot and too-fast submissions are silently dropped', async () => {
  let called = false;
  const spyEnv = { SUBSCRIBE_PROVIDER: 'spy' };
  providers.spy = async () => { called = true; return { ok: true }; };
  const a = await handleSubscribe({ email: 'a@example.com', company: 'Acme', ts: old }, { env: spyEnv, ip: '3' });
  const b = await handleSubscribe({ email: 'b@example.com', ts: Date.now() }, { env: spyEnv, ip: '4' });
  assert.equal(a.ok, true); assert.equal(a.skipped, 'honeypot');
  assert.equal(b.ok, true); assert.equal(b.skipped, 'too-fast');
  assert.equal(called, false);
  delete providers.spy;
});

test('rate limit kicks in after 5 tries from one IP', async () => {
  let last;
  for (let i = 0; i < 6; i++) last = await handleSubscribe({ email: `r${i}@example.com`, ts: old }, { env, ip: 'rl' });
  assert.equal(last.status, 429);
});

test('provider failure and unknown provider return friendly errors', async () => {
  providers.broken = async () => { throw new Error('boom'); };
  const a = await handleSubscribe({ email: 'c@example.com', ts: old }, { env: { SUBSCRIBE_PROVIDER: 'broken' }, ip: '5' });
  assert.equal(a.status, 502);
  const b = await handleSubscribe({ email: 'd@example.com', ts: old }, { env: { SUBSCRIBE_PROVIDER: 'nope' }, ip: '6' });
  assert.equal(b.status, 500);
  delete providers.broken;
});

test('kit-form adapter posts email_address to the Kit form endpoint', async () => {
  const realFetch = globalThis.fetch;
  let seen;
  globalThis.fetch = async (url, init) => { seen = { url, init }; return new Response(JSON.stringify({ status: 'success' }), { status: 200 }); };
  const r = await providers['kit-form']('e@example.com', {}, {});
  globalThis.fetch = realFetch;
  assert.equal(r.ok, true);
  assert.equal(seen.url, 'https://app.kit.com/forms/9649184/subscriptions');
  assert.equal(seen.init.body, 'email_address=e%40example.com');
});

test('origin checks', () => {
  assert.ok(isAllowedOrigin('https://www.insideperspective.org', {}));
  assert.ok(isAllowedOrigin('https://tip-site-git-preview-aaliyah.vercel.app', {}));
  assert.ok(isAllowedOrigin(undefined, {}));
  assert.equal(isAllowedOrigin('https://evil.example', {}), false);
});

test('HTTP handler: GET is 405, bad origin is 403, JSON post works, HTML post redirects', async () => {
  process.env.SUBSCRIBE_PROVIDER = 'mock';
  let res = mockRes(); await handler({ method: 'GET', headers: {} }, res); assert.equal(res.statusCode, 405);
  res = mockRes(); await handler({ method: 'POST', headers: { origin: 'https://evil.example' }, body: {} }, res); assert.equal(res.statusCode, 403);
  res = mockRes();
  await handler({ method: 'POST', headers: { accept: 'application/json', 'x-forwarded-for': '9.9.9.9' }, body: JSON.stringify({ email: 'f@example.com', ts: old }) }, res);
  assert.equal(res.statusCode, 200); assert.equal(res.body.ok, true);
  res = mockRes();
  await handler({ method: 'POST', headers: { accept: 'text/html', referer: 'https://www.insideperspective.org/about', 'x-forwarded-for': '8.8.8.8' }, body: 'email=g%40example.com&company=&ts=' }, res);
  assert.equal(res.statusCode, 303); assert.equal(res.headers.location, '/about?subscribed=1#subscribe');
  res = mockRes();
  await handler({ method: 'POST', headers: { accept: 'text/html', referer: 'https://evil.example/x', 'x-forwarded-for': '7.7.7.7' }, body: 'email=bad' }, res);
  assert.equal(res.headers.location, '/?subscribe_error=1#subscribe');
});
