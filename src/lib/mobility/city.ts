import {TERRITORY_CURRENCY} from "./currencies";

export type MobilityCity = {name:string;slug:string;countryCode:string;country:string};
export const MOBILITY_CITIES: readonly MobilityCity[] = [
  {name:"Mumbai",slug:"mumbai",countryCode:"IN",country:"India"},
  {name:"Kolkata",slug:"kolkata",countryCode:"IN",country:"India"},
  {name:"Delhi",slug:"delhi",countryCode:"IN",country:"India"},
  {name:"Bengaluru",slug:"bengaluru",countryCode:"IN",country:"India"},
  {name:"Dubai",slug:"dubai",countryCode:"AE",country:"United Arab Emirates"},
  {name:"London",slug:"london",countryCode:"GB",country:"United Kingdom"},
  {name:"New York",slug:"new-york",countryCode:"US",country:"United States"},
];

const plain = /^[\p{L}\p{M}\p{N} .,'’‘()&-]+$/u;
export function mobilityText(value:unknown,max=120):string {
  if(typeof value!=="string")return "";
  const clean=value.normalize("NFKC").trim().replace(/\s+/gu," ");
  return clean.length>0&&clean.length<=max&&plain.test(clean)?clean:"";
}
export const validMobilitySlug=(value:unknown):value is string=>typeof value==="string"&&value.length<=140&&/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(value);
const regionNames=new Intl.DisplayNames(["en"],{type:"region",fallback:"none"});
const trafficCityAliases=new Map(MOBILITY_CITIES.filter(city=>city.slug==="mumbai"||city.slug==="kolkata")
  .map(city=>[city.slug,city]));
export function mobilityCity(value:{name:unknown;slug:unknown;country:unknown;countryCode:unknown}):MobilityCity|null {
  const name=mobilityText(value.name),slug=value.slug;
  if(!name||!validMobilitySlug(slug))return null;
  const code=typeof value.countryCode==="string"&&/^[A-Z]{2}$/.test(value.countryCode)?value.countryCode:"";
  const country=mobilityText(value.country,80)||(code?regionNames.of(code)??"":"");
  const hub=trafficCityAliases.get(name.toLocaleLowerCase("en"));
  // Legacy catalog rows for these pilot cities may lack country metadata.
  // Match only their known slugs when geography cannot be determined.
  const legacyHub=hub&&!code&&(!country||country.toLocaleLowerCase("en")==="india")&&
    (slug===hub.slug||slug===hub.slug+"-in");
  return hub&&(code==="IN"||legacyHub)?hub:{name,slug,country,countryCode:code};
}
export function mobilityHref(city:MobilityCity) {
  return "/mobility/"+encodeURIComponent(city.slug);
}
export function mobilityCityKey(city:MobilityCity) {
  return [city.countryCode||city.country,city.slug].join(":");
}
export function currencyForCity(city:MobilityCity) {
  return TERRITORY_CURRENCY[city.countryCode]??"";
}
export function distanceUnit(city:MobilityCity):"km"|"mi" {
  return city.countryCode==="US"||city.countryCode==="GB"?"mi":"km";
}
export type Fuel="petrol"|"diesel"|"cng";
export type FuelUnit="L"|"US gal"|"kg"|"GGE";
export function fuelUnit(city:MobilityCity,fuel:Fuel):FuelUnit {
  if(fuel==="cng")return city.countryCode==="US"?"GGE":"kg";
  return city.countryCode==="US"?"US gal":"L";
}
export function currencyChoices() {
  return [...new Set(Object.values(TERRITORY_CURRENCY))].sort();
}
