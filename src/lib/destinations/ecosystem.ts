/** Canonical worldwide GTH PRO service navigation.
 * Only include real routes; city filters are used only when the receiving route supports them.
 * This file is a directory of discovery actions, not an inventory count or booking guarantee.
 */
import {flightDestinations} from "@/data/flight/destinations";
import {stadiums} from "@/lib/travel/stadiums";

export type DestinationService = {
  key:string;
  label:string;
  description:string;
  href:string;
  scope:"destination"|"country"|"global";
  pillar:"Travel"|"Real Estate"|"Tenders"|"Tickets";
};
const ISO:Readonly<Record<string,string>>={
 "Australia":"AU","India":"IN","United Arab Emirates":"AE","France":"FR","Indonesia":"ID","Thailand":"TH",
 "Singapore":"SG","Japan":"JP","United Kingdom":"GB","United States":"US",
 "Maldives":"MV","Sri Lanka":"LK","China":"CN","Hungary":"HU","South Africa":"ZA",
 "Denmark":"DK","Ireland":"IE","Switzerland":"CH","Vietnam":"VN","Finland":"FI",
 "South Korea":"KR","Taiwan":"TW","Netherlands":"NL","Spain":"ES","Greece":"GR",
 "Poland":"PL","Canada":"CA","Nepal":"NP","Malaysia":"MY","Philippines":"PH",
 "Norway":"NO","Portugal":"PT","Czechia":"CZ","Austria":"AT","Sweden":"SE","Italy":"IT"
};
/** Destination context is a planning hint, not a ticket or supplier-verified route. */
export function destinationFlightHref(name:string):string{
 const airport=flightDestinations.find(item=>item.name.toLocaleLowerCase("en")===name.toLocaleLowerCase("en"))?.destination;
 const params=new URLSearchParams();
 if(airport)params.set("destination",airport);
 params.set("destinationCity",name.slice(0,80));
 return "/flights?"+params.toString()+"#flight-search";
}
export function destinationServices(place:{slug:string;name:string;country:string|null;countryCode?:string|null}):DestinationService[]{
 const country=place.countryCode&&/^[A-Z]{2}$/.test(place.countryCode)?place.countryCode:place.country ? ISO[place.country] : undefined;
 const realEstate=new URLSearchParams({city:place.name});
 if(place.country)realEstate.set("country",place.country);
 const localVenues=stadiums.filter(venue=>venue.city.toLocaleLowerCase("en")===place.name.toLocaleLowerCase("en")&&Boolean(country)&&venue.countryCode===country);
 const localVenue=localVenues.length===1?localVenues[0]:null;
 // Use only directory-supported filters; do not treat regions or countries as cities.
 const attractionFilters=new URLSearchParams();
 if(country)attractionFilters.set("country",country);
 const broadPlace=["bali","maldives"].includes(place.slug.toLocaleLowerCase("en"));
 const goaRegion=place.slug.toLocaleLowerCase("en")==="goa"&&country==="IN";
 const validCity=Boolean(country)&&!broadPlace&&!goaRegion&&/^[\p{L}\p{N} .'-]{1,70}$/u.test(place.name);
 if(goaRegion)attractionFilters.set("region","goa");
 else if(validCity)attractionFilters.set("city",place.name);
 const attractionScope:DestinationService["scope"]=goaRegion||validCity?"destination":country?"country":"global";
 const attractionHref="/attractions"+(attractionFilters.size?"?"+attractionFilters.toString():"");
 const tender=new URLSearchParams({scope:"world"});
 if(country)tender.set("country",country);
 return [
  {key:"hotels",label:"Hotels & stays",description:"Find stays with the existing hotel booking network",href:"/hotels?"+new URLSearchParams({view:"booking",city:place.name,...(country?{country}:{})}).toString(),scope:"destination",pillar:"Travel"},
  {key:"packages",label:"Build a travel plan",description:"Combine flights, stays, experiences and transfers",href:"/travel/packages?"+new URLSearchParams({city:place.name,...(country?{country}:{})}).toString()+"#package-builder",scope:country?"destination":"global",pillar:"Travel"},
  {key:"flights",label:"Flights",description:"Compare routes and dates",href:destinationFlightHref(place.name),scope:"destination",pillar:"Travel"},
  {key:"tours",label:"Tours",description:"Explore listed local tours",href:"/tours?"+new URLSearchParams({city:place.name}).toString()+"#discover",scope:"destination",pillar:"Travel"},
  {key:"activities",label:"Activities",description:"Discover local experiences",href:"/activities?"+new URLSearchParams({city:place.name}).toString()+"#discover",scope:"destination",pillar:"Travel"},
  {key:"attractions",label:"Mapped attractions",description:"Browse real community-mapped place records; coverage varies by location",href:attractionHref,scope:attractionScope,pillar:"Travel"},
  {key:"transfers",label:"Airport transfers",description:"Check pickup providers",href:"/transfers",scope:"global",pillar:"Travel"},
  {key:"cars",label:"Car rentals",description:"Browse rental providers",href:"/cars",scope:"global",pillar:"Travel"},
  {key:"bus",label:"Buses",description:"Explore bus options",href:"/bus",scope:"global",pillar:"Travel"},
  {key:"train",label:"Trains",description:"Explore rail connections",href:"/train",scope:"global",pillar:"Travel"},
  {key:"guides",label:"Travel guides",description:"Read trip-planning guides",href:"/guides",scope:"global",pillar:"Travel"},
  {key:"blog",label:"Travel stories",description:"Discover travel knowledge",href:"/blog",scope:"global",pillar:"Travel"},
  {key:"properties",label:"Real Estate",description:"Find listed properties",href:"/real-estate?"+realEstate.toString(),scope:"destination",pillar:"Real Estate"},
  {key:"post-property",label:"List a property",description:"Owner property submission",href:"/real-estate/post-property",scope:"global",pillar:"Real Estate"},
  {key:"tenders",label:"Global tenders",description:country?"Discover country opportunities":"Search published opportunities",href:"/tender?"+tender.toString(),scope:country?"country":"global",pillar:"Tenders"},
  {key:"tender-assistant",label:"Tender assistant",description:"Explore eligibility guidance",href:"/tender/assistant",scope:"global",pillar:"Tenders"},
  {key:"tickets",label:"Worldwide event tickets",description:"Research event sellers and official ticket sources",href:"/tickets?"+new URLSearchParams({q:place.name}).toString(),scope:"global",pillar:"Tickets"},
  {key:"stadiums",label:"Stadium and venue guides",description:localVenue?"Open the reviewed local venue and official calendar":"Browse venue and event calendars",href:localVenue?"/stadiums/"+localVenue.slug:"/stadiums",scope:localVenue?"destination":"global",pillar:"Tickets"},
  {key:"list-hotel",label:"List your hotel",description:"Owner hotel submissions",href:"/hotels/list-your-property",scope:"global",pillar:"Travel"},
 ];
}
export function destinationScopeLabel(scope:DestinationService["scope"],name:string,country:string|null){
 return scope==="destination" ? "For "+name : scope==="country" && country ? "Across "+country : "Worldwide service";
}
