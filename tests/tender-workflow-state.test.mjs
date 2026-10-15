import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import vm from "node:vm";
import ts from "typescript";

const src=readFileSync(new URL("../src/lib/tender/workflow-state.ts",import.meta.url),"utf8");
const js=ts.transpileModule(src,{compilerOptions:{target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.CommonJS}}).outputText;
const mod={exports:{}};
vm.runInNewContext(js,{module:mod,exports:mod.exports,Date,Set,Number,Array},{timeout:2000});
const {parsePreparation,deriveReadiness,EMPTY_PREPARATION,REVIEW_IDS}=mod.exports;

const date=(days)=>new Date(Date.now()+days*86400000).toISOString();
function input(overrides={}){return {...EMPTY_PREPARATION,version:1,...overrides};}
test("Empty preparation cannot claim bid submitted or official criteria verified",()=>{
 const state=parsePreparation(input());
 assert.equal(state.external_submission,"not_reported");
 const report=deriveReadiness(state,false,date(4));
 assert.ok(report.blockers.length>=3);
 assert.equal(report.status,"review-required");
});
test("Only owner-declared progress can advance checklist and still needs official review",()=>{
 const state=parsePreparation(input({checked_documents:["Business registration proof"],
  checked_prebid:Array.from(REVIEW_IDS),notice_reviewed_at:new Date().toISOString()}));
 const report=deriveReadiness(state,false,date(4));
 assert.equal(report.status,"review-required");
 assert.ok(report.blockers.some(x=>x.toLowerCase().includes("official")));
});
test("Unverified submissions can only be labelled user-reported",()=>{
 const status=parsePreparation(input({external_submission:"user_reported",external_submission_recorded_at:new Date().toISOString()}));
 const report=deriveReadiness(status,false,date(4));
 assert.equal(report.status,"user-reported-external-submission");
 assert.ok(report.blockers.length);
});
test("Unknown, oversized, secret-like or unstructured values fail closed",()=>{
 for(const bad of [
   input({checked_documents:["b"]}),
   input({checked_documents:["PAN\u0000number"]}),
   input({checked_documents:Array(26).fill("document")}),
   input({checked_prebid:["verified_bid_submission"]}),
   input({external_submission:"officially_approved"}),
   input({external_submission:"user_reported"}),
   input({version:999}),
   {...input(),admin_approved:true},
 ])assert.throws(()=>parsePreparation(bad));
});
test("Timezone aware ISO dates normalized and deadline warning accurate",()=>{
 const parsed=parsePreparation(input({notice_reviewed_at:new Date().toISOString()}));
 assert.ok(parsed.notice_reviewed_at.endsWith("Z"));
 const exp=deriveReadiness(parsed,false,date(-1));
 assert.equal(exp.expired,true);
 const soon=deriveReadiness(parsed,false,date(2));
 assert.equal(soon.soon,true);
});
test("Workspace endpoint persists owner-only review state and independently resolves official catalog fields",()=>{
 const code=readFileSync(new URL("../src/app/api/tender/workspaces/route.ts",import.meta.url),"utf8");
 assert.match(code,/authenticatedStorage\(req\)/);
 assert.match(code,/eq\("owner_id",user\.id\)/);
 assert.match(code,/parsePreparation\(ni\.preparation/);
 assert.match(code,/deadline_snapshot=new Date\(source\.deadline_at\)/);
 assert.match(code,/source_updated_snapshot=new Date\(source\.updated_at\)/);
 assert.match(code,/official_notice_changed:changed/);
 assert.match(code,/linked\?\.title\?\?title\.trim\(\)/);
 assert.doesNotMatch(code,/service_role|SUPABASE_SERVICE_ROLE_KEY/);
});
