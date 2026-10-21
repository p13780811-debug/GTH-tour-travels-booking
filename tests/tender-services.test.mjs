import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import ts from 'typescript';
import {validateServiceRequest,serviceMessage,parseServiceMessage,sameServiceSubmission,TENDER_SERVICES} from '../src/lib/tender/services.ts';
const input={request_id:'edb636b8-1c11-4e70-b0aa-ff38d965c777',service:'eligibility_review',contact_name:'Test Reviewer',
 contact_email:'qa@example.invalid',organisation:'GTH QA Test',phone:'+91 99999 99999',country:'India',
 notes:'Review our eligibility requirements and missing document checklist.',tender_id:null,consent_to_contact:true,website_check:''};
test('all four quote services accept bounded international contact details',()=>{
 for(const service of TENDER_SERVICES){const result=validateServiceRequest({...input,service:service.id});assert.ok(result.ok);assert.equal(result.value.phone,'+919999999999');}
 assert.equal(validateServiceRequest({...input,phone:'+44 (20) 7946-0958'}).ok,true);
});
test('consent, injection, unexpected commercial fields and malformed IDs fail closed',()=>{
 for(const change of [{consent_to_contact:false},{website_check:'bot'},{price:1},{status:'paid'},{contact_name:'<script>alert(1)</script>'},
  {contact_email:'x\r\n@example.invalid'},{notes:'short'},{notes:'a'.repeat(901)},{phone:'123'},{phone:'0000000000'},
  {request_id:'unknown'},{tender_id:'../../secret'},{organisation:'<b>Business</b>'},{service:'award_guarantee'}])
  assert.equal(validateServiceRequest({...input,...change}).ok,false,JSON.stringify(change));
});
test('versioned storage is bounded and does not accept arbitrary partner messages',()=>{
 const request=validateServiceRequest(input).value,message=serviceMessage(request,'Official notice');
 assert.deepEqual(parseServiceMessage(message),{service:input.service,phone:'+919999999999',notes:input.notes,tender_id:null,tender_title:'Official notice'});
 assert.equal(parseServiceMessage('General business enquiry'),null);
 assert.equal(parseServiceMessage('TENDER_SERVICE_REQUEST_V1\n{}'),null);
 assert.equal(parseServiceMessage('TENDER_SERVICE_REQUEST_V1\nnull'),null);
 const worst=serviceMessage({...request,notes:'"'.repeat(900)},'"'.repeat(240));
 assert.ok(worst.length<=3000);assert.ok(parseServiceMessage(worst));
});
test('idempotency requires the exact original submission, not just a guessed UUID',()=>{
 const request=validateServiceRequest(input).value,message=serviceMessage(request,null);
 const saved={...request,application_type:'general',message,consent_to_contact:true};
 assert.equal(sameServiceSubmission(saved,request),true);
 for(const field of ['contact_email','contact_name','organisation','country','message','application_type'])
   assert.equal(sameServiceSubmission({...saved,[field]:'changed'},request),false);
 assert.equal(sameServiceSubmission({...saved,consent_to_contact:false},request),false);
});
// Exercise the actual handler with isolated provider boundaries; no live PII or credentials.
const routeSource=readFileSync(new URL('../src/app/api/tender/services/route.ts',import.meta.url),'utf8');
const stripped=routeSource.replace(/^import .*;\n/gm,'');
const compiled=ts.transpileModule(`const {createClient,enforceRateLimit,readJson,RequestError,requestError,getPublicTender,serviceMessage,sameServiceSubmission,validateServiceRequest}=globalThis.__tenderServiceTest;\n${stripped}`,{compilerOptions:{module:ts.ModuleKind.ESNext,target:ts.ScriptTarget.ES2022}}).outputText;
class RequestError extends Error{constructor(message,status){super(message);this.status=status;}}
async function handlerWith({insertError=null,existing=null,tender={ok:true,item:{title:'Server resolved title'}},rateError=null}={}){
 const writes=[];let checks=0;
 globalThis.__tenderServiceTest={
  createClient:()=>({from:()=>({insert:async row=>{writes.push(row);return {error:insertError};},select:()=>({eq:()=>({maybeSingle:async()=>({data:existing,error:null})})})})}),
  enforceRateLimit:async()=>{if(rateError)throw rateError;},
  readJson:async req=>req.json(),RequestError,requestError:error=>Response.json({error:error.message},{status:error.status??502}),
  getPublicTender:async()=>{checks++;return tender;},serviceMessage,sameServiceSubmission,validateServiceRequest,
 };
 const module=await import(`data:text/javascript;base64,${Buffer.from(compiled+`\n// ${crypto.randomUUID()}`).toString('base64')}`);
 return {POST:module.POST,writes,checks:()=>checks};
}
const post=body=>new Request('https://gth.test/api/tender/services',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body)});
const envUrl=process.env.NEXT_PUBLIC_SUPABASE_URL,envKey=process.env.SUPABASE_SERVICE_ROLE_KEY;
process.env.NEXT_PUBLIC_SUPABASE_URL='https://qa.supabase.co';process.env.SUPABASE_SERVICE_ROLE_KEY='test-only-never-shipped';
test('handler saves private general enquiry once, with server-resolved tender context',async()=>{
 const h=await handlerWith(),response=await h.POST(post({...input,tender_id:input.request_id}));
 assert.equal(response.status,201);assert.equal(response.headers.get('cache-control'),'no-store');
 assert.equal(h.checks(),1);assert.equal(h.writes.length,1);assert.equal(h.writes[0].status,'new');
 assert.equal(parseServiceMessage(h.writes[0].message).tender_title,'Server resolved title');
 assert.deepEqual(await response.json(),{received:true,reference:input.request_id});
});
test('rate limits, expired tenders and database outages never report a saved request',async()=>{
 for(const config of [{rateError:new RequestError('Too many requests',429)},{tender:{ok:true,item:null}},{insertError:{code:'XX000'}}]){
  const h=await handlerWith(config),r=await h.POST(post({...input,tender_id:input.request_id}));
  assert.ok([429,409,503].includes(r.status));assert.equal((await r.json()).received,undefined);
  if(!config.insertError)assert.equal(h.writes.length,0);
 }
});
test('duplicate insert confirms an identical request and rejects reference collisions',async()=>{
 const request=validateServiceRequest(input).value,message=serviceMessage(request,null);
 const existing={...request,application_type:'general',message,consent_to_contact:true};
 const accepted=await handlerWith({insertError:{code:'23505'},existing,tender:{ok:true,item:null}});
 assert.equal((await accepted.POST(post(input))).status,200);assert.equal(accepted.writes.length,0);assert.equal(accepted.checks(),0);
 const collision=await handlerWith({insertError:{code:'23505'},existing:{...existing,contact_email:'someoneelse@example.invalid'}});
 const response=await collision.POST(post(input));assert.equal(response.status,409);
 assert.ok(!(await response.text()).includes('someoneelse'));
});
test('private queue checks server-owned admin role and retains authenticated RLS client',()=>{
 const admin=readFileSync(new URL('../src/app/api/admin/tender-services/route.ts',import.meta.url),'utf8');
 assert.match(admin,/authenticatedStorage\(req\)/);assert.match(admin,/user\.app_metadata\?\.role!=="admin"/);
 assert.doesNotMatch(admin,/service_role|SERVICE_ROLE|user_metadata/);
 assert.match(admin,/private, no-store/);assert.match(admin,/\.eq\("application_type","general"\)/);
});
test.after(()=>{
 delete globalThis.__tenderServiceTest;
 if(envUrl===undefined)delete process.env.NEXT_PUBLIC_SUPABASE_URL;else process.env.NEXT_PUBLIC_SUPABASE_URL=envUrl;
 if(envKey===undefined)delete process.env.SUPABASE_SERVICE_ROLE_KEY;else process.env.SUPABASE_SERVICE_ROLE_KEY=envKey;
});
