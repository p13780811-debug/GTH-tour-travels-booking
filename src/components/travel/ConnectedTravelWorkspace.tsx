"use client";

import {useEffect,useRef,useState,type KeyboardEvent,type ReactNode} from "react";
import {useRouter} from "next/navigation";
import Link from "next/link";
import {ArrowUpRight,CalendarDays,Hotel,MapPin,Plane,Sparkles} from "lucide-react";
import NearbyHotelDiscovery from "@/components/hotel/NearbyHotelDiscovery";
import HotelBookingExperience from "@/components/hotel/HotelBookingExperience";
import {HOTEL_CURRENCY_OPTIONS} from "@/lib/travel/hotel-currency";
import {HOTEL_BOOKING_ORIGIN} from "@/lib/travel/hotel-whitelabel";
import {airportIndex} from "@/lib/travel/nuiteeAirportIndex";
import {TRAVEL_MODES,connectedFlightHref,connectedHotelStay,connectedTripHref,parseConnectedTrip,type ConnectedTrip,type TravelMode} from "@/lib/travel/connected-trip";
import NuiteeFlightHandoff from "./NuiteeFlightHandoff";
import styles from "./ConnectedTravelWorkspace.module.css";

const tabs={hotels:{label:"Hotels",Icon:Hotel},flights:{label:"Flights",Icon:Plane},experiences:{label:"Experiences",Icon:Sparkles}};
type Props={trip:ConnectedTrip;initialMode:TravelMode;countries:{code:string;name:string}[];experiences:ReactNode;activitiesHref:string;initialError?:string};

export default function ConnectedTravelWorkspace({trip,initialMode,countries,experiences,activitiesHref,initialError}:Props){
 const router=useRouter(),[mode,setMode]=useState(initialMode),[error,setError]=useState(initialError||""),[advanced,setAdvanced]=useState(false);
 const [,setDetectedCountry]=useState("");
 useEffect(()=>setMode(initialMode),[initialMode]);
 const buttons=useRef<(HTMLButtonElement|null)[]>([]);
 const flightHref=connectedFlightHref(trip),stayQuery=connectedHotelStay(trip);
 const countryName=countries.find(item=>item.code===trip.country)?.name;
 function changeMode(next:TravelMode){setMode(next);router.replace(connectedTripHref(trip,next),{scroll:false});}
 function keys(event:KeyboardEvent<HTMLButtonElement>,index:number){
  let next=index;
  if(event.key==="ArrowRight")next=(index+1)%3;else if(event.key==="ArrowLeft")next=(index+2)%3;
  else if(event.key==="Home")next=0;else if(event.key==="End")next=2;else return;
  event.preventDefault();buttons.current[next]?.focus();changeMode(TRAVEL_MODES[next]);
 }
 return <section id="travel-search" className={styles.workspace} aria-labelledby="connected-travel-title">
  <header className={styles.heading}><div><p className={styles.eyebrow}>Make the journey yours</p><h2 id="connected-travel-title">One trip. Everything within reach.</h2><p>Choose your destination once, then explore stays, flights and things to do.</p></div><span className={styles.mark}><MapPin size={17} aria-hidden="true"/> {trip.city||countryName||"Your next destination"}</span></header>
  <form className={styles.plan} onSubmit={event=>{
   event.preventDefault();const raw=Object.fromEntries(new FormData(event.currentTarget));
   const parsed=parseConnectedTrip(raw,countries.map(item=>item.code));
   if(!parsed.ok){setError(parsed.error);return;}
   setError("");router.replace(connectedTripHref(parsed.trip,mode),{scroll:false});
  }}>
   <div className={styles.fields}>
    <label>Destination country<select name="tripCountry" defaultValue={trip.country}><option value="">Explore near me</option>{countries.map(item=><option key={item.code} value={item.code}>{item.name}</option>)}</select></label>
    <label>Destination city (optional)<input name="tripCity" defaultValue={trip.city} maxLength={80} placeholder="Where would you like to go?" autoComplete="off"/></label>
    <label>Departure / check-in<input name="tripStart" type="date" defaultValue={trip.start}/></label>
    <label>Return / check-out<input name="tripEnd" type="date" defaultValue={trip.end}/></label>
   </div>
   <div className={styles.flightFields} hidden={mode!=="flights"}>
    <label>From airport code<input name="tripFrom" list="trip-airport-options" maxLength={3} defaultValue={trip.origin} placeholder="BOM" autoComplete="off"/></label>
    <label>To airport code<input name="tripTo" list="trip-airport-options" maxLength={3} defaultValue={trip.destination} placeholder="DXB" autoComplete="off"/></label>
    <datalist id="trip-airport-options">{airportIndex.map(item=><option key={item.code} value={item.code}>{item.city} · {item.name}</option>)}</datalist>
   </div>
   <div className={styles.planFooter}>
    <details className={styles.options}><summary>Hotel guests &amp; currency</summary><div className={styles.extraFields}>
     <label>Hotel adults per room<input name="tripAdults" type="number" min="1" max="20" defaultValue={trip.adults}/></label>
     <label>Hotel rooms<input name="tripRooms" type="number" min="1" max="8" defaultValue={trip.rooms}/></label>
     <label>Child ages per room<input name="tripChildren" defaultValue={trip.children.join(",")} maxLength={31} placeholder="For example: 4, 9"/><span>Each age 0–17, separated by commas.</span></label>
     <label>Hotel currency<select name="tripCurrency" defaultValue={trip.currency}>{HOTEL_CURRENCY_OPTIONS.map(item=><option key={item.code} value={item.code}>{item.code} · {item.name}</option>)}</select></label>
    </div></details>
    <button className="gth-btn-gold" type="submit">Apply to my trip <ArrowUpRight size={16} aria-hidden="true"/></button>
   </div>
   {error&&<p role="alert" className={styles.message}>{error}</p>}
  </form>
  <div className={styles.summary} aria-live="polite"><span><MapPin size={15} aria-hidden="true"/>{[trip.city,countryName].filter(Boolean).join(", ")||"Your area first · worldwide discovery"}</span>{trip.start&&<span><CalendarDays size={15} aria-hidden="true"/>{trip.start}{trip.end?" → "+trip.end:""}</span>}<span>Confirm final availability and booking details with your chosen provider.</span></div>
  <div role="tablist" aria-label="Plan your journey" className={styles.tabs}>{TRAVEL_MODES.map((item,index)=>{const {label,Icon}=tabs[item];return <button key={item} type="button" role="tab" id={"travel-tab-"+item} aria-selected={mode===item} aria-controls={"travel-panel-"+item} tabIndex={mode===item?0:-1} ref={node=>{buttons.current[index]=node;}} onKeyDown={event=>keys(event,index)} onClick={()=>changeMode(item)}><Icon size={19} aria-hidden="true"/>{label}</button>;})}</div>
  {TRAVEL_MODES.map(item=><div key={item} role="tabpanel" id={"travel-panel-"+item} aria-labelledby={"travel-tab-"+item} tabIndex={0} hidden={mode!==item} className={styles.panel}>
   {mode===item&&<>
   {mode==="hotels"&&<>
    <div className={styles.panelIntro}><div><h3>Find a stay that feels right.</h3><p>{stayQuery?"Your hotel selections will carry these dates, rooms and currency to the booking site.":"Explore real property profiles, then choose dates on the booking site for current room prices."}</p>{trip.start&&!stayQuery&&<p>Hotel handoff needs a check-out 1–90 nights after check-in. Adjust your dates to carry them with a property.</p>}</div><Link href="/hotels?view=booking" className={styles.textLink}>Full hotel search <ArrowUpRight size={16} aria-hidden="true"/></Link></div>
    {trip.city&&!trip.country?<p className={styles.message}>Choose a country above to find hotels in {trip.city}.</p>:<NearbyHotelDiscovery currency={trip.currency} onCountry={setDetectedCountry} initialArea={trip.country?{country:trip.country,city:trip.city}:undefined} stayQuery={stayQuery} showAreaForm={false}/>}
    <details className={styles.advanced} open={advanced} onToggle={event=>setAdvanced(event.currentTarget.open)}><summary>Search every stay with the hotel booking search</summary>{advanced&&<><p className="mb-4 text-sm leading-6 text-[var(--text-soft)]">This search has its own destination, date and guest controls. Check your trip details here before searching.</p><HotelBookingExperience currency={trip.currency}/></>}</details>
   </>}
   {mode==="flights"&&<>
    <div className={styles.panelIntro}><div><h3>A good journey starts with the right flight.</h3><p>Compare with Aviasales, or open GTH PRO’s Nuitee Stays &amp; Flights booking site.</p></div><Link href="/flights" className={styles.textLink}>Full flight search <ArrowUpRight size={16} aria-hidden="true"/></Link></div>
    {flightHref&&<div className={styles.route}><div><strong>{trip.origin} → {trip.destination}</strong><p>Route and dates are prepared. Confirm flight passengers, cabin and currency with Aviasales.</p></div><a href={flightHref} target="_blank" rel="noopener noreferrer sponsored" className="gth-btn-gold">Search this route <ArrowUpRight size={16} aria-hidden="true"/></a></div>}
    {!flightHref&&<div className={styles.route}><div><strong>Where are you flying?</strong><p>Add departure and arrival airport codes and your travel dates above, then apply your trip to prepare a route search.</p></div><Link href="/flights" className="gth-btn">Open Aviasales search <ArrowUpRight size={16} aria-hidden="true"/></Link></div>}
    <NuiteeFlightHandoff workspaceLink={false}/>
   </>}
   {mode==="experiences"&&<>
    <div className={styles.panelIntro}><div><h3>Make room for something memorable.</h3><p>{trip.city?"Explore things to do in "+trip.city+". ":"Find attraction tickets, city walks and day trips. "}Confirm visit dates and ticket options with the activity provider.</p></div><Link href={activitiesHref} className={styles.textLink}>All experiences <ArrowUpRight size={16} aria-hidden="true"/></Link></div>
    {experiences}
    <div className={styles.route}><div><strong>Continue on the GTH PRO booking site</strong><p>Explore the travel options available on our Nuitee White Label.</p></div><a href={HOTEL_BOOKING_ORIGIN} target="_blank" rel="noopener noreferrer sponsored" className="gth-btn">Open booking site <ArrowUpRight size={16} aria-hidden="true"/></a></div>
   </>}
   </>}
  </div>)}
 </section>;
}
