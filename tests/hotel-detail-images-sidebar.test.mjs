import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
const read=p=>readFileSync(new URL("../"+p,import.meta.url),"utf8");

test("OSM hotel source image from catalog is passed to cards, not nulled",()=>{
 const api=read("src/app/api/hotels/route.ts");
 assert.match(api,/hotel\.image_url\|\|commons\.get\(hotel\.source_id\)\?\.image_url\), affiliate_link: null/);
 assert.match(api,/source_id\.replace\("\/",\s*"-"\)/);
 assert.match(api,/source_license: "ODbL-1\.0"/);
});
test("Hotel detail can resolve encoded OSM card IDs and reuse sourced image",()=>{
 const page=read("src/app/hotels/stay/[id]/page.tsx");
 assert.match(page,/decodeURIComponent\(id\)/);
 assert.match(page,/sourceId=id\.slice\(4\)\.replace\("-","\/"\)/);
 assert.match(page,/select\("name,city,country_code,category,address,phone,source_url,website,image_url/);
 assert.match(page,/\.eq\("source","osm"\)\.eq\("source_id",sourceId\)/);
 const image=read("src/components/hotel/HotelPropertyImage.tsx");
 assert.match(page,/HotelPropertyImage/);
 assert.match(image,/Original hotel photo not available/);
 assert.match(image,/source-attributed property image/);
 assert.match(image,/onError=\{\(\)=>setFailed\(true\)\}/);
});
test("Left sidebar has functioning data-backed accommodation categories",()=>{
 const ui=read("src/app/hotels/page.tsx");
 assert.match(ui,/Accommodation categories/);
 for(const category of ["hotel","resort","guest_house","apartment","hostel","motel"])assert.ok(ui.includes('["'+category+'",'));
 assert.match(ui,/checked=\{category===value\}/);
 assert.match(ui,/onChange=\{\(\)=>setCategory\(value\)\}/);
 assert.match(ui,/name="hotel-accommodation-category"/);
});
