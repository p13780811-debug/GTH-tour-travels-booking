"use client";
import Image from "next/image";
import Link from "next/link";
import {useState} from "react";
import {ArrowUpRight,BadgePercent,Globe2,ShieldCheck,Ticket} from "lucide-react";
import {partnerSearchHref} from "@/lib/travel/partner-search";
import type {ApprovedKlookPromo} from "@/lib/travel/approved-klook-promos";

const regions=[
 {code:"all",title:"All destinations"},
 {code:"GB",title:"United Kingdom"},
 {code:"IN",title:"India"},
 {code:"JP",title:"Japan"},
 {code:"AE",title:"UAE"},
 {code:"SG",title:"Singapore"},
 {code:"CA",title:"Canada"},
] as const;

const destinations=[
 {id:"london",region:"GB",city:"London",title:"London attractions",kind:"activities",category:"Attraction tickets",image:"/images/cities/london.jpg"},
 {id:"mumbai",region:"IN",city:"Mumbai",title:"Mumbai tours & activities",kind:"tours",category:"",image:"/images/cities/mumbai.jpg"},
 {id:"tokyo",region:"JP",city:"Tokyo",title:"Tokyo experiences",kind:"activities",category:"",image:"/images/cities/tokyo.jpg"},
 {id:"dubai",region:"AE",city:"Dubai",title:"Dubai attraction tickets",kind:"activities",category:"Attraction tickets",image:"/images/cities/dubai.jpg"},
 {id:"singapore",region:"SG",city:"Singapore",title:"Singapore experiences",kind:"activities",category:"",image:"/images/cities/singapore.jpg"},
 {id:"toronto",region:"CA",city:"Toronto",title:"Toronto day experiences",kind:"tours",category:"",image:"/images/mega/tours.jpg"},
] as const;

export default function DealsDiscovery({promos}:{promos:readonly ApprovedKlookPromo[]}){
 const [region,setRegion]=useState<string>("all");
 const visible=destinations.filter(row=>region==="all"||row.region===region);
 return <div className="min-h-screen bg-[var(--bg)] text-[var(--text)]">
  <section className="border-b border-[var(--border)] bg-[var(--card)]">
   <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 sm:py-16">
    <p className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-[var(--gold)]"><BadgePercent size={18}/> GTH PRO · Travel offers</p>
    <h1 className="mt-4 max-w-3xl text-3xl font-bold tracking-tight sm:text-5xl">Explore travel deals around the world</h1>
    <p className="mt-4 max-w-2xl text-sm leading-7 text-[var(--text-soft)]">Choose a destination and discover experiences, or open the booking provider's current deals. Only the provider can confirm prices, eligible promo codes, dates and availability.</p>
    <div className="mt-6 flex flex-wrap gap-3">
     <a href="/api/travel/klook-deals" target="_blank" rel="sponsored nofollow noopener noreferrer" className="gth-btn-gold inline-flex min-h-12 items-center justify-center gap-2 rounded-xl px-6 text-sm font-semibold">See Klook's current deals <ArrowUpRight size={18} aria-hidden="true"/></a>
     <Link href="/activities" className="inline-flex min-h-12 items-center gap-2 rounded-xl border border-[var(--border)] px-5 text-sm font-semibold"><Ticket size={17}/> Browse activities</Link>
    </div>
    <p className="mt-3 text-xs text-[var(--text-soft)]">Partner-managed offers · Opens Klook via GTH PRO's existing tracked referral route · No discount is guaranteed.</p>
   </div>
  </section>
  <section aria-labelledby="deal-regions" className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
   <h2 id="deal-regions" className="text-xl font-bold sm:text-2xl">Explore by destination</h2>
   <p className="mt-2 text-sm leading-6 text-[var(--text-soft)]">Destination cards are search shortcuts, not confirmed discounts or available tickets.</p>
   <div role="group" aria-label="Choose country" className="mt-5 flex gap-2 overflow-x-auto overscroll-x-contain pb-3">
    {regions.map(item=><button type="button" key={item.code} onClick={()=>setRegion(item.code)} aria-pressed={region===item.code}
      className={"min-h-11 shrink-0 rounded-full border px-4 text-sm font-semibold focus-visible:outline focus-visible:outline-2 focus-visible:outline-[var(--gold)] "+(region===item.code?"border-[var(--gold)] bg-[var(--card)] text-[var(--text)]":"border-[var(--border)] text-[var(--text-soft)]")}>{item.title}</button>)}
   </div>
   <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
    {visible.map(item=>{
      const href=partnerSearchHref(item.kind,item.city,item.category);
      if(!href)return null;
      return <article key={item.id} className="min-w-0 overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--card)]">
       <div className="relative h-44"><Image src={item.image} alt={item.city+" destination illustration"} fill sizes="(max-width:640px) 100vw,(max-width:1024px) 50vw,33vw" className="object-cover"/></div>
       <div className="flex min-h-44 flex-col p-4">
        <p className="text-xs font-semibold uppercase tracking-wide text-[var(--gold)]">{regions.find(r=>r.code===item.region)?.title}</p>
        <h3 className="mt-2 text-lg font-bold">{item.title}</h3>
        <p className="mt-2 text-xs leading-5 text-[var(--text-soft)]">Explore independent provider options. Discounts, if any, are confirmed only on the booking page.</p>
        <a href={href} target="_blank" rel="sponsored nofollow noopener noreferrer" className="mt-auto inline-flex min-h-11 items-center gap-2 pt-3 text-sm font-semibold text-[var(--gold)]">Explore partner experiences <ArrowUpRight size={16} aria-hidden="true"/></a>
       </div>
      </article>;
    })}
   </div>
  </section>
  <section aria-labelledby="available-codes" className="border-y border-[var(--border)] bg-[var(--card)]">
   <div className="mx-auto max-w-7xl px-4 py-9 sm:px-6">
    <h2 id="available-codes" className="text-xl font-bold sm:text-2xl">Approved promo codes</h2>
    {promos.length>0?<div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{promos.map(promo=>
      <article className="rounded-2xl border border-[var(--border)] bg-[var(--bg)] p-5" key={promo.id}>
       <h3 className="text-lg font-semibold">{promo.title}</h3>
       <p className="mt-2 text-sm text-[var(--text-soft)]">{promo.conditions}</p>
       <p className="mt-3 font-bold text-[var(--gold)]">{promo.discountLabel}</p>
       <p className="mt-2 text-sm">Code: <code className="font-semibold">{promo.code}</code></p>
       <p className="mt-2 text-xs text-[var(--text-soft)]">Provider expiry: {promo.expiresAtUtc.slice(0,10)} · Check full terms at checkout.</p>
       <a href="/api/travel/klook-deals" rel="sponsored nofollow noopener noreferrer" target="_blank" className="mt-3 inline-flex min-h-11 items-center gap-2 text-sm font-semibold text-[var(--gold)]">Check eligibility <ArrowUpRight size={16}/></a>
      </article>)}</div>:<div className="mt-5 rounded-2xl border border-[var(--border)] bg-[var(--bg)] p-5">
      <p className="text-sm leading-7 text-[var(--text-soft)]">There are no partner-authorised promo codes published on GTH PRO right now. You can still view current codes and eligibility directly on Klook's Deals page.</p>
      <a href="/api/travel/klook-deals" target="_blank" rel="sponsored nofollow noopener noreferrer" className="mt-3 inline-flex min-h-11 items-center gap-2 text-sm font-semibold text-[var(--gold)]">View provider's current promotions <ArrowUpRight size={16}/></a>
    </div>}
   </div>
  </section>
  <div className="mx-auto flex max-w-7xl gap-3 px-4 py-8 text-xs leading-6 text-[var(--text-soft)] sm:px-6"><ShieldCheck size={18} className="mt-1 shrink-0"/><p><Globe2 size={14} className="mr-1 inline-block"/> Offers and bookings are independently supplied by Klook. GTH PRO may earn a referral commission. No promo code is copied from third-party screenshots or published without programme approval. <Link href="/affiliate-disclosure" className="underline">Affiliate disclosure</Link>.</p></div>
 </div>;
}
