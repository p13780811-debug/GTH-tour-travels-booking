"use client";
import {useEffect,useState} from "react";
import {Hotel,ImageOff} from "lucide-react";
import type {HotelIllustration} from "@/lib/travel/pexels-hotel-illustrations";

/** Display a real, permitted property image, or an explicit non-photographic state.
 * Never substitute a photo belonging to another hotel when a remote image fails.
 */
export default function HotelPropertyImage({
 src,name,className,placeholderClassName,variant="card",illustration,showIllustrationCreditLink=true,
}:{
 src:string|null|undefined;name:string;className:string;
 placeholderClassName:string;variant?:"card"|"detail";
 illustration?:HotelIllustration|null;showIllustrationCreditLink?:boolean;
}){
 const [failed,setFailed]=useState(false);
 const [illustrationFailed,setIllustrationFailed]=useState(false);
 useEffect(()=>setFailed(false),[src]);
 useEffect(()=>setIllustrationFailed(false),[illustration?.src]);
 if(src&&src!=="/placeholder.jpg"&&!failed){
  return <img src={src} alt={name+" — source-attributed property image"}
   className={className} loading="lazy" referrerPolicy="no-referrer"
   onError={()=>setFailed(true)}/>;
 }
 if(illustration&&!illustrationFailed){
  return <div className={placeholderClassName+" relative isolate overflow-hidden"}>
   <img src={illustration.src}
    alt={"Illustrative travel architecture, not a verified photograph of "+name}
    className="absolute inset-0 h-full w-full object-cover" loading="lazy" referrerPolicy="no-referrer"
    onError={()=>setIllustrationFailed(true)}/>
   <div className="absolute inset-x-2 bottom-2 z-10 rounded-lg border border-[var(--border)] bg-[var(--card)] px-2 py-1.5 text-[10px] leading-4 text-[var(--text)]">
    <span className="block font-semibold">Illustrative photo — not this property</span>
    {showIllustrationCreditLink?
     <a href={illustration.photoUrl} target="_blank" rel="noopener noreferrer nofollow"
      className="block truncate underline">Photo: {illustration.photographer} / Pexels</a>:
     <span className="block truncate">Photo: {illustration.photographer} / Pexels</span>}
   </div>
  </div>;
 }
 return <div role="img" aria-label={"No verified hotel photograph available for "+name}
  className={placeholderClassName}>
   {variant==="detail"?<ImageOff size={42} aria-hidden="true"/>:<Hotel size={36} aria-hidden="true"/>}
   <span className="text-xs font-medium">Original hotel photo not available</span>
 </div>;
}
