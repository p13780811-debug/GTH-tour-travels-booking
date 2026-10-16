import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const file = path => readFileSync(new URL("../" + path, import.meta.url), "utf8");

test("Hotel detail metadata is record-specific and rejects OSM-only, unsafe partner listings", () => {
  const page = file("src/app/hotels/stay/[id]/page.tsx");
  const seo = file("src/lib/seo/public-listings.ts");
  assert.match(page, /export async function generateMetadata/);
  assert.match(page, /hotelMetadata\(await getHotel\(id\),id,isPublicLaunch\(\)\)/);
  assert.match(page, /\.eq\("is_public",true\)\.eq\("media_rights_verified",true\)/);
  assert.match(seo, /item\.source !== "OpenStreetMap"/);
  assert.match(seo, /validPartner\(item\.partner\)/);
  assert.match(seo, /validHttps\(item\.sourceUrl\)/);
  assert.match(seo, /robots: \{ index, follow: index \}/);
  assert.doesNotMatch(seo, /wifi available|partner rates guaranteed|Luxury Villas in Goa partner rates/i);
});

test("Tender metadata remains indexable only for active source-verified public notices", () => {
  const page = file("src/app/tender/[id]/page.tsx");
  const catalog = file("src/lib/tender/catalog.ts");
  const seo = file("src/lib/seo/public-listings.ts");
  assert.match(page, /export async function generateMetadata/);
  assert.match(page, /tenderMetadata\(result\.ok \? result\.item : null, id, isPublicLaunch\(\)\)/);
  assert.match(catalog, /\.eq\("status", "published"\)\.eq\("source_verified", true\)\.eq\("is_public", true\)/);
  assert.match(catalog, /\.gt\("deadline_at", new Date\(\)\.toISOString\(\)\)/);
  assert.match(seo, /Date\.parse\(item\.deadline_at\) > now/);
  assert.match(seo, /clean\(item\.summary, 1000\)\.length >= 90/);
  assert.match(seo, /validHttps\(item\.source_url\)/);
  assert.match(seo, /source_name/);
  assert.match(seo, /index = launched && isIndexableTender\(item\)/);
});

test("Sitemap auto-discovers only approved hotel listings and active tenders", () => {
  const sitemap = file("src/app/sitemap.ts");
  assert.match(sitemap, /export const revalidate = 3600/);
  assert.match(sitemap, /if \(!publicLaunch\) return \[\]/);
  assert.match(sitemap, /MAX_APPROVED_PER_SOURCE = 1000/);
  assert.match(sitemap, /\.eq\("media_rights_verified", true\)/);
  assert.match(sitemap, /\.eq\("source_verified", true\)\.eq\("status", "published"\)/);
  assert.match(sitemap, /\.gt\("deadline_at", now\)/);
  assert.match(sitemap, /isIndexableHotel\(record\)/);
  assert.match(sitemap, /isIndexableTender\(item as TenderSeoRecord\)/);
  assert.match(sitemap, /\.\.\.approved/);
  assert.doesNotMatch(sitemap, /service_role|SUPABASE_SERVICE_ROLE_KEY|select\("\*"\)/);
});
