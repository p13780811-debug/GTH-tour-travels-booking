import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync,existsSync} from "node:fs";
const read=p=>readFileSync(new URL("../"+p,import.meta.url),"utf8");
const page=read("src/app/mega-aggregator/page.tsx");
const hero=read("src/app/mega-aggregator/EcosystemHeroCarousel.tsx");
const search=read("src/app/mega-aggregator/EcosystemUnifiedSearch.tsx");

test("keeps the exact approved heading and uses five original local photos",()=>{
 assert.match(hero,/Your world\. One connected gateway\./);
 const images=["/images/mega/hotels.jpg","/images/mega/flights.jpg","/images/mega/tours.jpg","/images/real-estate.jpg","/images/tender.jpg"];
 for(const img of images){
  assert.ok(hero.includes(img),"Missing slide "+img);
  assert.ok(existsSync(new URL("../public"+img,import.meta.url)),"Missing uploaded photo "+img);
 }
});
test("autoplay plus swipe plus reduced motion, not a static single image",()=>{
 assert.match(hero,/window\.setInterval/);
 assert.match(hero,/window\.clearInterval/);
 assert.match(hero,/prefers-reduced-motion: reduce/);
 assert.match(hero,/onTouchStart/);
 assert.match(hero,/onTouchEnd/);
 assert.match(hero,/aria-pressed/);
 assert.match(hero,/transition-opacity/);
});
test("floating first-party search overlaps the shorter mobile carousel",()=>{
 assert.match(page,/<EcosystemHeroCarousel \/>/);
 assert.match(page,/mx-auto -mt-10 w-full/);
 assert.match(hero,/aspect-\[2\/1\]/);
 assert.match(search,/action="\/search" method="get"/);
});
test("no custom backgrounds or duplicated intro/hero panels",()=>{
 assert.doesNotMatch(hero,/bg-black|bg-gradient|style=\{|gth-glass|from-black|via-black/);
 assert.doesNotMatch(page,/gth-master-intro|src="\/images\/mega\/tours.jpg"/);
 assert.match(page,/className="w-full transition-colors duration-300"/);
 assert.doesNotMatch(page,/className="gth-master-home/);
 assert.match(page,/<HeroSlider \/>/); // desktop remains unchanged
});
