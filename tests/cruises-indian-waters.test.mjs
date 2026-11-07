import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

const ui=readFileSync('src/components/travel/IndianWaters.tsx','utf8');
const page=readFileSync('src/app/cruises/page.tsx','utf8');
const original=readFileSync('src/lib/travel/cruises.ts','utf8');

test('India block is isolated and existing international cruise catalogue is retained',()=>{
 assert.ok(page.includes('from "@/components/travel/IndianWaters";'));
 assert.match(page,/<IndianWaters options=\{selectedIndia\}\/>/);
 assert.match(original,/disney-adventure-3-nights/);
 assert.match(original,/singapore-river-cruise/);
 assert.equal((original.match(/sourceUrl:"https:\/\/www\.klook\.com/g)||[]).length,7);
});
test('six Indian photo cards with exact matched cruise products and no generic Klook fallbacks',()=>{
 for(const slug of ['goa-mandovi-dinner','kerala-alleppey-houseboat','mumbai-harbour','lakshadweep-cruises','kolkata-river-cruises','andaman-cruises'])assert.ok(ui.includes(slug),slug);
 assert.match(ui,/activity\/185166-goa-lexicon-dinner-cruise/);
 assert.match(ui,/activity\/6620-alleppey-backwater-cruise-by-houseboat-cochin/);
 assert.ok(!ui.includes("partnerSearchHref"));
 assert.match(ui,/mumbai-private-sailing-yacht-cruise-with-snacks-t1142848/);
 assert.match(ui,/kolkata-hooghly-river-sunset-cruise-with-snacks-drinks-t1250175/);
 assert.match(ui,/A matching cruise or sailing is not guaranteed/);
 assert.match(ui,/buildCruiseProviderSearch/);
});
test('Cruise action buttons are concise; supplier attribution stays in disclosure, not every CTA',()=>{
 assert.equal((ui.match(/label:"View cruise details"/g)||[]).length,2);
 assert.equal((ui.match(/label:"Find cruise options"/g)||[]).length,2);
 assert.doesNotMatch(ui,/label:"(?:Check cruise|Search cruises) on GetYourGuide"/);
 assert.match(page,/>More water experiences<\/a>/);
 const discovery=readFileSync('src/components/travel/GetYourGuideCruiseDiscovery.tsx','utf8');
 assert.match(discovery,/View experiences <ArrowUpRight/);
 assert.match(discovery,/Featured water experiences/);
 assert.match(discovery,/Powered by <a href=\{fallback\}/);
 assert.doesNotMatch(discovery,/Explore on GetYourGuide <ArrowUpRight/);
});

test('no pricing, fake images or unapproved new affiliate provider',()=>{
 assert.ok(!ui.includes('₹'));
 assert.ok(ui.includes('<Image'));
 assert.match(ui,/Special:FilePath/);
 assert.match(ui,/Indian cruise photo credits/);
 assert.match(ui,/CC BY/);
 assert.ok(ui.includes("www.getyourguide.com"));
 assert.match(ui,/https:\/\/gyg\.me\/ZzIrHzQ9/);
 assert.match(ui,/partner_id=DF3NBKA&utm_medium=online_publisher&cmp=gthpro_cruises_kolkata/);
 assert.match(ui,/partner tracking is not yet configured for this card/);
 assert.match(ui,/campaign_id:"137"/);
 assert.match(ui,/marker:"417668"/);
 assert.match(ui,/noopener noreferrer sponsored/);
});

test('GetYourGuide analyzer is scoped to cruises; approved root integrations remain untouched',()=>{
 const layout=readFileSync('src/app/cruises/layout.tsx','utf8');
 const root=readFileSync('src/app/layout.tsx','utf8');
 assert.equal(layout.split('pa.umd.production.min.js').length-1,1);
 assert.ok(layout.includes('data-gyg-partner-id="DF3NBKA"'));
 assert.ok(!root.includes('pa.umd.production.min.js'));
 assert.ok(root.includes('id="gth-impact-stat"'));
 assert.ok(root.includes('id="gth-travelpayouts-drive"'));
});
test('search sends new destinations to tracked GYG results and allows selected Klook',()=>{
 const search=readFileSync('src/lib/travel/cruise-provider-search.ts','utf8');
 assert.ok(search.includes('https://www.getyourguide.com/s/'));
 assert.ok(search.includes('DF3NBKA'));
 assert.ok(search.includes('gthpro_cruises_search'));
 assert.ok(search.includes('buildPartnerSearch'));
 assert.ok(page.includes('Search provider'));
 assert.ok(page.includes('buildCruiseProviderSearch'));
});


test('one unified search filters India cards, links exact products and keeps mobile inputs readable',()=>{
 assert.match(ui,/export const indianWaterOptions/);
 assert.match(ui,/export function filterIndianWaters/);
 assert.match(ui,/export function indianCruiseHref/);
 assert.match(ui,/indianCruiseHref\(option\)/);
 assert.match(page,/selectedIndia=valid\?filterIndianWaters\(destination,type\)/);
 assert.match(page,/<IndianWaters options=\{selectedIndia\}\/>/);
 assert.match(page,/indianCruiseHref\(namedIndia\)/);
 assert.match(page,/\/go\/cruises\/\$\{namedInternational.slug\}/);
 assert.match(page,/grid-cols-1 items-end gap-3/);
 assert.match(page,/13 matching cruise options|selected.length\+selectedIndia.length/);
 assert.match(ui,/View \$\{option.title\} on the provider/);
 assert.match(page,/View \$\{item.title\} on Klook/);
});
