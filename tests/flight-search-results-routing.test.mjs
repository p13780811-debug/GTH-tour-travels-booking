import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const read=(p)=>readFileSync(new URL("../"+p,import.meta.url),"utf8");

test("TPWL flight search results route is explicitly /flights on the active host",()=>{
  const s=read("src/components/flights/AviasalesWhiteLabel.tsx");
  assert.match(s,/TPWL_CONFIGURATION/);
  assert.match(s,/new URL\("\/flights", window\.location\.origin\)\.href/);
  assert.match(s,/resultsURL: configuredResultsUrl/);
  assert.ok(s.indexOf("resultsURL: configuredResultsUrl") < s.indexOf("document.head.appendChild(script)"),
    "Results route must be configured before the vendor script initializes");
  assert.match(s,/id="tpwl-search"/);
  assert.match(s,/id="tpwl-tickets"/);
  assert.match(s,/wl_id=23459/);
  assert.match(s,/initialConfiguration === undefined/);
  assert.match(s,/delete configuredWindow\.TPWL_CONFIGURATION/);
  assert.doesNotMatch(s,/srcDoc=|<iframe|document\.body\.innerHTML/);
});

test("historical root ?flightSearch= link is redirected only for safe flight tokens",()=>{
  const s=read("src/middleware.ts");
  assert.match(s,/searchParams\.get\("flightSearch"\)/);
  assert.match(s,/pathname === "\/"/);
  assert.match(s,/\^\[A-Za-z0-9\]\{10,40\}\$/);
  assert.match(s,/results\.pathname = "\/flights"/);
  assert.match(s,/results\.searchParams\.set\("flightSearch", flightCode\)/);
  assert.match(s,/NextResponse\.redirect\(results, 307\)/);
  assert.match(s,/Cache-Control", "no-store"/);
  assert.match(s,/X-Frame-Options", "DENY"/);
  assert.ok(/^[A-Za-z0-9]{10,40}$/.test("CCU2110BOM1"));
  assert.equal(/^[A-Za-z0-9]{10,40}$/.test("https://bad.site"),false);
});

test("provider controls Booking.com hotel option, with flight-only instruction and GTH hotel route",()=>{
  const s=read("src/components/flights/AviasalesWhiteLabel.tsx");
  const page=read("src/app/flights/page.tsx");
  assert.match(s,/Show hotels/);
  assert.match(s,/checkbox is unchecked/);
  assert.match(page,/href: "\/hotels"/);
  assert.doesNotMatch(s,/window\.open\(|booking\.com|hotellook/);
});

test("CSS and hero not changed as a workaround for routing",()=>{
  const page=read("src/app/flights/page.tsx");
  const root=read("src/app/layout.tsx");
  assert.match(page,/Find your next flight/);
  assert.match(root,/Noto_Sans/);
  assert.match(page, /query\.flightSearch/);
  assert.match(page, /isResultsView=\{isResultsView\}/);
});


test("real flightSearch results suppress the host's fake loading/Retry card but leave TPWL intact", () => {
  const page = read("src/app/flights/page.tsx");
  const component = read("src/components/flights/AviasalesWhiteLabel.tsx");
  assert.match(page, /flightSearch\?: string/);
  assert.match(page, /const isResultsView = typeof query\.flightSearch === "string"/);
  assert.match(page, /<AviasalesWhiteLabel isResultsView=\{isResultsView\} \/>/);
  assert.match(component, /export default function AviasalesWhiteLabel\(\{ isResultsView = false \}/);
  assert.match(component, /!isResultsView && status === "loading"/);
  assert.match(component, /!isResultsView && status === "error"/);
  assert.match(component, /isResultsView \? "Flight results" : "Find flights for your trip"/);
  assert.match(component, /id="tpwl-search"/);
  assert.match(component, /id="tpwl-tickets"/);
  assert.match(component, /href="\/flights\/out\/aviasales"/);
  assert.match(component, /document\.head\.appendChild\(script\)/);
  assert.doesNotMatch(component, /<iframe|srcDoc=/);
});
