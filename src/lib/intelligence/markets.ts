/** Editorial routing only; these are not claims of available inventory or public tenders. */
export type GthMarket = {
  slug: string;
  city: string;
  countryCode: string;
  countryName: string;
  currency: string;
  headline: string;
  focus: string;
};
export const GTH_MARKETS: readonly GthMarket[] = [
  {slug:"mumbai",city:"Mumbai",countryCode:"IN",countryName:"India",currency:"INR",headline:"Mumbai property, public works and travel",focus:"Discover official registry references, public works notices and source-attributed stays"},
  {slug:"thane",city:"Thane",countryCode:"IN",countryName:"India",currency:"INR",headline:"Thane regional projects and infrastructure",focus:"Compare property registry evidence with any matching published regional tenders"},
  {slug:"kolkata",city:"Kolkata",countryCode:"IN",countryName:"India",currency:"INR",headline:"Kolkata civic projects and visitor services",focus:"Research source-backed government work, destination guides and verified booking handoffs"},
  {slug:"dubai",city:"Dubai",countryCode:"AE",countryName:"United Arab Emirates",currency:"AED",headline:"Dubai global property and infrastructure research",focus:"Distinguish real public sources from unverified project claims and inventory"},
  {slug:"london",city:"London",countryCode:"GB",countryName:"United Kingdom",currency:"GBP",headline:"London property research, public procurement and stays",focus:"Explore eligible published notices and regional travel options"},
  {slug:"paris",city:"Paris",countryCode:"FR",countryName:"France",currency:"EUR",headline:"Paris public procurement, travel and attractions",focus:"Combine open source notices, travel directory entries and venue guides"},
  {slug:"berlin",city:"Berlin",countryCode:"DE",countryName:"Germany",currency:"EUR",headline:"Berlin regional procurement and travel",focus:"Review documented government tenders and separate nearby travel research"},
  {slug:"singapore",city:"Singapore",countryCode:"SG",countryName:"Singapore",currency:"SGD",headline:"Singapore cross-sector research",focus:"Discover verified records without assuming availability or trade eligibility"},
  {slug:"new-york",city:"New York",countryCode:"US",countryName:"United States",currency:"USD",headline:"New York infrastructure, events and stays",focus:"Research real published tenders, public places and independent booking flows"},
  {slug:"tokyo",city:"Tokyo",countryCode:"JP",countryName:"Japan",currency:"JPY",headline:"Tokyo venues, procurement and mobility",focus:"Use source-labeled findings without invented proximity or pricing"},
] as const;
export function findGthMarket(slug: string): GthMarket | null {
  return GTH_MARKETS.find(market => market.slug === slug) ?? null;
}
export function marketsForCountry(code: string): GthMarket[] {
  return GTH_MARKETS.filter(market => market.countryCode === code);
}
export function gthMarketPath(market: GthMarket): string {
  return "/intelligence/" + market.slug;
}
