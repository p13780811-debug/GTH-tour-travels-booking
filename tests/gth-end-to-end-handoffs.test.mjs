import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync,existsSync} from "node:fs";
import vm from "node:vm";
import ts from "typescript";

const read=path=>readFileSync(new URL("../"+path,import.meta.url),"utf8");
function mod(path,imports={}){
 const output=ts.transpileModule(read(path),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText;
 const m={exports:{}};
 vm.runInNewContext(output,{module:m,exports:m.exports,URL,URLSearchParams,Date,require:id=>{
  if(!(id in imports))throw Error("Unexpected import "+id);
  return imports[id];
 }});
 return m.exports;
}
const venues=mod("src/lib/travel/stadiums.ts");
const venueIntent=mod("src/lib/travel/stadium-intent.ts",{"./stadiums":venues});
const destinations=mod("src/data/destinations.ts").destinations;
const universal=mod("src/lib/mobile/universal-search.ts",{
 "@/data/destinations":{destinations},
 "@/lib/travel/stadium-intent":venueIntent,
});
const hotelHref=(q,cat)=>universal.resolveUniversalTarget(q,cat).href;

test("Kolkata hotel, Goa hotel and property-name searches use supplier booking, never sparse GTH directory",()=>{
 for(const [q,target] of [
  ["hotels in Kolkata","/app/hotels?view=booking&city=Kolkata"],
  ["Goa hotel","/app/hotels?view=booking&city=Goa"],
  ["hotels in Mumbai","/app/hotels?view=booking&city=Mumbai"],
  ["hotel near Palava","/app/hotels?view=booking&city=Palava"],
  ["The Taj Palace hotel","/app/hotels?view=booking&name=The+Taj+Palace"],
 ]) assert.equal(hotelHref(q),target,q);
 assert.equal(hotelHref("","hotel"),"/app/hotels");
 const site=read("src/app/hotels/page.tsx");
 const app=read("src/app/app/hotels/page.tsx");
 const master=read("src/app/search/page.tsx");
 assert.ok(site.includes('params.get("view") === "directory" || params.get("directory") === "1"'));
 assert.ok(site.includes('name="view" value="booking"'));
 assert.ok(app.includes('query.directory==="1"||query.view==="directory"'));
 assert.ok(app.includes("<HotelBookingExperience"));
 assert.ok(master.includes('view:"booking"'));
 assert.ok(!master.includes('if (cityPhrase) return withParam("/hotels", "city"'));
});
test("Nuitee WL destination identity is never fabricated, SDK sends authenticated place selection to hosted supplier",()=>{
 const wl=read("src/lib/travel/hotel-whitelabel.ts");
 const experience=read("src/components/hotel/HotelBookingExperience.tsx");
 const provider=read("src/lib/travel/hotel-provider-search.ts");
 assert.ok(wl.includes('HOTEL_BOOKING_ORIGIN = "https://hotel.gthproglobal.com"'));
 assert.ok(wl.includes("placeId"));
 assert.ok(wl.includes("normalizeHotelOccupancies"));
 assert.ok(wl.includes("hotelWidgetSearchParams"));
 assert.ok(experience.includes("hotelWidgetSearchParams(payload, displayCurrency)"));
 assert.ok(experience.includes("hotelWhiteLabelUrl(stay)"));
 assert.ok(experience.includes("Select the matching place from the Nuitee location suggestions"));
 assert.ok(experience.includes("window.location.assign(hotelWhiteLabelUrl(stay))"));
 assert.ok(experience.includes("parseHotelBookingSearch"));
 assert.ok(!experience.includes("NEXT_PUBLIC_NUITEE")&&!experience.includes("service_role"));
 assert.ok(provider.includes("void destination"));
 assert.ok(provider.includes("void stay"));
 assert.ok(provider.includes("https://hotel.gthproglobal.com/hotels?language=en&currency=INR"));
});
test("source-only hotel catalog has a distinct real booking exit in all public touchpoints",()=>{
 const source=read("src/app/hotels/results/page.tsx");
 const results=read("src/app/hotels/results/HotelResults.tsx");
 assert.ok(source.includes("Hotel source directory"));
 assert.ok(source.includes('view:"booking"'));
 assert.ok(results.includes("Search rooms with Nuitee"));
 const entrypoints=[
  "src/components/travel/GuideDetail.tsx",
  "src/components/travel/GuidePartnerHandoffs.tsx",
  "src/components/travel/GuideDiscoveryRails.tsx",
  "src/components/travel/MappedCityDiscovery.tsx",
  "src/components/destination/DestinationExplorerResults.tsx",
  "src/app/attractions/cities/page.tsx",
  "src/app/hotels/[slug]/page.tsx",
  "src/app/stadiums/[slug]/page.tsx",
  "src/components/sections/HeroSearch.tsx",
 ];
 for(const p of entrypoints){
  const c=read(p);
  assert.ok(c.includes("/hotels?view=booking")||c.includes('view:"booking"'),"Missing supplier booking path in "+p);
  assert.ok(!c.includes('/hotels/results?city='),"Directory accidentally used as booking at "+p);
 }
 const legacy=read("src/components/sections/HotelScroll.tsx")+read("src/components/HotelSearch.tsx");
 assert.doesNotMatch(legacy,/YOUR_MARKER|Hotellook|hotellook\.com|Available Now|Elite Rate|style jsx|Math\.random/i);
});
test("Eden Gardens tour routes only to Kolkata reviewed venue and its official source",()=>{
 const links=mod("src/lib/travel/partner-search.ts");
 const discovery=mod("src/lib/travel/stadium-partner-discovery.ts",{"./partner-search":links,"./stadiums":venues});
 assert.equal(venueIntent.reviewedStadiumGuideHref("Eden Gardens stadium tour"),"/stadiums/eden-gardens");
 assert.equal(hotelHref("Eden Gardens stadium tour"),"/stadiums/eden-gardens");
 assert.equal(venueIntent.reviewedStadiumGuideHref("Eden Beach Australia tour"),null);
 assert.equal(discovery.reviewedStadiumMatches("Eden").length,0);
 const eden=discovery.stadiumPartnerSearchLinks("Eden Gardens stadium tour");
 assert.equal(eden.city,"Kolkata");
 assert.equal(eden.officialUrl,"https://www.cricketassociationofbengal.com/notice.php");
 assert.equal(eden.reviewedProducts,0);
 const page=read("src/app/stadiums/[slug]/page.tsx");
 const ui=read("src/app/stadiums/StadiumPartnerDiscovery.tsx");
 assert.ok(page.includes("partnerSearch.officialUrl"));
 assert.ok(page.includes("stadiumAffiliateHref(product, venue.slug)"));
 assert.ok(!page.includes("partnerSearch.getyourguide")&&!page.includes("partnerSearch.klook"));
 assert.ok(ui.includes("reviewedStadiumMatches(term)"));
 assert.ok(!ui.includes("href={links.getyourguide}")&&!ui.includes("href={links.klook}"));
});
test("existing suppliers use their own handoffs, without cross-pillar price or inventory invention",()=>{
 const flow=[
  ["flights","src/components/flights/AviasalesWhiteLabel.tsx","tpwl-tickets"],
  ["tours","src/components/tours/TourSearchHero.tsx","partnerSearchHref"],
  ["activities","src/components/tours/TourSearchHero.tsx","/activities"],
  ["cruises","src/app/cruises/page.tsx","buildCruiseProviderSearch"],
  ["stadium tickets","src/app/stadiums/[slug]/page.tsx","stadiumAffiliateHref"],
  ["bus/train/ferry","src/components/travel/GTHTransportSearchWidget.tsx","/go/transport/search"],
  ["cars","src/app/cars/page.tsx","TravelpayoutsCarWidget"],
  ["transfers","src/components/travel/TransferProviderWidgets.tsx","Kiwitaxi"],
  ["real estate","src/app/real-estate/page.tsx","/api/real-estate/search"],
  ["tenders","src/app/tender/page.tsx","searchPublicTenders"],
 ];
 for(const [label,path,needle] of flow){
  assert.ok(existsSync(new URL("../"+path,import.meta.url)),label+" missing module");
  assert.ok(read(path).includes(needle),label+" missing approved handoff");
 }
 assert.ok(read("src/lib/travel/stadium-affiliates.ts").includes("GETYOURGUIDE_PARTNER_ID"));
 assert.ok(read("src/lib/travel/partner-search.ts").includes('https://tp.media/r'));
 assert.ok(read("src/components/travel/TransferProviderWidgets.tsx").includes("intui.travel"));
 assert.ok(read("src/components/travel/GTHTransportSearchWidget.tsx").includes("reconfirm on 12Go"));
 assert.doesNotMatch(read("src/lib/travel/stadium-partner-discovery.ts"),/getyourguide\.com\/s|klook\.com\/en-IN\/search/);
});
