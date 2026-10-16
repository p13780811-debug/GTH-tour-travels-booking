import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const read=(file)=>readFileSync(new URL("../"+file,import.meta.url),"utf8");
test("destination and partner carousel arrow buttons have accessible name and native type",()=>{
 const destinations=read("src/components/home/FeaturedDestinationsSlider.tsx");
 const partners=read("src/components/sections/GTHNetwork.tsx");
 for(const dir of ["left","right"]){
   assert.match(destinations,new RegExp('aria-label="Scroll featured destinations '+dir+'"'));
   assert.match(partners,new RegExp('aria-label="Scroll partner network '+dir+'"'));
 }
 assert.ok((destinations.match(/type="button"/g)||[]).length>=2);
 assert.ok((partners.match(/type="button"/g)||[]).length>=2);
});
test("airport widget has working affiliate alternatives when provider blocks embedding",()=>{
 const s=read("src/components/travel/TransferProviderWidgets.tsx");
 assert.match(s,/active === "airport"/);
 assert.match(s,/intui\.travel may block embedded booking/);
 assert.match(s,/onClick=\{\(\) => select\("options"\)\}/);
 assert.match(s,/Try Kiwitaxi/);
 assert.match(s,/https:\/\/tpo\.lv\/GFuzmgYk/);
 assert.match(s,/rel="noopener noreferrer sponsored"/);
 assert.match(s,/aria-label=\{widgets\[active\]\.title\}/);
 assert.match(s,/campaign_id=22&promo_id=1504/);
 assert.match(s,/campaign_id=1&promo_id=3879/);
});
test("global identity and supplier configs untouched by minimal audit fixes",()=>{
 const root=read("src/app/layout.tsx");
 const w=read("src/components/flights/AviasalesWhiteLabel.tsx");
 assert.match(root,/<Navbar \/>/);
 assert.match(w,/wl_id=23459/);
 assert.match(w,/id="tpwl-search"/);
 assert.match(w,/id="tpwl-tickets"/);
});
