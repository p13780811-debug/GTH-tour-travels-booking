import {buildPartnerSearch, parsePartnerSearch} from "./partner-search";
import {GETYOURGUIDE_PARTNER_ID} from "./cruise-provider-search";

/**
 * Existing-owner Klook Travelpayouts tracking + public GetYourGuide partner ID.
 * Searches are supplier searches, NOT inventory confirmation or an event API.
 * No new provider agreement, key, cron, database, or client API request.
 */
export type StadiumPartnerSearchLinks = {
  term:string;
  klook:string;
  getyourguide:string;
};

export function stadiumPartnerSearchLinks(input:unknown):StadiumPartnerSearchLinks|null{
  if(typeof input!=="string")return null;
  // Reuse the existing trusted text input and Klook referral validator.
  const parsed=parsePartnerSearch({kind:"activities",destination:input,category:"sports tickets"});
  if(!parsed.ok)return null;
  const klook=buildPartnerSearch({
    kind:"activities",destination:parsed.destination,category:"sports tickets",
  });
  if(!klook)return null;
  // A GYG result search can include guided venue tours, but NOT guaranteed match admission.
  const gyg=new URL("https://www.getyourguide.com/s/");
  gyg.searchParams.set("q",parsed.destination+" stadium tour");
  gyg.searchParams.set("partner_id",GETYOURGUIDE_PARTNER_ID);
  gyg.searchParams.set("utm_medium","online_publisher");
  gyg.searchParams.set("cmp","gthpro_stadium_partner_search");
  return {term:parsed.destination,klook,getyourguide:gyg.href};
}
