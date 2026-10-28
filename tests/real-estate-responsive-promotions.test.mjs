import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
const read=p=>readFileSync(p,"utf8");
const hero=read("src/components/real-estate/ExplorerHero.tsx");
const page=read("src/app/real-estate/page.tsx");
const campaign=read("src/components/real-estate/CampaignPromotions.tsx");
const carousel=read("src/components/real-estate/PortalCarousel.tsx");
const ecosystem=read("src/components/real-estate/EcosystemPromotions.tsx");

test("floating property search is readable on desktop and mobile, still submits the same search",()=>{
 assert.match(hero,/left-3 right-3 top-full z-20/);
 assert.match(hero,/!bg-\[var\(--bg\)\]/);
 assert.match(hero,/text-\[var\(--text\)\]/);
 assert.doesNotMatch(hero,/gth-glass !absolute/);
 assert.match(hero,/placeholder:!text-\[var\(--text-muted\)\]/);
 assert.match(hero,/onSearch\(query.trim\(\)\)/);
});
test("affiliate carousels keep swipe and auto-scroll but no outside arrow row",()=>{
 assert.doesNotMatch(campaign,/ADVERTISEMENT · Travelpayouts affiliate promotions/);
 assert.match(campaign,/showControls=\{false\}/);
 assert.match(carousel,/count>1&&showControls&&/);
 assert.match(carousel,/onScroll=/);
 assert.match(carousel,/setInterval/);
});
test("footer ad is distinct and placed immediately above the page footer without unverified hotel partners",()=>{
 for(const id of ["worldwide-hotels","airport-transfers","car-rentals"])assert.ok(campaign.includes(`id:"${id}"`));
 assert.match(campaign,/href=isHotel\?"\/hotels":partnerSearchHref\(item.kind,item.destination\)/);
 assert.match(campaign,/sponsored nofollow noopener noreferrer/);
 assert.match(campaign,/id:"airport-transfers",title:"Explore Singapore airport transfers"/);
 assert.ok(page.indexOf('<CampaignPromotions slot="planning"/>')>page.indexOf('className={styles.submit}'));
 assert.ok(page.indexOf('<CampaignPromotions slot="planning"/>')<page.indexOf('<BottomNav user={user} />'));
 assert.equal(page.split('<CampaignPromotions slot="discovery"/>').length,2);
 assert.equal(page.split('<CampaignPromotions slot="planning"/>').length,2);
});
test("ecosystem follows buyer tools and retains Travel and Tender controls in spacious mobile cards",()=>{
 assert.match(ecosystem,/gap-10 md:grid-cols-2 md:gap-4/);
 assert.match(ecosystem,/href="\/travel"/);
 assert.match(ecosystem,/href="\/tender"/);
 assert.ok(page.indexOf('<RegistryPhotoProjects />')<page.indexOf('<section id="buyer-tools"'));
 assert.ok(page.indexOf('<section id="buyer-tools"')<page.indexOf('<EcosystemPromotions />'));
 assert.match(page,/<BottomNav user=\{user\} \/>/);
});

test("FREE badge preserves its exact original overlay and dimensions and changes only inverted theme colors",()=>{
 const badge=hero.match(/<span aria-hidden="true" className="([^"]+)"[^>]*>FREE<\/span>/);
 assert.ok(badge,"FREE badge remains above List property");
 const base="gth-btn !min-h-0 !text-xs pointer-events-none absolute left-1/2 top-0 z-10 -translate-x-1/2 -translate-y-1/2 whitespace-nowrap !px-3 !py-1";
 const positional=badge[1].replace("gth-badge-gold ","").replace(" dark:!bg-none dark:!bg-blue-600 dark:!text-white","");
 assert.equal(positional,base,"original badge geometry, sizing and CTA class must remain identical");
 assert.ok(badge[1].includes("gth-badge-gold"),"day badge uses established night-gold gradient");
 assert.ok(badge[1].includes("dark:!bg-none dark:!bg-blue-600 dark:!text-white"),"night badge uses day-blue and legible light text");
 assert.match(hero,/aria-label="List your property for free"/);
 assert.match(hero,/className="gth-btn gth-btn-gold inline-flex min-h-11/);
 assert.doesNotMatch(badge[1],/ring-|shadow-|!border-/);
});
test("Real Estate portal keeps distinct registry, offers, filtering, compare, pagination and responsive navigation",()=>{
 for(const marker of ['<RegistryDiscovery query={registryQuery}', 'aria-label="Property workspace"', 'aria-label="Property result pages"', '<DiscoveryFilters expanded', '<SavedSearches />','<ExplorerDialog state={dialog}', '<BottomNav user={user} />','<CampaignPromotions slot="discovery"/>', '<CampaignPromotions slot="planning"/>'])
   assert.ok(page.includes(marker),marker);
 assert.ok(page.includes('useState<"offers" | "registry">("registry")'));
 assert.ok(page.includes('isPropertyVisualCard'));
 assert.ok(page.includes('const applyIntent = (value: string) =>'));
 assert.ok(page.includes('const updateSearch = (term: string) =>'));
});

test("hero remains a three-image swipe/autoplay gallery with no visible arrows or brand label",()=>{
 const media=read("src/components/real-estate/HeroMedia.tsx");
 assert.match(media,/label="Property inspiration" showControls=\{false\}/);
 assert.match(media,/const scenes=\[/);
 assert.equal((media.match(/id:"(architecture|property-story|city-living)"/g)||[]).length,3);
 assert.match(media,/<p className="sr-only">Brand imagery · Not listed properties<\/p>/);
 assert.doesNotMatch(media,/overlayControls/);
 assert.match(carousel,/setInterval/);
 assert.match(carousel,/onScroll=/);
});
