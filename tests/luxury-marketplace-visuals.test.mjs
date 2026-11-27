import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync,existsSync} from "node:fs";
import {loadTenderTs as load} from "./helpers/tender-upgrade-loader.mjs";
const m=load("src/lib/destinations/visual-media.ts");
test("all 21 AI editorial assets are real mobile-sized WebP files, not placeholders",()=>{
 const images=Object.values(m.LUXURY_VISUALS);
 assert.equal(images.length,21);assert.equal(new Set(images).size,21);
 for(const src of images){assert.match(src,/^\/images\/luxury\/[a-z]+\.webp$/);const b=readFileSync("public"+src);assert.equal(b.subarray(0,4).toString(),"RIFF");assert.equal(b.subarray(8,12).toString(),"WEBP");assert.ok(b.length>10000&&b.length<160000,src);assert.equal(m.isIllustrativeVisual(src),true);}
});
test("regional and exact-city images stay country-bound and unknown identity has a local fallback",()=>{
 for(const [code,asset] of [["IN","southasia"],["TH","southeastasia"],["JP","eastasia"],["AE","westasia"],["GB","europe"],["GH","africa"],["US","northamerica"],["BR","latinamerica"],["AU","oceania"]])assert.equal(m.destinationVisual("unmapped-city",code,null),m.LUXURY_VISUALS[asset]);
 assert.equal(m.destinationVisual("london","GB","/images/cities/london.jpg"),m.LUXURY_VISUALS.london);
 assert.equal(m.destinationVisual("london-ca","CA",null),m.LUXURY_VISUALS.northamerica);
 assert.equal(m.destinationVisual("unmapped","ZZ",null),m.LUXURY_VISUALS.hero);
 assert.equal(m.destinationVisual("goa","IN","/images/cities/goa.jpg"),"/images/cities/goa.jpg");
 assert.equal(m.venueVisual("melbourne-cricket-ground"),m.LUXURY_VISUALS.melbourne);
 assert.equal(m.venueVisual("wankhede-stadium"),m.LUXURY_VISUALS.mumbai);
 for(const key of ["hotels","flights","tickets","packages","transfers","properties","tenders","train"])assert.ok(existsSync("public"+m.destinationServicePhoto(key)));
});
test("native package route and full city catalogue reuse existing booking components and only public read access",()=>{
 const read=p=>readFileSync(p,"utf8");
 assert.match(read("src/app/app/packages/page.tsx"),/<TravelPackagePlanner\/>/);
 const src=read("src/lib/mobile/destination-catalog.ts");
 assert.match(src,/from\("destinations"\)/);assert.match(src,/\.is\("is_active",true\)/);assert.match(src,/\.abortSignal\(/);
 assert.doesNotMatch(src,/SERVICE_ROLE|\.insert\(|\.upsert\(|\.update\(|\.delete\(/);
 assert.match(read("src/components/destination/DiscoveryCardPhoto.tsx"),/isIllustrativeVisual\(image\)/);
 assert.match(read("src/app/mega-aggregator/EcosystemUnifiedSearch.tsx"),/no generative API calls/);
});
