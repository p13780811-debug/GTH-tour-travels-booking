import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
const read=p=>readFileSync(new URL("../"+p,import.meta.url),"utf8");

test("PR204 SEO, blog and fourth-pillar ticket editorial survive consolidation",()=>{
 const home=read("src/components/home/FlagshipHome.tsx");
 const schema=read("src/components/seo/SiteIdentitySchema.tsx");
 const blogs=read("src/data/blogTickets.ts");
 const pexels=read("src/lib/editorial/pexels.ts");
 assert.match(home,/id:"tickets"/);
 assert.match(home,/href:"\/stadiums"/);
 assert.match(schema,/Worldwide/);
 assert.match(blogs,/how-to-find-sports-match-tickets-worldwide/);
 assert.match(pexels,/PEXELS_API_KEY/);
 const web=read("src/app/page.tsx");
 assert.match(web,/return <FlagshipHome \/>/);
});

test("Booking intent stays with Nuitee and only an explicitly chosen directory uses OSM",()=>{
 const hotel=read("src/app/hotels/page.tsx");
 const mobile=read("src/app/app/hotels/page.tsx");
 const provider=read("src/components/hotel/HotelBookingExperience.tsx");
 assert.match(hotel,/params\.get\("view"\) === "directory" \|\| params\.get\("directory"\) === "1"/);
 assert.doesNotMatch(hotel,/params\.get\("view"\) !== "booking" && \["city"/);
 assert.match(hotel,/const chooseHotelMode=/);
 assert.match(hotel,/name="view" value="booking"/);
 assert.match(mobile,/query\.directory==="1"\|\|query\.view==="directory"/);
 assert.match(provider,/hotelWhiteLabelUrl/);
 assert.match(provider,/Select the matching place from the Nuitee location suggestions below/);
 assert.doesNotMatch(provider,/NEXT_PUBLIC_NUITEE.*API_KEY|SUPABASE_SERVICE_ROLE_KEY/);
});

test("Safe hotel discovery and exact venue routing never claim invented prices or random foreign tours",()=>{
 const legacy=read("src/components/sections/HotelScroll.tsx");
 assert.doesNotMatch(legacy,/YOUR_MARKER|search\.hotellook\.com|Available Now|Elite Rate|Math\.random|style jsx/);
 const venue=read("src/lib/travel/stadium-partner-discovery.ts");
 const tickets=read("src/app/tickets/WorldwideTicketExplorer.tsx");
 assert.match(venue,/stadiumAffiliateHref/);
 assert.doesNotMatch(venue,/getyourguide\.com\/s\/|buildPartnerSearch/);
 assert.match(tickets,/No matching reviewed venue or ticket source/);
 assert.doesNotMatch(tickets,/mode==="fallback"/);
 const nav=read("src/components/MobileNav.tsx");
 assert.match(nav,/href: "\/app", appHref: "\/app", name: "Home"/);
});
