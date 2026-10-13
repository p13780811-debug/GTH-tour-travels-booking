import test from "node:test";
import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";

const source = file => readFileSync(new URL("../" + file, import.meta.url), "utf8");
const home = source("src/app/page.tsx");
const flagship = source("src/components/home/FlagshipHome.tsx");
const css = source("src/components/home/FlagshipHome.module.css");
const mega = source("src/app/mega-aggregator/page.tsx");
const navbar = source("src/components/Navbar.tsx");
const shell = source("src/components/LayoutWrapper.tsx");

test("root is the cinematic flagship, not the previous demo or mega aggregator", () => {
  assert.match(home, /return <FlagshipHome \/>/);
  assert.doesNotMatch(home, /GTHHomeV13|MegaAggregator/);
  assert.match(flagship, /Global Intelligence Ecosystem/);
  assert.match(flagship, /function BrandGlobe\(\)/);
  assert.match(flagship, /styles\.earth/);
  for (const name of ["Real Estate", "Travel", "Tender"]) assert.ok(flagship.includes(name));
  assert.match(css, /\.pillars[\s\S]*grid-template-columns:\s*1\.08fr 1fr 1\.08fr/);
  assert.match(css, /@media \(max-width: 680px\)/);
  assert.match(css, /@media \(prefers-reduced-motion:reduce\)/);
});

test("working mega-aggregator remains reachable at its own ecosystem route", () => {
  assert.match(mega, /<HeroSlider \/>/);
  assert.match(mega, /<EcosystemPillars \/>/);
  assert.match(mega, /canonical: "\/mega-aggregator"/);
  assert.match(flagship, /href="\/mega-aggregator"/);
  assert.match(navbar, /name: "Ecosystem", href: "\/mega-aggregator"/);
  assert.match(navbar, /pathname === "\/"\) return null/);
  assert.match(shell, /const isFlagship = pathname === "\/"/);
  assert.match(shell, /!isRealEstate && !isFlagship/);
});

test("flagship links to genuine working routes instead of fixture/demo results", () => {
  assert.doesNotMatch(flagship, /from ["\x27][^"\x27]*\/data\/opportunities|setExplorer|illustrative project|mockListings/i);
  const links = [...flagship.matchAll(/href:\s*"(\/[^"]+)"|href="(\/[^"]+)"/g)]
    .map(match => match[1] ?? match[2]);
  for (const href of new Set(links)) {
    assert.ok(existsSync(new URL("src/app" + (href === "/" ? "/page.tsx" : href + "/page.tsx"), new URL("../", import.meta.url))), "Missing linked route: " + href);
  }
});

test("original buttons and approved Real Estate scope remain unchanged", () => {
  const shared=source("src/app/globals.css");
  const estate=source("src/app/real-estate/layout.tsx");
  for (const item of [".gth-btn-gold",".gth-glass-strong","--glow-gold"])assert.ok(shared.includes(item));
  assert.match(estate, /styles\.estateScope/);
  assert.doesNotMatch(estate,/FlagshipHome/);
});

test("flagship can ship only with all five exact approved ZIP photographs", () => {
  const folder = new URL("public/images/gth-flagship/", new URL("../", import.meta.url));
  for (const file of ["global-earth.jpg", "global-city.jpg", "real-estate.jpg", "travel.jpg", "tender.jpg"]) {
    assert.ok(existsSync(new URL(file, folder)),
      "Approved homepage asset missing: public/images/gth-flagship/" + file);
  }
  assert.doesNotMatch(flagship, /fallback=|approvedImage|images\/mega\/tours\.jpg|\/dubai\.jpg/);
  assert.doesNotMatch(css, /images\.unsplash\.com|images\/cities\/dubai\.jpg/);
  assert.match(css, /@keyframes flagshipEarthReveal/);
  assert.match(css, /\.scrollCue \{/);
});
