import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
const read = file => readFileSync(file,"utf8");

test("Media candidates never fetch remote images or bypass exact approved source contracts",()=>{
 const intake=read("src/app/api/admin/property-media-feeds/route.ts");
 const check=read("src/lib/property-media/media-feed.ts");
 assert.match(intake,/configuredMediaFeeds/);
 assert.match(intake,/validateMediaCandidate/);
 assert.match(intake,/eq\("source_type","registry"\)/);
 assert.match(intake,/match_method:"rera_exact"/);
 assert.match(intake,/status:"pending"/);
 assert.doesNotMatch(intake,/fetch\(|\.storage\.from|status:"published"/);
 assert.match(check,/GTH_RE_MEDIA_SOURCE_CONTRACTS/);
 assert.match(check,/source\.origin!==contract\.origin/);
});
test("Private media proxy fails closed after takedown and does not export private storage paths",()=>{
 const media=read("src/app/api/property-media/[id]/route.ts");
 assert.match(media,/is_property_media_public/);
 assert.match(media,/eq\("status","published"\)/);
 assert.match(media,/media\.status!=="approved"/);
 assert.match(media,/claim\?\.status!=="approved"/);
 assert.match(media,/Cache-Control":"no-store"/);
 assert.doesNotMatch(media,/getPublicUrl|createSignedUrl|NEXT_PUBLIC_.*SERVICE/);
});
test("Independent review is required for publishing and takedown",()=>{
 const migration=read("supabase/migrations/20261020123000_re_07_09_media_candidate_publication.sql");
 assert.match(migration,/create policy "public may see independently approved media metadata"/i);
 assert.match(migration,/security definer/);
 assert.match(migration,/m\.reviewed_by<>m\.uploader_id/);
 assert.match(migration,/p_action not in \('publish','take_down'\)/);
 assert.match(migration,/p\.status='published'/);
 assert.match(migration,/status='taken_down'/);
 assert.doesNotMatch(migration,/update public\.properties set/i);
});
test("Registry records retain truthful placeholders until approved project media exists",()=>{
 const card=read("src/components/real-estate/ExplorerCard.tsx");
 const gallery=read("src/components/property/PropertyGallery.tsx");
 const image=read("src/components/real-estate/PropertyImage.tsx");
 const details=read("src/app/real-estate/[slug]/page.tsx");
 assert.match(card,/projectCover\(p\.publishedMedia\|\|\[\]\)/);
 assert.match(gallery,/publishedMedia/);
 assert.match(gallery,/Image attribution/);
 assert.match(image,/Project photo not available/);
 assert.doesNotMatch(image,/reviewedInventoryMedia/);
 assert.doesNotMatch(gallery,/reviewedInventoryMedia/);
 assert.match(details,/primaryImageOfPage/);
 assert.match(details,/getPublishedProjectMedia/);
});
