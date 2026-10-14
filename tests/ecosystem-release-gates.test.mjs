import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync,existsSync} from "node:fs";
const source=p=>readFileSync(new URL("../"+p,import.meta.url),"utf8");

test("shared design shell keeps dedicated Real Estate view and central footer on other routes",()=>{
 const shell=source("src/components/LayoutWrapper.tsx");
 assert.match(shell,/const isRealEstate = pathname\?\.startsWith\("\/real-estate"\)/);
 assert.match(shell,/<EcosystemFooter \/>/);
 assert.match(shell,/<ChatBot \/>/);
 assert.doesNotMatch(shell,/<Footer \/>/);
 const mega=source("src/app/mega-aggregator/page.tsx");
 assert.match(mega,/<HeroSlider \/>/);
 assert.match(mega,/href="\/partners\/apply"/);
 assert.doesNotMatch(mega,/<EcosystemFooter \/>/);
});
test("real estate and tender user entry points are original working routes",()=>{
 for(const p of ["src/app/real-estate/post-property/page.tsx","src/app/tender/assistant/page.tsx","src/app/partners/apply/page.tsx","src/app/contact/page.tsx"]){
   assert.ok(existsSync(new URL("../"+p,import.meta.url)),p);
 }
 const contact=source("src/app/contact/page.tsx");
 assert.match(contact,/PartnerApplicationForm/);
 const form=source("src/components/partners/PartnerApplicationForm.tsx");
 assert.match(form,/fetch\("\/api\/partners\/apply"/);
 assert.match(form,/consent_to_contact/);
 assert.match(form,/Send application for review/);
});
test("partner inbox fails closed and cannot grant itself publication or admin privileges",()=>{
 const route=source("src/app/api/partners/apply/route.ts");
 const sql=source("supabase/migrations/20261013235500_partner_applications.sql");
 const admin=source("src/app/api/admin/partners/route.ts");
 assert.match(route,/enforceRateLimit\(req,"enquiries"\)/);
 assert.match(route,/SUPABASE_SERVICE_ROLE_KEY/);
 assert.match(route,/consent_to_contact:true,status:"new"/);
 assert.match(sql,/partner_applications enable row level security/);
 assert.match(sql,/revoke all on public.partner_applications from public, anon, authenticated/);
 assert.match(sql,/app_metadata'->>'role'/);
 assert.match(admin,/user.app_metadata\?\.role!=="admin"/);
 assert.match(admin,/\.eq\("id",id\)/);
 assert.doesNotMatch(route,/NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY/);
});
test("preview indexing is gated, public sitemap and robots honour release switch",()=>{
 const layout=source("src/app/layout.tsx");
 const robots=source("src/app/robots.ts");
 const sitemap=source("src/app/sitemap.ts");
 for(const s of [layout,robots,sitemap]){
   assert.match(s,/GTH_PUBLIC_LAUNCH_ENABLED/);
   assert.match(s,/VERCEL_ENV/);
 }
 assert.match(robots,/disallow: "\/"/);
 assert.match(sitemap,/if \(!publicLaunch\) return \[\]/);
});


test("affiliate application contact and owned-project advertising are truthful",()=>{
 const about=source("src/app/about/page.tsx"),contact=source("src/app/contact/page.tsx");
 const home=source("src/components/home/FlagshipHome.tsx");
 const footer=source("src/components/sections/EcosystemFooter.tsx");
 const ads=source("src/components/sections/HousePromotions.tsx");
 const projects=source("src/lib/portfolio/projects.ts");
 for(const content of [about,contact,home,footer]) assert.match(content,/official\.gthpro@gmail\.com/);
 assert.match(ads,/Advertisement · GTH PRO owned projects/);
 assert.match(ads,/prefers-reduced-motion/);
 assert.match(ads,/window\.setInterval/);
 assert.match(ads,/8000/);
 assert.match(ads,/noopener noreferrer/);
 assert.match(ads,/portfolioProjects/);
 assert.match(projects,/https:\/\/gth-pro-portfolio\.pages\.dev\//);
 assert.match(projects,/https:\/\/thali-treats-palava\.lovable\.app\//);
 assert.doesNotMatch(ads,/Google Ads sponsored placement|Guaranteed results/);
 assert.match(footer,/<HousePromotions \/>/);
 assert.match(home,/<HousePromotions flagship \/>/);
 const legacy=source("src/components/real-estate/OwnerProjectAds.tsx");
 assert.match(legacy,/portfolioProjects\.filter/);
 assert.match(home,/BrandVideo name="logo-motion"/);
 assert.match(home,/className=\{styles\.cityFooter\}/);
});

test("public partner inbox stays private, and launch indexing remains gated",()=>{
 const api=source("src/app/api/partners/apply/route.ts");
 const robots=source("src/app/robots.ts");
 const sitemap=source("src/app/sitemap.ts");
 assert.match(api,/SUPABASE_SERVICE_ROLE_KEY/);
 assert.match(api,/enforceRateLimit\(req,"enquiries"\)/);
 assert.match(robots,/if \(!publicLaunch\)/);
 assert.match(sitemap,/if \(!publicLaunch\) return \[\]/);
 assert.match(source("src/app/about/page.tsx"),/mailto:official\.gthpro@gmail\.com/);
});
