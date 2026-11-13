import {parsePartnerSearch} from "./partner-search";
import {filterStadiums,stadiums} from "./stadiums";

/**
 * Only first-party venue guides and official, reviewed venue references are
 * returned. A generic supplier text query can resolve "Eden" to an Australian
 * town; it must never masquerade as an Eden Gardens, Kolkata tour.
 *
 * Exact approved supplier products remain in the stadium page's products
 * catalog via stadiumAffiliateHref. No API, booking or invented place mapping.
 */
export type StadiumPartnerSearchLinks={
 term:string;
 slug:string;
 name:string;
 city:string;
 country:string;
 officialUrl:string;
 officialLabel:string;
 reviewedProducts:number;
};

export function reviewedStadiumMatches(input:unknown):StadiumPartnerSearchLinks[]{
 if(typeof input!=="string")return [];
 const parsed=parsePartnerSearch({kind:"activities",destination:input});
 if(!parsed.ok)return [];
 const requested=parsed.destination.replace(/\b(?:guided|stadium|venue|ground|tours?|tickets?|matches?|admission|book|booking)\b/gi," ")
  .replace(/\s+/g," ").trim();
 if(requested.length<2)return [];
 return filterStadiums(stadiums,requested,"").slice(0,8).flatMap(venue=>{
  const official=venue.tickets??venue.schedule;
  try{
   const u=new URL(official.url);
   if(u.protocol!=="https:"||u.username||u.password)return [];
  }catch{return [];}
  return [{term:parsed.destination,slug:venue.slug,name:venue.name,
    city:venue.city,country:venue.country,officialUrl:official.url,
    officialLabel:official.label,reviewedProducts:venue.products?.length??0}];
 });
}

/** A single candidate is allowed to label an exact venue handoff; broader city
 * searches use reviewedStadiumMatches to show all matching venue guides. */
export function stadiumPartnerSearchLinks(input:unknown):StadiumPartnerSearchLinks|null{
 const rows=reviewedStadiumMatches(input);
 return rows.length===1?rows[0]:null;
}
