"use client";
import {useState} from "react";
import {MessageCircle} from "lucide-react";

type Props={title:string;path:string;city?:string;countryCode?:string;venue?:string;eventDate?:string;airportCode?:string};
const CITY=/^[\p{L}\p{M}\p{N} .,'’\-]{2,80}$/u;
export default function ShareTripPlanButton({title,path,city="",countryCode="",venue="",eventDate="",airportCode=""}:Props){
 const [destination,setDestination]=useState(city);
 const [tripDate,setTripDate]=useState(eventDate);
 const [status,setStatus]=useState("");
 function share(){
  setStatus("");
  try{
   const place=destination.normalize("NFKC").trim().slice(0,80);
   if(!CITY.test(place))throw Error("Choose destination");
   if(!/^\/(?:stadiums(?:\/|$)|flights(?:\?|$)|travel(?:\/|$)|tickets(?:\/|$))/.test(path)||path.startsWith("//")||path.includes("\\"))throw Error("Invalid link");
   const source=new URL(path,window.location.origin);
   if(source.origin!==window.location.origin)throw Error("External link");
   const code=/^[A-Z]{2}$/.test(countryCode)?countryCode:"";
   const hotelParams=new URLSearchParams({view:"booking",city:place});
   if(code)hotelParams.set("country",code);
   const hotel=new URL("/hotels?"+hotelParams.toString(),window.location.origin);
   const flightParams=new URLSearchParams({destinationCity:place});
   if(/^[A-Z]{3}$/.test(airportCode))flightParams.set("destination",airportCode);
   const flight=new URL("/flights?"+flightParams.toString(),window.location.origin);
   const when=/^\d{4}-\d{2}-\d{2}$/.test(tripDate)?tripDate:"Dates to decide together";
   const lines=[
    "GTH PRO | Friends' Match & Trip Plan",
    title.trim().slice(0,120),
    venue?"Venue: "+venue.slice(0,100):"Destination: "+place,
    "City: "+place,
    "Date: "+when,
    "Venue / event research: "+source.href,
    "Airport & flights (confirm the nearest suitable airport): "+flight.href,
    "Hotels for "+place+" (check live options): "+hotel.href,
    "",
    "Let's plan together! Verify official event dates, seat stock, hotel rates and flights before paying."
   ];
   window.open("https://wa.me/?text="+encodeURIComponent(lines.join("\n")),"_blank","noopener,noreferrer");
   setStatus("Choose a WhatsApp group or chat. Nothing has been sent automatically.");
  }catch{setStatus("Enter a valid destination city before sharing.");}
 }
 return <div className="mt-3 flex flex-wrap items-end gap-2" aria-label="Group trip invitation">
  {!city&&<label className="text-xs font-semibold">Destination city
    <input value={destination} onChange={e=>{setDestination(e.target.value);setStatus("");}} maxLength={80} className="gth-input mt-2 min-h-11" placeholder="Kolkata, Melbourne, Goa"/>
  </label>}
  {!eventDate&&<label className="text-xs font-semibold">Travel date (optional)
    <input type="date" value={tripDate} onChange={e=>setTripDate(e.target.value)} className="gth-input mt-2 min-h-11"/>
  </label>}
  <button type="button" onClick={share} className="gth-btn inline-flex min-h-11 items-center justify-center gap-2 rounded-xl px-4 text-xs font-semibold">
    <MessageCircle size={17} aria-hidden="true"/>Share Match / Trip Plan with Friends
  </button>
  {status&&<p role="status" className="w-full text-xs text-[var(--text-soft)]">{status}</p>}
 </div>;
}
