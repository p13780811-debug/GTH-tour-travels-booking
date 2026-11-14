import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
const source=path=>readFileSync(new URL("../"+path,import.meta.url),"utf8");

test("QR visiting poster is generated locally, contains broker/projects and explicit public branding",()=>{
 const poster=source("src/lib/client/broker-poster.ts");
 const broker=source("src/components/real-estate/BrokerCatalogGenerator.tsx");
 const picker=source("src/components/real-estate/BrokerProjectPicker.tsx");
 assert.match(poster,/document.createElement\("canvas"\)/);
 assert.match(poster,/qrcodegen\.QrCode\.encodeText/);
 assert.match(poster,/toDataURL\("image\/png"\)/);
 assert.match(poster,/Powered by gthproglobal\.com/);
 assert.match(poster,/input\.projects\.length>5/);
 assert.match(poster,/href\.origin!==window\.location\.origin/);
 assert.doesNotMatch(poster,/fetch\(|supabase|qrserver|quickchart|MediaRecorder/i);
 assert.match(broker,/Download Ready-to-Share Poster \(PNG\)/);
 assert.match(broker,/posterNames:slugs\.map/);
 assert.match(broker,/onLabels=\{names=>setProjectNames/);
 assert.match(broker,/if\(!consent\)/);
 assert.match(picker,/onLabels\?\.\(\{\[project\.slug\]:project\.title\}\)/);
});

test("comparison WhatsApp shares only 2-3 source-backed records, never private notes",()=>{
 const share=source("src/components/engagement/ShareComparisonButton.tsx");
 assert.match(share,/items\.length<2\|\|items\.length>3/);
 assert.match(share,/https:\/\/wa\.me\/\?text=/);
 assert.match(share,/encodeURIComponent\(lines\.join/);
 assert.match(share,/source: /);
 assert.match(share,/No message was sent automatically/);
 assert.match(source("src/app/real-estate/saved/page.tsx"),/ShareComparisonButton kind="property"/);
 assert.match(source("src/app/real-estate/saved/page.tsx"),/Compare Side-by-Side/);
 assert.match(source("src/components/tender/TenderSavedWorkspace.tsx"),/ShareComparisonButton kind="tender"/);
 assert.match(source("src/app/real-estate/registry/compare/page.tsx"),/ShareComparisonButton kind="registry"/);
 assert.doesNotMatch(share,/localStorage|supabase|fetch\(/i);
});

test("tender score is a bounded self-assessment and PDF has real first-party quote annotation",()=>{
 const rules=source("src/lib/tender/readiness-score.ts");
 const pdf=source("src/lib/client/comparison-pdf.ts");
 const form=source("src/components/tender/BidReadinessReport.tsx");
 assert.match(rules,/not an eligibility decision|Not an eligibility decision/i);
 assert.match(rules,/score=steps\.reduce/);
 assert.match(rules,/points:input\.msme!=="unknown"\?10:0/);
 assert.match(rules,/^\s*const numeric=.*=>/m);
 assert.match(pdf,/export function downloadTenderReadinessCanvas/);
 assert.match(pdf,/https:\/\/gthproglobal\.com\/tender\/services\?service=eligibility_review/);
 assert.match(pdf,/pdfFromJpeg\(jpeg,/);
 assert.match(form,/Download 1-page Readiness PDF/);
 assert.match(form,/downloadTenderReadinessCanvas\(canvas\)/);
 assert.match(form,/Request a bid support quote/);
 assert.match(source("src/app/tender/page.tsx"),/<BidReadinessReport\/>/);
 assert.doesNotMatch(form,/fetch\(|supabase|localStorage|service_role/i);
});

test("group trip sharing has exact first-party hotel, flight and venue links; no invented seats/rates",()=>{
 const share=source("src/components/engagement/ShareTripPlanButton.tsx");
 assert.match(share,/https:\/\/wa\.me\/\?text=/);
 assert.match(share,/onClick=\{share\}/);
 assert.match(share,/\/hotels\?/);
 assert.match(share,/\/flights\?/);
 assert.match(share,/confirm the nearest suitable airport/);
 assert.match(share,/Nothing has been sent automatically/);
 assert.doesNotMatch(share,/fetch\(|supabase|\/api\/hotels\/search/i);
 for(const path of [
 "src/app/stadiums/StadiumEventDiscovery.tsx",
 "src/app/stadiums/StadiumUpcomingEvents.tsx",
 "src/app/stadiums/[slug]/page.tsx",
 "src/app/travel/page.tsx",
 "src/app/flights/page.tsx"]){
  assert.match(source(path),/<ShareTripPlanButton /,path);
 }
});
