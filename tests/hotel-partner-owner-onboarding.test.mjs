import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
const read=path=>readFileSync(new URL("../"+path,import.meta.url),"utf8");

test("Only authenticated owners can submit hotel inventory; server determines ownership and private status",()=>{
 const api=read("src/app/api/hotels/partner/submissions/route.ts");
 const validator=read("src/lib/hotels/partner-validation.ts");
 assert.match(api,/authenticatedStorage\(request\)/);
 assert.match(api,/user\.email_confirmed_at/);
 assert.match(api,/enforceRateLimit\(request,"submissions",user\.id\)/);
 assert.match(validator,/owner_id:ownerId/);
 assert.match(validator,/contact_email:verifiedEmail/);
 assert.match(validator,/photo_rights_confirmed:true/);
 assert.match(validator,/owner_authorised:true/);
 assert.match(validator,/status:"pending"/);
 assert.match(validator,/Object\.keys\(body\)\.some/);
 assert.doesNotMatch(validator,/is_public:\s*true|media_rights_verified:\s*true/);
});

test("Original hotel photos stay private, are resized and stripped of metadata",()=>{
 const api=read("src/app/api/hotels/partner/photos/route.ts");
 assert.match(api,/authenticatedStorage\(request\)/);
 assert.match(api,/enforceRateLimit\(request,"upload",user\.id\)/);
 assert.match(api,/readBytes\(request,MAX_INPUT\+64\*1024\)/);
 assert.match(api,/failOn:"warning"/);
 assert.match(api,/limitInputPixels:30_000_000/);
 assert.match(api,/\.rotate\(\)\.resize/);
 assert.match(api,/\.webp\(\{quality:78,effort:4\}\)/);
 assert.match(api,/PRIVATE_BUCKET/);
 assert.match(api,/\.eq\("owner_id",user\.id\)/);
 assert.match(api,/\.eq\("status","pending"\)/); // check quoted form below if changed
 assert.doesNotMatch(api,/getPublicUrl|googlePlaces|NEXT_PUBLIC_GOOGLE/);
});

test("Hotel owner private and public storage buckets have restricted access",()=>{
 const sql=read("supabase/migrations/20261017021000_hotel_partner_owner_onboarding.sql");
 assert.match(sql,/hotel-partner-private',false/);
 assert.match(sql,/hotel-partner-public',true/);
 assert.match(sql,/photo_rights_confirmed is true/);
 assert.match(sql,/owner_authorised is true/);
 assert.match(sql,/hotel_partner_photos/);
 assert.match(sql,/grant select,insert on public\.hotel_partner_submissions to authenticated/);
 assert.match(sql,/owner_id=auth\.uid\(\)/);
 assert.match(sql,/h\.is_public is true and h\.media_rights_verified is true/);
 assert.doesNotMatch(sql,/policy.+insert.+to anon/i);
});

test("Admin publication requires server-verified admin role and separate photo/business proof",()=>{
 const api=read("src/app/api/hotels/partner/admin/route.ts");
 assert.match(api,/user\.app_metadata\?\.role!=="admin"/);
 assert.match(api,/input\.business_verified!==true\|\|input\.photo_rights_verified!==true/);
 assert.match(api,/\.eq\("status","pending"\)/);
 assert.match(api,/storage\.from\(PRIVATE_BUCKET\)\.download/);
 assert.match(api,/storage\.from\(PUBLIC_BUCKET\)\.upload/);
 assert.match(api,/media_rights_verified:false/);
 assert.match(api,/is_public:true,media_rights_verified:true/);
 assert.match(api,/source_name:"GTH PRO Reviewed Hotel Partner"/);
 const ui=read("src/components/hotel/HotelReviewDashboard.tsx");
 assert.match(ui,/verification\[item\.id\]/);
 assert.match(ui,/admin permission/i);
});

test("Reviewed owner inventory appears in hotel filters, detail photo gallery, SEO and sitemap",()=>{
 const api=read("src/app/api/hotels/route.ts");
 const detail=read("src/app/hotels/stay/[id]/page.tsx");
 const seo=read("src/lib/seo/public-listings.ts");
 const sitemap=read("src/app/sitemap.ts");
 const ownerPage=read("src/app/hotels/list-your-property/page.tsx");
 const hotelPage=read("src/app/hotels/page.tsx");
 assert.match(api,/supplierCountQuery\.eq\("country_code",country\)/);
 assert.match(api,/supplierCountQuery\.eq\("category",category\)/);
 assert.match(api,/category:hotel\.category\|\|"hotel"/);
 assert.match(detail,/hotel_partner_public_photos/);
 assert.match(detail,/GTH PRO Reviewed Hotel Partner/);
 assert.match(seo,/item\.source === "GTH PRO Reviewed Hotel Partner"/);
 assert.match(sitemap,/hotels\/list-your-property/);
 assert.doesNotMatch(sitemap,/\.not\("affiliate_link", "is", null\)/);
 assert.match(ownerPage,/HotelPartnerForm/);
 assert.match(hotelPage,/List your hotel for free/);
});

test("Hotel partner user and admin UI reuse existing shared design, without new CSS system",()=>{
 const form=read("src/components/hotel/HotelPartnerForm.tsx");
 const review=read("src/components/hotel/HotelReviewDashboard.tsx");
 assert.match(form,/gth-btn-gold/);
 assert.match(form,/\[var\(--card\)\]/);
 assert.match(review,/gth-btn-gold/);
 assert.doesNotMatch(form,/NEXT_PUBLIC_SUPABASE_SERVICE_ROLE|GOOGLE_PLACES_API_KEY/);
});
