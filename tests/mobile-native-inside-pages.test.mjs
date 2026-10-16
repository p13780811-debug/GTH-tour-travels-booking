import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
const file=(p)=>readFileSync(new URL("../"+p,import.meta.url),"utf8");
test("All app main sections keep standalone app layout, horizontal rails and brand logo",()=>{
 const home=file("src/app/app/page.tsx");
 const section=file("src/app/app/[section]/page.tsx");
 const rail=file("src/components/mobile/MobileDiscoveryRail.tsx");
 const header=file("src/components/mobile/MobileAppHeader.tsx");
 assert.match(home,/MobileDiscoveryRail kind="hotel"/);
 assert.match(home,/MobileDiscoveryRail kind="property"/);
 assert.match(home,/MobileDiscoveryRail kind="tender"/);
 assert.match(section,/MobileDiscoveryRail appLinks/);
 assert.match(rail,/snap-x snap-mandatory/);
 assert.match(rail,/<Link href=\{destination\} className="flex w-\[116px\]/);
 assert.match(header,/\/gth-app-brand\.svg/);
});
test("App detail and workflow stay within mobile route; full website only via explicit external handoff",()=>{
 const detail=file("src/app/app/[section]/[id]/page.tsx");
 const prepare=file("src/app/app/[section]/[id]/prepare/page.tsx");
 const workflow=file("src/components/mobile/MobilePreparation.tsx");
 assert.match(detail,/\/prepare"\}/);
 assert.match(detail,/Open full website separately/);
 assert.match(detail,/target="_blank" rel="noopener noreferrer"/);
 assert.match(prepare,/MobilePreparation/);
 assert.match(prepare,/MobileAppHeader/);
 assert.match(workflow,/TASKS=\{/);
 for(const kind of ["hotels","property","tenders","destinations"])assert.ok(workflow.includes(kind+":["));
 assert.match(workflow,/not a verified booking/);
 assert.match(workflow,/Notes are not sent to a server/);
});
test("App installation is PWA only and does not make false Play Store listing claims",()=>{
 const manifest=file("src/app/manifest.ts");
 const install=file("src/components/mobile/AppInstall.tsx");
 assert.match(manifest,/start_url: "\\/app"/);
 assert.match(manifest,/scope: "\\/app\\/"/);
 assert.match(manifest,/GTH PRO/);
 assert.match(install,/beforeinstallprompt/);
 assert.doesNotMatch(manifest,/play\\.google\\.com/);
});
test("Website styling and Real Estate routes stay outside app implementation",()=>{
 const routes=file("src/lib/mobile/routes.ts");
 const layout=file("src/components/LayoutWrapper.tsx");
 assert.match(routes,/Routes intentionally contained in the installable app shell/);
 assert.match(layout,/isAppHome/);
 assert.match(routes,/\/app\\/property/);
});
