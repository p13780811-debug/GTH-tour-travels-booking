"use client";
import {useEffect,useRef,useState} from "react";

export default function DiscoveryCardPhoto({source,fallback,title}:{source:string|null;fallback:string;title:string}){
 const imageRef=useRef<HTMLImageElement>(null);
 const [failedSource,setFailedSource]=useState<string|null>(null);
 const failed=source!==null&&failedSource===source;
 const image=!failed&&source?source:fallback;
 useEffect(()=>{
  // An SSR image may fail before React attaches its error handler.
  // Check the native image state after hydration as well as onError.
  const node=imageRef.current;
  if(source&&!failed&&node?.complete&&node.naturalWidth===0)setFailedSource(source);
 },[source,failed]);
 return <><img ref={imageRef} src={image} alt={source&&!failed?title:""} loading="lazy" width={480} height={224} className="absolute inset-0 h-full w-full object-cover" onError={()=>{if(source&&!failed)setFailedSource(source);}}/>{(!source||failed)&&<span className="absolute bottom-1 left-1 rounded bg-[var(--card)] px-2 py-1 text-[10px] text-[var(--text)]">Illustrative photo</span>}</>;
}
