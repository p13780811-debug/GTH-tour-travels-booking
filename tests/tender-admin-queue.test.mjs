import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import ts from 'typescript';
import {parseServiceMessage, SERVICE_MESSAGE_PREFIX, serviceMessage, validateServiceRequest} from '../src/lib/tender/services.ts';

const source=readFileSync(new URL('../src/app/api/admin/tender-services/route.ts',import.meta.url),'utf8').replace(/^import .*;\n/gm,'');
class RequestError extends Error { constructor(message,status){super(message);this.status=status;} }
const submission=validateServiceRequest({request_id:'edb636b8-1c11-4e70-b0aa-ff38d965c777',service:'eligibility_review',contact_name:'Release QA',contact_email:'qa@example.invalid',organisation:'QA organisation',phone:'+919999999999',country:'India',notes:'Review the official eligibility documents and checklist.',tender_id:null,consent_to_contact:true,website_check:''}).value;
async function queue({role='admin',authError=null,error=null,rows=[],count=0}={}){
 const calls=[];
 const query={};
 for(const method of ['select','eq','like','order'])query[method]=(...args)=>{calls.push([method,...args]);return query;};
 query.range=async(...args)=>{calls.push(['range',...args]);return {data:rows,error,count};};
 globalThis.__gthQueueBoundary={authenticatedStorage:async()=>{
  if(authError)throw authError;
  return {user:{app_metadata:{role},user_metadata:{role:'admin'}},client:{from:name=>{calls.push(['from',name]);return query;}}};
 },RequestError,requestError:err=>Response.json({error:err.message},{status:err.status??503}),parseServiceMessage,SERVICE_MESSAGE_PREFIX};
 const compiled=ts.transpileModule(`const {authenticatedStorage,RequestError,requestError,parseServiceMessage,SERVICE_MESSAGE_PREFIX}=globalThis.__gthQueueBoundary;\n${source}`,{compilerOptions:{module:ts.ModuleKind.ESNext,target:ts.ScriptTarget.ES2022}}).outputText;
 const handler=await import(`data:text/javascript;base64,${Buffer.from(compiled+`\n//${crypto.randomUUID()}`).toString('base64')}`);
 return {calls,get:search=>handler.GET(new Request(`https://gth.test/api/admin/tender-services${search??''}`))};
}
test('private queue refuses missing authentication and forged user-editable admin metadata before any database read',async()=>{
 for(const config of [{authError:new RequestError('Sign in required',401)},{role:'member'}]){
  const h=await queue(config),r=await h.get();assert.ok([401,403].includes(r.status));assert.equal(h.calls.length,0);
 }
});
test('trusted admin queue uses the authenticated client, bounded pages and escaped service prefix',async()=>{
 const h=await queue({rows:[{id:submission.request_id,message:serviceMessage(submission,null),contact_name:submission.contact_name,contact_email:submission.contact_email,status:'reviewing',submitted_at:'2026-10-23T00:00:00Z'}],count:21});
 const r=await h.get('?status=reviewing&page=2'),body=await r.json();
 assert.equal(r.status,200);assert.equal(r.headers.get('cache-control'),'private, no-store');assert.equal(body.items[0].request_id,submission.request_id);assert.equal(body.total,21);
 assert.ok(h.calls.some(c=>c[0]==='range'&&c[1]===20&&c[2]===39));
 assert.ok(h.calls.some(c=>c[0]==='eq'&&c[1]==='application_type'&&c[2]==='general'));
 assert.ok(h.calls.some(c=>c[0]==='like'&&c[2]===SERVICE_MESSAGE_PREFIX.replace(/_/g,'\\_')+'%'));
});
test('queue rejects injected filters and out-of-range pagination before querying private contacts',async()=>{
 for(const search of ['?status=paid','?page=0','?page=10000','?page=1%20or%201=1']){
  const h=await queue(),r=await h.get(search);assert.equal(r.status,400);assert.equal(h.calls.length,0);
 }
});
test('private queue hides provider diagnostics and handles an exhausted page',async()=>{
 const h=await queue({error:{code:'XX000',message:'private provider diagnostics'}}),r=await h.get();
 assert.equal(r.status,503);assert.ok(!(await r.text()).includes('private provider diagnostics'));
 const exhausted=await queue({error:{code:'PGRST103'}}),response=await exhausted.get('?page=2');
 assert.deepEqual(await response.json(),{items:[],total:0,page:2});
});
test.after(()=>{delete globalThis.__gthQueueBoundary;});
