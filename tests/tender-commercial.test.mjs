import test from "node:test";
import assert from "node:assert/strict";
import {loadTenderTs} from "./helpers/tender-upgrade-loader.mjs";
const services=loadTenderTs("src/lib/tender/services.ts"),commercial=loadTenderTs("src/lib/tender/commercial.ts",{"./services":services});
const ACTOR="edb636b8-1c11-4e70-b0aa-ff38d965c888",ID="edb636b8-1c11-4e70-b0aa-ff38d965c777";
const input={id:ID,expectedRevision:0,stage:"quoted",fee:"1250.25",currency:"INR",quoteRef:"QUOTE-2026-01",invoiceRef:"",paidDate:"",note:"Written quote shared",confirmed:true};
const request={request_id:ID,service:"document_review",contact_name:"QA Buyer",contact_email:"qa@example.invalid",organisation:"Fixture Business",phone:"+919999999999",country:"India",notes:"Please review the official document checklist.",tender_id:null};
const raw=services.serviceMessage(request,null);
test("commercial stages preserve the existing private request and intake retry identity",()=>{
 const quoted=commercial.nextTenderCommercial(input,null,ACTOR),message=commercial.appendTenderCommercial(raw,quoted);
 assert.equal(quoted.feeMinor,125025);assert.equal(commercial.parseTenderCommercial(message).quoteRef,input.quoteRef);
 assert.equal(services.parseServiceMessage(message).notes,request.notes);
 assert.equal(services.sameServiceSubmission({...request,application_type:"general",message,consent_to_contact:true},request),true);
});
test("a full-fee payment requires a recorded quote, acceptance, explicit confirmation, valid date and invoice",()=>{
 const quoted=commercial.nextTenderCommercial(input,null,ACTOR);
 assert.throws(()=>commercial.nextTenderCommercial({...input,expectedRevision:1,stage:"paid",paidDate:"2026-11-01",invoiceRef:"INV-1"},quoted,ACTOR),/acceptance/);
 const accepted=commercial.nextTenderCommercial({...input,expectedRevision:1,stage:"accepted"},quoted,ACTOR);
 const paid=commercial.nextTenderCommercial({...input,expectedRevision:2,stage:"paid",paidDate:"2026-11-01",invoiceRef:"INV-1"},accepted,ACTOR);
 assert.equal(paid.stage,"paid");assert.equal(paid.revision,3);
 assert.throws(()=>commercial.nextTenderCommercial({...input,expectedRevision:3},paid,ACTOR),/cannot be overwritten/);
 for(const patch of [{confirmed:false},{invoiceRef:""},{paidDate:"2099-01-01"},{paidDate:"2026-02-31"},{fee:"1200"},{currency:"USD"}])assert.throws(()=>commercial.nextTenderCommercial({...input,expectedRevision:2,stage:"paid",paidDate:"2026-11-01",invoiceRef:"INV-1",...patch},accepted,ACTOR));
});
test("payment dates follow the recorded business calendar zone across the international day boundary",()=>{
 const quote=commercial.nextTenderCommercial(input,null,ACTOR),accepted=commercial.nextTenderCommercial({...input,expectedRevision:1,stage:"accepted"},quote,ACTOR);
 const now=new Date("2026-11-08T23:00:00Z");
 const paid=commercial.nextTenderCommercial({...input,expectedRevision:2,stage:"paid",invoiceRef:"INV-IST",paidDate:"2026-11-09",paidZone:"Asia/Kolkata"},accepted,ACTOR,now);
 assert.equal(paid.paidZone,"Asia/Kolkata");
 assert.throws(()=>commercial.nextTenderCommercial({...input,expectedRevision:2,stage:"paid",invoiceRef:"INV-UTC",paidDate:"2026-11-09",paidZone:"UTC"},accepted,ACTOR,now));
});
test("money and revision validation prevents malformed fees, forged fields and stale writes",()=>{
 for(const value of ["0","-1","Infinity","1e5","1.001","999999999999"] )assert.equal(commercial.commercialMoney(value),null);
 assert.throws(()=>commercial.nextTenderCommercial({...input,updatedBy:"forged"},null,ACTOR));
 const q=commercial.nextTenderCommercial(input,null,ACTOR);assert.throws(()=>commercial.nextTenderCommercial(input,q,ACTOR),/Refresh/);
 assert.throws(()=>commercial.appendTenderCommercial("unrelated partner request",q));
});
test("page totals separate currencies and stages; lost or unquoted/closed enquiries are not payment revenue",()=>{
 const quoted=commercial.nextTenderCommercial(input,null,ACTOR);
 const totals=commercial.commercialPageTotals([{commercial:quoted},{commercial:{...quoted,stage:"accepted"}},{commercial:{...quoted,stage:"paid"}},{commercial:{...quoted,stage:"lost"}},{commercial:{...quoted,currency:"USD",stage:"paid"}},{}]);
 assert.equal(totals.length,2);assert.equal(totals[0].paid,125025);assert.equal(totals[0].quoted,125025);assert.equal(totals[1].paid,125025);
});
function routeHarness({role="admin",collision=false,dbError=false,message=raw}={}){
 const calls=[],user={id:ACTOR,app_metadata:{role},user_metadata:{role:"admin"}};
 const client={from(table){calls.push(["from",table]);let update=false;const q=new Proxy({}, {get(_t,key){if(key==="then")return (resolve,reject)=>Promise.resolve(dbError?{error:{message:"private SQL detail"},data:null}:{error:null,data:update?(collision?null:{id:ID}):{id:ID,message}}).then(resolve,reject);return (...args)=>{calls.push([key,...args]);if(key==="update")update=true;return q;};}});return q;}};
 class RequestError extends Error{constructor(message,status){super(message);this.status=status;}}
 const api=loadTenderTs("src/app/api/admin/tender-services/route.ts",{"@/lib/tender/commercial":commercial,"@/lib/security/rate-limit":{enforceRateLimit:async(...args)=>{assert.equal(args[1],"tender_operations");calls.push(["budget"]);}},"@/lib/security/auth":{authenticatedStorage:async()=>({client,user})},"@/lib/security/request":{RequestError,readJson:req=>req.json(),requestError:error=>Response.json({error:error.message},{status:error.status??503})},"@/lib/tender/services":services});
 return {calls,post:body=>api.POST(new Request("https://gth.test/api/admin/tender-services",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(body)}))};
}
test("actual admin POST enforces trusted role before reads and compares the original message before an update",async()=>{
 const denied=routeHarness({role:"member"});assert.equal((await denied.post(input)).status,403);assert.equal(denied.calls.length,0);
 const ok=routeHarness();const r=await ok.post(input);assert.equal(r.status,200);assert.equal(r.headers.get("cache-control"),"private, no-store");
 assert.ok(ok.calls.some(([method,key,value])=>method==="eq"&&key==="message"&&value===raw));
 const update=ok.calls.find(([method])=>method==="update")[1];assert.equal(Object.keys(update).sort().join(","),"message,updated_at");
 assert.equal(commercial.parseTenderCommercial(update.message).updatedBy,ACTOR);
 const raced=routeHarness({collision:true});assert.equal((await raced.post(input)).status,409);
 const broken=routeHarness({dbError:true});const failure=await broken.post(input);assert.equal(failure.status,503);assert.doesNotMatch(await failure.text(),/private SQL/);
 const other=routeHarness({message:"Not a tender enquiry"});assert.equal((await other.post(input)).status,404);
});
