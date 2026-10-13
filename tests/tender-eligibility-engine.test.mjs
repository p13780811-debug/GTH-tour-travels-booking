import test from "node:test";
import assert from "node:assert/strict";
import {
  evaluateEligibility, buildBidPacket, EMPTY_PROFILE, EMPTY_REQUIREMENTS
} from "../src/lib/tender/eligibility.ts";

const bidder={
  ...EMPTY_PROFILE,business_name:"Declared Example Ltd",business_country:"IN",
  contact_name:"Person",years_experience:"5",annual_turnover:"1000000",
  turnover_currency:"INR",registrations:"Company registration\nGST",
  available_documents:"Audited statement\nRegistration certificate",
  capability_statement:"Completed relevant services — operator must verify."
};
const criteria={
 ...EMPTY_REQUIREMENTS,min_experience_years:3,min_annual_turnover:500000,
 turnover_currency:"INR",eligible_countries:["IN"],required_registrations:["GST"],
 required_documents:["Audited statement"]
};

test("no official requirements produces insufficient information, not eligible",()=>{
 const r=evaluateEligibility(bidder,EMPTY_REQUIREMENTS,true);
 assert.equal(r.status,"insufficient_criteria");
});
test("manual AI-extracted/user-entered requirements never certify eligibility",()=>{
 const r=evaluateEligibility(bidder,criteria,false);
 assert.equal(r.status,"needs_review");
 assert.ok(r.warning.includes("not independently verified"));
});
test("verified requirements plus explicit mismatch are flagged",()=>{
 const r=evaluateEligibility({...bidder,years_experience:"1"},criteria,true);
 assert.equal(r.status,"not_meeting_stated_conditions");
 assert.equal(r.checks.find(x=>x.label==="Minimum experience")?.result,"gap");
});
test("currency mismatch and absent answer must require review, never fake conversion",()=>{
 const r=evaluateEligibility({...bidder,turnover_currency:"USD"},criteria,true);
 assert.equal(r.status,"needs_review");
 assert.equal(r.checks.find(x=>x.label==="Minimum annual turnover")?.result,"unknown");
});
test("verified clauses with matching declarations only yield POTENTIAL match",()=>{
 const r=evaluateEligibility(bidder,criteria,true);
 assert.equal(r.status,"potential_match");
 assert.match(r.warning,/not final eligibility/i);
});
test("draft packet cannot claim filing, proof or false missing data",()=>{
 const report=evaluateEligibility(bidder,criteria,false);
 const packet=buildBidPacket({...bidder,contact_name:""},{title:"Infrastructure procurement",buyer:"Government buyer"},criteria,report);
 assert.match(packet,/NOT SUBMITTED/);
 assert.match(packet,/\[TO BE COMPLETED BY BIDDER\]/);
 assert.match(packet,/official tender notice/i);
 assert.match(packet,/cannot submit or claim/i);
});
