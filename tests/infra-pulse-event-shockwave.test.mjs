import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import ts from "typescript";
const read=p=>readFileSync(new URL("../"+p,import.meta.url),"utf8");
function load(path,deps={}){
 const out=ts.transpileModule(read(path),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText;
 const exports={};new Function("exports","require",out)(exports,name=>{if(!(name in deps))throw Error("Unexpected import "+name);return deps[name];});return exports;
}
const rules=load("src/lib/intelligence/contracts.ts");
const registry=load("src/lib/intelligence/officialRegistry.ts",{"./contracts":rules});
const base={request_id:"a38b8540-994f-4d29-aedc-2541e6ae6795",kind:"infra",property_id:42,currency:"AED",full_name:"Example Investor",email:"investor@example.invalid",phone:"+919999999999",services:["investor_dossier"],consent:true,notes:"Request reviewed records"};
test("Data Guard rejects raw and Unicode-normalized markup, unconsented and oversized leads",()=>{
 assert.equal(rules.validateIntelligenceLead(base).currency,"AED");
 for(const patch of [{consent:false},{full_name:"＜script＞"},{phone:"9999999999"},{currency:"BTC"},{notes:"x".repeat(1001)},{tender_ids:["injected"]},{property_id:"42"},{services:["hotel_blocks"]}])assert.throws(()=>rules.validateIntelligenceLead({...base,...patch}));
});
test("hospitality requests require a known source identity and bounded group size",()=>{
 const input={...base,kind:"hospitality",property_id:undefined,target:{kind:"stadium",id:"eden-gardens"},services:["hotel_blocks","group_transport"],group_size:30};
 assert.equal(rules.validateIntelligenceLead(input).groupSize,30);
 for(const patch of [{target:{kind:"stadium",id:"eden-gardens",fake:true}},{target:{kind:"osm",id:"unknown"}},{group_size:5001},{services:["hotel_blocks","hotel_blocks"]}])assert.throws(()=>rules.validateIntelligenceLead({...input,...patch}));
});
test("WhatsApp does not invent a destination or silently send an enquiry",()=>{
 assert.equal(rules.conciergeWhatsApp(undefined,"hello"),null);
 assert.equal(rules.conciergeWhatsApp("+919999999999","hello"),null);
 const url=new URL(rules.conciergeWhatsApp("919999999999","Property:42, Currency:AED, Tender:a,b"));
 assert.equal(url.hostname,"wa.me");assert.equal(url.searchParams.get("text"),"Property:42, Currency:AED, Tender:a,b");
});
test("official schemas retain unverified locality as noindex and reject provenance laundering",()=>{
 const row={country_code:"IN",authority:"MAHARERA",record_id:"P00000000001",record_kind:"project",project_name:"Example archived record",district:"Thane",locality:"Recorded village",source_url:"https://maharera.maharashtra.gov.in/",license:"unconfirmed",source_status:"historical_unverified",rights_confirmed:false,locality_verified:false};
 assert.equal(registry.validateOfficialRegistry(row).indexable,false);
 for(const patch of [{locality_verified:true},{rights_confirmed:true},{raw_json:{}},{country_code:"AE"},{source_url:"https://maharera.maharashtra.gov.in.evil.example/"},{source_url:"https://user:secret@maharera.maharashtra.gov.in/"}])assert.throws(()=>registry.validateOfficialRegistry({...row,...patch}));
 const uk={...row,country_code:"GB",authority:"HM_LAND_REGISTRY",record_id:"source-transaction-id",record_kind:"sale_transaction",source_url:"https://publicdata.landregistry.gov.uk/",license:"OGL-UK-3.0",source_status:"official_dataset",rights_confirmed:true};
 assert.equal(registry.validateOfficialRegistry(uk).indexable,false);
});
test("matched tenders are attached in batches and the count is not presented as property appreciation",()=>{
 const panel=read("src/components/intelligence/InfraPulsePanel.tsx");
 assert.match(panel,/does not establish a high-growth corridor/);
 assert.match(read("src/lib/intelligence/infraPulse.ts"),/slice\(0,24\)/);
 assert.doesNotMatch(read("src/components/real-estate/ExplorerCard.tsx"),/fetch\(/);
 const event=read("src/lib/intelligence/eventShockwave.ts");
 assert.match(event,/from\("hotels"\)/);assert.match(event,/\.eq\("city",city\)\.eq\("country_code",country\)/);
 assert.doesNotMatch(event,/NUITEE_PRODUCTION_API_KEY|api\.liteapi|prebook|\.from\("hotel_catalog"\)/);
});
