import assert from "node:assert/strict";
import test from "node:test";
import {existsSync,readFileSync} from "node:fs";
const read=(name)=>readFileSync(new URL("../"+name,import.meta.url),"utf8");
const fromTs=(file,exportName)=>{
 const src=read(file);
 const re=new RegExp(exportName+":readonly EcosystemGuide\\[\\]=([\\s\\S]+);\\s*$");
 const m=src.match(re);
 assert.ok(m,"Editorial data registry missing: "+file);
 return JSON.parse(m[1]);
};
const sources=[
 fromTs("src/data/blogCrossTravel.ts","crossTravelGuides"),
 fromTs("src/data/blogCrossProperty.ts","crossPropertyGuides"),
 fromTs("src/data/blogCrossTender.ts","crossTenderGuides"),
];
const articles=sources.flat();
const slugs=[...read("src/lib/flights/partners.ts").matchAll(/slug:\s*"([a-z0-9-]+)"/g)].map(m=>m[1]);
const official=new Set([
 "maharera.maharashtra.gov.in","gem.gov.in","eprocure.gov.in",
 "www.ungm.org","ted.europa.eu","projects.worldbank.org"
]);
test("research coverage: 8 travel, 6 property and 6 tender guides",()=>{
 assert.deepEqual(sources.map(set=>set.length),[8,6,6]);
 assert.equal(new Set(articles.map(a=>a.slug)).size,20);
 for(let i=0;i<3;i++){
  const pillar=["Travel","Real Estate","Tenders"][i];
  assert.ok(sources[i].every(a=>a.pillar===pillar));
 }
});
test("original articles are substantial, useful and image-backed",()=>{
 const bodies=new Set();
 for(const article of articles){
  assert.match(article.slug,/^[a-z0-9]+(?:-[a-z0-9]+)*$/);
  assert.ok(article.title.length>=48,article.slug+" title too short");
  assert.ok(article.description.length>=90,article.slug+" description too short");
  assert.ok(article.content.split(/\s+/).length>=210,article.slug+" is a thin article");
  assert.ok((article.content.match(/^## /gm)||[]).length>=5,article.slug+" missing research sections");
  assert.ok((article.content.match(/\]\(\/[A-Za-z0-9/?#=&-]+\)/g)||[]).length>=3,article.slug+" needs useful internal links");
  assert.equal(article.publishedAt,"2026-11-13");
  assert.ok(existsSync(new URL("../public"+article.image,import.meta.url)),"Missing licensed existing media path "+article.image);
  assert.ok(!bodies.has(article.content),article.slug+" duplicates another article");
  bodies.add(article.content);
 }
});
test("only existing tracked Travelpayouts links, GYG and hotel WL helpers are referenced",()=>{
 const validSlugs=new Set(slugs);
 assert.ok(validSlugs.size>=14,"Missing pre-existing reviewed flight partner registry");
 for(const article of articles){
  assert.ok(article.resources.length>=3,article.slug+" missing contextual resource paths");
  assert.equal(new Set(article.resources.map(x=>x.href)).size,article.resources.length);
  for(const resource of article.resources){
   assert.ok(resource.label.length>=6&&resource.description.length>=15);
   if(resource.href.startsWith("/")){
    assert.ok(!resource.href.startsWith("//")&&!resource.href.includes("\\\\"));
   }else{
    const u=new URL(resource.href);
    assert.equal(u.protocol,"https:");
    assert.ok(official.has(u.hostname),resource.href+" unapproved external official link");
    assert.ok(!u.username&&!u.password&&!u.hash);
   }
  }
  for(const slug of article.partnerSlugs||[])assert.ok(validSlugs.has(slug),article.slug+" unknown affiliate "+slug);
  if(article.pillar!=="Travel")assert.ok(!article.partnerSlugs?.length&&!article.nuitee&&!article.gygCruiseDestination);
 }
 const component=read("src/components/seo/EcosystemGuideResources.tsx");
 assert.ok(component.includes("findFlightPartner")&&component.includes("buildCruiseProviderSearch")&&component.includes("hotelProviderSearchUrl")&&component.includes("buildPartnerSearch"));
 assert.ok(component.includes('rel="sponsored noopener noreferrer"'),"Affiliate URLs must be sponsored and safe");
 assert.ok(component.includes("officialHosts.has"),"Official links must be allowlisted");
});
test("SEO hierarchy: all articles, main pillar guide hubs, sitemap and related links are reachable",()=>{
 const blog=read("src/data/blogs.ts");
 const index=read("src/app/blog/page.tsx");
 const article=read("src/app/blog/[slug]/page.tsx");
 const sitemap=read("src/app/sitemap.ts");
 const property=read("src/app/real-estate/page.tsx");
 const tender=read("src/app/tender/page.tsx");
 assert.ok(blog.includes("...ecosystemGuides"));
 assert.ok(blog.includes('"Real Estate" | "Tenders"'));
 assert.ok(index.includes('"Real Estate", "Tenders"'));
 assert.ok(index.includes('id="ecosystem-guides"'));
 assert.ok(article.includes("EcosystemGuideResources slug={ecosystemGuide.slug}"));
 assert.ok(article.includes("datePublished:datedGuide.publishedAt"));
 assert.ok(article.includes("BreadcrumbList"));
 assert.ok(sitemap.includes('"/real-estate/guides"')&&sitemap.includes('"/tender/guides"'));
 assert.ok(sitemap.includes('...blogs.map(article => ({ url: base + "/blog/" + article.slug'));
 assert.ok(property.includes('href="/real-estate/guides"')&&tender.includes('href="/tender/guides"'));
 for(const path of ["src/app/real-estate/guides/page.tsx","src/app/tender/guides/page.tsx"]) {
  const page=read(path);
  assert.ok(page.includes("PillarGuideIndex")&&page.includes("isPublicLaunch()")&&page.includes("siteUrl("));
 }
});
