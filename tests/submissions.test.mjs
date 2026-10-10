import test from 'node:test';import assert from 'node:assert/strict';import ts from 'typescript';import fs from 'node:fs';
function load(path,deps={}){const exports={};new Function('exports','require',ts.transpileModule(fs.readFileSync(path,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText)(exports,name=>{if(!(name in deps))throw new Error(name);return deps[name]});return exports}
const validators=load('src/lib/security/validators.ts');const request=load('src/lib/security/request.ts',{'./validators':validators});
const req=body=>new Request('http://localhost/api/admin/submissions',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body)});
function admin(user,client){return load('src/app/api/admin/submissions/route.ts',{'@/lib/security/auth':{authenticatedStorage:async()=>({user,client})},'@/lib/security/request':request})}
test('user editable role cannot grant moderation',async()=>{const route=admin({app_metadata:{},user_metadata:{role:'admin'}},{rpc(){throw new Error('must not call')}});assert.equal((await route.POST(req({id:'00000000-0000-0000-0000-000000000001',decision:'approved'}))).status,403)});
test('admin review passes only validated decision and id to atomic RPC',async()=>{let called;const route=admin({app_metadata:{role:'admin'}},{rpc:async(name,args)=>{called={name,args};return {data:42,error:null}}});const response=await route.POST(req({id:'00000000-0000-0000-0000-000000000001',decision:'approved',verified:true}));assert.equal(response.status,200);assert.deepEqual(called,{name:'review_listing_submission',args:{submission_id:'00000000-0000-0000-0000-000000000001',decision:'approved'}})});
test('invalid decision rejected without invoking publication',async()=>{const route=admin({app_metadata:{role:'admin'}},{rpc(){throw new Error('must not call')}});assert.equal((await route.POST(req({id:'bad',decision:'verified'}))).status,400)});
test('account submission history is owner scoped even for administrators and never cached', async () => {
 const calls = [];
 const query = { select(fields) { calls.push(['select',fields]); return this }, eq(field,value) { calls.push(['eq',field,value]); return this }, order() { return this }, async limit(value) { calls.push(['limit',value]); return {data:[],error:null} } };
 const route = load('src/app/api/real-estate/submissions/route.ts', {
  '@/lib/security/auth': {authenticatedStorage:async()=>({user:{id:'actual-user',app_metadata:{role:'admin'}},client:{from:()=>query}})},
  '@/lib/security/request': request, '@/lib/security/validators': validators,
  '@/lib/security/rate-limit': {enforceRateLimit:async()=>{}},
 });
 const response = await route.GET(new Request('http://localhost/api/real-estate/submissions'));
 assert.equal(response.status,200);
 assert.ok(calls.some(call=>call[0]==='eq' && call[1]==='owner_id' && call[2]==='actual-user'));
 assert.ok(calls.some(call=>call[0]==='limit' && call[1]===50));
 assert.equal(response.headers.get('Cache-Control'),'private, no-store');
 assert.equal(calls.find(call=>call[0]==='select')[1].includes('owner_id'),false);
});
