import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
const read=path=>readFileSync(new URL("../"+path,import.meta.url),"utf8");
const supplierNames=/\b(?:Nuitee|GetYourGuide|Ticketmaster|StubHub|Partnerize|Amadeus|Aviasales|Travelpayouts|Klook|WeGoTrip|Tiqets|KKday|Kiwitaxi)\b/i;

test("GTH first-party metadata, structured identity, manifest and public README advertise the GTH brand",()=>{
  const metadata=read("src/app/layout.tsx").split("const gaId =")[0];
  for(const src of [metadata,read("src/components/seo/SiteIdentitySchema.tsx"),
    read("src/app/gth-ecosystem-manifest/page.tsx"),read("README.md")]){
    assert.match(src,/GTH Global Booking Engine/);
    assert.doesNotMatch(src,supplierNames,"Brand identity must not market specific backend names");
    assert.doesNotMatch(src,/GTH PRO[- ]owned millions of properties|GTH PRO owns.*ticket inventory|sole owner.*inventory/i);
    assert.match(src,/independent|supplier|partner|provider/i,"Maintain truthful external fulfilment boundaries");
  }
  const schema=read("src/components/seo/SiteIdentitySchema.tsx");
  const manifest=read("src/app/gth-ecosystem-manifest/page.tsx");
  for(const name of ["GTH Worldwide Stays","GTH Event Concierge","GTH Provider-Operated Handoffs"]){
    assert.ok(schema.includes(name),name);
    assert.ok(manifest.includes(name),name);
  }
  assert.match(manifest,/href="\/affiliate-disclosure"/);
});

test("GTH-branded search labels leave provider SDKs, booked handoffs, affiliate identifiers and required transparency intact",()=>{
  const whiteLabel=read("src/lib/travel/hotel-whitelabel.ts");
  assert.match(whiteLabel,/HOTEL_BOOKING_ORIGIN = "https:\/\/hotel\.gthproglobal\.com"/);
  const flight=read("src/components/flights/AviasalesWhiteLabel.tsx");
  assert.match(flight,/WL_ID = 23459/);
  assert.match(flight,/tpwl-search/);
  assert.match(flight,/tpwl-tickets/);
  assert.match(flight,/GTH Global Booking Engine/);
  const cruises=read("src/app/cruises/page.tsx");
  assert.match(cruises,/buildCruiseProviderSearch/);
  assert.match(cruises,/provider==="klook"\?"klook":"gyg"/);
  assert.match(cruises,/rel="noopener noreferrer sponsored"/);
  const hotels=read("src/components/hotel/NuiteeHotelsListWidget.tsx");
  assert.match(hotels,/HotelsList\.create\(options\)/);
  assert.match(hotels,/GTH Worldwide Stays/);
  assert.match(read("src/components/travel/GTHTransportSearchWidget.tsx"),/12Go/);
  assert.match(read("src/components/travel/GTHTransportSearchWidget.tsx"),/12Go/);
  const policy=read("src/app/affiliate-disclosure/page.tsx");
  assert.match(policy,/provider may collect information/);
  const transparency=read("src/app/verification/page.tsx");
  assert.match(transparency,/independent|external provider/i);
});

test("GTH capability panels contain no fabricated security accreditation, partner endorsements or arbitrary corporate counts",()=>{
  for(const path of ["src/components/gth/TrustMatrix.tsx","src/components/sections/TrustMatrix.tsx"]){
    const src=read(path);
    assert.doesNotMatch(src,/SOC 2 Type II|PCI DSS L1|ISO 27001|99\.999% SLA|IATA Accredited|Trusted by 4,200/i);
    assert.doesNotMatch(src,/AMADEUS|EMIRATES|MARRIOTT|AIRBNB|EUROSTAR/i);
    assert.match(src,/GTH STAYS/);
    assert.match(src,/GTH MOBILITY/);
  }
});
