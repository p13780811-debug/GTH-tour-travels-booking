"use client";
import {useEffect,useState} from "react";
import {Building2,Hotel,ImageOff,MapPin} from "lucide-react";

/**
 * Source-photo presentation for both hotel cards and hotel details.
 * Do not replace a missing original hotel photo with another property's image.
 * All fallback styling uses the existing GTH PRO theme tokens.
 */
export default function HotelPropertyImage({
 src,name,className,placeholderClassName,variant="card",
}:{
 src:string|null|undefined;name:string;className:string;
 placeholderClassName:string;variant?:"card"|"detail";
}){
 const [failed,setFailed]=useState(false);
 useEffect(()=>setFailed(false),[src]);
 if(src&&src!=="/placeholder.jpg"&&!failed){
  return <img src={src} alt={name+" — source-attributed property image"}
   className={className} loading="lazy" decoding="async" referrerPolicy="no-referrer"
   onError={()=>setFailed(true)}/>;
 }
 return <div role="img" aria-label={"No original hotel photograph available for "+name}
  className={placeholderClassName+" relative isolate min-w-0 overflow-hidden"}>
  <div aria-hidden="true" className="pointer-events-none absolute inset-0 bg-[var(--bg-soft)] opacity-70"/>
  <Building2 aria-hidden="true" className="pointer-events-none absolute -bottom-7 -right-5 h-40 w-40 text-[var(--text-soft)] opacity-10 md:h-48 md:w-48"/>
  <div className="relative z-10 flex max-w-full flex-col items-center gap-2 px-3 text-center">
   <span aria-hidden="true" className="flex h-12 w-12 items-center justify-center rounded-2xl border border-[var(--border)] bg-[var(--card)] text-[var(--text)] shadow-sm">
    {variant==="detail"?<ImageOff size={25}/>:<Hotel size={25}/>}
   </span>
   <span className="max-w-full line-clamp-2 text-sm font-semibold text-[var(--text)]">{name}</span>
   <span className="inline-flex items-center gap-1 text-[11px] font-medium text-[var(--text-soft)]">
    <MapPin size={12} aria-hidden="true"/> Property directory
   </span>
   <span className="text-[11px] leading-4 text-[var(--text-soft)]">Original property photo not available</span>
  </div>
 </div>;
}
