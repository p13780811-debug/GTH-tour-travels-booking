import test from "node:test";
import assert from "node:assert/strict";
import {existsSync,readFileSync} from "node:fs";
const file=path=>readFileSync(new URL("../"+path,import.meta.url),"utf8");
const route=path=>existsSync(new URL("../src/app"+path+"/page.tsx",import.meta.url));
const svg=path=>existsSync(new URL("../public"+path,import.meta.url));

test("four independent research pillars are present on both desktop and mobile",()=>{
 const flagship=file("src/components/home/FlagshipHome.tsx");
 const pillarCards=file("src/components/sections/EcosystemPillars.tsx");
 const mobile=file("src/components/mobile/MobileAppDashboard.tsx");
 const services=file("src/lib/mobile/app-dashboard.ts");
 const journeys=file("src/components/mobile/AppJourneyCards.tsx");
 const footer=file("src/components/sections/EcosystemFooter.tsx");
 for(const label of ["Real Estate","Travel","Tender","Tickets"]){
  assert.ok(flagship.includes(label),label+" missing on flagship");
 }
 for(const path of ["/tickets","/stadiums","/real-estate","/tender","/travel"]){
  assert.ok(route(path),path+" must exist");
 }
 assert.match(flagship,/id:"tickets"/);
 assert.match(pillarCards,/number:"04"/);
 assert.match(pillarCards,/Four defining pillars/);
 assert.match(mobile,/grid-cols-5/);
 assert.match(mobile,/id:"tickets",name:"Tickets"/);
 assert.match(services,/AppPillar="all"\|"travel"\|"property"\|"tender"\|"tickets"/);
 assert.match(journeys,/id:"tickets",eyebrow:"04/);
 assert.match(footer,/heading: "Tickets & Events"/);
 assert.match(file("src/components/MobileNav.tsx"),/name: "Tickets", Icon: Ticket/);
});
test("ticket intent routes to existing curated source explorer, not invented inventory",()=>{
 const desktop=file("src/app/search/page.tsx");
 const mobile=file("src/lib/mobile/universal-search.ts");
 const ticketPage=file("src/app/tickets/page.tsx");
 const explorer=file("src/app/tickets/WorldwideTicketExplorer.tsx");
 const megaSearch=file("src/app/mega-aggregator/EcosystemUnifiedSearch.tsx");
 for(const source of [desktop,mobile,megaSearch])assert.ok(source.includes('"ticket"'),"Missing ticket category");
 assert.ok(desktop.includes('if (category === "ticket") return withParam("/tickets","q",q);'));
 assert.ok(mobile.includes('if(category==="ticket")return {category,href:"/tickets?"'));
 assert.ok(ticketPage.includes('const initialQuery=typeof params.q==="string"?params.q.slice(0,100):""'));
 assert.ok(explorer.includes('useState(initialQuery.slice(0,100))'));
 assert.doesNotMatch(desktop,/style=\{theme\}|const theme\s*=\s*\{/);
 assert.doesNotMatch(desktop,/#[0-9a-f]{6}\b/i);
});
test("Australia has no Digha fallback and 9 ticket categories have unique original artwork",()=>{
 const src=file("src/data/blogTickets.ts");
 assert.ok(src.includes('slug:"australia-cricket-afl-music-ticket-guide"'));
 const row=src.match(/slug:"australia-cricket-afl-music-ticket-guide"[^\n]+/);
 assert.ok(row);
 assert.ok(row[0].includes('image:"/images/editorial/australia.svg"'));
 assert.ok(!row[0].includes("default.jpg")&&!row[0].includes("digha"));
 const images=[...src.matchAll(/slug:"[^"]+",title:"[^"]+",description:"[^"]+",category:"Tickets",image:"([^"]+)"/g)].map(m=>m[1]);
 assert.equal(images.length,15);
 assert.equal(new Set(images).size,15,"Do not repeat same image across ticket guide cards");
 for(const image of images)assert.ok(svg(image),"Missing local ticket photo or artwork "+image);
});
test("Tender guides have separate subject-specific non-location media",()=>{
 const src=file("src/data/blogCrossTender.ts");
 const a=JSON.parse(src.match(/:readonly EcosystemGuide\[\]=([\s\S]+);\s*$/)[1]);
 assert.equal(a.length,6);
 const images=a.map(x=>x.image);
 assert.equal(new Set(images).size,6);
 for(const img of images)assert.ok(img.startsWith("/images/editorial/tender-")&&svg(img),img);
});
test("Pexels only runs server-side with cached static editorial fallback",()=>{
 const p=file("src/lib/editorial/pexels.ts");
 const detail=file("src/app/blog/[slug]/page.tsx");
 assert.ok(p.includes('import "server-only"'));
 assert.ok(p.includes("process.env.PEXELS_API_KEY"));
 assert.ok(p.includes('hostname==="images.pexels.com"'));
 assert.ok(p.includes('hostname==="www.pexels.com"'));
 assert.ok(p.includes("revalidate:60*60*24*30"));
 assert.ok(p.includes("AbortSignal.timeout(2500)"));
 assert.ok(!p.includes("NEXT_PUBLIC_PEXELS"));
 assert.ok(detail.includes("pexelsPhoto?.src||blog.image"));
 assert.ok(detail.includes("Illustrative photo by"));
 assert.ok(detail.includes('href={pexelsPhoto.source}'));
 assert.ok(file("next.config.ts").includes('hostname: "images.pexels.com"'));
});
test("global theme and downstream identities reflect four source-aware pillars",()=>{
 const about=file("src/app/about/page.tsx");
 const verification=file("src/app/verification/page.tsx");
 const identity=file("src/components/seo/SiteIdentitySchema.tsx");
 const blog=file("src/app/blog/page.tsx");
 const destination=file("src/components/destination/DestinationEcosystem.tsx");
 assert.ok(about.includes("Four connected fields"));
 assert.ok(verification.includes("Four connected digital platforms"));
 assert.ok(identity.includes('siteUrl("/tickets")'));
 assert.ok(blog.includes("Four connected pillars"));
 assert.ok(destination.includes("Four pillars connected"));
 const root=file("src/app/layout.tsx");
 assert.ok(root.includes("Four Pillars"));
 assert.ok(!root.includes("NEXT_PUBLIC_PEXELS"));
 assert.ok(!file("src/components/home/FlagshipHome.tsx").includes("PEXELS_API_KEY"));
});
