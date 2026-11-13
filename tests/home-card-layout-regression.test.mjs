import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";

const read = path => readFileSync(new URL("../" + path, import.meta.url), "utf8");
const homeCss = read("src/components/home/FlagshipHome.module.css");
const globalCss = read("src/app/globals.css");
const pillars = read("src/components/sections/EcosystemPillars.tsx");
const mobileNav = read("src/components/MobileNav.tsx");
const homepage = read("src/app/page.tsx");
const mega = read("src/app/mega-aggregator/page.tsx");

test("homepage capability links do not inherit white backing from the global nav surface", () => {
  assert.match(globalCss, /nav\s*\{[\s\S]*?background: var\(--card\)/);
  assert.match(homeCss, /\.site \.proofLinks\s*\{[^}]*background: transparent;[^}]*box-shadow: none;[^}]*backdrop-filter: none;/);
  assert.match(homeCss, /\.site \.proofLink\s*\{[^}]*background: var\(--flag-navy\)/);
  assert.match(homeCss, /@media \(max-width: 680px\) \{[\s\S]*?\.proofGrid \{ grid-template-columns: minmax\(0, 1fr\)/);
});

test("three ecosystem cards show real photos in a compact theme-aware card layout", () => {
  for (const name of ["Tours & Travels", "Real Estate", "Tenders"]) {
    assert.ok(pillars.includes('title: "' + name + '"'));
  }
  assert.match(pillars, /gth-master-pillar group flex min-w-0 flex-col/);
  assert.match(pillars, /className="relative h-40 shrink-0 overflow-hidden bg-\[var\(--bg-soft\)\]/);
  assert.match(pillars, /<Image src=\{image\} alt="" fill sizes=/);
  assert.match(pillars, /bg-\[var\(--card\)\]/);
  assert.match(pillars, /border-\[var\(--border\)\]/);
  assert.match(pillars, /text-\[var\(--text-soft\)\]/);
  assert.doesNotMatch(pillars, /from-black|via-black\/80|bg-slate-950|mt-16/);
  assert.match(pillars, /<Link href=\{href\} className=/);
});

test("Mobile website and PWA Home have explicit single destinations without changing the flagship landing route", () => {
  assert.match(homepage, /return <FlagshipHome \/>/);
  assert.match(mega, /<EcosystemPillars \/>/);
  assert.match(mobileNav, /href: "\/app", appHref: "\/app", name: "Home"/);
});
