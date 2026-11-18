"use client";

import {useState,type FormEvent} from "react";
import {useRouter} from "next/navigation";
import {cleanHotelDestination} from "@/lib/travel/hotel-routing";

/** Legacy search surface retained for compatibility; only GTH's reviewed
 * supplier booking widget can turn a city into a real Nuitee placeId.
 * No invented Hotellook/Klook hotel URL, no browser affiliate secrets.
 */
export default function HotelSearch(){
 const router=useRouter();
 const [city,setCity]=useState("");
 const [checkin,setCheckin]=useState("");
 const [checkout,setCheckout]=useState("");
 const [message,setMessage]=useState("");
 function search(event:FormEvent<HTMLFormElement>){
  event.preventDefault();
  const name=cleanHotelDestination(city);
  if(!name){setMessage("Enter a valid city or destination.");return;}
  // Missing/invalid stay dates are normalized by the single booking router.
  setMessage("");
  const params=new URLSearchParams({view:"booking",city:name});
  if(checkin&&checkout){params.set("checkin",checkin);params.set("checkout",checkout);}
  router.push("/hotels?"+params.toString());
 }
 return <form role="search" aria-label="Hotel booking destination" onSubmit={search}
   className="gth-glass mx-auto grid max-w-6xl gap-4 rounded-2xl border border-[var(--border)] p-5 text-[var(--text)] sm:grid-cols-4">
   <label className="text-sm font-semibold">City or destination
    <input name="city" value={city} onChange={e=>setCity(e.target.value)} maxLength={80} required
     placeholder="e.g. Kolkata" className="gth-input mt-2 w-full"/>
   </label>
   <label className="text-sm font-semibold">Check-in
    <input name="checkin" type="date" value={checkin} onChange={e=>setCheckin(e.target.value)} className="gth-input mt-2 w-full"/>
   </label>
   <label className="text-sm font-semibold">Check-out
    <input name="checkout" type="date" min={checkin||undefined} value={checkout} onChange={e=>setCheckout(e.target.value)} className="gth-input mt-2 w-full"/>
   </label>
   <button type="submit" className="gth-btn-gold min-h-12 self-end rounded-xl px-5 text-sm font-semibold">Explore GTH Worldwide Stays</button>
   {message&&<p role="alert" className="text-sm sm:col-span-4">{message}</p>}
   <p className="text-xs text-[var(--text-soft)] sm:col-span-4">Select a matching destination and guest count in GTH Worldwide Stays. The supplier confirms available hotels and dates.</p>
 </form>;
}