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

test("Booking.com fallback retains hotel identity and validated stay without changing host",()=>{
 const link=hotelProviderSearchUrl("Example Hotel, 12 Main St, Paris, France");
 const u=new URL(link);
 assert.equal(u.hostname,"www.booking.com");
 assert.equal(u.pathname,"/searchresults.html");
 assert.match(u.searchParams.get("ss"),/Example Hotel.*Paris/);
 const stay=hotelProviderSearchUrl("Example Hotel, Paris",{checkin:"2050-05-05",checkout:"2050-05-08",adults:3});
 const v=new URL(stay);
 assert.equal(v.searchParams.get("group_adults"),"3");
 assert.equal(v.searchParams.get("checkin"),"2050-05-05");
 assert.equal(v.searchParams.get("checkout"),"2050-05-08");
});

test("GTH detail has a verified Book Now and clearly separate honest Booking.com search fallback",()=>{
 const page=read("src/app/hotels/stay/[id]/page.tsx");
 assert.match(page,/href=\{hotel\.partner\}/);
 assert.match(page,/Book Now\{hotel\.partnerName/);
 assert.match(page,/!hotel.partner&&\(hotel.city\|\|hotel.address\|\|hotel.country\)/);
 assert.match(page,/Find this hotel on Booking\.com/);
 assert.match(page,/hotelProviderSearchUrl\(\[hotel.name/);
 assert.match(page,/provider may show matching results/);
});
