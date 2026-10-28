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

test("FREE badge uses existing night-gold style by day and day-blue style by night without touching the CTA",()=>{
 assert.match(hero,/gth-badge gth-badge-gold pointer-events-none absolute/);
 assert.match(hero,/dark:!bg-none dark:!bg-blue-600 dark:!text-white/);
 assert.ok(hero.includes('shadow-[var(--glow-gold)] dark:!bg-none'));
 assert.ok(hero.includes('dark:!shadow-[var(--glow-blue)]'));
 assert.match(hero,/aria-label="List your property for free"/);
 assert.match(hero,/className="gth-btn gth-btn-gold inline-flex min-h-11/);
 assert.doesNotMatch(hero,/gth-btn !min-h-0 !text-xs pointer-events-none/);
});
test("Real Estate portal keeps distinct registry, offers, filtering, compare, pagination and responsive navigation",()=>{
 for(const marker of ['<RegistryDiscovery query={registryQuery}', 'aria-label="Property workspace"', 'aria-label="Property result pages"', '<DiscoveryFilters expanded', '<SavedSearches />','<ExplorerDialog state={dialog}', '<BottomNav user={user} />','<CampaignPromotions slot="discovery"/>', '<CampaignPromotions slot="planning"/>'])
   assert.ok(page.includes(marker),marker);
 assert.ok(page.includes('useState<"offers" | "registry">("registry")'));
 assert.ok(page.includes('isPropertyVisualCard'));
 assert.ok(page.includes('const applyIntent = (value: string) =>'));
 assert.ok(page.includes('const updateSearch = (term: string) =>'));
});
