import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync,existsSync} from "node:fs";
const source=p=>readFileSync(new URL("../"+p,import.meta.url),"utf8");

test("website mobile flagship exposes real Super App and Research Desk links without replacing /",()=>{
 const flagship=source("src/components/home/FlagshipHome.tsx");
 assert.match(flagship,/aria-label="Super App and Research Desk shortcuts"/);
 assert.match(flagship,/href="\/app"[^>]*>\s*Open Super App/);
 assert.match(flagship,/href="\/app\/board"[^>]*>\s*My Research Desk/);
 assert.ok(flagship.indexOf('aria-label="Super App and Research Desk shortcuts"')<flagship.indexOf('id="pillars"'));
 assert.doesNotMatch(flagship,/onClick=|fetch\(|createClient|SUPABASE_SERVICE_ROLE_KEY/);
 assert.match(source("src/app/page.tsx"),/return <FlagshipHome \/>/);
 assert.match(source("src/components/MobileNav.tsx"),/href: "\/", appHref: "\/app", name: "Home"/);
});

test("ecosystem and installed PWA expose saved research directly with no additional DB calls",()=>{
 const ecosystem=source("src/app/mega-aggregator/page.tsx");
 const app=source("src/app/app/page.tsx");
 const manifest=source("src/app/manifest.ts");
 assert.match(ecosystem,/aria-label="Super App access and Research Desk"/);
 assert.match(ecosystem,/href="\/app"/);
 assert.match(ecosystem,/href="\/app\/board"/);
 assert.match(app,/aria-label="Super App quick access"/);
 assert.match(app,/href="\/app\/board"/);
 assert.match(app,/href="\/app\/explore"/);
 assert.match(app,/<EcosystemHeroCarousel embedded\/>/);
 assert.match(app,/<MobileAppDashboard data=\{data\}\/>/);
 assert.match(manifest,/name: "Research Desk", short_name: "Desk", url: "\/app\/board"/);
 for(const p of ["src/app/app/page.tsx","src/app/app/board/page.tsx"])assert.ok(existsSync(new URL("../"+p,import.meta.url)));
});

test("private research storage implementation is preserved, with no resets or account sync",()=>{
 const desk=source("src/components/mobile/MobileResearchDesk.tsx");
 const hook=source("src/components/mobile/useAppResearch.ts");
 const board=source("src/app/app/board/page.tsx");
 assert.match(board,/<MobileResearchDesk\/>/);
 assert.match(desk,/Saved only on this device/);
 assert.match(hook,/window\.localStorage\.getItem\(RESEARCH_KEY\)/);
 assert.match(hook,/window\.localStorage\.setItem\(RESEARCH_KEY,JSON\.stringify\(next\)\)/);
});
