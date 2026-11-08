"use client";

import {useEffect,useRef,useState} from "react";
import {HOTEL_BOOKING_ORIGIN,HOTEL_WIDGET_SCRIPT} from "@/lib/travel/hotel-whitelabel";

type LiteHotelsListOptions={
  selector:string;
  placeId:string;
  currency:string;
  hasSearchBar:boolean;
  rows:number;
  primaryColor?:string;
  deepLinkParams:string;
  labelsOverride:{searchAction:string;placePlaceholderText:string};
};
type LiteHotelsListSdk={
  init:(options:{domain:string;deepLinkParams:string})=>void;
  HotelsList:{create:(options:LiteHotelsListOptions)=>unknown};
};
type LiteWindow=Window & {LiteAPI?:LiteHotelsListSdk};

const DOMAIN=new URL(HOTEL_BOOKING_ORIGIN).hostname;
const SCRIPT_ID="gth-nuitee-hotels-list-sdk";

function loadNuiteeHotelsSdk():Promise<LiteHotelsListSdk>{
  const loaded=(window as LiteWindow).LiteAPI;
  if(loaded?.HotelsList?.create)return Promise.resolve(loaded);
  return new Promise((resolve,reject)=>{
    let script=document.getElementById(SCRIPT_ID) as HTMLScriptElement|null;
    const finish=()=>{
      const sdk=(window as LiteWindow).LiteAPI;
      if(sdk?.HotelsList?.create)resolve(sdk);
      else reject(new Error("Nuitee Hotels List SDK is unavailable"));
    };
    const fail=()=>reject(new Error("Could not load Nuitee Hotels List SDK"));
    if(script){
      script.addEventListener("load",finish,{once:true});
      script.addEventListener("error",fail,{once:true});
      return;
    }
    script=document.createElement("script");
    script.id=SCRIPT_ID;
    script.src=HOTEL_WIDGET_SCRIPT;
    script.async=true;
    script.addEventListener("load",finish,{once:true});
    script.addEventListener("error",fail,{once:true});
    document.head.appendChild(script);
  });
}

/** Official first-party Nuitee SDK: real supplier imagery and exact hotel
 * booking click-through to our configured White Label. No catalogue API key.
 * Never intercept supplier hotel clicks or substitute an OSM identity.
 * The existing GTH CSS and day/night tokens own the surrounding layout.
 */
export default function NuiteeHotelsListWidget({
  placeId,placeLabel,id,rows=1
}:{
  placeId:string;placeLabel:string;id:string;rows?:number;
}){
  const initialized=useRef(false);
  const [failed,setFailed]=useState(false);
  useEffect(()=>{
    if(initialized.current)return;
    if(!/^ChIJ[A-Za-z0-9_-]{12,80}$/.test(placeId))return;
    let live=true;
    void loadNuiteeHotelsSdk().then(sdk=>{
      if(!live||initialized.current)return;
      initialized.current=true;
      try{
        sdk.init({domain:DOMAIN,deepLinkParams:"language=en&currency=INR"});
        const color=getComputedStyle(document.documentElement).getPropertyValue("--gold").trim();
        const options:LiteHotelsListOptions={
          selector:"#"+id,
          placeId,
          currency:"INR",
          hasSearchBar:false,
          rows,
          deepLinkParams:"language=en&currency=INR",
          labelsOverride:{searchAction:"View hotels",placePlaceholderText:"Choose a destination"}
        };
        if(/^#[\da-f]{6}$/i.test(color))options.primaryColor=color;
        const task=sdk.HotelsList.create(options);
        if(task&&typeof task==="object"&&"catch" in task&&typeof task.catch==="function"){
          (task as Promise<unknown>).catch(()=>{if(live)setFailed(true);});
        }
      }catch{initialized.current=false;if(live)setFailed(true);}
    }).catch(()=>{if(live)setFailed(true);});
    return ()=>{live=false;};
  },[id,placeId,rows]);

  return <div className="min-w-0" aria-label={"Bookable Nuitee hotel listings near "+placeLabel}>
    <div id={id} className="min-w-0" data-gth-nuitee-supplier-hotels="true"/>
    {failed?<p role="status" className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-3 text-sm text-[var(--text-soft)]">
      Live supplier hotel cards are unavailable in this browser. You can still browse the official Nuitee White Label directly.
    </p>:null}
    <p className="mt-2 text-xs text-[var(--text-soft)]">
      Hotel photos, rooms and prices in this section come from Nuitee. Selecting a supplier hotel opens its matching page on GTH PRO&apos;s Nuitee White Label.
    </p>
    <a href={HOTEL_BOOKING_ORIGIN+"/hotels?language=en&currency=INR"}
      target="_blank" rel="noopener noreferrer sponsored"
      className="gth-btn-gold mt-3 inline-flex min-h-11 items-center justify-center rounded-xl px-4 text-sm font-semibold">
      Open Nuitee White Label
    </a>
  </div>;
}
