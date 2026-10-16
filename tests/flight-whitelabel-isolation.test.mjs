import test from "node:test";
import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";

const read = (path) => readFileSync(new URL("../" + path, import.meta.url), "utf8");

test("restore documented TPWL Web native script with search and results on the same page", () => {
  const source = read("src/components/flights/AviasalesWhiteLabel.tsx");
  const middleware = read("src/middleware.ts");
  assert.match(source, /id="tpwl-search"/);
  assert.match(source, /id="tpwl-tickets"/);
  assert.match(source, /tpwidg\.com\/wl_web\/main\.js\?wl_id=23459/);
  assert.match(source, /tpwgts\.com\/wl_web\/main\.js\?wl_id=23459/);
  assert.match(source, /document\.head\.appendChild\(script\)/);
  assert.match(source, /script\.type = "module"/);
  assert.match(source, /script\.onerror/);
  assert.match(source, /currentScript\.remove\(\)/);
  assert.doesNotMatch(source, /<iframe|srcDoc=|sandbox=/);
  assert.match(middleware, /response\.headers\.set\("X-Frame-Options", "DENY"\)/);
  assert.ok(!existsSync(new URL("../src/app/flights/embed/route.ts", import.meta.url)));
});

test("scope the supplier script and clean only identifiable provider assets on unmount", () => {
  const source = read("src/components/flights/AviasalesWhiteLabel.tsx");
  assert.match(source, /MutationObserver/);
  assert.match(source, /isSupplierHeadAsset/);
  assert.match(source, /headObserver\.disconnect\(\)/);
  assert.match(source, /supplierAssets/);
  assert.match(source, /originalHeadStyles/);
  assert.match(source, /isNextAppStylesheet/);
  assert.match(source, /if \(!originalHeadStyles\.has\(asset\) && !isNextAppStylesheet\(asset\)/);
  assert.match(source, /asset\.remove\(\)/);
  assert.match(source, /window\.clearTimeout\(fallbackTimer\)/);
  assert.doesNotMatch(source, /document\.head\.replaceChildren|document\.body\.style =/);
  assert.doesNotMatch(source, /dangerouslySetInnerHTML|eval\(|document\.write\(/);
});

test("supplier owns its search lifecycle; no GTH loading/error/retry panel is added", () => {
  const source = read("src/components/flights/AviasalesWhiteLabel.tsx");
  assert.match(source, /hasProviderContent\(\)/);
  assert.doesNotMatch(source, /setInterval|setStatus|Loading flight search|Flight search is unavailable|Reload flight search|RefreshCw/);
  assert.match(source, /href="\/flights\/out\/aviasales"/);
  assert.match(source, /rel="noopener noreferrer sponsored"/);
  assert.match(source, /aria-labelledby="flight-white-label-heading"/);
});

test("no route-only font CSS or supplier global root script was introduced", () => {
  const root = read("src/app/layout.tsx");
  const layout = read("src/app/flights/layout.tsx");
  const page = read("src/app/flights/page.tsx");
  assert.doesNotMatch(layout, /flights\.css/);
  assert.match(page, /<AviasalesWhiteLabel isResultsView=\{isResultsView\} \/>/);
  assert.doesNotMatch(page, /tpwidg\.com|tpwgts\.com|dangerouslySetInnerHTML/);
  assert.doesNotMatch(root, /tpwidg\.com\/wl_web\/main\.js/);
});
