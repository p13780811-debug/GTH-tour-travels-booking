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
 "src/app/api/property-claims/route.ts",{
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
 const r=await route.POST(makeRequest("/api/property-claims",{
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
 const response=await route.POST(makeRequest("/api/property-claims",{
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
 const response=await route.POST(makeRequest("/api/property-claims",{
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
  id,type:"media",decision:"approved",notes:"Reviewer checked supplier authorization and project identity",publish:true,verified:true,
 }));
 assert.equal(response.status,200);
 assert.deepEqual(call,{
  name:"review_property_claim_media",
  payload:{p_id:id,p_decision:"approved",p_notes:"Reviewer checked supplier authorization and project identity"},
 });
});
test("RE-06: old public upload never used for new project-claim evidence",()=>{
 const upload=fs.readFileSync("src/app/api/property-claims/media/route.ts","utf8");
 assert.match(upload,/gth-re-claim-media/);
 assert.doesNotMatch(upload,/\.from\(["']property-images["']\)/);
 assert.match(upload,/sharp\(source/);
 assert.match(upload,/sha256/);
 assert.match(upload,/rights_attested/);
 assert.doesNotMatch(upload,/getPublicUrl/);
});

test("RE-05: direct Storage JWT cannot upload to a different claimant's pending project", () => {
 const sql=fs.readFileSync("supabase/migrations/20261020091500_re_master_98_project_media_claims.sql","utf8");
 const storageInsert=sql.split('create policy "re claim private image inserts"')[1].split('drop policy if exists "re claim private image review downloads"')[0];
 assert.match(storageInsert,/c\.id=\(\(storage\.foldername\(name\)\)\[3\]\)::uuid/);
 assert.match(storageInsert,/c\.claimant_id=\(select auth\.uid\(\)\)/);
 assert.match(storageInsert,/c\.status in \('pending','approved'\)/);
 assert.match(storageInsert,/else false/);
});


test("RE-05: candidate evidence cannot be deleted while metadata exists, only orphan owner files", () => {
 const sql=fs.readFileSync("supabase/migrations/20261020091500_re_master_98_project_media_claims.sql","utf8");
 const policy=sql.split('create policy "re claim private orphan cleanup"')[1].split('-- Only a separate administrator')[0];
 assert.match(policy,/for delete to authenticated/i);
 assert.match(policy,/bucket_id='gth-re-claim-media'/);
 assert.match(policy,/storage.foldername\(name\)\)\[2\]=\(select auth.uid\(\)\)/);
 assert.match(policy,/not exists \(/);
 assert.match(policy,/m.object_key=name/);
});
test("RE-06: corrupted alleged PNG rejected without touching private storage", async() => {
 const sharp=(await import("sharp")).default;
 let writes=0;
 const user={id:"123e4567-e89b-12d3-a456-426614174000",app_metadata:{}};
 const claimId="11111111-1111-4111-8111-111111111111";
 const context={user,client:{
  from(){return {select(){return this},eq(){return this},async single(){return {data:{id:claimId,project_id:17,status:"pending"},error:null}}}},
  storage:{from(){return {upload(){writes++;throw new Error("must not upload")}}}}
 }};
 const route=load("src/app/api/property-claims/media/route.ts",{
  "node:crypto":await import("node:crypto"),"sharp":{default:sharp},
  "@/lib/security/auth":{authenticatedStorage:async()=>context},
  "@/lib/security/rate-limit":{enforceRateLimit:async()=>{}},
  "@/lib/security/request":request,"@/lib/security/validators":validators,
 });
 const form=new FormData();
 form.set("claim_id",claimId);form.set("media_type","photo");
 form.set("license_basis","creator");form.set("supplier","Original photographer");
 form.set("permission_reference","Written media permission reference");
 form.set("rights_attested","true");
 form.set("file",new File([new Uint8Array([1,2,3,4])],"invalid.png",{type:"image/png"}));
 const response=await route.POST(new Request("https://example.test/api/property-claims/media",{method:"POST",body:form}));
 assert.equal(response.status,415);
 assert.equal(writes,0);
});
test("RE-06: failed metadata insert cleans only newly created private orphan",async()=>{
 const sharp=(await import("sharp")).default;
 const user={id:"123e4567-e89b-12d3-a456-426614174000",app_metadata:{}};
 const claimId="11111111-1111-4111-8111-111111111111";
 const image=await sharp({create:{width:8,height:8,channels:3,background:"#fff"}}).png().toBuffer();
 const uploaded=[],removed=[];
 const context={user,client:{
  from(table){
   if(table==="property_project_claims")return {
    select(){return this},eq(){return this},async single(){return {data:{id:claimId,project_id:17,status:"pending"},error:null}}
   };
   if(table==="property_claim_media")return {
    insert(){return this},select(){return this},async single(){return {data:null,error:{message:"duplicate"}}}
   };
   throw new Error("Unexpected table");
  },
  storage:{from(bucket){
   assert.equal(bucket,"gth-re-claim-media");
   return {
    async upload(key,data){uploaded.push(key);assert.ok(data.length>0);return {error:null}},
    async remove(keys){removed.push(...keys);return {error:null}},
   };
  }},
 }};
 const route=load("src/app/api/property-claims/media/route.ts",{
  "node:crypto":await import("node:crypto"),"sharp":{default:sharp},
  "@/lib/security/auth":{authenticatedStorage:async()=>context},
  "@/lib/security/rate-limit":{enforceRateLimit:async()=>{}},
  "@/lib/security/request":request,"@/lib/security/validators":validators,
 });
 const form=new FormData();
 form.set("claim_id",claimId);form.set("media_type","photo");form.set("license_basis","creator");
 form.set("supplier","Original photographer");form.set("permission_reference","Original author signed rights agreement");
 form.set("rights_attested","true");
 form.set("file",new File([image],"photo.png",{type:"image/png"}));
 const response=await route.POST(new Request("https://example.test/api/property-claims/media",{method:"POST",body:form}));
 assert.equal(response.status,409);
 assert.equal(uploaded.length,1);
 assert.deepEqual(removed,uploaded);
 assert.match(uploaded[0],new RegExp("^claims/"+user.id+"/"+claimId+"/[a-f0-9-]{36}\\.webp$"));
});

test("RE-06: moderator cannot approve unverified rights with blank review notes",async()=>{
 let called=false;
 const route=load("src/app/api/admin/project-claims/route.ts",{
  "@/lib/security/auth":{authenticatedStorage:async()=>({
   user:{id:"reviewer",app_metadata:{role:"admin"}},
   client:{rpc(){called=true;throw new Error("Must not approve without evidence")}},
  })},
  "@/lib/security/request":request,"@/lib/security/validators":validators,
 });
 const response=await route.POST(makeRequest("/api/admin/project-claims",{
  id:"00000000-0000-0000-0000-000000000001",type:"media",decision:"approved",notes:"approved",
 }));
 assert.equal(response.status,400);
 assert.equal(called,false);
 const sql=fs.readFileSync("supabase/migrations/20261020091500_re_master_98_project_media_claims.sql","utf8");
 assert.match(sql,/Documented independent claim review evidence required/);
 assert.match(sql,/Documented independent media review evidence required/);
});
