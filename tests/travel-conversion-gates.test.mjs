import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {hotelProviderSearchUrl} from "../src/lib/travel/hotel-provider-search.ts";
import {hotelLocationFilter} from "../src/lib/travel/hotel-geo-bounds.ts";
const read=p=>readFileSync(new URL("../"+p,import.meta.url),"utf8");
test("Tours list and detail use the real license-approved table schema",()=>{
  const list=read("src/lib/tours.ts"),detail=read("src/app/tours/[slug]/page.tsx");
  for(const s of [list,detail]){
    assert.doesNotMatch(s,/currency,rating|rating,category|\.eq\("category"/);
    assert.match(s,/media_rights_verified/);
    assert.match(s,/is_public/);
  }
  assert.match(list,/currency,tags,image_url/);
  assert.match(list,/\.contains\("tags", \[f\.category\]\)/);
  assert.match(detail,/currency,tags,image_url,affiliate_link/);
  assert.match(list,/rating: null/);
});
test("Hotel city discovery does not match arbitrary hotel names or addresses",()=>{
  const where=hotelLocationFilter("%Paris%",null);
  assert.match(where,/city\.ilike/);
  assert.match(where,/region\.ilike/);
  assert.doesNotMatch(where,/name\.ilike|address\.ilike|latitude/);
  assert.match(read("src/app/api/hotels/route.ts"),/Region: /);
});
test("Unknown hotel identity cannot create a fabricated supplier search or affiliate deep link",()=>{
 const link=hotelProviderSearchUrl("Hilton Mumbai",{checkin:"2099-01-12",checkout:"2099-01-15",adults:3});
 assert.equal(link,"/hotels?view=booking");
 const invalid=hotelProviderSearchUrl("Paris",{checkin:"2020-01-01",checkout:"2020-01-02",adults:500});
 assert.equal(invalid,link);
});
test("Hotels planning controls and fallback routes work without changing global styling",()=>{
  const page=read("src/app/hotels/page.tsx");
  assert.match(page,/id="hotel-checkin"/);
  assert.match(page,/id="hotel-checkout"/);
  assert.match(page,/id="hotel-guests"/);
  assert.match(page,/setRequestedCountry\(selectedCountry\)/);
  assert.match(page,/setRequestedCountry\("IN"\)/);
  assert.match(page,/View hotel details/);
  assert.doesNotMatch(page,/hotelProviderSearchUrl/);
  assert.doesNotMatch(read("src/app/hotels/results/HotelResults.tsx"),/Search this hotel on Booking\.com/);
  assert.doesNotMatch(page,/images\.pexels\.com\/photos\/258154/);
});
