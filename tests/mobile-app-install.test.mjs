import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
const src = (path) => readFileSync(new URL("../" + path, import.meta.url), "utf8");

test("mobile app manifest uses standalone install mode and actual routed PNG icon sizes", () => {
  const manifest = src("src/app/manifest.ts");
  const icons = src("src/app/app-icon/[size]/route.tsx");
  assert.match(manifest, /start_url: "\/app"/);
  assert.match(manifest, /display: "standalone"/);
  assert.match(manifest, /sizes: "192x192"/);
  assert.match(manifest, /sizes: "512x512"/);
  assert.match(icons, /new ImageResponse/);
  assert.match(icons, /180, 192, 512/);
});

test("offline worker cannot persist user data or api responses", () => {
  const sw = src("public/sw.js");
  assert.match(sw, /caches\.open\(CACHE\)/);
  assert.match(sw, /cache\.add\(OFFLINE\)/);
  assert.match(sw, /event\.request\.mode !== "navigate"/);
  assert.doesNotMatch(sw, /cache\.put|cache\.addAll|localStorage|indexedDB/);
  assert.doesNotMatch(sw, /\/api\/|\/admin\//);
});

test("mobile shell navigates all pillars with safe touch areas and centralized colors", () => {
  const shell = src("src/components/MobileNav.tsx");
  const hub = src("src/app/app/page.tsx");
  for (const route of ["/flights", "/hotels", "/real-estate", "/tender"]) {
    assert.ok(shell.includes(route) && hub.includes(route), route);
  }
  assert.match(shell, /env\(safe-area-inset-bottom/);
  assert.match(shell, /min-h-\[64px\]/);
  assert.match(hub, /bg-\[var\(--bg\)\]/);
  assert.match(hub, /<AppInstall \/>/);
});

test("app home is isolated; Real Estate and desktop home retain independent layouts", () => {
  const wrapper = src("src/components/LayoutWrapper.tsx");
  assert.match(wrapper, /isRealEstate \? "pb-0"/);
  assert.match(wrapper, /!isRealEstate && <MobileNav \/>/);
  assert.match(wrapper, /!isRealEstate && !isFlagship && !isAppHome/);
});
