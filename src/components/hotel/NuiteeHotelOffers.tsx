"use client";

import {useCallback,useEffect,useRef,useState} from "react";
import Link from "next/link";
import {ArrowUpRight,ShieldCheck} from "lucide-react";
import {
  HOTEL_BOOKING_ORIGIN,HOTEL_WIDGET_SCRIPT,hotelWhiteLabelUrl,
  normalizeHotelOccupancies,parseHotelBookingSearch,
} from "@/lib/travel/hotel-whitelabel";

/**
 * Same supplier-origin pattern as WeGoTrip's original tour cards.
 * Nuitee's official HotelsList owns all hotel names, hotel photographs, rates
 * and hotel IDs. No OSM or fake catalogue is rendered here.
 *
 * The original search SDK and White Label flow stay untouched. We isolate each
 * supplier list in a responsive srcDoc iframe, like HotelBookingExperience,
 * so the vendor's styles cannot override GTH PRO's global CSS.
 */
const MARKETS=[
  {
    key:"india",
    title:"Hotels in India",
    city:"Mumbai",
    placeId:"ChIJwe1EZjDG5zsRaYxkjY_tpF0",
    description:"Original supplier hotel cards for Mumbai, India",
  },
  {
    key:"world",
    title:"International hotels",
    city:"London",
    placeId:"ChIJdd4hrwug2EcRmSrV3Vo6llI",
    description:"Original supplier hotel cards for London, United Kingdom",
  },
] as const;
const frameDocument='<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"></head><body><main id="gth-nuitee-hotel-offers"></main></body></html>';
type ListSdk={
  init:(args:{domain:string;deepLinkParams?:string})=>void;
  HotelsList:{create:(args:{
    selector:string;placeId:string;hasSearchBar:boolean;rows:number;currency:string;
    primaryColor?:string;onHotelClick:(value:unknown)=>void;
  })=>void|Promise<void>};
};
type FrameWindow=Window&{LiteAPI?:ListSdk};
type ClickInfo={hotel?:{id?:unknown;hotelId?:unknown};checkin?:unknown;checkout?:unknown;adults?:unknown;children?:unknown};

function supplierHotelId(value:unknown):string|null{
  // SDK data only; never turn arbitrary user-entered hotel names into IDs.
  return typeof value==="string"&&/^[A-Za-z0-9_-]{2,100}$/.test(value)?value:null;
}
function hotelPartnerHref(placeId:string){
  const u=new URL("/hotels",HOTEL_BOOKING_ORIGIN);
  u.searchParams.set("placeId",placeId);
  u.searchParams.set("language","en");
  u.searchParams.set("currency","INR");
  return u.toString();
}
function SupplierMarket({market}:{market:typeof MARKETS[number]}){
  const frame=useRef<HTMLIFrameElement>(null);
  const bootstrapped=useRef<Document|null>(null);
  const teardown=useRef<(()=>void)|null>(null);
  const [attempt,setAttempt]=useState(0);
  const [loading,setLoading]=useState(true);
  const [error,setError]=useState("");
  const openSelectedHotel=useCallback((value:unknown)=>{
    const event=value as ClickInfo|null;
    const id=supplierHotelId(event?.hotel?.id??event?.hotel?.hotelId);
    if(!id){
      setError("The supplier did not return a valid hotel ID. Open this destination's booking results below.");
      return;
    }
    // The White Label domain is GTH PRO's already-connected Nuitee supplier site.
    // A vendor-returned hotel ID opens its exact hotel details, not a generic search.
    const basic=new URL("/hotels/"+encodeURIComponent(id),HOTEL_BOOKING_ORIGIN);
    basic.searchParams.set("language","en");
    basic.searchParams.set("currency","INR");
    let target=basic.toString();
    if(typeof event?.checkin==="string"&&typeof event.checkout==="string"&&
       typeof event.adults==="number"&&Array.isArray(event.children)){
      const normalized=normalizeHotelOccupancies([{adults:event.adults,children:event.children}]);
      if(normalized){
        const query=new URLSearchParams({
          hotelId:id,checkin:event.checkin,checkout:event.checkout,
          occupancies:btoa(JSON.stringify(normalized)),currency:"INR",
        });
        const parsed=parseHotelBookingSearch(query);
        if(parsed)target=hotelWhiteLabelUrl(parsed);
      }
    }
    window.location.assign(target);
  },[]);
  const boot=useCallback(async()=>{
    const element=frame.current,doc=element?.contentDocument;
    const win=element?.contentWindow as FrameWindow|null;
    if(!element||!doc||!win||bootstrapped.current===doc)return;
    teardown.current?.();
    bootstrapped.current=doc;
    let active=true;
    let timer:ReturnType<typeof setTimeout>|undefined;
    let mutations:MutationObserver|undefined;
    let resizeObserver:ResizeObserver|undefined;
    let themeObserver:MutationObserver|undefined;
    setLoading(true);setError("");
    const fit=()=>{
      if(!active)return;
      const next=Math.min(3600,Math.max(480,doc.body?.scrollHeight+32||480));
      if(element.height!==String(next))element.height=String(next);
    };
    const syncTheme=()=>{doc.documentElement.className=document.documentElement.className;};
    syncTheme();
    themeObserver=new MutationObserver(syncTheme);
    themeObserver.observe(document.documentElement,{attributes:true,attributeFilter:["class"]});
    const cancel=()=>{
      active=false;
      if(timer)clearTimeout(timer);
      mutations?.disconnect();resizeObserver?.disconnect();themeObserver?.disconnect();
    };
    teardown.current=cancel;
    timer=setTimeout(()=>{
      if(active){setLoading(false);setError("Hotel cards are taking longer than expected. Open the supplier hotel list below.");}
    },20000);
    try{
      await new Promise<void>((resolve,reject)=>{
        const script=doc.createElement("script");
        script.src=HOTEL_WIDGET_SCRIPT;
        script.async=true;
        script.onload=()=>resolve();
        script.onerror=()=>reject(new Error("Hotel supplier widget unavailable"));
        doc.head.appendChild(script);
      });
      if(!active)return;
      if(!win.LiteAPI?.HotelsList?.create)throw new Error("Supplier hotel list unavailable");
      // Reuse the SAME compiled GTH global styles; no new theme or inline CSS.
      for(const sheet of document.querySelectorAll('link[rel="stylesheet"], style')){
        doc.head.appendChild(sheet.cloneNode(true));
      }
      const gold=getComputedStyle(document.documentElement).getPropertyValue("--gold").trim();
      win.LiteAPI.init({
        domain:new URL(HOTEL_BOOKING_ORIGIN).hostname,
        deepLinkParams:"language=en&currency=INR",
      });
      await win.LiteAPI.HotelsList.create({
        selector:"#gth-nuitee-hotel-offers",placeId:market.placeId,
        hasSearchBar:false,rows:2,currency:"INR",
        ...(gold?{primaryColor:gold}:{}),
        onHotelClick:openSelectedHotel,
      });
      if(!active)return;
      mutations=new MutationObserver(fit);
      mutations.observe(doc.body,{childList:true,subtree:true,attributes:true,attributeFilter:["class"]});
      resizeObserver=new ResizeObserver(fit);
      resizeObserver.observe(doc.body);
      fit();
      if(timer)clearTimeout(timer);
      setLoading(false);
    }catch{
      if(active){if(timer)clearTimeout(timer);setLoading(false);
        setError("Supplier hotel cards could not load. You can still open this destination on our connected hotel booking site.");}
    }
  },[market.placeId,openSelectedHotel]);
  useEffect(()=>{
    if(frame.current?.contentDocument?.readyState==="complete")void boot();
    return ()=>teardown.current?.();
  },[boot,attempt]);
  return <section aria-label={market.description} className="min-w-0">
    <div className="mb-3 flex flex-wrap items-end justify-between gap-3">
      <div>
        <h3 className="text-xl font-bold text-[var(--text)]">{market.title}</h3>
        <p className="mt-1 text-sm text-[var(--text-soft)]">{market.city} · Direct supplier hotel cards</p>
      </div>
      <a href={hotelPartnerHref(market.placeId)} className="gth-btn inline-flex min-h-11 items-center gap-2 px-4 text-sm font-semibold"
         target="_blank" rel="noopener noreferrer sponsored">More {market.city} hotels <ArrowUpRight size={15}/></a>
    </div>
    {loading&&<p role="status" className="mb-2 text-xs text-[var(--text-soft)]">Loading original supplier hotels for {market.city}…</p>}
    {error&&<div role="alert" className="mb-3 rounded-2xl border border-[var(--border)] bg-[var(--card)] p-4 text-sm">
      <p>{error}</p>
      <button type="button" className="gth-btn mt-3" onClick={()=>{
        teardown.current?.();bootstrapped.current=null;setLoading(true);setError("");setAttempt(n=>n+1);
      }}>Retry hotel cards</button>
    </div>}
    <iframe key={attempt} ref={frame} title={"Nuitee original hotels in "+market.city}
      srcDoc={frameDocument} onLoad={()=>void boot()} height="720"
      className="block w-full min-w-0 rounded-2xl border border-[var(--border)] bg-[var(--card)]"
      sandbox="allow-scripts allow-same-origin" referrerPolicy="strict-origin-when-cross-origin"/>
  </section>;
}
export default function NuiteeHotelOffers(){
  return <section aria-labelledby="gth-original-hotel-cards" className="mx-auto max-w-7xl px-4 py-7 sm:px-6">
    <div className="mb-6">
      <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--gold)]">
        GTH PRO · Original supplier hotels
      </p>
      <h2 id="gth-original-hotel-cards" className="mt-2 text-2xl font-bold text-[var(--text)] md:text-3xl">
        Explore real hotels in India and worldwide
      </h2>
      <p className="mt-2 text-sm leading-6 text-[var(--text-soft)]">
        Hotel photos, property information and date-dependent prices are provided directly by our connected
        Nuitee hotel supplier. Choose an actual hotel card for its exact details on the booking site.
      </p>
    </div>
    <div className="grid min-w-0 gap-8">
      {MARKETS.map(market=><SupplierMarket key={market.key} market={market}/>)}
    </div>
    <p className="mt-5 flex items-start gap-2 text-xs leading-6 text-[var(--text-soft)]">
      <ShieldCheck size={15} className="mt-1 shrink-0" aria-hidden="true"/>
      Booking, payment, final taxes, cancellation rules and availability are confirmed by the supplier.
      <Link href="/affiliate-disclosure" className="underline">Affiliate disclosure</Link>
    </p>
  </section>;
}
