import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
const f=p=>readFileSync(new URL("../"+p,import.meta.url),"utf8");

test("Tender assistant presents real guided application steps and editable draft",()=>{
 const ui=f("src/components/tender/TenderAssistant.tsx");
 const route=f("src/app/tender/assistant/page.tsx");
 for(const step of ["Tender notice","Business profile","Eligibility conditions","Eligibility result","Documents","Prepare application"]){
   assert.ok(ui.includes(step),step);
 }
 for(const method of ["evaluateEligibility(","buildBidPacket(","downloadDraft","saveDraft","loadList","askAI","requestOtp"]){
   assert.ok(ui.includes(method),method);
 }
 assert.match(ui,/No submission, fee payment or document upload is performed here/);
 assert.match(ui,/aiConsent/);
 assert.match(route,/getPublicTender/);
 assert.match(f("src/app/tender/page.tsx"),/Start Guided Tender Assistant/);
 assert.match(f("src/app/tender\/\[id\]\/page.tsx"),/Check eligibility & prepare draft/);
});
test("Eligibility cannot be faked without official criteria and evidence",()=>{
 const code=f("src/lib/tender/eligibility.ts");
 assert.match(code,/insufficient_criteria/);
 assert.match(code,/needs_review/);
 assert.match(code,/not_meeting_stated_conditions/);
 assert.match(code,/potential_match/);
 assert.match(code,/if\(!criteriaVerified\)/);
 assert.match(code,/no automatic currency conversion/i);
 assert.match(code,/NOT SUBMITTED/);
});
test("Private user drafts have owner-bound RLS and no public submission",()=>{
 const sql=f("supabase/migrations/20261013232000_tender_ai_assistant_v1.sql");
 const route=f("src/app/api/tender/workspaces/route.ts");
 const ai=f("src/app/api/tender/assistant/route.ts");
 assert.match(sql,/tender_bid_workspaces enable row level security/);
 assert.match(sql,/owner_id = \(select auth.uid\(\)\)/);
 assert.match(sql,/grant select,insert,update,delete on public.tender_bid_workspaces to authenticated/);
 assert.match(route,/authenticatedStorage\(req\)/);
 assert.match(route,/\.eq\("owner_id",user.id\)/);
 assert.match(route,/enforceRateLimit\(req,"submissions"/);
 assert.match(ai,/GEMINI_API_KEY/);
 assert.match(ai,/enforceRateLimit\(req,"ai"\)/);
 assert.doesNotMatch(ai,/SERVICE_ROLE/);
 assert.doesNotMatch(ai,/upload.*file.*to.*provider/i);
});
