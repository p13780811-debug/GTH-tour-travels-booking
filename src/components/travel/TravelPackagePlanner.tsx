"use client";
import {useEffect,useRef,useState} from "react";
import Image from "next/image";
import Link from "next/link";
import {ArrowRight,CalendarDays,MapPin,ShieldCheck} from "lucide-react";
import TravelAirportField,{airportCode,airportLabel} from "./TravelAirportField";
import {PACKAGE_DESTINATIONS,PACKAGE_SERVICES,buildPackagePlan,packageEstimate,packageContextAirport,type PackageDraft,type PackagePlan,type PackageServiceId} from "@/lib/travel/package-planner";
const initial:PackageDraft={origin:"",destination:"",start:"",end:"",adults:"2",rooms:"1",currency:"INR",experience:true,transfer:true};
const field="mt-2 block min-h-12 w-full rounded-xl border border-[var(--border)] bg-[var(--card)] px-3 py-2 text-[var(--text)]";
export default function TravelPackagePlanner(){
 const [draft,setDraft]=useState(initial),[airportText,setAirportText]=useState({origin:"",destination:""}),[plan,setPlan]=useState<PackagePlan|null>(null),[error,setError]=useState(""),[amounts,setAmounts]=useState<Partial<Record<PackageServiceId,string>>>({});
 const form=useRef<HTMLFormElement>(null),result=useRef<HTMLElement>(null);
 const [context,setContext]=useState("");
 const [ready,setReady]=useState(false);
 useEffect(()=>{
  setReady(true);
  const q=new URLSearchParams(window.location.search),city=q.get("city")||"",country=q.get("country")||"";
  if(q.getAll("city").length!==1||q.getAll("country").length!==1||!/^\p{L}[\p{L}\p{M}\p{N} .'-]{1,79}$/u.test(city)||!/^[A-Z]{2}$/.test(country))return;
  setContext(city+" · "+country);
  const code=packageContextAirport(city,country);
  if(code){setDraft(d=>({...d,destination:code}));setAirportText(a=>({...a,destination:airportLabel(code)}));}
 },[]);
 const edit=(change:Partial<PackageDraft>)=>{setDraft(current=>({...current,...change}));setPlan(null);setError("");};
 const choose=(airport:string)=>{edit({destination:airport});setAirportText(current=>({...current,destination:airportLabel(airport)}));form.current?.scrollIntoView({block:"start"});};
 const total=plan?packageEstimate(plan.legs,amounts):null;
 return <>
  <section aria-labelledby="package-inspiration" className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
   <p className="text-xs font-semibold uppercase tracking-widest text-[var(--gold)]">Destination inspiration</p><h2 id="package-inspiration" className="mt-2 text-2xl font-bold md:text-4xl">Choose your next escape</h2>
   <p className="mt-2 text-sm text-[var(--text-soft)]">Each collection is a starting point for a personal itinerary, not a published package price.</p>
   <div className="mt-6 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
    {PACKAGE_DESTINATIONS.map(p=><article key={p.airport} className="min-w-0 overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--card)]">
     <div className="relative aspect-[16/10]"><Image src={p.image} alt={p.city+" destination scenery"} fill sizes="(max-width:640px) 100vw,(max-width:1024px) 50vw,33vw" className="object-cover"/></div>
     <div className="p-5"><p className="flex items-center gap-2 text-xs text-[var(--text-soft)]"><MapPin size={14}/>{p.city} · {p.country}</p><h3 className="mt-2 text-xl font-bold">{p.title}</h3><p className="mt-2 text-sm text-[var(--text-soft)]">{p.description}</p><button type="button" className="gth-btn-gold mt-4 inline-flex min-h-11 items-center gap-2 px-4" disabled={!ready} onClick={()=>choose(p.airport)}>Plan {p.city} <ArrowRight size={16}/></button></div>
    </article>)}
   </div>
  </section>
  <section className="mx-auto max-w-7xl px-4 pb-10 sm:px-6" aria-labelledby="package-builder-title">
   <form ref={form} data-planner-ready={ready?"true":"false"} id="package-builder" className="gth-glass scroll-mt-24 rounded-2xl border border-[var(--border)] p-5 sm:p-7" onSubmit={event=>{event.preventDefault();const built=buildPackagePlan(draft);if(!built.ok){setError(built.error);return;}setPlan(built.plan);setAmounts({});setError("");requestAnimationFrame(()=>result.current?.scrollIntoView({block:"start"}));}}>
    <h2 id="package-builder-title" className="text-2xl font-bold">Build your personal travel plan</h2><p className="mt-2 text-sm text-[var(--text-soft)]">One trip, shared dates and independently booked services. Choose any airport in the existing directory.</p>{context&&<p className="mt-3 text-sm font-semibold" role="status">Requested destination: {context}. Confirm the correct arrival airport before creating your plan.</p>}
    <div className="mt-6 grid gap-4 sm:grid-cols-2">
     <TravelAirportField label="Departure airport" value={airportText.origin} code={draft.origin} onType={value=>{setAirportText(current=>({...current,origin:value}));edit({origin:airportCode(value)});}} onSelect={code=>{setAirportText(current=>({...current,origin:airportLabel(code)}));edit({origin:code});}}/>
     <TravelAirportField label="Destination airport" value={airportText.destination} code={draft.destination} onType={value=>{setAirportText(current=>({...current,destination:value}));edit({destination:airportCode(value)});}} onSelect={code=>{setAirportText(current=>({...current,destination:airportLabel(code)}));edit({destination:code});}}/>
     <label>Departure / check-in<input className={field} type="date" required value={draft.start} onChange={e=>edit({start:e.target.value})}/></label>
     <label>Return / check-out<input className={field} type="date" required min={draft.start||undefined} value={draft.end} onChange={e=>edit({end:e.target.value})}/></label>
     <label>Adults per room<input className={field} type="number" min="1" max="20" required value={draft.adults} onChange={e=>edit({adults:e.target.value})}/></label>
     <label>Rooms<input className={field} type="number" min="1" max="8" required value={draft.rooms} onChange={e=>edit({rooms:e.target.value})}/></label>
     <label>Planning currency<select className={field} value={draft.currency} onChange={e=>edit({currency:e.target.value})}>{["INR","USD","EUR","GBP","AED","SGD","AUD","CAD","JPY"].map(c=><option key={c}>{c}</option>)}</select></label>
    </div>
    <p className="mt-3 text-xs text-[var(--text-soft)]">Plan for up to 20 adults in total. Confirm any child travelers and actual arrival/check-out times separately with each provider.</p>
    <div className="mt-5 grid grid-cols-2 gap-3 md:grid-cols-4">{PACKAGE_SERVICES.map(service=><div key={service.id} className="overflow-hidden rounded-xl border border-[var(--border)] bg-[var(--card)]"><div className="relative aspect-[16/10]"><Image src={service.image} alt={service.alt} fill sizes="(max-width:768px) 50vw,25vw" className="object-cover"/></div><div className="p-3 text-sm font-semibold">{service.id==="flight"||service.id==="hotel"?<span>{service.title} · Included in plan</span>:<label className="flex items-start gap-2"><input type="checkbox" className="mt-1" checked={service.id==="experience"?draft.experience:draft.transfer} onChange={e=>edit(service.id==="experience"?{experience:e.target.checked}:{transfer:e.target.checked})}/>{service.title}</label>}</div></div>)}</div>
    {error&&<p className="mt-4 text-sm" role="alert">{error}</p>}
    <button type="submit" disabled={!ready} className="gth-btn-gold mt-6 inline-flex min-h-12 w-full items-center justify-center gap-2 px-5 sm:w-auto">Create my travel plan <ArrowRight size={18}/></button>
    <p className="mt-3 flex items-start gap-2 text-xs text-[var(--text-soft)]"><ShieldCheck size={16} className="shrink-0"/>No automatic supplier searches or booking charges. Prices are confirmed only when you choose to visit a booking service.</p>
   </form>
  </section>
  {plan&&<section ref={result} aria-labelledby="package-result-title" className="mx-auto max-w-7xl scroll-mt-24 px-4 pb-12 sm:px-6">
   <div className="overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--card)]"><div className="relative aspect-[16/6] min-h-40"><Image src={plan.image} alt={PACKAGE_DESTINATIONS.some(p=>p.image===plan.image)?plan.city+" scenery":"Travel inspiration"} fill sizes="100vw" className="object-cover"/></div><div className="p-5"><h2 id="package-result-title" className="text-2xl font-bold">Your {plan.city} travel plan</h2><p className="mt-2 flex flex-wrap items-center gap-2 text-sm text-[var(--text-soft)]"><CalendarDays size={16}/>{plan.trip.start} → {plan.trip.end} · {plan.nights} nights · {plan.trip.adults*plan.trip.rooms} adults</p><p className="mt-2 text-sm">Independent bookings, not one supplier-issued package or guaranteed combined rate.</p></div></div>
   <div className="mt-5 grid gap-5 sm:grid-cols-2">{plan.legs.map(leg=>{const service=PACKAGE_SERVICES.find(item=>item.id===leg.id)!;return <article key={leg.id} className="overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--card)]"><div className="relative aspect-[16/9]"><Image src={service.image} alt={service.alt} fill sizes="(max-width:640px) 100vw,50vw" className="object-cover"/></div><div className="p-5"><h3 className="text-xl font-bold">{service.title}</h3><p className="mt-2 text-sm">{leg.detail}</p><p className="mt-2 text-xs leading-6 text-[var(--text-soft)]">{leg.note}</p><a href={leg.href} target={leg.href.startsWith("https://")?"_blank":undefined} rel={leg.href.startsWith("https://")?"noopener noreferrer sponsored":undefined} className="gth-btn-gold mt-4 inline-flex min-h-11 items-center gap-2 px-4">{leg.action}<ArrowRight size={16}/></a><label className="mt-5 block text-sm">Your estimated total for this service ({plan.trip.currency})<input className={field} type="text" inputMode="decimal" maxLength={11} value={amounts[leg.id]??""} onChange={e=>setAmounts(a=>({...a,[leg.id]:e.target.value}))} placeholder="Enter confirmed quote or estimate"/></label></div></article>;})}</div>
   <div className="gth-glass mt-5 rounded-2xl border border-[var(--border)] p-5"><h3 className="font-bold">Your estimated trip budget</h3><p aria-live="polite" className="mt-2 text-2xl font-bold">{total===null?"Enter each service estimate":new Intl.NumberFormat("en-IN",{style:"currency",currency:plan.trip.currency}).format(total)}</p><p className="mt-2 text-xs text-[var(--text-soft)]">Calculated only from your entries in one currency. Not a live package quote. Include taxes, baggage and fees in your estimates. <Link href="/affiliate-disclosure" className="underline">Booking disclosure</Link></p></div>
  </section>}
 </>;
}
