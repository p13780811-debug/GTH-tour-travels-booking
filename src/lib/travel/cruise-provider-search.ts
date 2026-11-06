/** GTH PRO Cruise handoff: only fixed official providers and public, approved tracking IDs. */
import {parsePartnerSearch,buildPartnerSearch} from "@/lib/travel/partner-search";

export const GETYOURGUIDE_PARTNER_ID="DF3NBKA";
export type CruiseSearchProvider="gyg"|"klook";
export type CruiseSearchType=""|"holiday"|"sightseeing"|"dining";

const cruiseIntent:Record<CruiseSearchType,string>={
 "":"cruise",holiday:"cruise holiday",sightseeing:"sightseeing cruise",dining:"dinner cruise",
};

/** No generic URL redirect accepts arbitrary hosts: the two providers are fixed. */
export function buildCruiseProviderSearch(
 destination:string, provider:CruiseSearchProvider="gyg", type:CruiseSearchType=""
):string|null{
 const parsed=parsePartnerSearch({kind:"cruises",destination});
 if(!parsed.ok||!(type in cruiseIntent)||(provider!=="gyg"&&provider!=="klook"))return null;
 const category=cruiseIntent[type];
 if(provider==="klook"){
  // Existing Travelpayouts/Klook referral builder. Search results are supplier-
  // controlled, so selecting Klook does NOT guarantee any matching cruise.
  return buildPartnerSearch({kind:"cruises",destination:parsed.destination,category});
 }
 // GetYourGuide's documented search-result path with public Partner ID. Search
 // intent is encoded with URLSearchParams, not concatenated into a redirect URL.
 const link=new URL("https://www.getyourguide.com/s/");
 link.searchParams.set("q",parsed.destination+" "+category);
 link.searchParams.set("partner_id",GETYOURGUIDE_PARTNER_ID);
 link.searchParams.set("utm_medium","online_publisher");
 link.searchParams.set("cmp","gthpro_cruises_search");
 return link.href;
}
