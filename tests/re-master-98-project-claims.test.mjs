import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import ts from "typescript";

function load(path, deps={}) {
  const exports={};
  const out=ts.transpileModule(fs.readFileSync(path,"utf8"),{
    compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}
  }).outputText;
  new Function("exports","require",out)(exports,name=>{
    if(!(name in deps)) throw new Error("Unexpected dependency: "+name);
    return deps[name];
  });
  return exports;
}
const validators=load("src/lib/security/validators.ts");
const request=load("src/lib/security/request.ts",{"./validators":validators});
const makeRequest=(path,data)=>new Request("https://localhost"+path,{
  method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(data)
});
const claimRoute=(client,user={id:"user1",app_metadata:{}})=>load(
 "src/app/api/real-estate/project-claims/route.ts",{
 "@/lib/security/auth":{authenticatedStorage:async()=>({client,user})},
 "@/lib/security/rate-limit":{enforceRateLimit:async()=>{}},
 "@/lib/security/request":request,
 "@/lib/security/validators":validators,
});
test("RE-05: private bucket, immutable review and no public candidate rights",()=>{
 const sql=fs.readFileSync("supabase/migrations/20261020091500_re_master_98_project_media_claims.sql","utf8");
 assert.match(sql,/gth-re-claim-media/);
 assert.match(sql,/values \('gth-re-claim-media','gth-re-claim-media',false/);
 assert.match(sql,/enable row level security/ig);
 assert.match(sql,/revoke all on public\.property_claim_media from public,anon,authenticated/i);
 assert.doesNotMatch(sql,/grant (?:all|update|delete) on public\.property_claim_media to authenticated/i);
 assert.match(sql,/item\.uploader_id=auth\.uid\(\)/i);
 assert.match(sql,/p\.rera_id=item\.rera_reference/i);
 assert.match(sql,/claim not eligible for independent review/i);
 assert.match(sql,/status='approved' and c\.project_id=item\.project_id/i);
});
test("RE-06: malformed RERA and missing authority attestation fail before write",async()=>{
 let touched=false;
 const route=claimRoute({from(){touched=true;throw new Error("Should not query") }});
 const r=await route.POST(makeRequest("/api/real-estate/project-claims",{
  rera_reference:"P000",claimant_role:"developer",legal_name:"A Builder",
  authority_reference:"Document evidence exists",rights_attested:true,authority_attested:false
 }));
 assert.equal(r.status,400);
 assert.equal(touched,false);
});
test("RE-06: only unique exact registry project can be claimed",async()=>{
 let inserted=false;
 const query={select(){return this;},eq(){return this;},async limit(){return {data:[],error:null}}};
 const route=claimRoute({from(table){if(table==="properties")return query;inserted=true;throw new Error("Must not insert");}});
 const response=await route.POST(makeRequest("/api/real-estate/project-claims",{
  rera_reference:"P51800002057",claimant_role:"agent",legal_name:"Authorized Agent",
  authority_reference:"Written project permission #2026",
  authority_attested:true,rights_attested:true,
 }));
 assert.equal(response.status,422);
 assert.equal(inserted,false);
});
test("RE-06: owner session is authoritative, review defaults to pending",async()=>{
 let payload;
 const query={select(){return this;},eq(){return this;},
 async limit(){return {data:[{id:42,rera_id:"P51800002057"}],error:null}}};
 const insertion={insert(data){payload=data;return this;},select(){return this;},async single(){
  return {data:{id:"test-id",status:"pending",project_id:42,rera_reference:"P51800002057"},error:null};
 }};
 const route=claimRoute({from(table){return table==="properties"?query:insertion;}},{id:"real-user",app_metadata:{},user_metadata:{role:"admin"}});
 const response=await route.POST(makeRequest("/api/real-estate/project-claims",{
  rera_reference:"p51800002057",claimant_role:"owner",legal_name:"Registered Owner",
  authority_reference:"Signed ownership reference 1234",
  authority_attested:true,rights_attested:true,
  status:"approved",claimant_id:"another-user",reviewed_by:"fake-admin",
 }));
 assert.equal(response.status,201);
 assert.equal(payload.project_id,42);
 assert.equal(payload.rera_reference,"P51800002057");
 assert.equal(Object.hasOwn(payload,"claimant_id"),false);
 assert.equal(Object.hasOwn(payload,"status"),false);
 assert.equal(Object.hasOwn(payload,"reviewed_by"),false);
});
test("RE-06: unprivileged or forged metadata cannot call review RPC",async()=>{
 let invoked=false;
 const route=load("src/app/api/admin/project-claims/route.ts",{
  "@/lib/security/auth":{authenticatedStorage:async()=>({
   user:{id:"u1",app_metadata:{},user_metadata:{role:"admin"}},
   client:{rpc(){invoked=true;throw new Error("Must not call");}},
  })},
  "@/lib/security/request":request,"@/lib/security/validators":validators,
 });
 const response=await route.POST(makeRequest("/api/admin/project-claims",{
  id:"00000000-0000-0000-0000-000000000001",type:"claim",decision:"approved",
 }));
 assert.equal(response.status,403);
 assert.equal(invoked,false);
});
test("RE-06: reviewer RPC only gets validated decision, never publication flag",async()=>{
 let call;
 const route=load("src/app/api/admin/project-claims/route.ts",{
  "@/lib/security/auth":{authenticatedStorage:async()=>({
   user:{id:"moderator",app_metadata:{role:"admin"}},
   client:{rpc:async(name,payload)=>{call={name,payload};return {error:null};}},
  })},
  "@/lib/security/request":request,"@/lib/security/validators":validators,
 });
 const id="00000000-0000-0000-0000-000000000001";
 const response=await route.POST(makeRequest("/api/admin/project-claims",{
  id,type:"media",decision:"approved",publish:true,verified:true,
 }));
 assert.equal(response.status,200);
 assert.deepEqual(call,{
  name:"review_property_claim_media",
  payload:{p_id:id,p_decision:"approved",p_notes:""},
 });
});
test("RE-06: old public upload never used for new project-claim evidence",()=>{
 const upload=fs.readFileSync("src/app/api/real-estate/claim-media/route.ts","utf8");
 assert.match(upload,/gth-re-claim-media/);
 assert.doesNotMatch(upload,/\.from\(["']property-images["']\)/);
 assert.match(upload,/sharp\(source/);
 assert.match(upload,/sha256/);
 assert.match(upload,/rights_attested/);
 assert.doesNotMatch(upload,/getPublicUrl/);
});
