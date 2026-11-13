import {parsePartnerSearch} from "./partner-search";
import {stadiums, type Stadium} from "./stadiums";
import {stadiumAffiliateHref} from "./stadium-affiliates";

/** Only refer to an existing reviewed, exact venue product, never a fuzzy
 * supplier search like "Eden Gardens stadium tour" which can resolve to the
 * unrelated town of Eden, Australia. No live ticket API or database queries.
 */
export type StadiumPartnerSearchLinks={
 term:string;venueName:string;city:string;venueSlug:string;
 klook?:string;getyourguide?:string;
 klookLabel?:string;getyourguideLabel?:string;
};
const normalized=(text:string)=>text.normalize("NFKC").trim().replace(/\s+/g," ").toLocaleLowerCase("en");
const intentWords=/\b(?:find|search|book|guided|stadium|venue|sports?|live|match|game|tours?|tickets?|experiences?)\b/g;
export function matchReviewedStadiums(input:unknown):readonly Stadium[]{
 if(typeof input!=="string")return [];
 const parsed=parsePartnerSearch({kind:"activities",destination:input});
 if(!parsed.ok)return [];
 const query=normalized(parsed.destination);
 const stripped=query.replace(intentWords," ").replace(/\s+/g," ").trim();
 if(stripped.length<3)return [];
 return stadiums.filter(venue=>{
  const name=normalized(venue.name);
  const city=normalized(venue.city);
  const aliases=normalized(venue.aliases||"");
  return stripped===name||stripped===city||(
   stripped.length>=4&&(name.includes(stripped)||aliases.includes(stripped)||
   query.startsWith(name+" ")||query.startsWith(city+" "))
  );
 });
}
export function stadiumPartnerSearchLinks(input:unknown):StadiumPartnerSearchLinks|null{
 const matches=matchReviewedStadiums(input);
 // Deterministic, approved exact-product handoffs only; no generic search result
 // is presented as a specific stadium tour or match ticket.
 for(const venue of matches){
  const products=(venue.products||[]).flatMap(product=>{
   const url=stadiumAffiliateHref(product,venue.slug);
   return url?[{product,url}]:[];
  });
  if(!products.length)continue;
  const klook=products.find(item=>item.product.provider==="klook");
  const gyg=products.find(item=>item.product.provider==="getyourguide");
  if(!klook&&!gyg)continue;
  return {
   term:typeof input==="string"?input.trim():"",
   venueName:venue.name,city:venue.city,venueSlug:venue.slug,
   ...(klook?{klook:klook.url,klookLabel:klook.product.label}:{}),
   ...(gyg?{getyourguide:gyg.url,getyourguideLabel:gyg.product.label}:{}),
  };
 }
 return null;
}
