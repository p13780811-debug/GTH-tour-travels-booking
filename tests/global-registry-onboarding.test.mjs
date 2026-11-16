import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import ts from "typescript";

function load(path,deps={}){
  const exports={};
  const code=ts.transpileModule(fs.readFileSync(path,"utf8"),{compilerOptions:{
    module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022,
  }}).outputText;
  new Function("exports","require","TextEncoder",code)(exports,name=>{
    if(!(name in deps))throw Error("Unexpected imported dependency: "+name);
    return deps[name];
  },TextEncoder);
  return exports;
}
const registry=load("src/lib/real-estate/global-registry.ts");
const valid=(overrides={})=>({
  country_code:"IN",region_state:"Maharashtra",city:"Mumbai",registry_authority:"MAHARERA",
  registration_id:"P51800012345",project_name:"Example Project",lat:"19.076",lng:"72.8777",
  developer_name:"",postal_code:"",...overrides,
});

test("worldwide and 36 Indian states normalize consistently",()=>{
  assert.equal(Object.keys(registry.INDIAN_REGIONS).length,36);
  assert.equal(registry.normalizeGlobalRegistryStub(valid()).region_state,"MH");
  for(const [country,region,authority,id] of [
    ["AE","Dubai","DLD/RERA","2026-345"],
    ["US","California","COUNTY_ASSESSOR","APN-123"],
    ["GB","England","HM_LAND_REGISTRY","AB/123"],
    ["SG","Central","GLOBAL_UNLISTED","PERMIT-123"],
    ["AU","Victoria","GLOBAL_UNLISTED","VIC.123"],
  ]) {
    const row=registry.normalizeGlobalRegistryStub(valid({
      country_code:country,region_state:region,registry_authority:authority,registration_id:id,
    }));
    assert.equal(row.country_code,country);
    assert.equal(row.verification_status,undefined,"Untrusted client cannot assign verified status");
  }
});
test("rejects unknown jurisdiction, invalid authority, markup, raw blobs and oversized coordinates",()=>{
  for(const input of [
    {country_code:"ZZ"}, {region_state:"Missing Indian state"},
    {registry_authority:"DLD/RERA"}, {registration_id:"MAHA-123"},
    {city:"<script>"}, {project_name:"<img src=x>"},
    {registration_id:"ABC%20INSERT"}, {lat:91}, {lng:""},
    {lat:"1.999999"}, {html:"<html>..."},{verification_status:"verified"},
    {project_name:"ज".repeat(80)},{country_code:"0!"},{country_code:"US",region_state:"NY",registry_authority:"MAHARERA"},
  ]) assert.throws(()=>registry.normalizeGlobalRegistryStub(valid(input)),registry.GlobalRegistryValidationError,JSON.stringify(input));
});
test("private migration prevents unverified public rows and preserves owner-only links",()=>{
  const sql=fs.readFileSync("supabase/migrations/20261117044500_global_registry_compact_stubs.sql","utf8");
  assert.match(sql,/enable row level security/i);
  assert.match(sql,/submitted_by = \(select auth.uid\(\)\)/i);
  assert.match(sql,/global_registry_unique_reference unique \(country_code, registry_authority, registration_id\)/);
  assert.match(sql,/octet_length\(country_code/);
  assert.match(sql,/grant select, insert, update, delete on table public.global_registry_projects to service_role/i);
  assert.doesNotMatch(sql,/grant insert on table public.global_registry_projects to (?:anon|authenticated)/i);
  assert.match(sql,/status = 'review'/);
});

const validators=load("src/lib/security/validators.ts");
const request=load("src/lib/security/request.ts",{"./validators":validators});
function makeApi({login,limit,service}){
  return load("src/app/api/real-estate/global-registry/route.ts",{
    "server-only":{},
    "@supabase/supabase-js":{createClient:service},
    "@/lib/security/auth":{authenticatedStorage:login},
    "@/lib/security/request":request,
    "@/lib/security/rate-limit":{enforceRateLimit:limit},
    "@/lib/real-estate/global-registry":registry,
  });
}
const post=body=>new Request("https://example.org/api/real-estate/global-registry",{
  method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(body),
});

test("route rejects anonymous and rate-limited creation before DB access",async()=>{
  const unreachable=()=>{throw Error("Database must not be reached");};
  const anon=makeApi({login:async()=>{throw new request.RequestError("Sign in required",401);},
    limit:unreachable,service:unreachable});
  assert.equal((await anon.POST(post(valid()))).status,401);
  const rate=makeApi({login:async()=>({user:{id:"owner"}}),limit:async()=>{throw new request.RequestError("Request protection unavailable",503);},service:unreachable});
  assert.equal((await rate.POST(post(valid()))).status,503);
});

test("authenticated creation writes only a compact pending stub under server-only key",async()=>{
  const env={url:process.env.NEXT_PUBLIC_SUPABASE_URL,key:process.env.SUPABASE_SERVICE_ROLE_KEY};
  let inserted=null,serviceCalls=0;
  process.env.NEXT_PUBLIC_SUPABASE_URL="https://example.supabase.co";
  process.env.SUPABASE_SERVICE_ROLE_KEY="test-fixture-service-only";
  const chain={
    select(){return this;},eq(){return this;},abortSignal(){return this;},
    insert(body){inserted=body;return this;},
    maybeSingle:async()=>({data:null,error:null}),
    single:async()=>({data:{id:42},error:null}),
  };
  const api=makeApi({
    login:async()=>({user:{id:"test-owner"}}),
    limit:async(_req,scope,user)=>{assert.equal(scope,"submissions");assert.equal(user,"test-owner");},
    service:(url,key)=>{assert.equal(url,"https://example.supabase.co");assert.equal(key,"test-fixture-service-only");serviceCalls++;return {from:table=>{
      if(table==="properties") return {select(){return this;},eq(){return this;},limit(){return this;},abortSignal:async()=>({data:[],error:null})};
      assert.equal(table,"global_registry_projects");return chain;
    }};},
  });
  try{
    const response=await api.POST(post(valid()));
    assert.equal(response.status,201);
    assert.deepEqual(await response.json(),{id:42,status:"pending_global_review",created:true});
    assert.equal(serviceCalls,1);
    assert.equal(inserted.submitted_by,"test-owner");
    assert.equal(inserted.region_state,"MH");
    assert.equal(inserted.verification_status,"pending_global_review");
    assert.equal("raw_html" in inserted,false);
    assert.equal((await api.POST(post(valid({raw_html:"bad"})))).status,400);
    assert.equal(serviceCalls,1,"invalid payload never reaches the DB");
  }finally {
    for(const [name,value] of [["NEXT_PUBLIC_SUPABASE_URL",env.url],["SUPABASE_SERVICE_ROLE_KEY",env.key]]){
      if(value===undefined)delete process.env[name];else process.env[name]=value;
    }
  }
});
