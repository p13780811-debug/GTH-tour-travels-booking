import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
const read=p=>readFileSync(p,"utf8");
test("Aviasales supplier white-label remains in place without cached fares on Smart Synergy",()=>{
 const flight=read("src/app/flights/page.tsx");
 const wl=read("src/components/flights/AviasalesWhiteLabel.tsx");
 const cross=read("src/components/ecosystem/SmartSynergy.tsx");
 assert.match(flight,/<AviasalesWhiteLabel/);
 assert.match(wl,/wl_id=23459/);
 assert.match(cross,/\/flights\?destination=/);
 assert.doesNotMatch(cross,/\/api\/flights/);
});
test("No false metro or published-photo claims are generated",()=>{
 const route=read("src/app/api/real-estate/locality/[slug]/route.ts");
 const pdf=read("src/app/api/real-estate/dossier/[slug]/route.ts");
 assert.match(route,/nearestOsm/);
 assert.match(route,/airportDriveMinutes:null|airportDriveMinutes:number\|null/);
 assert.match(route,/process.env.GTH_OSRM_BASE_URL/);
 assert.match(pdf,/is_property_media_public/);
 assert.match(pdf,/permission_reference/);
 assert.match(pdf,/download/);
 assert.doesNotMatch(pdf,/placeholder.jpg|picsum|unsplash/);
});
test("Download PDF is a real route and the existing print escape remains",()=>{
 const view=read("src/components/real-estate/PrintDossier.tsx");
 const route=read("src/app/api/real-estate/dossier/[slug]/route.ts");
 assert.match(view,/Download PDF/);
 assert.match(view,/window.print/);
 assert.match(route,/application\/pdf/);
 assert.match(route,/no-store/);
});
test("Mobile sheet uses global theme tokens and handles keyboard and gestures",()=>{
 const page=read("src/app/real-estate/page.tsx");
 const css=read("src/components/real-estate/Explorer.module.css");
 assert.match(page,/onTouchEnd/);
 assert.match(page,/event.key === "Escape"/);
 assert.match(page,/aria-modal/);
 assert.match(page,/closeFilter.current\?\.focus/);
 assert.match(css,/\.sheetHandle/);
 assert.match(css,/var\(--card\)/);
 assert.match(css,/var\(--border\)/);
});
test("Real-estate registry and inventory public boundaries preserved",()=>{
 const propertyRoute=read("src/app/real-estate/[slug]/page.tsx");
 const detail=read("src/components/real-estate/PropertyDetailClient.tsx");
 assert.match(propertyRoute,/\.from\("property_inventory"\)/);
 assert.match(detail,/registry_only/);
 assert.match(detail,/ProjectInventory/);
});
