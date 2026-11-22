/**
 * Source-backed structured data for approved detail pages only.
 * This is descriptive schema.org data, not a promise of Google rich results.
 * Call sites enforce the existing public-launch + content-quality gates.
 * Deliberately no invented ratings, prices, inventory, owners or awards.
 */
type HotelFacts = {
 name:string; category:string; address:string|null; city:string|null;
 country:string|null; description:string|null;
};
type TenderFacts = {
 title:string; summary:string|null; source_name:string;
 source_reference:string; buyer:string;
};
type TourFacts = {title:string;city:string|null;country:string|null};

function fact(value:unknown,max=300):string|undefined{
 if(typeof value!=="string")return undefined;
 const text=value.replace(/[\u0000-\u001f\u007f]/g," ").replace(/\s+/g," ").trim();
 return text?text.slice(0,max):undefined;
}

/** A hotel directory record is not proof of a room offer or rating. */
export function hotelIdentitySchema(hotel:HotelFacts,canonical:string):Record<string,unknown>{
 const street=fact(hotel.address,180),city=fact(hotel.city,100),country=fact(hotel.country,80);
 const address=(street||city||country)?{
  "@type":"PostalAddress",
  ...(street?{streetAddress:street}:{}),
  ...(city?{addressLocality:city}:{}),
  ...(country?{addressCountry:country}:{}),
 }:undefined;
 return {
  "@context":"https://schema.org",
  "@type":hotel.category?.toLowerCase()==="hotel"?"Hotel":"LodgingBusiness",
  "@id":canonical+"#lodging",
  name:fact(hotel.name,180)||"Hotel directory record",
  url:canonical,
  ...(address?{address}:{}),
  ...(fact(hotel.description,300)?{description:fact(hotel.description,300)}:{}),
 };
}

/** Tender notices are procurement documents, never JobPosting or GovernmentService. */
export function tenderNoticeSchema(tender:TenderFacts,canonical:string,sourceUrl:string|null):Record<string,unknown>{
 return {
  "@context":"https://schema.org",
  "@type":"CreativeWork",
  "@id":canonical+"#notice",
  url:canonical,
  name:fact(tender.title,250)||"Public tender notice",
  ...(fact(tender.summary,1000)?{description:fact(tender.summary,1000)}:{}),
  ...(fact(tender.source_reference,120)?{identifier:fact(tender.source_reference,120)}:{}),
  ...(fact(tender.source_name,120)?{creditText:fact(tender.source_name,120)}:{}),
  ...(sourceUrl?{isBasedOn:sourceUrl}:{}),
 };
}

/** Independent tour discovery only; no fictitious schedule, fare or booking offer. */
export function tourDiscoverySchema(tour:TourFacts,canonical:string):Record<string,unknown>{
 const city=fact(tour.city,100),country=fact(tour.country,80);
 return {
  "@context":"https://schema.org",
  "@type":"TouristTrip",
  "@id":canonical+"#tour",
  url:canonical,
  name:fact(tour.title,180)||"Tour experience",
  description:"Experience discovery. Verify operating dates, pricing and booking terms with the provider.",
  ...(city?{touristDestination:{
   "@type":"Place",name:city,
   ...(country?{address:{"@type":"PostalAddress",addressCountry:country}}:{}),
  }}:{}),
 };
}
