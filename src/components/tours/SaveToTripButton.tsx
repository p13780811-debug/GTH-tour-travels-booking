"use client";
import { useEffect, useState } from "react";
import { Bookmark } from "lucide-react";

const KEY="gth-tour-trip-saved-v1";
function clean(value:unknown):string[]{
  if(!Array.isArray(value))return [];
  return [...new Set(value.filter((item):item is string=>typeof item==="string"&&/^[a-z0-9-]{1,100}$/i.test(item)))].slice(0,50);
}
export default function SaveToTripButton({slug}:{slug:string}){
 const [saved,setSaved]=useState(false);
 const [message,setMessage]=useState("");
 useEffect(()=>{
  const sync=()=>{try{setSaved(clean(JSON.parse(localStorage.getItem(KEY)||"[]")).includes(slug))}catch{setSaved(false)}};
  sync();window.addEventListener("storage",sync);window.addEventListener("gth-saved-trip",sync);
  return()=>{window.removeEventListener("storage",sync);window.removeEventListener("gth-saved-trip",sync)};
 },[slug]);
 const toggle=()=>{
  setMessage("");
  if(!/^[a-z0-9-]{1,100}$/i.test(slug))return;
  try{
    const values=clean(JSON.parse(localStorage.getItem(KEY)||"[]"));
    if(!values.includes(slug)&&values.length>=50){setMessage("Trip shortlist is full (50 items).");return}
    const next=values.includes(slug)?values.filter(item=>item!==slug):[...values,slug];
    localStorage.setItem(KEY,JSON.stringify(next));
    setSaved(next.includes(slug));window.dispatchEvent(new Event("gth-saved-trip"));
    setMessage(next.includes(slug)?"Saved on this device":"Removed from device shortlist");
  }catch{setMessage("Device storage unavailable; use the share link instead.")}
 };
 return <div className="inline-flex flex-col gap-1">
  <button type="button" onClick={toggle} aria-pressed={saved} className="gth-btn inline-flex min-h-11 items-center gap-2 rounded-xl">
    <Bookmark size={16} fill={saved?"currentColor":"none"} aria-hidden="true"/>{saved?"Saved to trip":"Save to trip"}
  </button>
  {message&&<span role="status" className="text-xs text-[var(--text-soft)]">{message}</span>}
 </div>;
}
