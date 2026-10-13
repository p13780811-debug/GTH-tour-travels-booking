import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const load = path => readFileSync(new URL("../" + path, import.meta.url), "utf8");
const css = load("src/app/globals.css");
const home = load("src/app/page.tsx");
const mega = load("src/app/mega-aggregator/page.tsx");
const hero = load("src/components/HeroSlider.tsx");
const pillars = load("src/components/sections/EcosystemPillars.tsx");
const realEstateLayout = load("src/app/real-estate/layout.tsx");

test("master design remains scoped to the preserved mega-aggregator ecosystem route", () => {
  assert.match(home, /return <FlagshipHome \/>/);
  assert.match(mega, /className="gth-master-home /);
  assert.match(css, /\.gth-master-home \{/);
  assert.doesNotMatch(css, /(?:^|\n)\s*(?:html|body|:root)\s*\{[^}]*--gth-navy:/m);
  assert.match(hero, /gth-master-hero-shell/);
  assert.equal((hero.match(/gth-master-hero-title/g) ?? []).length, 2);
  assert.match(pillars, /gth-master-heading/);
  assert.match(pillars, /gth-master-pillar/);
});

test("premium buttons, shadows, glass, and property styles remain available", () => {
  for (const selector of [
    ".gth-btn-gold", ".gth-btn", ".gth-glass", ".gth-glass-strong",
    ".gth-card-premium", ".gold-text", "--btn-shadow", "--glow-gold"
  ]) {
    assert.ok(css.includes(selector), selector + " must remain intact");
  }
  // The shared style must not re-define existing CTA and card elevation classes.
  const master = css.slice(css.indexOf("GTH PRO MASTER DESIGN V1"));
  assert.doesNotMatch(master, /(?:^|\n)\s*\.gth-(?:btn|glass|card-premium)[\s.:#>{]/m);
  assert.match(realEstateLayout, /styles\.estateScope/);
  assert.doesNotMatch(realEstateLayout, /gth-master-home/);
});

test("global market typography scales with viewport, without breaking reduced-motion", () => {
  assert.match(css, /gth-master-hero-title[\s\S]*?font-size: clamp\(2\.75rem, 4\.8vw, 4\.35rem\)/);
  assert.match(css, /gth-master-heading[\s\S]*?font-size: clamp\(2rem, 3\.4vw, 3\.15rem\)/);
  assert.match(css, /@media \(max-width: 639px\)/);
  assert.match(css, /@media \(prefers-reduced-motion: reduce\)/);
});
