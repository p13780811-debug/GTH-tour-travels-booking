import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const read = path => readFileSync(new URL("../" + path, import.meta.url), "utf8");
const app = read("src/app/app/page.tsx");
const pillars = read("src/components/sections/EcosystemPillars.tsx");
const search = read("src/app/mega-aggregator/EcosystemUnifiedSearch.tsx");
const dashboard = read("src/components/mobile/MobileAppDashboard.tsx");
const shell = read("src/components/LayoutWrapper.tsx");
const mobileNav = read("src/components/MobileNav.tsx");
const gateway = read("src/app/mega-aggregator/page.tsx");
const header = read("src/components/Navbar.tsx");
const flagship = read("src/components/home/FlagshipHome.tsx");
const vercel = JSON.parse(read("vercel.json"));

test("Installed GTH Home displays one service grid and one global bottom bar", () => {
  assert.equal((app.match(/<EcosystemPillars appHome\/>/g) || []).length, 1);
  assert.equal((app.match(/<MobileAppDashboard mode="tools" compactHome\/>/g) || []).length, 1);
  assert.match(app, /<EcosystemUnifiedSearch appHome\/>/);
  assert.doesNotMatch(app, /<EcosystemHub appHome\/>|Super App quick access/);
  assert.match(dashboard, /!compactHome && <div role="tablist"/);
  assert.match(pillars, /!appHome && <nav aria-label="Popular ecosystem destinations"/);
  assert.match(shell, /\{!isRealEstate && !isFlagship && <MobileNav \/>/);
  assert.match(mobileNav, /aria-label=\{isApp \? "GTH PRO app navigation" : "GTH PRO mobile navigation"\}/);
  assert.doesNotMatch(app, /<MobileNav|<BottomNav/);
});

test("App Home restores paired Research Desk and service-navigation shortcuts without a second icon bar", () => {
  assert.match(app, /<nav aria-label="GTH PRO Home and Research Desk shortcuts"/);
  assert.match(app, /href="\/app\/explore" prefetch=\{false\}/);
  assert.match(app, /href="\/app\/board" prefetch=\{false\}/);
  assert.match(app, />\s*Explore All Services\s*</);
  assert.match(app, />\s*My Research Desk\s*</);
  assert.equal((app.match(/<MobileNav/g)||[]).length, 0);
  assert.doesNotMatch(app, /display:\s*none|hidden\s+.*My Research Desk/);
});

test("Travel, Real Estate, Tenders and Tickets open full dedicated platform pages", () => {
  for (const link of ['href: "/travel"', 'href: "/real-estate"', 'href: "/tender"', 'href:"/tickets"']) {
    assert.ok(pillars.includes(link), "Missing dedicated pillar route " + link);
  }
  assert.match(pillars, /<Link href=\{appHome \? appPillarRoutes\[id\] : href\} prefetch=\{appHome\?false:undefined\} aria-label=\{cta\}/);
  assert.doesNotMatch(pillars, /id==="travel"\?"\/app\/destinations"/);
  assert.match(pillars, /after:absolute after:inset-0/);
});

test("App home has one accessible first-party search, no false platform-filter buttons", () => {
  const mobile = search.slice(search.indexOf("if (appHome) return"), search.indexOf("\n  return (", search.indexOf("if (appHome) return")));
  assert.match(mobile, /action="\/app\/search" method="get"/);
  assert.match(mobile, /name="q"/);
  assert.match(mobile, /aria-label="What would you like to find\?"/);
  assert.match(mobile, /name="category" value="all"/);
  assert.doesNotMatch(mobile, /setPillar|setCategory|tabs\.map|Select GTH PRO platform/);
  // Non-app Ecosystem search continues to use its existing validated routing.
  assert.match(search, /action=\{appHome\?"\/app\/search":"\/search"\} method="get"/);
  assert.match(app, /AppResearchQuickAccess/);
  assert.match(app, /AppInstall/);
  assert.match(app, /MobileSupplierShowcase/);
});

test("Public brand uses GTH PRO Global Gateway while old URL remains stable", () => {
  assert.match(app, /GTH PRO · Global Technical Hub/);
  assert.doesNotMatch(app, /Super App/);
  assert.match(gateway, /GTH PRO Global Gateway/);
  assert.match(gateway, /canonical: "\/mega-aggregator"/);
  assert.match(header, /name: "Ecosystem", href: "\/mega-aggregator"/); // protected shared Navbar unchanged
  assert.match(flagship, /Open GTH PRO App Home/);
  assert.doesNotMatch(flagship + gateway, /Open Super App/);
  assert.match(gateway, /<EcosystemHub \/>/); // Website services remain unchanged
});

test("No new global theme or provider configuration, preview safe by default", () => {
  assert.match(app, /bg-\[var\(--bg\)\]/);
  assert.match(dashboard, /border-\[var\(--border\)\]/);
  assert.equal(vercel.git.deploymentEnabled["feat/mobile-global-gateway-first-impression-20261118"], false);
  for (const src of [app,pillars,search,dashboard]) {
    assert.doesNotMatch(src, /SUPABASE_SERVICE_ROLE_KEY|ODDS_API_KEY|GEMINI_API_KEY|api\.the-odds-api\.com/);
  }
});

test("Website Global Gateway platform tabs navigate instead of filtering the search below", () => {
  assert.match(search, /<nav aria-label="Open GTH PRO platforms"/);
  for (const [name,url] of [
    ["travel","/travel"],["property","/real-estate"],["tender","/tender"],["ticket","/tickets"],
  ]) assert.ok(search.includes(name + ':"' + url + '"'), "Wrong platform route " + name);
  assert.match(search, /<Link key=\{id\} href=\{platformRoutes\[id\]\} prefetch=\{false\}/);
  assert.doesNotMatch(search, /onClick=\{\(\)=>selectPillar\(id\)\}/);
});
