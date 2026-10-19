import test from 'node:test';
import assert from 'node:assert/strict';
import ts from 'typescript';
import {readFileSync} from 'node:fs';
const read = path => readFileSync(path,'utf8');
function load(path,deps={}) {
 const exports={};
 const js=ts.transpileModule(read(path),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText;
 new Function('exports','require',js)(exports,name=>{assert.ok(name in deps,'Unexpected dependency: '+name);return deps[name]});
 return exports;
}
const buyer=load('src/lib/real-estate/buyer-leads.ts');
const emi=load('src/lib/real-estate/emi.ts');
const media=load('src/lib/propertyImages.ts');
const seo=load('src/lib/real-estate/property-seo.ts');
const validators=load('src/lib/security/validators.ts');
const request=load('src/lib/security/request.ts',{'./validators':validators});
const payload={property_id:12,full_name:'Test Buyer',phone:'+91 98765 43210',email:'BUYER@EXAMPLE.COM',preferred_unit:'2 BHK',budget_range:'Not decided',intent_type:'site_visit',consent_to_contact:true,website_check:'',request_id:'a3d83726-538a-4e39-a8a2-a0c8f836a521'};
test('buyer validation normalizes Indian phone, Unicode text and email',()=>{
 const row=buyer.validateBuyerLead({...payload,full_name:'  Ａman Kumar  '});
 assert.equal(row.fullName,'Aman Kumar');assert.equal(row.phone,'9876543210');assert.equal(row.email,'buyer@example.com');
});
test('buyer validation rejects invalid identity, injected markup, missing consent and forged modes',()=>{
 for(const patch of [{property_id:true},{property_id:'1e2'},{property_id:Infinity},{property_id:0},{full_name:'＜script＞'},{full_name:'A\nB'},{phone:'1234567890'},{phone:'98765432101'},{email:'bad email'},{preferred_unit:'free text'},{budget_range:'<script>'},{intent_type:'booking_confirmed'},{consent_to_contact:'true'},{website_check:'bot'},{request_id:'x'}])assert.throws(()=>buyer.validateBuyerLead({...payload,...patch}),undefined,JSON.stringify(patch));
});
test('optional email and budget are accepted; oversized fields are rejected',()=>{
 assert.equal(buyer.validateBuyerLead({...payload,email:'',budget_range:''}).email,null);
 assert.throws(()=>buyer.validateBuyerLead({...payload,full_name:'a'.repeat(151)}));
});
test('only safe HTTPS PDF documents are returned',()=>{
 const doc={title:'Approved floor plans',kind:'floor_plan',url:'https://assets.example.com/project.pdf?download=1'};
 assert.ok(buyer.safePropertyDocument(doc));
 for(const url of ['javascript:alert(1)','http://assets.example.com/project.pdf','https://name:secret@assets.example.com/project.pdf','https://127.0.0.1/project.pdf','https://a.local/project.pdf','https://assets.example.com/file.html'])assert.equal(buyer.safePropertyDocument({...doc,url}),null);
 assert.equal(buyer.safePropertyDocument({...doc,kind:'photo'}),null);
});
test('EMI formula agrees with known fixed-rate amortization and handles zero interest',()=>{
 const value=emi.calculateEmi(5000000,20,8.5);assert.ok(Math.abs(value.monthly-43391.1617)<0.01);assert.ok(Math.abs(value.total-value.monthly*240)<0.0001);
 assert.equal(emi.calculateEmi(1200000,10,0).monthly,10000);
 for(const args of [[NaN,20,8],[99999,20,8],[1e9,20,8],[1e6,0,8],[1e6,20.5,8],[1e6,20,-1],[1e6,20,21]])assert.equal(emi.calculateEmi(...args),null);
});
test('unconfigured or unsafe lender referrals stay disabled',()=>{
 for(const url of [undefined,'','http://bank.example/offer','https://user:secret@bank.example','https://bank.local/offer','https://127.0.0.1/offer'])assert.equal(emi.homeLoanReferral(url),null);
 assert.equal(emi.homeLoanReferral('https://bank.example/offer?ref=gth'),'https://bank.example/offer?ref=gth');
});
test('visual mapping is deterministic, category-aware and always illustrative',()=>{
 assert.equal(media.getPropertyVisuals('Mumbai Suburban','Andheri East','Residential').category,'highrise');
 assert.equal(media.getPropertyVisuals('Thane','Palava','Residential').category,'township');
 assert.equal(media.getPropertyVisuals('Thane','Dombivli','Commercial').category,'commercial');
 const value=media.getPropertyVisuals('Thane','Thane West','Residential',[],'test');
 assert.deepEqual(value,media.getPropertyVisuals('Thane','Thane West','Residential',[],'test'));assert.equal(value.gallery.length,3);
 assert.ok(value.gallery.every(x=>x.illustrative&&new URL(x.url).hostname==='images.pexels.com'&&x.sourceUrl.startsWith('https://www.pexels.com/')));
 assert.doesNotMatch(value.gallery.map(x=>x.label).join(' '),/floor plan|verified project/i);
});
const project={title:'Example Project',slug:'example-project-p51800012345',location:'Andheri East',district:'Mumbai Suburban',rera_id:'P51800012345',official_source_url:'https://maharera.maharashtra.gov.in/',status:'active'};
test('project SEO accepts only source-linked registered profiles and safe slugs',()=>{
 assert.equal(seo.isIndexableProperty(project),true);
 for(const patch of [{slug:'../../admin'},{slug:'bad?secret=1'},{status:'archived'},{rera_id:'fake'},{official_source_url:'https://maharera.maharashtra.gov.in.evil.example'},{official_source_url:'https://u:p@maharera.maharashtra.gov.in'}])assert.equal(seo.isIndexableProperty({...project,...patch}),false);
 const meta=seo.propertySeo(project);assert.match(meta.title,/Example Project Andheri East/);assert.match(meta.description,/P51800012345/);assert.doesNotMatch(meta.description,/verified|available now|guaranteed/i);
});
function leadRoute({rpcError=null,docFailure=false,created=true,rateError=null}={}) {
 const calls=[];
 const docs={select:()=>docs,eq:()=>docs,limit:async()=>{if(docFailure)throw Error('asset service down');return {data:[{title:'Project brochure',kind:'brochure',url:'https://assets.example.com/project.pdf'}],error:null}}};
 const route=load('src/app/api/property/lead/route.ts',{
  '@/lib/security/request':request,'@/lib/real-estate/buyer-leads':buyer,
  '@/lib/security/rate-limit':{enforceRateLimit:async()=>{if(rateError)throw rateError}},
  '@/lib/real-estate/lead-server':{propertyLeadWriter:()=>({rpc:async(name,args)=>{calls.push({name,args});return {data:rpcError?null:[{result_id:3,created}],error:rpcError}},from:()=>docs})}
 });return {route,calls};
}
const req=(body=payload,headers={})=>new Request('https://www.gthproglobal.com/api/property/lead',{method:'POST',headers:{'Content-Type':'application/json',Origin:'https://www.gthproglobal.com',...headers},body:JSON.stringify(body)});
test('buyer endpoint saves normalized fields through private RPC and returns no contact data',async()=>{
 const {route,calls}=leadRoute();const res=await route.POST(req());const body=await res.json();assert.equal(res.status,201);assert.equal(body.received,true);assert.equal(body.documents.length,1);assert.equal(res.headers.get('Cache-Control'),'no-store');
 assert.equal(calls[0].name,'gth_capture_property_lead');assert.equal(calls[0].args.p_phone,'9876543210');assert.equal(calls[0].args.p_project_name,undefined);assert.doesNotMatch(JSON.stringify(body),/9876543210|BUYER@|Test Buyer|service_role/);
});
test('document outage cannot turn a saved buyer enquiry into a failed response',async()=>{
 const {route}=leadRoute({docFailure:true,created:false});const res=await route.POST(req());assert.equal(res.status,200);assert.deepEqual((await res.json()).documents,[]);
});
test('invalid and cross-site requests never reach database capture',async()=>{
 for(const [body,headers,status] of [[{...payload,consent_to_contact:false},{},400],[payload,{Origin:'https://evil.example'},403],[payload,{'sec-fetch-site':'cross-site'},403]]){
  const {route,calls}=leadRoute();assert.equal((await route.POST(req(body,headers))).status,status);assert.equal(calls.length,0);
 }
 const {route,calls}=leadRoute();const res=await route.POST(req({...payload,full_name:'x'.repeat(5000)}));assert.equal(res.status,413);assert.equal(calls.length,0);
});
test('rate limiting fails closed; database errors do not leak internal diagnostics',async()=>{
 const rate=leadRoute({rateError:new request.RequestError('Too many enquiries',429)});assert.equal((await rate.route.POST(req())).status,429);assert.equal(rate.calls.length,0);
 for(const [code,status] of [['P0002',404],['22023',400],['XX000',503]]){const {route}=leadRoute({rpcError:{code,message:'private database diagnostics'}});const res=await route.POST(req());assert.equal(res.status,status);assert.doesNotMatch(await res.text(),/private database diagnostics/)}
});
test('private schema capture is atomic, idempotent and unavailable to browser roles',()=>{
 const sql=read('supabase/migrations/20261019165857_real_estate_buyer_leads_and_property_seo.sql');
 assert.match(sql,/property_leads enable row level security/);assert.match(sql,/on conflict\(request_id\) do nothing/);assert.match(sql,/insert into public.leads/);assert.match(sql,/security invoker set search_path=''/);assert.match(sql,/revoke all on function .* from public,anon,authenticated/);assert.match(sql,/grant execute on function .* to service_role/);assert.doesNotMatch(sql,/grant insert on public.property_leads to anon/i);
 assert.match(sql,/gth_seo_properties_v1 with\(security_invoker=true\)/);
 assert.match(read('src/lib/seo/large-sitemaps.ts'),/properties:\{view:"gth_seo_properties_v1"/);
});
test('admin buyer enrichment is joined only after a verified admin guard',async()=>{
 const crm={select:()=>crm,order:()=>crm,limit:async()=>({data:[{id:8,property_id:12,phone:'9999999999',status:'new'}],error:null})};
 const detail={select:fields=>{assert.doesNotMatch(fields,/request_id|permission_reference/);return detail},in:async(key,ids)=>{assert.equal(key,'legacy_lead_id');assert.deepEqual(ids,[8]);return {data:[{legacy_lead_id:8,full_name:'QA buyer',project_name:'QA project',intent_type:'site_visit'}],error:null}}};
 const route=load('src/app/api/admin/leads/route.ts',{'@/lib/security/request':request,'@/lib/security/auth':{authenticatedStorage:async()=>({user:{app_metadata:{role:'admin'}},client:{from:table=>table==='leads'?crm:detail}})}});
 const res=await route.GET(new Request('https://www.gthproglobal.com/api/admin/leads'));
 assert.equal(res.status,200);assert.equal((await res.json())[0].buyer.full_name,'QA buyer');assert.equal(res.headers.get('Cache-Control'),'private, no-store');
});
