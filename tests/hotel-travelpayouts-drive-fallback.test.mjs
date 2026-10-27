import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {hotelProviderSearchUrl} from "../src/lib/travel/hotel-provider-search.ts";
const read=p=>readFileSync(new URL("../"+p,import.meta.url),"utf8");

test("Existing project-specific Travelpayouts Drive is present only once in global head",()=>{
 const shell=read("src/app/layout.tsx");
 assert.match(shell,/emrldtp\.com\/NTA0MzQy\.js\?t=504342/);
 assert.match(shell,/querySelector\('script\[src\^=/);
});

test("unmapped hotel search redirects to the existing Nuitee booking screen without guessing a supplier ID",()=>{
 const url=hotelProviderSearchUrl("Example Hotel, Paris",{checkin:"2050-05-05",checkout:"2050-05-08",adults:3});
 assert.equal(url,"/hotels?view=booking");
});

test("GTH hotel details separate verified direct booking from Nuitee search",()=>{
 const page=read("src/app/hotels/stay/[id]/page.tsx");
 assert.ok(page.includes('href={hotel.partner}'));
 assert.ok(page.includes('Book Now{hotel.partnerName'));
 assert.ok(page.includes('Search stays using Nuitee white-label'));
 assert.ok(page.includes('hotelProviderSearchUrl([hotel.name'));
 assert.ok(page.includes('exact hotel match or rate is not guaranteed'));
});
