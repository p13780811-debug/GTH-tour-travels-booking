import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import test from "node:test";
const read=(path)=>readFileSync(new URL("../"+path,import.meta.url),"utf8");

test("global blog index and articles use only central theme variables, no manual CSS",()=>{
  for(const path of ["src/app/blog/page.tsx","src/app/blog/[slug]/page.tsx"]){
    const body=read(path);
    assert.doesNotMatch(body,/\bstyle\s*=/,"No inline CSS is permitted: "+path);
    assert.doesNotMatch(body,/CSSProperties|const palette\s*=/,"No custom theme or local palette: "+path);
    assert.doesNotMatch(body,/#[0-9a-fA-F]{3}(?:[0-9a-fA-F]{3})?(?:[0-9a-fA-F]{2})?\b/,"Hardcoded CSS color: "+path);
    assert.match(body,/bg-\[var\(--bg\)\]/,"Must reuse global background token");
    assert.match(body,/text-\[var\(--text\)\]/,"Must reuse global text token");
    assert.match(body,/border-\[var\(--border\)\]/,"Must reuse global border token");
    assert.match(body,/max-w-7xl/,"Keep centered responsive container");
    assert.match(body,/min-w-0/,"Protect narrow Android screens from grid overflow");
    assert.match(body,/sm:grid-cols-2/,"Must have responsive card grids");
  }
});
test("knowledge hub retains its SEO article filters and pillar links",()=>{
  const body=read("src/app/blog/page.tsx");
  assert.match(body,/id="ecosystem-guides"/);
  assert.match(body,/id="ticket-guides"/);
  assert.match(body,/id="journal"/);
  assert.ok(body.includes('"Real Estate", "Tenders"'));
  assert.ok(body.includes('href:"/knowledge/tenders"'));
  assert.ok(body.includes('href="/real-estate/guides"'));
  assert.ok(body.includes('ticketBlogGuides.slice(0,6)'));
  assert.ok(body.includes('ecosystemGuides.filter'));
  assert.ok(body.includes('articles.map('));
});
test("article page retains structured SEO and safe supplier links",()=>{
  const body=read("src/app/blog/[slug]/page.tsx");
  assert.ok(body.includes("datePublished:datedGuide.publishedAt"));
  assert.ok(body.includes("const datedGuide=ticketGuide||ecosystemGuide"));
  assert.ok(body.includes("BreadcrumbList"));
  assert.ok(body.includes("TicketBlogLinks slug={ticketGuide.slug}"));
  assert.ok(body.includes("EcosystemGuideResources slug={ecosystemGuide.slug}"));
  assert.ok(body.includes('href?.startsWith("https://")&&ecosystemGuide.resources.some'));
  assert.ok(body.includes('target="_blank" rel="noopener noreferrer"'));
  assert.ok(body.includes("generateStaticParams"));
  assert.ok(body.includes("isPublicLaunch()"));
});
test("legacy tender knowledge URL redirects before dynamic UUID validation",()=>{
  const legacy=read("next.config.ts");
  const canonical=read("src/app/knowledge/tenders/page.tsx");
  const detail=read("src/app/tender/[id]/page.tsx");
  assert.ok(legacy.includes('source:"/tender/guides",destination:"/knowledge/tenders",permanent:true'));
  assert.ok(canonical.includes('siteUrl("/knowledge/tenders")'));
  assert.ok(detail.includes("getPublicTender(id)"));
  assert.ok(!legacy.includes("getPublicTender"));
  assert.ok(!legacy.includes("db.from("));
});
