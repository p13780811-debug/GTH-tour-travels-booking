import test from 'node:test';
import assert from 'node:assert/strict';
import ts from 'typescript';
import fs from 'node:fs';

function load(path, dependencies) {
  const exports = {};
  const source = ts.transpileModule(fs.readFileSync(path, 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText;
  new Function('exports', 'require', source)(exports, name => {
    if (!(name in dependencies)) throw new Error(`Unexpected import: ${name}`);
    return dependencies[name];
  });
  return exports;
}
const validators = load('src/lib/security/validators.ts', {});
const request = load('src/lib/security/request.ts', { './validators': validators });

test('upload authentication rejects missing bearer before calling the auth provider', async () => {
  const auth = load('src/lib/security/auth.ts', { './request': request, '@supabase/supabase-js': { createClient: () => { throw new Error('Must not be called'); } } });
  await assert.rejects(auth.authenticatedStorage(new Request('http://localhost')), { status: 401 });
});

test('upload client uses the caller JWT and verifies it with getUser', async () => {
  const names = ['NEXT_PUBLIC_SUPABASE_URL', 'NEXT_PUBLIC_SUPABASE_ANON_KEY'];
  const prior = names.map(name => process.env[name]);
  try {
    process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://test.supabase.co';
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'test-only-anon-key';
    const user = { id: 'verified-owner' };
    const client = { auth: { getUser: async token => { assert.equal(token, 'test-only-session'); return { data: { user }, error: null }; } } };
    const auth = load('src/lib/security/auth.ts', { './request': request, '@supabase/supabase-js': {
      createClient: (_url, key, options) => {
        assert.equal(key, 'test-only-anon-key');
        assert.equal(options.global.headers.Authorization, 'Bearer test-only-session');
        assert.equal(options.auth.persistSession, false);
        return client;
      },
    } });
    assert.deepEqual(await auth.authenticatedStorage(new Request('http://localhost', { headers: { Authorization: 'Bearer test-only-session' } })), { client, user });
  } finally { names.forEach((name, i) => { if (prior[i] === undefined) delete process.env[name]; else process.env[name] = prior[i]; }); }
});

test('admin leads never trust user_metadata or read data for ordinary users', async () => {
  let reads = 0;
  const route = user => load('src/app/api/admin/leads/route.ts', {
    '@/lib/security/request': request,
    '@/lib/security/auth': { authenticatedStorage: async () => ({ user, client: { from: () => { reads++; throw new Error('Must not query'); } } }) },
  });
  for (const user of [{ user_metadata: { role: 'admin' }, app_metadata: {} }, { app_metadata: { role: 'owner' } }]) {
    const response = await route(user).GET(new Request('http://localhost'));
    assert.equal(response.status, 403);
    assert.equal(response.headers.get('Cache-Control'), 'no-store');
  }
  assert.equal(reads, 0);
});

test('trusted admin leads are bounded, projected and never cached', async () => {
  const query = {
    select: fields => { assert.equal(fields, 'id,property_id,phone,created_at'); return query; },
    order: () => query,
    limit: async n => { assert.equal(n, 100); return { data: [], error: null }; },
  };
  const route = load('src/app/api/admin/leads/route.ts', {
    '@/lib/security/request': request,
    '@/lib/security/auth': { authenticatedStorage: async () => ({ user: { app_metadata: { role: 'admin' } }, client: { from: table => { assert.equal(table, 'leads'); return query; } } }) },
  });
  const response = await route.GET(new Request('http://localhost'));
  assert.equal(response.status, 200);
  assert.equal(response.headers.get('Cache-Control'), 'private, no-store');
});
