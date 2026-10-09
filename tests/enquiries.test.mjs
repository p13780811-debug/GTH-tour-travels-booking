import test from 'node:test';
import assert from 'node:assert/strict';
import ts from 'typescript';
import fs from 'node:fs';
function load(path, deps = {}) {
 const exports = {};
 const source = ts.transpileModule(fs.readFileSync(path, 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText;
 new Function('exports','require',source)(exports, name => { if (!(name in deps)) throw new Error(name); return deps[name]; });
 return exports;
}
const validators = load('src/lib/security/validators.ts');
const request = load('src/lib/security/request.ts', { './validators': validators });
function route(client, limit = async () => {}) {
 return load('src/app/api/real-estate/enquiries/route.ts', { 'next/server': { NextResponse: Response }, '@/lib/supabase': { supabase: client }, '@/lib/security/request': request, '@/lib/security/validators': validators, '@/lib/security/rate-limit': { enforceRateLimit: limit } });
}
const req = body => new Request('http://localhost/api/real-estate/enquiries', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
test('invalid phone rejected before rate store or database access', async () => {
 const api = route({ from() { throw new Error('must not run'); } }, async () => { throw new Error('must not run'); });
 assert.equal((await api.POST(req({ property_id: 1, phone: '<script>bad</script>' }))).status, 400);
});
test('enquiry inserts only known columns and returns no customer data', async () => {
 let inserted;
 const client = { from(table) { if (table === 'properties') return { select(columns) { assert.equal(columns,'id'); return { eq(key,id) { assert.equal(id,8); return { limit: async () => ({ data: [{id:8}], error: null }) }; } }; } }; return { insert: async body => { inserted=body; return {error:null}; } }; } };
 const api = route(client, async (_req, scope) => assert.equal(scope,'enquiries'));
 const res = await api.POST(req({ property_id:8, phone:'+91 9876543210', status:'approved', extra:'ignored' }));
 assert.equal(res.status,201); assert.deepEqual(inserted,{ property_id:8, phone:'+91 9876543210' }); assert.deepEqual(await res.json(),{success:true});
});
test('request protection failure prevents database writes', async () => {
 const api = route({ from() { throw new Error('must not run'); } }, async () => { throw new request.RequestError('Request protection unavailable',503); });
 assert.equal((await api.POST(req({ property_id:8, phone:'+91 9876543210' }))).status,503);
});
