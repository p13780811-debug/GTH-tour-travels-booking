import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import ts from "typescript";
const read=(path)=>readFileSync(new URL("../"+path,import.meta.url),"utf8");

test("standalone PWA retains approved PNG assets and safe legacy icon URLs",async()=>{
 const manifest=read("src/app/manifest.ts");
 const handler=read("src/app/app-icon/[size]/route.ts");
 assert.match(manifest,/start_url: "\/app"/);
 assert.match(manifest,/display: "standalone"/);
 assert.match(manifest,/purpose: "maskable"/);
 assert.doesNotMatch(manifest,/purpose: "any maskable"/);
 assert.match(manifest,/sizes: "192x192"/);
 assert.match(manifest,/sizes: "512x512"/);
 assert.doesNotMatch(handler,/next\/og|ImageResponse/);
 const compiled=ts.transpileModule(handler,{compilerOptions:{target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.ESNext}}).outputText;
 const {GET}=await import("data:text/javascript;base64,"+Buffer.from(compiled).toString("base64"));
 for(const size of [180,192,512]){
   const request=new Request("https://example.invalid/app-icon/"+size);
   const response=await GET(request,{params:Promise.resolve({size:String(size)})});
   assert.equal(response.status,307);
   assert.equal(response.headers.get("location"),"/app-brand/icon-"+size+".png");
   assert.equal(response.headers.get("cache-control"),"public, max-age=86400");
   const png=readFileSync(new URL("../public"+response.headers.get("location"),import.meta.url));
   assert.equal(png.subarray(0,8).toString("hex"),"89504e470d0a1a0a");
   assert.equal(png.readUInt32BE(16),size);
   assert.equal(png.readUInt32BE(20),size);
 }
 for(const size of ["0","256","../secret","https://example.invalid","512.png"]){
   const response=await GET(new Request("https://example.invalid/app-icon/0"),{params:Promise.resolve({size})});
   assert.equal(response.status,404);
   assert.equal(response.headers.get("location"),null);
 }
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
 const hub=read("src/app/app/page.tsx")+read("src/components/mobile/MobileAppDashboard.tsx")+read("src/lib/mobile/app-dashboard.ts");
 for(const route of ["/app/flights","/app/hotels","/app/property","/app/tenders","/tickets"])
   assert.ok(nav.includes(route)&&hub.includes(route),route);
 assert.match(nav,/env\(safe-area-inset-bottom/);
 assert.match(nav,/min-h-\[64px\]/);
 assert.match(hub,/bg-\[var\(--bg\)\]/);
 assert.match(hub,/<AppInstall \/>/);
});
test("app home does not duplicate web chatbot/footer and retains Real Estate/flagship routing",()=>{
 const wrapper=read("src/components/LayoutWrapper.tsx");
 const navbar=read("src/components/Navbar.tsx");
 assert.match(wrapper,/isRealEstate \|\| isFlagship \|\| isAppHome \? 'pb-0'/);
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
