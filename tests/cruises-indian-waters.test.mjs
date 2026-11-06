import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

const ui=readFileSync('src/components/travel/IndianWaters.tsx','utf8');
const page=readFileSync('src/app/cruises/page.tsx','utf8');
const original=readFileSync('src/lib/travel/cruises.ts','utf8');

test('India block is isolated and existing international cruise catalogue is retained',()=>{
 assert.match(page,/import IndianWaters from "@\/components\/travel\/IndianWaters";/);
 assert.match(page,/<IndianWaters\/>/);
 assert.match(original,/disney-adventure-3-nights/);
 assert.match(original,/singapore-river-cruise/);
 assert.equal((original.match(/sourceUrl:"https:\/\/www\.klook\.com/g)||[]).length,7);
});
test('six Indian photo cards with exact matched cruise products and no generic Klook fallbacks',()=>{
 for(const slug of ['goa-mandovi-dinner','kerala-alleppey-houseboat','mumbai-harbour','lakshadweep-cruises','kolkata-river-cruises','andaman-cruises'])assert.ok(ui.includes(slug),slug);
 assert.match(ui,/activity\/185166-goa-lexicon-dinner-cruise/);
 assert.match(ui,/activity\/6620-alleppey-backwater-cruise-by-houseboat-cochin/);
 assert.match(ui,/partnerSearchHref\("cruises"/);
});
test('no pricing, fake images or unapproved new affiliate provider',()=>{
 assert.ok(!ui.includes('₹'));
 assert.ok(ui.includes('<Image'));
 assert.match(ui,/Special:FilePath/);
 assert.match(ui,/Indian cruise photo credits/);
 assert.match(ui,/CC BY/);
 assert.match(ui,/getyourguide\\.com/);
 assert.match(ui,/Affiliate attribution is not verified/);
 assert.match(ui,/campaign_id:"137"/);
 assert.match(ui,/marker:"417668"/);
 assert.match(ui,/noopener noreferrer sponsored/);
});
