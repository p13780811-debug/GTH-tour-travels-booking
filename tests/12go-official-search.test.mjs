import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const source = (path) => readFileSync(new URL("../" + path, import.meta.url), "utf8");

test("the frozen partner iframe is gone; native first-party form provides editable fields on mobile and desktop", () => {
  const form = source("src/components/travel/GTHTransportSearchWidget.tsx");
  assert.match(form, /<form method="GET" action="\/go\/transport\/search"/);
  assert.match(form, /type="text" name="from"/);
  assert.match(form, /type="text" name="to"/);
  assert.match(form, /type="date" name="date"/);
  assert.match(form, /<select className=\{field\} name="people"/);
  assert.match(form, /type="hidden" name="mode" value=\{activeMode\}/);
  assert.match(form, /type="submit"/);
  assert.match(form, /minLength=\{2\}/);
  assert.match(form, /maxLength=\{80\}/);
  assert.match(form, /sm:grid-cols-2 lg:grid-cols-4/);
  assert.match(form, /w-full min-w-0 max-w-full/);
  assert.match(form, /h-12 w-full min-w-0 max-w-full/);
  assert.match(form, /"gth-btn-gold/);
  assert.match(form, /name="mode"/);
  assert.match(form, /"ferry"/);
  assert.doesNotMatch(form, /<iframe|document\.createElement\("script"\)|ResizeObserver|dataset\.(width|height)|trainbusferry\.com|height: 680|height: 520|height: 440|pointer-events-none/);
  for (const mode of ["bus", "train", "ferry"]) {
    const page = source("src/app/" + mode + "/page.tsx");
    assert.ok(page.includes('<GTHTransportSearchWidget mode="' + mode + '" />'));
    assert.match(page, /searchFirstLayout/);
    assert.match(page, /partners=\{\[\]\}/);
    assert.doesNotMatch(page, /<TransportPlanner|TwelveGoSearchWidget|<iframe|cd.n0\.trainbusferry/i);
  }
});

test("route handoff is strict, official, mode-limited, and preserves itinerary without open redirect", () => {
  const route = source("src/app/go/transport/search/route.ts");
  assert.match(route, /"https:\/\/12go\.asia"/);
  assert.match(route, /"17380992"/);
  assert.match(route, /"bus", "train", "ferry", "flight"/);
  assert.match(route, /mode = single\(params, "mode"\)/);
  assert.match(route, /locationSlug\(single\(params, "from"\)\)/);
  assert.match(route, /locationSlug\(single\(params, "to"\)\)/);
  assert.match(route, /validDeparture\(date\)/);
  assert.match(route, /!\/\^\[1-8\]\$\/.test\(people\)/);
  assert.match(route, /from === to/);
  assert.match(route, /const supplierMode = mode === "flight" \? "flights" : mode;/);
  assert.match(route, /new URL\("\/en\/" \+ supplierMode \+ "\/" \+ from \+ "\/" \+ to, PROVIDER_ORIGIN\)/);
  assert.match(route, /supplier\.searchParams\.set\("date", date\)/);
  assert.match(route, /supplier\.searchParams\.set\("people", people\)/);
  assert.match(route, /supplier\.searchParams\.set\("z", AFFILIATE_ID\)/);
  assert.match(route, /NextResponse\.redirect\(supplier, 303\)/);
  assert.match(route, /NextResponse\.redirect\(fallback, 303\)/);
  assert.match(route, /X-Robots-Tag/);
  assert.match(route, /no-store/);
  assert.doesNotMatch(route, /process\.env|NEXT_PUBLIC_|apiKey|service_role|Math\.random|params\.get\("url"\)|searchParams\.get\("redirect"\)/i);
});

test("Ferry is a first-class GTH PRO service on nav, footer, travel landing and sitemap", () => {
  const nav = source("src/components/travel/TravelSectionNav.tsx");
  const sidebar = source("src/components/travel/TravelServicePage.tsx");
  const home = source("src/app/travel/page.tsx");
  const footer = source("src/components/sections/EcosystemFooter.tsx");
  const sitemap = source("src/app/sitemap.ts");
  const ferry = source("src/app/ferry/page.tsx");
  assert.match(nav, /href:"\/ferry",label:"Ferries"/);
  assert.match(sidebar, /href: "\/ferry", Icon: Ship/);
  assert.match(home, /name: "Ferry Travel", href: "\/ferry"/);
  assert.match(footer, /"Ferries","\/ferry"/);
  assert.match(sitemap, /"\/train", "\/ferry", "\/transfers"/);
  assert.match(ferry, /Worldwide Ferry and Sea Routes/);
  assert.match(ferry, /independent operators and the connected booking provider/);
  assert.doesNotMatch(ferry, /guaranteed availability|verified price|ticket issued/i);
});

test("Flights, Hotels and Transfers remain on their original providers and theme", () => {
  const flights = source("src/components/flights/AviasalesWhiteLabel.tsx");
  const hotel = source("src/lib/travel/hotel-whitelabel.ts");
  const transfers = source("src/app/transfers/page.tsx");
  const shell = source("src/components/travel/TravelServicePage.tsx");
  assert.match(flights, /wl_id=23459/);
  assert.match(hotel, /nuitee\.link/);
  assert.doesNotMatch(transfers, /GTHTransportSearchWidget|12go\.asia/);
  assert.match(transfers, /TransferProviderWidgets/);
  assert.match(shell, /searchFirstLayout = false/);
  assert.match(shell, /!searchFirstLayout && <aside/);
});

test("preview deployment disabled for the staging-only branch", () => {
  const c = JSON.parse(source("vercel.json"));
  assert.equal(c.git.deploymentEnabled["fix/transport-interactive-search-ferry-20261105"], false);
});

test("booking gateway exposes static Next.js segment configuration", () => {
  const gateway = source("src/app/go/transport/route.ts");
  assert.match(gateway, /export const runtime = "nodejs"/);
  assert.match(gateway, /export const dynamic = "force-dynamic"/);
  assert.match(gateway, /export \{ GET \} from "\.\.\/12go\/route"/);
});


test("all four 12Go modes switch inside the same existing search form; main Flights page stays untouched",()=>{
  const page = source("src/app/flights/page.tsx");
  const widget = source("src/components/travel/GTHTransportSearchWidget.tsx");
  const route = source("src/app/go/transport/search/route.ts");
  const hotels = source("src/lib/travel/hotel-whitelabel.ts");
  const transfers = source("src/app/transfers/page.tsx");
  assert.match(widget, /"use client"/);
  for (const mode of ['bus','train','ferry','flight']) assert.match(widget,new RegExp('mode: "'+mode+'" as const'));
  assert.match(widget, /grid-cols-4 gap-1/);
  assert.match(widget, /onClick=\{\(\) => setActiveMode\(item\)\}/);
  assert.match(widget, /aria-pressed=\{activeMode === item\}/);
  assert.match(widget, /name="mode" value=\{activeMode\}/);
  assert.match(widget, /<form method="GET" action="\/go\/transport\/search"/);
  assert.doesNotMatch(widget, /href: "\/flights|<iframe/);
  assert.match(route, /"bus", "train", "ferry", "flight"/);
  assert.match(route, /mode === "flight" \? "flights" : mode/);
  assert.match(route, /supplier\.searchParams\.set\("z", AFFILIATE_ID\)/);
  assert.match(page, /<AviasalesWhiteLabel isResultsView=\{isResultsView\} \/>/);
  assert.doesNotMatch(page, /12go-flight-options|GTHTransportSearchWidget|12go\.asia/);
  assert.match(hotels, /nuitee\.link/);
  assert.doesNotMatch(transfers, /GTHTransportSearchWidget|12go\.asia/);
});
