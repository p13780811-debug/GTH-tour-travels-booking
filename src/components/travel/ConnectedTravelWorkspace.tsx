"use client";

import {useEffect,useRef,useState,useTransition,type KeyboardEvent,type ReactNode} from "react";
import Link from "next/link";
import Image from "next/image";
import {ArrowRight,ArrowUpRight,ArrowLeftRight,BedDouble,CalendarDays,Globe2,MapPin,Plane,Search,ShieldCheck,Sparkles,Ticket,Users} from "lucide-react";
import NearbyHotelDiscovery from "@/components/hotel/NearbyHotelDiscovery";
import HotelBookingExperience from "@/components/hotel/HotelBookingExperience";
import {HOTEL_CURRENCY_OPTIONS} from "@/lib/travel/hotel-currency";
import {HOTEL_BOOKING_ORIGIN} from "@/lib/travel/hotel-whitelabel";
import {connectedHotelBookingHref} from "@/lib/travel/connected-hotel-handoff";
import {EMPTY_TOUR_SEARCH,tourDiscoveryHref} from "@/lib/tours/discovery";
import {FLIGHT_DESTINATIONS,EXPERIENCE_COLLECTIONS} from "@/lib/travel/travel-editorial";
import {TRAVEL_MODES,connectedFlightHref,connectedTwelveGoFlightHref,connectedHotelStay,connectedTripHref,connectedTripParams,parseConnectedTrip,type ConnectedTrip,type TravelMode} from "@/lib/travel/connected-trip";
import TravelAirportField,{airportCode,airportLabel} from "./TravelAirportField";
import styles from "./ConnectedTravelWorkspace.module.css";

const tabs={hotels:{label:"Hotels",Icon:BedDouble},flights:{label:"Flights",Icon:Plane},experiences:{label:"Experiences",Icon:Sparkles}};
type Props={trip:ConnectedTrip;initialMode:TravelMode;countries:{code:string;name:string}[];experiences:ReactNode;activitiesHref:string;initialError?:string};

export default function ConnectedTravelWorkspace({trip,initialMode,countries,experiences,activitiesHref,initialError}:Props){
 const [mode,setMode]=useState(initialMode),[draft,setDraft]=useState(trip),[error,setError]=useState(initialError||"");
 const [opened,setOpened]=useState<TravelMode[]>([initialMode]);
 const [children,setChildren]=useState(trip.children.join(",")),[advanced,setAdvanced]=useState(false),[oneWay,setOneWay]=useState(!trip.end);
 const [airportText,setAirportText]=useState({origin:airportLabel(trip.origin),destination:airportLabel(trip.destination)});
 const [pending,startTransition]=useTransition();
 const [,setDetectedCountry]=useState("");
 const buttons=useRef<(HTMLButtonElement|null)[]>([]),searchLink=useRef<HTMLAnchorElement>(null),form=useRef<HTMLFormElement>(null);
 useEffect(()=>{setMode(initialMode);setOpened(current=>current.includes(initialMode)?current:[...current,initialMode]);},[initialMode]);
 const tripKey=connectedTripParams(trip,"hotels").toString();
 useEffect(()=>{
  const restored=parseConnectedTrip(Object.fromEntries(new URLSearchParams(tripKey)),countries.map(item=>item.code));
  if(restored.ok){setDraft(restored.trip);setChildren(restored.trip.children.join(","));setAirportText({origin:airportLabel(restored.trip.origin),destination:airportLabel(restored.trip.destination)});setOneWay(!restored.trip.end);setAdvanced(false);}
 },[tripKey,countries]);
 useEffect(()=>setError(initialError||""),[initialError]);
 const countriesList=countries.map(item=>item.code);
 const parseDraft=()=>parseConnectedTrip({tripCountry:draft.country,tripCity:draft.city,tripStart:draft.start,tripEnd:draft.end,tripVisitDate:draft.visitDate,tripAdults:String(draft.adults),tripRooms:String(draft.rooms),tripChildren:children,tripCurrency:draft.currency,tripFrom:draft.origin,tripTo:draft.destination},countriesList);
 const parsed=parseDraft();
 const flightTrip=parsed.ok?{...parsed.trip,end:oneWay?"":parsed.trip.end}:null;
 // Existing 12Go route is preferred; Aviasales remains the fallback when
 // route mapping is unavailable, and an explicit alternative after handoff.
 const twelveGoHref=flightTrip?connectedTwelveGoFlightHref(flightTrip):null;
 const aviaHref=flightTrip?connectedFlightHref(flightTrip):null;
 const readyFlight=(!oneWay&&!draft.end)?null:(twelveGoHref||aviaHref);
 const alternateFlightHref=aviaHref||"/flights";
 const activeTrip=parsed.ok?parsed.trip:trip;
 const stayQuery=connectedHotelStay(trip),countryName=countries.find(item=>item.code===activeTrip.country)?.name;
 const directHotelHref=parsed.ok?connectedHotelBookingHref(parsed.trip):null;
 const edit=(change:Partial<ConnectedTrip>)=>setDraft(current=>({...current,...change}));
 function apply(afterHandoff=false){
  const value=parseDraft();if(!value.ok){setError(value.error);return false;}
  if(mode==="flights"&&(!draft.origin||!draft.destination||!draft.start||!oneWay&&!draft.end)){setError("Choose departure and arrival airports, a departure date, and a return date for a round trip.");return false;}
  setError("");const save=()=>window.history.replaceState(null,"",connectedTripHref(value.trip,mode));
  // Commit search intent before opening an external provider. A delayed timer
  // can be discarded when mobile WebView navigates away.
  if(afterHandoff)save();else startTransition(save);return true;
 }
 function changeMode(next:TravelMode){
  setMode(next);setOpened(current=>current.includes(next)?current:[...current,next]);
  if(next!=="hotels")setAdvanced(false);
  const current=parseDraft();
  // Use the current edits, not the stale server-provided trip. Switching a tab
  // must never silently restore an earlier city, date or airport.
  if(current.ok){
   setError("");
   window.history.replaceState(null,"",connectedTripHref(current.trip,next));
  }else setError(current.error);
 }
 function keys(event:KeyboardEvent<HTMLButtonElement>,index:number){
  let next=index;
  if(event.key==="ArrowRight")next=(index+1)%3;else if(event.key==="ArrowLeft")next=(index+2)%3;
  else if(event.key==="Home")next=0;else if(event.key==="End")next=2;else return;
  event.preventDefault();buttons.current[next]?.focus();changeMode(TRAVEL_MODES[next]);
 }
 const experienceSearch={...EMPTY_TOUR_SEARCH,city:activeTrip.city,currency:activeTrip.currency};
 return <section id="travel-search" className={styles.workspace} aria-labelledby="connected-travel-title">
  <div className={styles.searchCard}>
   <div className={styles.searchTop}><h2 id="connected-travel-title">Where will you go next?</h2><span><Globe2 size={15} aria-hidden="true"/>Your journey, connected</span></div>
   <div role="tablist" aria-label="Plan your journey" className={styles.tabs}>{TRAVEL_MODES.map((item,index)=>{const {label,Icon}=tabs[item];return <button key={item} type="button" role="tab" id={"travel-tab-"+item} aria-selected={mode===item} aria-controls={"travel-panel-"+item} tabIndex={mode===item?0:-1} ref={node=>{buttons.current[index]=node;}} onKeyDown={event=>keys(event,index)} onClick={()=>changeMode(item)}><Icon size={20} aria-hidden="true"/>{label}</button>;})}</div>
   <form ref={form} className={mode==="hotels"?"hidden":styles.plan} hidden={mode==="hotels"} aria-label={tabs[mode].label+" search"} onSubmit={event=>{event.preventDefault();if(mode==="flights"){if(readyFlight)searchLink.current?.click();else apply();}else if(mode==="hotels"){
     if(!apply())return;
     if(!directHotelHref){setError("Choose valid hotel dates and guests to search available stays.");return;}
     window.location.assign(directHotelHref);
   }else apply();}}>
    {mode==="flights"&&<fieldset className={styles.tripTypes}><legend className={styles.srOnly}>Flight journey type</legend><label><input type="radio" name="flightType" checked={oneWay} onChange={()=>{setOneWay(true);edit({end:""});}}/>One way</label><label><input type="radio" name="flightType" checked={!oneWay} onChange={()=>setOneWay(false)}/>Round trip</label><span>Passengers and cabin options are selected with your booking.</span></fieldset>}
    <div className={mode==="flights"?styles.flightFields:mode==="experiences"?styles.experienceFields:styles.fields}>
     {mode==="flights"?<>
      <TravelAirportField label="From" value={airportText.origin} code={draft.origin} onType={text=>{setAirportText(current=>({...current,origin:text}));edit({origin:airportCode(text)});}} onSelect={code=>{setAirportText(current=>({...current,origin:airportLabel(code)}));edit({origin:code});}}/>
      <button type="button" className={styles.swap} aria-label="Swap departure and arrival airports" onClick={()=>{setAirportText(current=>({origin:current.destination,destination:current.origin}));edit({origin:draft.destination,destination:draft.origin});}}><ArrowLeftRight size={19} aria-hidden="true"/></button>
      <TravelAirportField label="To" value={airportText.destination} code={draft.destination} onType={text=>{setAirportText(current=>({...current,destination:text}));edit({destination:airportCode(text)});}} onSelect={code=>{setAirportText(current=>({...current,destination:airportLabel(code)}));edit({destination:code});}}/>
     </>:<>
      <label className={styles.field}><span><Globe2 size={15} aria-hidden="true"/>Destination country</span><select name="tripCountry" value={draft.country} onChange={event=>edit({country:event.target.value})}><option value="">Explore near me</option>{countries.map(item=><option key={item.code} value={item.code}>{item.name}</option>)}</select></label>
      <label className={styles.field}><span><MapPin size={15} aria-hidden="true"/>{mode==="experiences"?"Explore a city":"City (optional)"}</span><input name="tripCity" value={draft.city} onChange={event=>edit({city:event.target.value,country:event.target.value===draft.city?draft.country:""})} maxLength={80} placeholder="Where would you like to go?" autoComplete="off"/></label>
     </>}
     <label className={styles.field}><span><CalendarDays size={15} aria-hidden="true"/>{mode==="flights"?"Departure":mode==="experiences"?"Visit date (optional)":"Check-in"}</span><input name={mode==="experiences"?"tripVisitDate":"tripStart"} type="date" value={mode==="experiences"?draft.visitDate:draft.start} onChange={event=>edit(mode==="experiences"?{visitDate:event.target.value}:{start:event.target.value})}/></label>
     {mode!=="experiences"&&<label className={styles.field}><span><CalendarDays size={15} aria-hidden="true"/>{mode==="flights"?"Return":"Check-out"}</span><input name="tripEnd" type="date" value={mode==="flights"&&oneWay?"":draft.end} disabled={mode==="flights"&&oneWay} onChange={event=>edit({end:event.target.value})}/></label>}
     {mode==="flights"?<a ref={searchLink} href={readyFlight||"#travel-search"} target={readyFlight?"_blank":undefined} rel="noopener noreferrer sponsored" className={styles.primary} onClick={event=>{const allowed=apply(true);if(!readyFlight||!allowed)event.preventDefault();}}>Search flights <Search size={18} aria-hidden="true"/></a>:<button className={styles.primary} type="submit" disabled={pending}>{pending?"Finding your next adventure…":mode==="hotels"?"Find stays":"Find experiences"}<Search size={18} aria-hidden="true"/></button>}
    </div>
    {mode==="hotels"&&<details className={styles.options}><summary><Users size={16} aria-hidden="true"/>{draft.adults} adults per room · {draft.rooms} {draft.rooms===1?"room":"rooms"}{children?" · children":""}<span>{draft.currency} · Edit guests</span></summary><div className={styles.extraFields}>
     <label>Adults per room<input name="tripAdults" type="number" min="1" max="20" value={draft.adults} onChange={event=>edit({adults:Number(event.target.value)})}/></label>
     <label>Rooms<input name="tripRooms" type="number" min="1" max="8" value={draft.rooms} onChange={event=>edit({rooms:Number(event.target.value)})}/></label>
     <label>Child ages per room<input name="tripChildren" value={children} onChange={event=>setChildren(event.target.value)} maxLength={31} placeholder="For example: 4, 9"/><small>Each age 0–17, separated by commas.</small></label>
     <label>Hotel currency<select name="tripCurrency" value={draft.currency} onChange={event=>edit({currency:event.target.value})}>{HOTEL_CURRENCY_OPTIONS.map(item=><option key={item.code} value={item.code}>{item.code} · {item.name}</option>)}</select></label>
    </div></details>}
    {error&&<p role="alert" className={styles.message}>{error}</p>}
    <p className={styles.searchNote}><ShieldCheck size={14} aria-hidden="true"/>{mode==="flights"?"Start with the connected flight search. If no service appears, use Advanced flight search below. Reconfirm airports, return flights, passengers and final fares with the provider.":mode==="experiences"?"Your visit date stays in your trip plan. Choose ticket dates and availability when booking.":"Find stays opens the booking network directly. Exact rooms, dates and prices are confirmed by the provider."}</p>
   </form>
  </div>
  <div className={styles.summary} aria-live="polite"><span><MapPin size={15} aria-hidden="true"/>{[activeTrip.city,countryName].filter(Boolean).join(", ")||"Your area first. The world next."}</span>{activeTrip.start&&<span><CalendarDays size={15} aria-hidden="true"/>{activeTrip.start}{activeTrip.end?" → "+activeTrip.end:""}</span>}<Link prefetch={false} href="/affiliate-disclosure">Booking &amp; affiliate information <ArrowUpRight size={12} aria-hidden="true"/></Link></div>
  {TRAVEL_MODES.map(item=><div key={item} role="tabpanel" id={"travel-panel-"+item} aria-labelledby={"travel-tab-"+item} tabIndex={0} hidden={mode!==item} className={styles.panel}>{opened.includes(item)&&<>
   {item==="hotels"&&<>
    <div className={styles.panelIntro}>
      <div><p className={styles.eyebrow}>Stay somewhere you love</p>
        <h2>Book hotels worldwide</h2>
        <p>Search your destination, dates and guests right here. Verified accommodation results and prices open through the existing worldwide hotel booking service.</p>
      </div>
      <Link prefetch={false} href="/hotels?view=booking" className={styles.textLink}>
        Open full hotel booking page <ArrowRight size={17} aria-hidden="true"/>
      </Link>
    </div>
    <div className={styles.hotelContent} data-travel-hotel-booking="supplier-search">
      {trip.city&&<p className={styles.message}>Your planned destination is {trip.city}. Select the matching location in the worldwide hotel search below. No unverified destination ID will be guessed.</p>}
      {mode==="hotels"&&<HotelBookingExperience currency={trip.currency}/>}
    </div>
    <details className={styles.advanced} open={advanced} onToggle={event=>setAdvanced(event.currentTarget.open)}>
      <summary>Optional: explore local hotel suggestions <ArrowUpRight size={15} aria-hidden="true"/></summary>
      {advanced&&<div className={styles.hotelContent}>
        <NearbyHotelDiscovery key={trip.country+":"+trip.city} currency={trip.currency}
          onCountry={setDetectedCountry} initialArea={trip.country?{country:trip.country,city:trip.city}:undefined}
          stayQuery={stayQuery} showAreaForm={false}/>
      </div>}
    </details>
   </>}
   {item==="flights"&&<>
    <div className={styles.panelIntro}><div><p className={styles.eyebrow}>The start of something new</p><h2>Go somewhere remarkable.</h2><p>Choose a destination below to build your route. Your dates stay with your journey.</p></div><Link prefetch={false} href={alternateFlightHref} target={aviaHref?"_blank":undefined} rel={aviaHref?"noopener noreferrer sponsored":undefined} className={styles.textLink}>Advanced flight search <ArrowRight size={17} aria-hidden="true"/></Link></div>
    <div className={styles.destinationGrid}>{FLIGHT_DESTINATIONS.map(destination=><button key={destination.airport} type="button" className={styles.destinationCard} aria-label={"Plan a flight to "+destination.city} onClick={()=>{edit({destination:destination.airport,city:destination.city,country:destination.countryCode});setAirportText(current=>({...current,destination:airportLabel(destination.airport)}));form.current?.scrollIntoView({block:"center",behavior:window.matchMedia("(prefers-reduced-motion: reduce)").matches?"auto":"smooth"});}}><Image src={destination.image} alt={destination.city+" destination scenery"} fill sizes="(max-width: 600px) 80vw, (max-width: 1024px) 50vw, 25vw" className={styles.cover}/><span className={styles.destinationCaption}><span>{destination.country}</span><strong>{destination.city}<ArrowUpRight size={20} aria-hidden="true"/></strong><small>{destination.note}</small></span></button>)}</div>
    <div className={styles.bookingBanner}><div><span className={styles.eyebrow}>Keep your journey connected</span><h3>Flights and stays. One booking space.</h3><p>Prefer to plan them together? Explore the options on the GTH PRO booking site.</p></div><a href={HOTEL_BOOKING_ORIGIN} target="_blank" rel="noopener noreferrer sponsored" className={styles.secondary}>Continue booking <ArrowUpRight size={17} aria-hidden="true"/></a></div>
   </>}
   {item==="experiences"&&<>
    <div className={styles.panelIntro}><div><p className={styles.eyebrow}>Go beyond the itinerary</p><h2>Moments worth travelling for.</h2><p>{activeTrip.city?"Find your next experience in "+activeTrip.city+", from iconic sights to new discoveries.":"A new perspective. A memorable day out. A little more adventure."}</p></div><Link prefetch={false} href={tourDiscoveryHref("/activities",experienceSearch)} className={styles.textLink}>All experiences <ArrowRight size={17} aria-hidden="true"/></Link></div>
    <nav className={styles.categoryLinks} aria-label="Experience categories">{[{value:"attraction-ticket",label:"Attractions & tickets"},{value:"city-pass",label:"City passes"},{value:"outdoor",label:"Outdoor adventures"}].map(category=><Link prefetch={false} key={category.value} href={tourDiscoveryHref("/activities",experienceSearch,"rail",{category:category.value})}><Ticket size={15} aria-hidden="true"/>{category.label}<ArrowUpRight size={14} aria-hidden="true"/></Link>)}<Link prefetch={false} href={tourDiscoveryHref("/tours",experienceSearch,"rail",{category:"audio-tour"})}>City walks &amp; audio tours<ArrowUpRight size={14} aria-hidden="true"/></Link></nav>
    {experiences}
    <div className={styles.collectionHeading}><div><p className={styles.eyebrow}>Explore by destination</p><h3>Your next great day out.</h3></div><p>Destination collections to inspire your plans.</p></div>
    <div className={styles.collectionGrid}>{EXPERIENCE_COLLECTIONS.map(collection=><Link prefetch={false} key={collection.city} href={tourDiscoveryHref("/activities",{...experienceSearch,city:collection.city},"rail",{category:collection.category})} className={styles.collectionCard}><div className={styles.collectionImage}><Image src={collection.image} alt={collection.city+" destination scenery"} fill sizes="(max-width: 600px) 85vw, (max-width: 1024px) 50vw, 25vw" className={styles.cover}/><span>{collection.tag}</span></div><div className={styles.collectionBody}><p><MapPin size={13} aria-hidden="true"/>{collection.city}</p><h4>{collection.title}</h4><p>{collection.description}</p><span className={styles.collectionAction}>Explore collection <ArrowUpRight size={16} aria-hidden="true"/></span></div></Link>)}</div>
    <p className={styles.caption}>Destination photographs illustrate these collections. Ticket dates, current prices and inclusions are confirmed when booking.</p>
   </>}
  </>}</div>)}
 </section>;
}
