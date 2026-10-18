import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {approvedPexelsIllustrations} from "../src/lib/travel/pexels-hotel-illustrations.ts";

const read=(path)=>readFileSync(new URL("../"+path,import.meta.url),"utf8");
const photo={
  src:{landscape:"https://images.pexels.com/photos/12/pexels-photo-12.jpeg?auto=compress"},
  url:"https://www.pexels.com/photo/architecture-and-travel-12/",
  photographer:"Example Photographer"
};
test("Pexels response validates source, credits and limits illustrated photos",()=>{
 const input={photos:[photo,{...photo}, {...photo,src:{landscape:"https://evil.example/photos/12.jpg"}},
  {...photo,url:"https://www.pexels.com.evil.tld/photo/123"},
  {...photo,src:{landscape:"http://images.pexels.com/photos/23/x.jpg"}},
  ...Array.from({length:5},(_,i)=>({...photo,src:{landscape:"https://images.pexels.com/photos/"+(30+i)+"/x.jpeg"}}))]};
 const approved=approvedPexelsIllustrations(input);
 assert.equal(approved.length,4);
 assert.equal(approved[0].photographer,"Example Photographer");
 assert.ok(approved.every(p=>p.photoUrl.startsWith("https://www.pexels.com/photo/")));
 assert.deepEqual(approvedPexelsIllustrations(null),[]);
});
test("Existing /api/images remains server-side, rate limited and opt-in illustrative",()=>{
 const source=read("src/app/api/images/route.ts");
 assert.match(source,/mode === "hotel_illustration"/);
 assert.match(source,/approvedPexelsIllustrations/);
 assert.match(source,/enforceRateLimit\(req, "images"\)/);
 assert.match(source,/process\.env\.PEXELS_API_KEY/);
 assert.match(source,/per_page", hotelIllustrations \? "4" : "1"/);
 assert.doesNotMatch(source,/NEXT_PUBLIC_PEXELS_API_KEY|SUPABASE_SERVICE_ROLE_KEY/);
});
test("One source-scoped Pexels query per visible destination, not per hotel",()=>{
 const hook=read("src/lib/travel/use-hotel-illustrations.ts");
 assert.match(hook,/inFlight\.get\(key\)/);
 assert.match(hook,/resolved\.get\(key\)/);
 assert.match(hook,/mode=hotel_illustration/);
 assert.doesNotMatch(hook,/service_role|insert\(|upsert\(|hotel_catalog/);
});
test("Hotel cards and detail never repeat shared illustrative photos",()=>{
 const image=read("src/components/hotel/HotelPropertyImage.tsx");
 const list=read("src/app/hotels/page.tsx");
 const results=read("src/app/hotels/results/HotelResults.tsx");
 const detail=read("src/app/hotels/stay/[id]/page.tsx");
 const visual=read("src/components/hotel/HotelStayVisual.tsx");
 assert.match(image,/Original property photo not available/);
 assert.match(image,/source-attributed property image/);
 assert.match(image,/onError=\{\(\)=>setFailed\(true\)\}/);
 for(const content of [list,results,visual,image]){
  assert.doesNotMatch(content,/useHotelIllustrations|illustration=|index%illustrations/);
 }
 assert.match(detail,/hotel\.image\?<HotelPropertyImage/);
 assert.match(detail,/HotelStayVisual/);
 assert.doesNotMatch(visual,/Pexels|illustrations/);
});
