import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";

const page=readFileSync(new URL("../src/app/destinations/[slug]/page.tsx",import.meta.url),"utf8");
const seo=readFileSync(new URL("../src/lib/seo/large-sitemaps.ts",import.meta.url),"utf8");
test("public destination metadata is server rendered and DB reads use shared persistent caching",()=>{
 assert.match(page,/import \{ unstable_cache \} from "next\/cache"/);
 assert.match(page,/const getDestination=unstable_cache\(async \(slug: string\)/);
 assert.match(page,/\["gth-destination-public-metadata-v1"\],\{revalidate:3600\}/);
 assert.match(page,/const place = await getDestination\(slug\)/);
 assert.match(page,/const destination = await getDestination\(slug\)/);
 assert.doesNotMatch(page,/GEMINI_API_KEY|SUPABASE_SERVICE_ROLE_KEY|generateContent/);
});
test("crawl requests never promote unapproved AI drafts to indexable metadata",()=>{
 assert.match(page,/seoTitle:approved && typeof data\.seo_title==="string"/);
 assert.match(page,/seoDescription:approved && typeof data\.seo_description==="string"/);
 assert.match(page,/data\.seo_title\.toLocaleLowerCase\(\)\.includes\(name\.toLocaleLowerCase\(\)\)/);
 assert.match(page,/data\.seo_description\.toLocaleLowerCase\(\)\.includes\(name\.toLocaleLowerCase\(\)\)/);
 assert.match(page,/robots:\{index,follow:index\}/);
 assert.match(page,/isPublicLaunch\(\)&&place\.seoApproved/);
 assert.match(seo,/view:"gth_seo_destinations_v1"/);
 assert.match(page,/alternates: \{ canonical: `\/destinations\/\$\{slug\}` \}/);
});
