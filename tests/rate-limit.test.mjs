import test from 'node:test';
import assert from 'node:assert/strict';
import ts from 'typescript';
import fs from 'node:fs';
import crypto from 'node:crypto';
import net from 'node:net';

function load(path, dependencies = {}) {
  const source = ts.transpileModule(fs.readFileSync(path, 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText;
  const exports = {};
  new Function('exports', 'require', source)(exports, name => {
    if (!(name in dependencies)) throw new Error(`Unexpected import: ${name}`);
    return dependencies[name];
  });
  return exports;
}
const validators = load('src/lib/security/validators.ts');
const request = load('src/lib/security/request.ts', { './validators': validators });
const { enforceRateLimit, clientIdentity } = load('src/lib/security/rate-limit.ts', { './request': request, 'node:crypto': crypto, 'node:net': net });

const req = new Request('https://gth-pro.vercel.app/api/chat', { headers: { 'x-vercel-forwarded-for': '203.0.113.7' } });

// No real provider calls or credentials. Preserve environment/fetch on failure.
async function configured(fn) {
  const names = ['UPSTASH_REDIS_REST_URL', 'UPSTASH_REDIS_REST_TOKEN', 'VERCEL', 'VERCEL_ENV', 'GTH_RATE_LIMIT_NAMESPACE'];
  const prior = Object.fromEntries(names.map(name => [name, process.env[name]]));
  const originalFetch = globalThis.fetch;
  Object.assign(process.env, { UPSTASH_REDIS_REST_URL: 'https://test.upstash.io', UPSTASH_REDIS_REST_TOKEN: 'test-only-token', VERCEL: '1', VERCEL_ENV: 'preview', GTH_RATE_LIMIT_NAMESPACE: 'test' });
  try { await fn(); } finally {
    globalThis.fetch = originalFetch;
    for (const name of names) { if (prior[name] === undefined) delete process.env[name]; else process.env[name] = prior[name]; }
  }
}

test('missing configuration and store failures fail closed', async () => configured(async () => {
  delete process.env.UPSTASH_REDIS_REST_TOKEN;
  let calls = 0;
  globalThis.fetch = async () => { calls++; return Response.json({ result: [1, 0] }); };
  await assert.rejects(enforceRateLimit(req, 'ai'), { status: 503 });
  assert.equal(calls, 0);
  process.env.UPSTASH_REDIS_REST_TOKEN = 'test-only-token';
  globalThis.fetch = async () => { throw new Error('private backend details'); };
  await assert.rejects(enforceRateLimit(req, 'ai'), { status: 503, message: 'Request protection unavailable' });
}));

test('allowed requests use one atomic EVAL with identity and global counters', async () => configured(async () => {
  globalThis.fetch = async (url, options) => {
    assert.equal(String(url), 'https://test.upstash.io/');
    assert.equal(options.cache, 'no-store');
    assert.equal(options.redirect, 'error');
    const command = JSON.parse(options.body);
    assert.equal(command[0], 'EVAL');
    assert.equal(command[2], 4);
    const keys = command.slice(3, 7);
    assert.match(keys[0], /^\{test:preview:rl:v1:ai\}:[a-f0-9]{64}:minute$/);
    assert.equal(keys[2], '{test:preview:rl:v1:ai}:global:minute');
    assert.ok(!options.body.includes('203.0.113.7'));
    assert.equal(command[7], 20);
    return Response.json({ result: [1, 0] });
  };
  await enforceRateLimit(req, 'ai');
}));

test('denials carry retry information and cannot be cached', async () => configured(async () => {
  globalThis.fetch = async () => Response.json({ result: [0, 45] });
  let error;
  try { await enforceRateLimit(req, 'ai'); } catch (e) { error = e; }
  assert.equal(error.status, 429);
  const response = request.requestError(error);
  assert.equal(response.status, 429);
  assert.equal(response.headers.get('Retry-After'), '45');
  assert.equal(response.headers.get('Cache-Control'), 'no-store');
}));

test('malformed store responses never permit a provider call', async () => configured(async () => {
  for (const result of [null, [], [1], [1, 1], [0, 0], ['1', 0], [0, -1], [0, 90000]]) {
    globalThis.fetch = async () => Response.json({ result });
    await assert.rejects(enforceRateLimit(req, 'ai'), { status: 503 });
  }
  globalThis.fetch = async () => Response.json({ error: 'WRONGPASS private data', result: [1, 0] });
  await assert.rejects(enforceRateLimit(req, 'ai'), { status: 503 });
}));

test('identity rejects spoofed forwarding chains and ignores headers outside Vercel', async () => configured(async () => {
  assert.equal(clientIdentity(req), '203.0.113.7');
  assert.equal(clientIdentity(new Request(req.url, { headers: { 'x-vercel-forwarded-for': '203.0.113.7, 198.51.100.1' } })), 'unknown-vercel-client');
  const v6 = address => new Request(req.url, { headers: { 'x-vercel-forwarded-for': address } });
  assert.equal(clientIdentity(v6('2001:db8::1')), clientIdentity(v6('2001:0db8:0:0:0:0:0:1')));
  delete process.env.VERCEL;
  assert.equal(clientIdentity(req), 'untrusted-origin');
}));

test('upload identity uses the verified user instead of request-controlled headers', async () => configured(async () => {
  const keys = [];
  globalThis.fetch = async (_url, options) => { keys.push(JSON.parse(options.body)[3]); return Response.json({ result: [1, 0] }); };
  await enforceRateLimit(req, 'upload', 'verified-user-a');
  await enforceRateLimit(new Request(req.url), 'upload', 'verified-user-a');
  await enforceRateLimit(req, 'upload', 'verified-user-b');
  assert.equal(keys[0], keys[1]);
  assert.notEqual(keys[0], keys[2]);
}));
