import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const read = (path) => readFileSync(new URL("../" + path, import.meta.url), "utf8");

test("TPWL 23459 executes in isolated iframe instead of the persistent app document", () => {
  const source = read("src/components/flights/AviasalesWhiteLabel.tsx");
  assert.match(source, /srcDoc=\{whiteLabelDocument\}/);
  assert.match(source, /<iframe/);
  assert.match(source, /sandbox="allow-scripts allow-forms allow-popups/);
  assert.doesNotMatch(source, /sandbox="[^"]*allow-same-origin/);
  assert.match(source, /id="tpwl-search"/);
  assert.match(source, /id="tpwl-tickets"/);
  assert.match(source, /tpwidg\.com\/wl_web\/main\.js\?wl_id=23459/);
  assert.match(source, /tpwgts\.com\/wl_web\/main\.js\?wl_id=23459/);
  assert.match(source, /document\.head\.appendChild\(script\)/);
  assert.match(source, /window\.parent\.postMessage/);
  assert.match(source, /event\.source !== iframeRef\.current\.contentWindow/);
  assert.match(source, /window\.removeEventListener\("message", handleWidgetMessage\)/);
  assert.doesNotMatch(source, /document\.head\.appendChild\(script\);\s*}\s*,\s*\[\]/);
  assert.doesNotMatch(source, /dangerouslySetInnerHTML|window\.top\.document|document\.write\(/);
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

test("provider links and accessibility remain available if script fails inside frame", () => {
  const source = read("src/components/flights/AviasalesWhiteLabel.tsx");
  assert.match(source, /onerror = function/);
  assert.match(source, /else emit\("error"\)/);
  assert.match(source, /status === "error"/);
  assert.match(source, /href="\/flights\/out\/aviasales"/);
  assert.match(source, /rel="noopener noreferrer sponsored"/);
  assert.match(source, /title="Aviasales flight search and results"/);
  assert.match(source, /aria-labelledby="flight-white-label-heading"/);
});
