import assert from "node:assert/strict";
import {existsSync,readFileSync} from "node:fs";
import test from "node:test";

const load=(path)=>readFileSync(new URL("../"+path,import.meta.url),"utf8");
const source=load("src/data/blogTickets.ts");
const guides=[...source.matchAll(/\{slug:"([^"]+)",title:"([^"]+)",description:"([^"]+)",category:"Tickets",image:"([^"]+)",publishedAt:"([^"]+)",(ticketCategory|market):"([^"]+)"/g)]
 .map(match=>({slug:match[1],title:match[2],description:match[3],image:match[4],publishedAt:match[5],dimension:match[6],value:match[7]}));
const categories=["sports","concerts","theatre","comedy","festivals","attractions","museums","theme-parks","cinema"];

test("editorial library contains one original guide per ticket category and six geographic research guides",()=>{
 assert.equal(guides.length,15,"Expected curated rather than mass-generated articles");
 assert.equal(new Set(guides.map(x=>x.slug)).size,guides.length);
 assert.deepEqual(guides.filter(g=>g.dimension==="ticketCategory").map(g=>g.value).sort(),[...categories].sort());
 assert.equal(guides.filter(g=>g.dimension==="market").length,6);
 for(const g of guides){
  assert.match(g.slug,/^[a-z0-9]+(?:-[a-z0-9]+)*$/);
  assert.ok(g.title.length>=35&&g.description.length>=70,g.slug+" metadata must be descriptive");
  assert.equal(g.publishedAt,"2026-11-13");
  assert.ok(existsSync(new URL("../public"+g.image,import.meta.url)),"Missing image for "+g.slug);
 }
});
test("each editorial page contains substantial distinct material and useful internal links",()=>{
 const contents=[...source.matchAll(/content:`([\s\S]*?)`\}/g)].map(m=>m[1]);
 assert.equal(contents.length,guides.length);
 for(let i=0;i<contents.length;i++){
  const body=contents[i];
  assert.ok(body.split(/\s+/).length>=200,"Guide too short: "+guides[i].slug);
  assert.ok((body.match(/## /g)||[]).length>=4,"Need subject-specific headings: "+guides[i].slug);
  assert.ok((body.match(/\]\(\/[a-z0-9/?#=&-]+\)/g)||[]).length>=4,"Missing on-site research links: "+guides[i].slug);
  assert.ok(!/guaranteed (?:seats|prices|tickets)|live inventory feed/i.test(body),"Unverified sales claim");
 }
 assert.equal(new Set(contents).size,contents.length);
});
test("all ticket guides are connected to existing Blog, sitemap, hub, categories and public-source component",()=>{
 const blogs=load("src/data/blogs.ts");
 const blogIndex=load("src/app/blog/page.tsx");
 const blogDetail=load("src/app/blog/[slug]/page.tsx");
 const sitemap=load("src/app/sitemap.ts");
 const ticketHub=load("src/app/tickets/page.tsx");
 const ticketCategory=load("src/app/tickets/[category]/page.tsx");
 const links=load("src/components/travel/TicketBlogLinks.tsx");
 assert.ok(blogs.includes("...ticketBlogGuides")&&blogs.includes('| "Tickets"'));
 assert.ok(blogIndex.includes('category=Tickets')||blogIndex.includes('"Tickets"'));
 assert.ok(blogIndex.includes('id="ticket-guides"'));
 assert.ok(blogDetail.includes('TicketBlogLinks slug={ticketGuide.slug}'));
 assert.ok(blogDetail.includes('datePublished:datedGuide.publishedAt') && blogDetail.includes('const datedGuide=ticketGuide||ecosystemGuide'), 'Ticket and new ecosystem guides must retain sourced publication metadata');
 assert.ok(sitemap.includes('...blogs.map(article => ({ url: base + "/blog/" + article.slug'));
 assert.ok(ticketHub.includes('ticketBlogGuides.map(guide=>'));
 assert.ok(ticketCategory.includes('guide.ticketCategory===selected.slug'));
 assert.ok(links.includes("isPublicTicketUrl(source.url)"));
 assert.ok(links.includes('href={"/tickets/"+category.slug}'));
 assert.ok(links.includes('target="_blank" rel="noopener noreferrer"'));
 assert.ok(links.includes('href="/tickets"')||links.includes('"/tickets"'));
});
