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


test('registry-linked submission resolves master project and stores inventory facts for review', async () => {
 let inserted;
 const registryQuery = {
  select() { return this },
  eq() { return this },
  limit(){return this}, async abortSignal() { return { data: [{ id: 21064, title: 'MANHAR RESIDENCY', country: 'India', city: 'Mumbai', location: 'Mumbai', rera_id: 'P51800002057', source_type: 'registry' }], error: null } },
 };
 const submissionsQuery = { insert(payload) { inserted = payload; return this }, async abortSignal(){return {error:null}} };
 const route = load('src/app/api/real-estate/submissions/route.ts', {
  '@/lib/security/auth': { authenticatedStorage: async () => ({ user: { id: 'owner-1' }, client: { from: table => table === 'properties' ? registryQuery : submissionsQuery } }) },
  '@/lib/security/request': request,
  '@/lib/security/validators': validators,
  '@/lib/security/rate-limit': { enforceRateLimit: async () => {} },
 });
 const response = await route.POST(new Request('http://localhost/api/real-estate/submissions', {
  method: 'POST', headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
   title: 'User typed title', country: 'India', city: 'Mumbai', location: 'Andheri',
   description: 'Current two bedroom inventory submitted for administrator review.',
   property_type: 'Apartment', listing_type: 'buy', submitter_role: 'agent', agent_registration:'A51800000001',
   registry_reference: 'p51800002057', price_amount: '17500000',
   bedrooms: '2', bathrooms: '2', area_sqft: '710',
  }),
 }));
 assert.equal(response.status, 201);
 assert.equal(inserted.target_project_id, 21064);
 assert.equal(inserted.registry_reference, 'P51800002057');
 assert.equal(inserted.title, 'MANHAR RESIDENCY');
 assert.equal(inserted.price_amount, 17500000);
 assert.equal(inserted.bedrooms, 2);
 assert.equal(inserted.area_sqft, 710);
 assert.equal(inserted.submitter_role, 'agent');
});

test('unknown registry reference is rejected without creating a duplicate submission', async () => {
 let inserted = false;
 const registryQuery = { select() { return this }, eq() { return this }, limit(){return this}, async abortSignal() { return { data: [], error: null } } };
 const submissionsQuery = { insert() { inserted = true; return this }, async abortSignal(){return {error:null}} };
 const route = load('src/app/api/real-estate/submissions/route.ts', {
  '@/lib/security/auth': { authenticatedStorage: async () => ({ user: { id: 'owner-1' }, client: { from: table => table === 'properties' ? registryQuery : submissionsQuery } }) },
  '@/lib/security/request': request,
  '@/lib/security/validators': validators,
  '@/lib/security/rate-limit': { enforceRateLimit: async () => {} },
 });
 const response = await route.POST(new Request('http://localhost/api/real-estate/submissions', {
  method: 'POST', headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
   title: 'Unknown Project', country: 'India', city: 'Mumbai', location: 'Mumbai',
   description: 'Enough description for administrator review without publication.',
   property_type: 'Apartment', listing_type: 'buy', submitter_role: 'agent', agent_registration:'A51800000001',
   registry_reference: 'P51899999999',
  }),
 }));
 assert.equal(response.status, 400);
 assert.equal(inserted, false);
});


test('global submission preserves currency and normalizes square metres to square feet', async () => {
 let inserted;
 const submissionsQuery = { insert(payload) { inserted = payload; return this }, async abortSignal(){return {error:null}} };
 const route = load('src/app/api/real-estate/submissions/route.ts', {
  '@/lib/security/auth': { authenticatedStorage: async () => ({ user: { id: 'owner-1' }, client: { from: () => submissionsQuery } }) },
  '@/lib/security/request': request,
  '@/lib/security/validators': validators,
  '@/lib/security/rate-limit': { enforceRateLimit: async () => {} },
 });
 const response = await route.POST(new Request('http://localhost/api/real-estate/submissions', {
  method: 'POST', headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
   title: 'Dubai Residence', country: 'United Arab Emirates', city: 'Dubai', location: 'Dubai Marina',
   description: 'Reviewed inventory submission with global currency and metric area.',
   property_type: 'Apartment', listing_type: 'buy', submitter_role: 'developer',
   currency: 'AED', price_amount: '2500000', bedrooms: '2', bathrooms: '2',
   area_value: '100', area_unit: 'sqm',
  }),
 }));
 assert.equal(response.status, 201);
 assert.equal(inserted.currency, 'AED');
 assert.equal(inserted.price_amount, 2500000);
 assert.equal(inserted.area_sqft, 1076);
});
