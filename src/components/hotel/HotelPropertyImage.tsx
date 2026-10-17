"use client";
import {useEffect,useState} from "react";
import {Hotel,ImageOff} from "lucide-react";

/** Display a real, permitted property image, or an explicit non-photographic state.
 * Never substitute a photo belonging to another hotel when a remote image fails.
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
   className={className} loading="lazy" referrerPolicy="no-referrer"
   onError={()=>setFailed(true)}/>;
 }
 return <div role="img" aria-label={"No verified hotel photograph available for "+name}
  className={placeholderClassName}>
   {variant==="detail"?<ImageOff size={42} aria-hidden="true"/>:<Hotel size={36} aria-hidden="true"/>}
   <span className="text-xs font-medium">Original hotel photo not available</span>
 </div>;
}
