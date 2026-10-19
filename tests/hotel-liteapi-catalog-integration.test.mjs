import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {normalizeLiteApiHotel,sourceDescription} from "../src/lib/travel/liteapi-view-model.ts";
const read=p=>readFileSync(new URL("../"+p,import.meta.url),"utf8");
test("Provider hotel cards retain actual details without invented photos or stars",()=>{
 const hotel=normalizeLiteApiHotel({id:"lp51",name:"The Example Hotel",starRating:4,
 hotelDescription:"<p>Well located</p><br/>Amenities: <b>Pool</b>",
 hotelImages:[{url:"https://hotels.example/room.jpg",urlHd:"https://hotels.example/room_hd.jpg",defaultImage:true}],
 hotelFacilities:["WiFi","Pool"]});
 assert.equal(hotel?.image,"https://hotels.example/room_hd.jpg");
 assert.match(hotel?.description||" ",/Well located/);
 assert.doesNotMatch(hotel?.description||"",/<[^>]+>/);
 assert.equal(hotel?.stars,4);
 assert.deepEqual(hotel?.amenities,["WiFi","Pool"]);
 assert.equal(normalizeLiteApiHotel({id:"lp52",name:"No Media",hotelImages:[]})?.image,null);
 assert.equal(sourceDescription(null),null);
});
test("Main hotel marketplace offers independent source-correct LiteAPI catalogue",()=>{
 const home=read("src/app/hotels/page.tsx");
 const api=read("src/app/api/hotels/live/route.ts");
 const rate=read("src/lib/security/rate-limit.ts");
 assert.match(home,/setSourceFilter\("liteapi"\)/);
 assert.match(home,/LiteAPI — original hotel content/);
 assert.match(home,/providerPath\(hotel\)/);
 assert.match(home,/\/api\/hotels\/live/);
 assert.match(api,/hotelName:/);
 assert.match(api,/imageCount:/);
 assert.match(api,/enforceRateLimit\(request, "hotels"\)/);
 assert.match(rate,/hotels: \{ minute:/);
 assert.doesNotMatch(api,/\.upsert\(|\.insert\(|\.delete\(/);
});
