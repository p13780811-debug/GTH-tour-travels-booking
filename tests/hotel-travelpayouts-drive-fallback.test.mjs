import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {loadTenderTs} from "./helpers/tender-upgrade-loader.mjs";
const partner=loadTenderTs("src/lib/travel/partner-search.ts");
const tracked=loadTenderTs("src/lib/travel/klook-hotel-search.ts",{"./partner-search.ts":partner});
const {hotelProviderSearchUrl}=loadTenderTs("src/lib/travel/hotel-provider-search.ts",{"./klook-hotel-search.ts":tracked});
const read=p=>readFileSync(new URL("../"+p,import.meta.url),"utf8");

test("Existing project-specific Travelpayouts Drive is present only once in global head",()=>{
 const shell=read("src/app/layout.tsx");
 assert.match(shell,/emrldtp\.com\/NTA0MzQy\.js\?t=504342/);
 assert.match(shell,/querySelector\('script\[src\^=/);
});

test("unverified OSM hotel goes to tracked worldwide Klook Hotels, no fictitious direct property result",()=>{
 const url=new URL(hotelProviderSearchUrl("Example Hotel, Paris",{checkin:"2050-05-05",checkout:"2050-05-08",adults:3}));
 assert.equal(url.origin,"https://tp.media");
 assert.equal(url.searchParams.get("campaign_id"),"137");
 assert.equal(url.searchParams.get("marker"),"417668");
 assert.equal(url.searchParams.get("trs"),"504342");
 assert.equal(new URL(url.searchParams.get("u")).href,"https://www.klook.com/hotels/");
});

test("GTH hotel details separate verified direct booking from Nuitee search",()=>{
 const page=read("src/app/hotels/stay/[id]/page.tsx");
 assert.ok(page.includes('href={hotel.partner}'));
 assert.ok(page.includes('Continue booking'));
 assert.ok(page.includes('Search stays'));
 assert.ok(page.includes('hotelProviderSearchUrl([hotel.name'));
 assert.ok(page.includes('exact hotel match or rate is not guaranteed'));
});
