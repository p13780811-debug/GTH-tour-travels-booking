import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
const read=p=>readFileSync(new URL("../"+p,import.meta.url),"utf8");
test("publisher tag exact account, secure origin, permitted functions",()=>{
 const s=read("src/components/travel/ImpactPublisherConsent.tsx");
 assert.ok(s.includes("https://utt.impactcdn.com/P-A7994211-fddb-452e-b462-635aeb20c5681.js"));
 assert.match(s,/window\.impactStat\?\.\("transformLinks"\)/);
 assert.match(s,/window\.impactStat\?\.\("trackImpression"\)/);
 assert.match(s,/u\.hostname!=="utt\.impactcdn\.com"/);
 assert.doesNotMatch(s,/trackConversion|partnercustid|customeremail/);
});
test("optional travel-scoped consent, with accessible rejection and revocation",()=>{
 const s=read("src/components/travel/ImpactPublisherConsent.tsx");
 const wrapper=read("src/components/LayoutWrapper.tsx");
 const root=read("src/app/layout.tsx");
 for(const path of ['"/travel"','"/tours"','"/activities"','"/guides"','"/blog"','"/destinations"','"/attractions"'])assert.ok(s.includes(path),path);
 assert.doesNotMatch(s,/PATHS=[^\n]*(real-estate|tender|admin)/);
 assert.match(s,/if\(!active\|\|choice!=="allow"\)return/);
 assert.match(s,/localStorage\.getItem\(KEY\)/);
 assert.match(s,/localStorage\.setItem\(KEY,c\)/);
 assert.match(s,/location\.reload\(\)/);
 assert.match(s,/Decline/);
 assert.match(wrapper,/<ImpactPublisherConsent \/>/);
 assert.doesNotMatch(root,/impactcdn|ImpactPublisherConsent/);
});
test("Impact is explained in privacy and affiliate policies",()=>{
 assert.match(read("src/app/privacy-policy/page.tsx"),/<ImpactConsentSettings \/>/);
 assert.match(read("src/app/affiliate-disclosure/page.tsx"),/Impact\.com Publisher STAT tag/);
});
