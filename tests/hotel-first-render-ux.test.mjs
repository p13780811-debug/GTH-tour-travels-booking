import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
const read=p=>readFileSync(new URL("../"+p,import.meta.url),"utf8");

test("hotel Suspense fallback delivers truthful, usable first-render search and H1",()=>{
 const s=read("src/app/hotels/page.tsx");
 assert.match(s, /<Suspense/);
 assert.match(s, /fallback=\{/);
 assert.match(s, /Discover Hotels Around the World/);
 assert.match(s, /<h1 className=/);
 assert.match(s, /<form action="\/hotels" method="GET" role="search"/);
 assert.match(s, /<label htmlFor="hotel-first-render-city"/);
 assert.match(s, /<input id="hotel-first-render-city" name="city"/);
 assert.match(s, /<button type="submit"/);
 assert.match(s, /Preparing available hotel listings/);
 assert.doesNotMatch(s, /Initializing Global Luxury Engine/);
 assert.match(s, /aria-hidden="true" className="mt-5 grid/);
});

test("hotel catalog still uses actual API data and source-backed partner handoff",()=>{
 const s=read("src/app/hotels/page.tsx");
 assert.match(s, /useSearchParams/);
 assert.match(s, /const hotelParams = hotelParamsFor\(1\)/);
 assert.match(s, /fetch\(\`\/api\/hotels\?\$\{hotelParams\}\`/);
 assert.match(s, /<HotelsContent \/>/);
 assert.match(s, /setHotels\(data as HotelListing\[\]\)/);
 assert.match(s, /hotel\.affiliate_link/);
 assert.match(s, /aria-label="Hotel city or destination"/);
 assert.doesNotMatch(s, /Math\.random|generateHotels\(/);
});

test("hotels continue to reuse approved global design, SEO canonical and route",()=>{
 const page=read("src/app/hotels/page.tsx");
 const meta=read("src/app/hotels/layout.tsx");
 assert.match(meta, /canonical: "\/hotels"/);
 assert.match(meta, /Browse actual hotel listings/);
 assert.match(page, /bg-\[var\(--bg\)\]/);
 assert.match(page, /gth-btn-gold/);
 assert.match(page, /focus-visible:outline-\[var\(--gold\)\]/);
});
