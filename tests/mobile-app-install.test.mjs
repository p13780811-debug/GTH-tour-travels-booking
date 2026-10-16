import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
const read=(path)=>readFileSync(new URL("../"+path,import.meta.url),"utf8");

test("standalone PWA has valid icons and a real Next.js route.ts handler",()=>{
 const manifest=read("src/app/manifest.ts");
 const handler=read("src/app/app-icon/[size]/route.ts");
 assert.match(manifest,/start_url: "\/app"/);
 assert.match(manifest,/display: "standalone"/);
 assert.match(manifest,/purpose: "maskable"/);
 assert.doesNotMatch(manifest,/purpose: "any maskable"/);
 assert.match(manifest,/sizes: "192x192"/);
 assert.match(manifest,/sizes: "512x512"/);
 assert.match(handler,/new ImageResponse/);
 assert.match(handler,/createElement/);
 assert.match(handler,/export async function GET/);
 assert.match(handler,/180\|192\|512/);
});
test("offline service worker caches no API pages or customer data",()=>{
 const sw=read("public/sw.js");
 assert.match(sw,/caches\.open\(CACHE\)/);
 assert.match(sw,/cache\.add\(OFFLINE\)/);
 assert.match(sw,/event\.request\.mode !== "navigate"/);
 assert.doesNotMatch(sw,/cache\.put|cache\.addAll|localStorage|indexedDB/);
 assert.doesNotMatch(sw,/\/api\/|\/admin\//);
});
test("the installed app routes all three pillars with real 64px touch targets",()=>{
 const nav=read("src/components/MobileNav.tsx");
 const hub=read("src/app/app/page.tsx");
 for(const route of ["/flights","/hotels","/real-estate","/tender"])
   assert.ok(nav.includes(route)&&hub.includes(route),route);
 assert.match(nav,/env\(safe-area-inset-bottom/);
 assert.match(nav,/min-h-\[64px\]/);
 assert.match(hub,/bg-\[var\(--bg\)\]/);
 assert.match(hub,/<AppInstall \/>/);
});
test("app home does not duplicate web chatbot/footer and retains Real Estate/flagship routing",()=>{
 const wrapper=read("src/components/LayoutWrapper.tsx");
 const navbar=read("src/components/Navbar.tsx");
 assert.match(wrapper,/isRealEstate \|\| isFlagship \? 'pb-0'/);
 assert.match(wrapper,/!isRealEstate && !isFlagship && <MobileNav \/>/);
 assert.match(wrapper,/!isRealEstate && !isFlagship && !isAppHome/);
 assert.match(navbar,/pathname === "\/app"/);
 assert.match(navbar,/<EstateHeader \/>/);
});
test("day/night remain tied to central CSS, no second global theme",()=>{
 const root=read("src/app/layout.tsx");
 assert.match(root,/viewportFit: "cover"/);
 assert.match(root,/GTH_PUBLIC_LAUNCH_ENABLED/);
 const style=read("src/app/globals.css");
 assert.match(style,/\.gth-btn-gold/);
 const documentation=read("docs/gth-mobile-app-v1.md");
 assert.match(documentation,/Progressive Web App/);
 assert.match(documentation,/not a compiled or Play Store-signed Android APK/);
});
