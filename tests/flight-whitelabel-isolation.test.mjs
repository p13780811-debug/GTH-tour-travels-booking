import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const read = (path) => readFileSync(new URL("../" + path, import.meta.url), "utf8");

test("TPWL 23459 is confined to a normal HTTPS frame route and never injected into app head", () => {
  const source = read("src/components/flights/AviasalesWhiteLabel.tsx");
  const route = read("src/app/flights/embed/route.ts");
  const middleware = read("src/middleware.ts");
  assert.match(source, /<iframe/);
  assert.match(source, /src=\{WL_FRAME_ROUTE\}/);
  assert.match(source, /sandbox="allow-scripts allow-same-origin allow-forms/);
  assert.match(source, /event\.source !== frame\.contentWindow/);
  assert.match(source, /event\.origin !== window\.location\.origin/);
  assert.match(source, /window\.removeEventListener\("message", onMessage\)/);
  assert.match(route, /id="tpwl-search"/);
  assert.match(route, /id="tpwl-tickets"/);
  assert.match(route, /tpwidg\.com\/wl_web\/main\.js\?wl_id=23459/);
  assert.match(route, /tpwgts\.com\/wl_web\/main\.js\?wl_id=23459/);
  assert.match(route, /document\.head\.appendChild\(script\)/);
  assert.match(route, /window\.parent\.postMessage/);
  assert.match(route, /frame-ancestors 'self'/);
  assert.match(middleware, /pathname === "\/flights\/embed"/);
  assert.match(middleware, /isFlightWidgetDocument \? "SAMEORIGIN" : "DENY"/);
  assert.doesNotMatch(source, /document\.head\.appendChild|dangerouslySetInnerHTML|srcDoc=/);
});

test("flight route does not load a manual font stylesheet or insert widget code globally", () => {
  const root = read("src/app/layout.tsx");
  const flightLayout = read("src/app/flights/layout.tsx");
  const flightPage = read("src/app/flights/page.tsx");
  const globalCSS = read("src/app/globals.css");
  assert.doesNotMatch(flightLayout, /flights\.css/);
  assert.match(flightPage, /<AviasalesWhiteLabel \/>/);
  assert.doesNotMatch(flightPage, /tpwidg\.com|tpwgts\.com|dangerouslySetInnerHTML/);
  assert.doesNotMatch(root, /tpwidg\.com\/wl_web\/main\.js/);
  assert.match(globalCSS, /@import "tailwindcss"/);
});

test("there is never a persistent blank frame without a visible fallback", () => {
  const source = read("src/components/flights/AviasalesWhiteLabel.tsx");
  const route = read("src/app/flights/embed/route.ts");
  assert.match(route, /script\.onerror = function/);
  assert.match(route, /emit\("error"\)/);
  assert.match(route, /hasSearchForm\(\)/);
  assert.match(source, /20_000/);
  assert.match(source, /status === "error"/);
  assert.match(source, /Retry on GTH PRO/);
  assert.match(source, /onClick=\{retry\}/);
  assert.match(source, /href="\/flights\/out\/aviasales"/);
  assert.match(source, /rel="noopener noreferrer sponsored"/);
  assert.match(source, /title="Aviasales flight search, date selection and results"/);
  assert.match(source, /aria-labelledby="flight-white-label-heading"/);
});
