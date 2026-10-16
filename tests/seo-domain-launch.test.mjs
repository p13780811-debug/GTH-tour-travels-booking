import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync, existsSync} from "node:fs";
const source = p => readFileSync(new URL("../" + p, import.meta.url), "utf8");

test("SEO domain selection is conditional: never prematurely index or point to unowned primary", () => {
  const seo=source("src/lib/seo/site.ts");
  const root=source("src/app/layout.tsx");
  const robots=source("src/app/robots.ts");
  const sitemap=source("src/app/sitemap.ts");
  assert.match(seo,/PRIMARY_ORIGIN = "https:\/\/www\.gthproglobal\.com"/);
  assert.match(seo,/https:\/\/gth-pro\.vercel\.app/);
  assert.match(seo,/GTH_PUBLIC_LAUNCH_ENABLED === "true"/);
  assert.match(seo,/VERCEL_ENV === "production"/);
  assert.match(root,/metadataBase: new URL\(siteOrigin\(\)\)/);
  assert.match(root,/index: false, follow: false/);
  assert.match(sitemap,/if \(!publicLaunch\) return \[\]/);
  assert.match(sitemap,/const base = siteOrigin\(\)/);
  assert.match(robots,/sitemap: siteOrigin\(\) \+ "\/sitemap\.xml"/);
  assert.match(robots,/allow: "\/"/);
  assert.match(robots,/disallow: privateRoutes/);
  assert.doesNotMatch(root,/alternates:\s*\{\s*canonical:\s*"\/"\s*\}/);
});
test("indexable public content is canonicalized and private results excluded",()=>{
  const sitemap=source("src/app/sitemap.ts");
  for(const p of ["/privacy-policy","/terms-and-conditions","/refund-policy","/contact","/partners","/about","/affiliate-disclosure"]) {
    assert.ok(sitemap.includes('"'+p+'"'),p);
  }
  for(const p of ["/partners/apply","/hotels/results","/search","/real-estate/saved"]) {
    assert.ok(!sitemap.includes('"'+p+'"'),p);
  }
  assert.match(source("src/app/activities/page.tsx"),/canonical: "\/tours"/);
  for(const p of ["src/app/hotels/results/page.tsx","src/app/ai-trip/page.tsx",
    "src/app/owners/layout.tsx","src/app/gth-kitchen/layout.tsx"]) {
    assert.match(source(p),/index: false/);
  }
  assert.match(source("src/app/hotels/[slug]/page.tsx"),/canonical: `\/hotels\/\$\{parsed\.citySlug\}`/);
  assert.match(source("src/app/tours/[slug]/page.tsx"),/canonical: `\/tours\/\$\{encodeURIComponent\(slug\)\}`/);
  assert.match(source("src/app/real-estate/[slug]/page.tsx"),/isPublicLaunch\(\)/);
  assert.match(source("src/app/real-estate/layout.tsx"),/GTH_PUBLIC_LAUNCH_ENABLED === "true"/);
});
test("structured data tells the truth, never fake names, ratings or partner approvals",()=>{
 const company=source("src/components/seo/SiteIdentitySchema.tsx");
 const blog=source("src/app/blog/[slug]/page.tsx");
 const destination=source("src/app/destinations/[slug]/page.tsx");
 const legacy=source("src/components/GTH_SEO.tsx");
 const home=source("src/components/home/FlagshipHome.tsx");
 assert.match(home,/<SiteIdentitySchema \/>/);
 assert.match(company,/"@type": "Organization"/);
 assert.match(company,/official\.gthpro@gmail\.com/);
 assert.match(blog,/"@type": "BlogPosting"/);
 assert.match(destination,/"@type": "BreadcrumbList"/);
 for(const value of [company,legacy])assert.doesNotMatch(value,/Sanjay Basak|200 OK verified live|gthpro\.com|aggregateRating|priceRange/);
 assert.ok(existsSync(new URL("../docs/GTH-PRO-SEO-LAUNCH.md",import.meta.url)));
});


test("business policies expose their own canonical metadata without changing client page visuals",()=>{
 for(const [name,path] of [
  ["privacy-policy","/privacy-policy"],
  ["terms-and-conditions","/terms-and-conditions"],
  ["refund-policy","/refund-policy"]]){
  const layout=source("src/app/"+name+"/layout.tsx");
  assert.match(layout,/export const metadata/);
  assert.ok(layout.includes('canonical: "'+path+'"'));
 }
 assert.match(source("src/app/success/layout.tsx"),/index: false/);
 const article=source("src/app/blog/[slug]/page.tsx");
 assert.ok(article.includes("<JsonLd data={articleData} />"));
 assert.doesNotMatch(article,/dangerouslySetInnerHTML/);
 assert.match(source("src/components/seo/JsonLd.tsx"),/safeStructuredData/);
});


test("destination, hotel and tour social metadata and factual breadcrumbs use selected domain",()=>{
 const destinations=source("src/app/destinations/page.tsx");
 const tours=source("src/app/tours/page.tsx");
 const detail=source("src/app/tours/[slug]/page.tsx");
 const hotels=source("src/app/hotels/[slug]/page.tsx");
 for(const content of [destinations,tours]) {
   assert.match(content,/openGraph:/);
   assert.match(content,/twitter:/);
   assert.doesNotMatch(content,/gthpro\.com/);
 }
 for(const content of [detail,hotels]){
   assert.match(content,/JsonLd data=\{breadcrumbData\}/);
   assert.match(content,/"@type": "BreadcrumbList"/);
   assert.match(content,/siteUrl\(/);
   assert.doesNotMatch(content,/aggregateRating|fakeReviews|lowPriceGuarantee/);
 }
 assert.match(detail,/rel="noopener noreferrer sponsored"/);
 assert.match(hotels,/canonical: `\/hotels\/\$\{parsed\.citySlug\}`/);
});
