import {parseConnectedTrip,connectedFlightHref,type ConnectedTrip} from "./connected-trip";
import {resolveHotelRoute} from "./hotel-routing";
import {normalizeHotelOccupancies} from "./hotel-whitelabel";
import {airportIndex} from "./nuiteeAirportIndex";
import {EMPTY_TOUR_SEARCH,tourDiscoveryHref} from "../tours/discovery";

/** Existing editorial photography only. No claim of a priced or available package. */
export const PACKAGE_DESTINATIONS=[
 {city:"Dubai",country:"United Arab Emirates",code:"AE",airport:"DXB",image:"/images/cities/dubai.jpg",title:"Skyline & desert escape",description:"City views, desert adventures and a relaxing stay."},
 {city:"Singapore",country:"Singapore",code:"SG",airport:"SIN",image:"/images/cities/singapore.jpg",title:"Garden city getaway",description:"Gardens, island attractions and city discoveries."},
 {city:"Bangkok",country:"Thailand",code:"TH",airport:"BKK",image:"/images/cities/bangkok.jpg",title:"Riverside city break",description:"Temple visits, markets and Thai food experiences."},
 {city:"Tokyo",country:"Japan",code:"JP",airport:"HND",image:"/images/cities/tokyo.jpg",title:"Tokyo city adventure",description:"Neighbourhoods, food and cultural discoveries."},
 {city:"London",country:"United Kingdom",code:"GB",airport:"LHR",image:"/images/cities/london.jpg",title:"Classic London escape",description:"Museums, city walks and famous landmarks."},
 {city:"Mumbai",country:"India",code:"IN",airport:"BOM",image:"/images/cities/mumbai.jpg",title:"Mumbai coastal city break",description:"Waterfront sights, culture and food."},
] as const;
export const PACKAGE_SERVICES=[
 {id:"flight",title:"Return flights",image:"/images/mega/flights.jpg",alt:"Passenger aircraft travel inspiration"},
 {id:"hotel",title:"Hotel stays",image:"/images/mega/hotels.jpg",alt:"Hotel accommodation inspiration"},
 {id:"experience",title:"Tours & experiences",image:"/images/mega/tours.jpg",alt:"Sightseeing and travel experiences inspiration"},
 {id:"transfer",title:"Airport transfers",image:"/images/mega/transfers.jpg",alt:"Airport transfer vehicle inspiration"},
] as const;
export type PackageServiceId=typeof PACKAGE_SERVICES[number]["id"];
export type PackageDraft={origin:string;destination:string;start:string;end:string;adults:string;rooms:string;currency:string;experience:boolean;transfer:boolean};
export type PackageLeg={id:PackageServiceId;href:string;detail:string;action:string;note:string};
export type PackagePlan={trip:ConnectedTrip;nights:number;city:string;image:string;legs:PackageLeg[]};
/** Planning only: no provider API, rate search, reservation, checkout or DB calls.
 * Every outbound target is produced by existing fixed-origin builders or app routes.
 * Direct supplier package/flight/experience APIs have no execution path here.
 */
export function buildPackagePlan(draft:PackageDraft,now=new Date()):{ok:true;plan:PackagePlan}|{ok:false;error:string}{
 const origin=airportIndex.find(a=>a.code===draft.origin),arrival=airportIndex.find(a=>a.code===draft.destination);
 if(!origin||!arrival||origin.code===arrival.code)return {ok:false,error:"Choose two different airports from the airport directory."};
 const preset=PACKAGE_DESTINATIONS.find(p=>p.airport===arrival.code&&p.code===arrival.countryCode);
 const city=preset?.city??arrival.city;
 const raw={tripFrom:origin.code,tripTo:arrival.code,tripCity:city,tripCountry:arrival.countryCode,tripStart:draft.start,tripEnd:draft.end,tripAdults:draft.adults,tripRooms:draft.rooms,tripCurrency:draft.currency};
 const parsed=parseConnectedTrip(raw,[arrival.countryCode],now);
 if(!parsed.ok)return parsed;
 const trip=parsed.trip;
 if(!trip.start||!trip.end)return {ok:false,error:"Choose both travel dates."};
 const nights=(Date.parse(trip.end+"T00:00:00Z")-Date.parse(trip.start+"T00:00:00Z"))/86400000;
 const lead=(Date.parse(trip.end+"T00:00:00Z")-Date.parse(now.toISOString().slice(0,10)+"T00:00:00Z"))/86400000;
 if(nights<1||nights>90||lead>365)return {ok:false,error:"Choose a trip of 1–90 nights ending within the next 365 days."};
 const occupancy=normalizeHotelOccupancies([{adults:trip.adults,rooms:trip.rooms,children:[]}]);
 if(!occupancy)return {ok:false,error:"Check the room and adult counts."};
 const hotel=resolveHotelRoute({destination:city,countryCode:trip.country,checkIn:trip.start,checkOut:trip.end,occupancies:occupancy,currency:trip.currency},now);
 const flight=connectedFlightHref(trip);
 if(hotel.status==="invalid"||!flight)return {ok:false,error:"The travel dates or booking details could not be validated."};
 const hotelHref=hotel.status==="ready"?hotel.url:"/hotels?"+new URLSearchParams({view:"booking",city,country:trip.country,checkin:trip.start,checkout:trip.end,adults:String(trip.adults*trip.rooms),rooms:String(trip.rooms),currency:trip.currency}).toString()+"#hotel-booking-experience";
 const legs:PackageLeg[]=[
  {id:"flight",href:flight,detail:origin.code+" → "+arrival.code+" → "+origin.code,action:"Compare return flights",note:"Reconfirm passengers, cabin, dates and final fare with the booking provider."},
  {id:"hotel",href:hotelHref,detail:nights+" nights · "+trip.rooms+" room"+(trip.rooms===1?"":"s")+" · "+(trip.adults*trip.rooms)+" adults",action:hotel.status==="ready"?"Find stays in "+city:"Choose stays in "+city,note:hotel.status==="ready"?"Your stay dates and room preferences are carried to the booking site.":"Choose the exact destination in the existing hotel picker; reconfirm dates and room preferences."},
 ];
 if(draft.experience)legs.push({id:"experience",href:tourDiscoveryHref("/activities",{...EMPTY_TOUR_SEARCH,city,currency:trip.currency}),detail:"Explore "+city,action:"Find experiences",note:"Choose an activity and confirm its date, participants and price separately."});
 if(draft.transfer)legs.push({id:"transfer",href:"/transfers",detail:"Arrival at "+arrival.code,action:"Explore airport pickups",note:"Select your arrival airport, accommodation and pickup time with the existing transfer service."});
 return {ok:true,plan:{trip,nights,city,image:preset?.image??"/images/travel.jpg",legs}};
}
/** User-entered estimates only. All entries must be in the chosen currency. */
export function packageEstimate(legs:readonly PackageLeg[],amounts:Partial<Record<PackageServiceId,string>>):number|null{
 let minor=0;
 for(const leg of legs){const value=amounts[leg.id]?.trim()??"";if(!/^\d{1,8}(?:\.\d{1,2})?$/.test(value))return null;minor+=Math.round(Number(value)*100);}
 return minor/100;
}
