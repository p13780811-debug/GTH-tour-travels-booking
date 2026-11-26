"use client";
import {useState} from "react";
export default function DiscoveryCardPhoto({source,fallback,title}:{source:string|null;fallback:string;title:string}){
 const [failed,setFailed]=useState(false);
 const image=!failed&&source?source:fallback;
 return <><img src={image} alt={source&&!failed?title:""} loading="lazy" width={480} height={224} className="absolute inset-0 h-full w-full object-cover" onError={()=>setFailed(true)}/>{(!source||failed)&&<span className="absolute bottom-1 left-1 rounded bg-[var(--card)] px-2 py-1 text-[10px] text-[var(--text)]">Illustrative photo</span>}</>;
}
