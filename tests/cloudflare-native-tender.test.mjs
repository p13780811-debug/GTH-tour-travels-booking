import test from "node:test";
import assert from "node:assert/strict";
import {loadTenderTs as load} from "./helpers/tender-upgrade-loader.mjs";
const audience=load("src/lib/tender/native-audience.ts");
const original=load("src/lib/tender/localization.ts",{"server-only":{},"next/headers":{headers:async()=>new Headers()}});
const env={GTH_CLOUDFLARE_INGRESS:"1",VERCEL_ENV:"preview",GTH_RATE_LIMIT_NAMESPACE:"native-tender-fixture",NEXT_PUBLIC_SUPABASE_URL:"https://fixture.supabase.co",SUPABASE_SERVICE_ROLE_KEY:"sb_secret_fixture_only"};
const make=(rate,fetch=async()=>{throw Error("Unexpected fetch")})=>load("scripts/cloudflare-native-tender.mjs",{"../src/lib/security/rate-limit.ts":{enforceRateLimit:rate},"../src/lib/tender/native-audience.ts":audience},{fetch,atob,Headers});
const req=(query="scope=world&country=IN",init)=>new Request("https://preview.example.com/api/tender?"+query,init);
const row={id:"12345678-1234-4234-8234-123456789abc",country_code:"IN",title:"Test public notice",deadline_at:"2099-01-01T00:00:00Z",source_url:"https://example.org/notice",private_email:"must-not-leak"};
const result=(rows=[row],total=rows.length)=>Response.json(rows,{headers:{"Content-Range":rows.length?"0-"+(rows.length-1)+"/"+total:"*/"+total}});
test("native locale matches existing Tender localization across countries and languages",()=>{
 assert.deepEqual([...audience.COUNTRY_CODES],[...original.COUNTRY_CODES]);
 for(const country of ["IN","JP","US","AE","DE","GB"])for(const accept of [null,"en-US,en;q=0.9","ja","hi;q=0,fr;q=0.8","de-DE;q=0.8,en;q=0.9"])assert.equal(audience.preferLanguage(accept,country),original.preferLanguage(accept,country));
});
test("only explicit valid world-country first page GET enters the native path",()=>{
 const {nativeTenderInput}=make(async()=>{});
 assert.equal(nativeTenderInput(req()).country,"IN");
 assert.equal(nativeTenderInput(req()).language,"hi");
 assert.equal(nativeTenderInput(req("scope=world&country=in&lang=en&page=1&sort=deadline")).language,"en");
 for(const q of ["scope=local&country=IN","scope=world","scope=world&country=XX","scope=world&country=IN&country=US","scope=world&country=IN&q=test","scope=world&country=IN&page=2","scope=world&country=IN&sort=newest","scope=world&country=IN&lang=zz","scope=world&country=IN&x=1","scope=world&country=IN%2Ceq.US"])assert.equal(nativeTenderInput(req(q)),null,q);
 for(const h of ["Cookie","Authorization","RSC","Range","Next-Router-Prefetch"])assert.equal(nativeTenderInput(req(undefined,{headers:{[h]:"fixture"}})),null);
 assert.equal(nativeTenderInput(req(undefined,{method:"POST"})),null);
});
test("first uncached request reads verified public notices with exact total and existing budget",async()=>{
 let permits=0,queries=0;
 const api=make(async(request,scope,identity,bindings)=>{permits++;assert.equal(scope,"tender_reads");assert.equal(identity,"shared-public-catalogue");assert.equal(bindings,env);});
 const db=async(table,p,body,options)=>{queries++;assert.equal(table,"tenders");assert.equal(p.status,"eq.published");assert.equal(p.source_verified,"eq.true");assert.equal(p.is_public,"eq.true");assert.equal(p.country_code,"eq.IN");assert.match(p.deadline_at,/^gt\./);assert.equal(p.order,"deadline_at.asc,id.asc");assert.equal(p.limit,"12");assert.equal(options.exactCount,true);assert.ok(!p.select.includes("private_email"));return result();};
 const response=await api.nativeTenderRead(req(),env,db,{cache:null});
 assert.equal(response.status,200);assert.equal(response.headers.get("X-GTH-Edge-Read"),"native-tender");assert.match(response.headers.get("Cache-Control"),/no-store/);
 const data=await response.json();assert.equal(data.items.length,1);assert.equal(data.items[0].private_email,undefined);assert.equal(data.total,1);assert.equal(data.country,"IN");assert.equal(data.language,"hi");assert.equal(data.pageSize,12);assert.equal(permits,1);assert.equal(queries,1);
});
test("regional repeat cache preserves language isolation; private and failed reads cannot populate it",async()=>{
 const entries=new Map();const cache={async match(k){return entries.get(k.url)?.clone()},async put(k,v){entries.set(k.url,v.clone())}};
 let permits=0,reads=0;
 const api=make(async()=>{permits++});
 const db=async()=>{reads++;return result()};
 const first=await api.nativeTenderRead(req(),env,db,{cache});assert.equal(first.status,200);
 const second=await api.nativeTenderRead(req(),env,db,{cache});assert.equal(second.headers.get("X-GTH-Read-Cache"),"HIT");assert.equal(permits,1);assert.equal(reads,1);
 const en=await api.nativeTenderRead(req("scope=world&country=IN&lang=en"),env,db,{cache});assert.equal((await en.json()).language,"en");assert.match(en.headers.get("cache-control"),/s-maxage=/);assert.equal(reads,2);
 assert.equal(await api.nativeTenderRead(req(undefined,{headers:{Cookie:"session=private"}}),env,db,{cache}),null);
 const failed=await api.nativeTenderRead(req("scope=world&country=JP"),env,async()=>new Response(null,{status:503}),{cache});assert.equal(failed.status,503);assert.equal(entries.size,2);
});
test("budget denial fails closed; only Redis unavailability uses the same fallback quota RPC",async()=>{
 let fallback=0,reads=0;const db=async()=>{reads++;return result()};
 const limited=make(async()=>{throw Object.assign(Error(),{status:429})},async()=>{fallback++;return Response.json(true)});
 assert.equal((await limited.nativeTenderRead(req(),env,db,{cache:null})).status,429);assert.equal(fallback,0);assert.equal(reads,0);
 const unavailable=make(async()=>{throw Object.assign(Error(),{status:503})},async(url,init)=>{fallback++;assert.equal(new URL(url).pathname,"/rest/v1/rpc/tender_reserve_fallback_read");assert.equal(init.method,"POST");assert.equal(init.headers.apikey,env.SUPABASE_SERVICE_ROLE_KEY);assert.equal(JSON.parse(init.body).p_environment,"preview");return Response.json(true)});
 assert.equal((await unavailable.nativeTenderRead(req(),env,db,{cache:null})).status,200);assert.equal(fallback,1);assert.equal(reads,1);
 const rejected=make(async()=>{throw Object.assign(Error(),{status:503})},async()=>Response.json(false));
 assert.equal((await rejected.nativeTenderRead(req(),env,db,{cache:null})).status,429);assert.equal(reads,1);
});
test("invalid count and expired records are never invented or cached",async()=>{
 const api=make(async()=>{});
 const cache={async match(){return undefined},async put(){assert.fail("Must not store invalid or expired payload")}};
 assert.equal((await api.nativeTenderRead(req(),env,async()=>Response.json([row]),{cache})).status,503);
 const response=await api.nativeTenderRead(req(),env,async()=>result([{...row,deadline_at:"2000-01-01T00:00:00Z"}]),{cache});assert.equal(response.status,200);assert.equal((await response.json()).items.length,0);
});

test("protected preview Access-only cookie permits real public read but never shared cache",async()=>{
 const api=make(async()=>{});
 const preview="https://gth-pro-preview-20261126.p13780811.workers.dev/api/tender?scope=world&country=IN";
 const token="fixture.access.assertion";
 const accessHeaders={"CF-Access-Jwt-Assertion":token,Cookie:"CF_Authorization="+token};
 const allowed=new Request(preview,{headers:accessHeaders});
 assert.equal(api.nativeTenderInput(allowed,env).previewNoCache,true);
 let calls=0;
 const cache={async match(){assert.fail("Access request cannot read shared cache")},async put(){assert.fail("Access request cannot write shared cache")}};
 const response=await api.nativeTenderRead(allowed,env,async()=>{calls++;return result()},{cache});
 assert.equal(response.status,200);assert.equal(response.headers.get("X-GTH-Edge-Read"),"native-tender");
 assert.equal(response.headers.get("Cache-Control"),"private, no-store");assert.equal(calls,1);
 for(const headers of [{Cookie:"CF_Authorization="+token},{...accessHeaders,Cookie:"CF_Authorization="+token+"; session=private"},{...accessHeaders,Cookie:"CF_Authorization=wrong"},{...accessHeaders,Authorization:"Bearer private"}]){
  assert.equal(api.nativeTenderInput(new Request(preview,{headers}),env),null);
 }
 assert.equal(api.nativeTenderInput(allowed,{...env,VERCEL_ENV:"production"}),null);
 assert.equal(api.nativeTenderInput(new Request("https://www.gthproglobal.com/api/tender?scope=world&country=IN",{headers:accessHeaders}),env),null);
});
