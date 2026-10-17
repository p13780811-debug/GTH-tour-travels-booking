"use client";
import {useEffect,useState} from "react";
import type {HotelIllustration} from "@/lib/travel/pexels-hotel-illustrations";

const resolved = new Map<string,{expires:number;photos:HotelIllustration[]}>();
const inFlight = new Map<string,Promise<HotelIllustration[]>>();
const TTL = 30 * 60 * 1000;
const MAX_PLACES = 24;

/** One cached Pexels search per visible destination, never one call per hotel. */
export function useHotelIllustrations(location:string,enabled:boolean):HotelIllustration[]{
 const key=location.trim().slice(0,60).toLocaleLowerCase("en");
 const [state,setState]=useState<{key:string;photos:HotelIllustration[]}>({key:"",photos:[]});
 useEffect(()=>{
  let live=true;
  if(!enabled){return ()=>{live=false;};}
  const old=resolved.get(key);
  if(old&&old.expires>Date.now()){
    setState({key,photos:old.photos});
    return ()=>{live=false;};
  }
  let promise=inFlight.get(key);
  if(!promise){
    promise=(async()=>{
      try{
        const url="/api/images?mode=hotel_illustration&city="+encodeURIComponent(key);
        const response=await fetch(url,{cache:"no-store"});
        if(!response.ok)return [];
        const payload:unknown=await response.json();
        if(!payload||typeof payload!=="object"||!("usage" in payload)||
           payload.usage!=="illustrative_only"||!("photos" in payload)||
           !Array.isArray(payload.photos))return [];
        return payload.photos.slice(0,4).filter((photo:unknown):photo is HotelIllustration=>{
          if(!photo||typeof photo!=="object")return false;
          const entry=photo as Record<string,unknown>;
          return typeof entry.src==="string"&&entry.src.startsWith("https://images.pexels.com/photos/")&&
            typeof entry.photoUrl==="string"&&entry.photoUrl.startsWith("https://www.pexels.com/photo/")&&
            typeof entry.photographer==="string"&&entry.photographer.length>0;
        });
      }catch{return [];}
    })();
    inFlight.set(key,promise);
    void promise.then(photos=>{
      // No unlimited memory growth; no persistence or mutation of source records.
      if(resolved.size>=MAX_PLACES)resolved.delete(resolved.keys().next().value!);
      resolved.set(key,{photos,expires:Date.now()+(photos.length?TTL:60_000)});
    }).finally(()=>inFlight.delete(key));
  }
  void promise.then(photos=>{if(live)setState({key,photos});});
  return ()=>{live=false;};
 },[key,enabled]);
 return enabled&&state.key===key?state.photos:[];
}
