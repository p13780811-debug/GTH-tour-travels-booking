import {normalizeHotelOccupancies} from "./hotel-whitelabel";
import {HOTEL_CURRENCY_OPTIONS} from "./hotel-currency";
import {flightPartnerUrl} from "../flights/fare-search";
export const TRAVEL_MODES=["hotels","flights","experiences"] as const;
export type TravelMode=typeof TRAVEL_MODES[number];
export type ConnectedTrip={country:string;city:string;start:string;end:string;visitDate:string;adults:number;rooms:number;children:number[];currency:string;origin:string;destination:string};
export const EMPTY_CONNECTED_TRIP:ConnectedTrip={country:"",city:"",start:"",end:"",visitDate:"",adults:2,rooms:1,children:[],currency:"INR",origin:"",destination:""};
const fields={country:"tripCountry",city:"tripCity",start:"tripStart",end:"tripEnd",visitDate:"tripVisitDate",adults:"tripAdults",rooms:"tripRooms",children:"tripChildren",currency:"tripCurrency",origin:"tripFrom",destination:"tripTo"} as const;
function day(value:string){
 if(!/^\d{4}-\d{2}-\d{2}$/.test(value))return NaN;
 const stamp=Date.parse(value+"T00:00:00Z");return Number.isFinite(stamp)&&new Date(stamp).toISOString().slice(0,10)===value?stamp:NaN;
}
export function travelMode(raw:unknown):TravelMode{return typeof raw==="string"&&TRAVEL_MODES.some(mode=>mode===raw)?raw as TravelMode:"hotels";}
export function parseConnectedTrip(raw:Record<string,unknown>,countries:readonly string[],now=new Date()):{ok:true;trip:ConnectedTrip}|{ok:false;error:string}{
 if(Object.values(fields).some(key=>raw[key]!=null&&typeof raw[key]!=="string"))return {ok:false,error:"Choose one value for each trip field."};
 const value=(key:keyof typeof fields)=>typeof raw[fields[key]]==="string"?(raw[fields[key]]as string).trim():"";
 const city=value("city").normalize("NFKC").replace(/\s+/g," "),country=value("country").toUpperCase();
 if(city&&(city.length<2||city.length>80||!/^[\p{L}\p{M} .'-]+$/u.test(city)))return {ok:false,error:"Enter a city name using letters, spaces, apostrophes or hyphens."};
 if(country&&!countries.includes(country))return {ok:false,error:"Choose a valid destination country."};
 const start=value("start"),end=value("end"),today=day(now.toISOString().slice(0,10));
 if(start&&(!Number.isFinite(day(start))||day(start)<today||day(start)>today+730*86400000))return {ok:false,error:"Choose a valid upcoming departure or check-in date."};
 if(end&&(!start||!Number.isFinite(day(end))||day(end)<day(start)||day(end)>today+730*86400000))return {ok:false,error:"Choose a valid return or check-out date within the next two years."};
 const visitDate=value("visitDate");if(visitDate&&(!Number.isFinite(day(visitDate))||day(visitDate)<today||day(visitDate)>today+730*86400000))return {ok:false,error:"Choose a valid upcoming visit date within the next two years."};
 const a=value("adults")||"2",r=value("rooms")||"1",ages=value("children");
 if(!/^(?:[1-9]|1\d|20)$/.test(a)||!/^[1-8]$/.test(r)||ages&&!/^\d{1,2}(?:\s*,\s*\d{1,2}){0,7}$/.test(ages))return {ok:false,error:"Check hotel adults, rooms and child ages."};
 const adults=Number(a),rooms=Number(r),children=ages?ages.split(",").map(age=>Number(age.trim())):[];
 if(!normalizeHotelOccupancies([{adults,rooms,children}]))return {ok:false,error:"Each child age must be 0–17; the plan supports up to eight rooms and forty hotel guests."};
 const currency=value("currency")||"INR";if(!HOTEL_CURRENCY_OPTIONS.some(item=>item.code===currency))return {ok:false,error:"Choose a supported hotel currency."};
 const origin=value("origin").toUpperCase(),destination=value("destination").toUpperCase();
 if([origin,destination].some(code=>code&&!/^[A-Z]{3}$/.test(code))||origin&&destination&&origin===destination)return {ok:false,error:"Choose different three-letter departure and arrival airport codes."};
 return {ok:true,trip:{country,city,start,end,visitDate,adults,rooms,children,currency,origin,destination}};
}
export function connectedTripParams(trip:ConnectedTrip,mode:TravelMode):URLSearchParams{
 const params=new URLSearchParams({travelMode:mode});
 for(const [key,name]of Object.entries(fields)){
  const value=trip[key as keyof ConnectedTrip];const text=Array.isArray(value)?value.join(","):String(value);
  if(text)params.set(name,text);
 }
 return params;
}
export function connectedTripHref(trip:ConnectedTrip,mode:TravelMode){return "/travel?"+connectedTripParams(trip,mode)+"#travel-search";}
export function connectedHotelStay(trip:ConnectedTrip):string{
 if(!trip.start||!trip.end||day(trip.end)-day(trip.start)<86400000||day(trip.end)-day(trip.start)>90*86400000)return "";
 const occupancies=normalizeHotelOccupancies([{adults:trip.adults,rooms:trip.rooms,children:trip.children}]);if(!occupancies)return "";
 return new URLSearchParams({checkin:trip.start,checkout:trip.end,occupancies:btoa(JSON.stringify(occupancies)),currency:trip.currency}).toString();
}
/** Existing Aviasales route/date handoff. Passenger/currency choices are confirmed
 * with the provider; this never calls a flight fare/ticketing API. */
export function connectedFlightHref(trip:ConnectedTrip):string|null{
 return trip.origin&&trip.destination&&trip.start?flightPartnerUrl(undefined,trip.origin,trip.destination,trip.start,trip.end||null):null;
}
