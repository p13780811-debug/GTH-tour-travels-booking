"use client";
import {useEffect,useState} from "react";
import {useSearchParams} from "next/navigation";
import TenderAssistant from "./TenderAssistant";
import type {PublicTender} from "@/lib/tender/catalog";
const UUID=/^[a-f0-9]{8}-[a-f0-9]{4}-[1-8][a-f0-9]{3}-[89ab][a-f0-9]{3}-[a-f0-9]{12}$/i;
type Notice=Pick<PublicTender,"id"|"title"|"buyer"|"source_reference"|"source_url"|"eligibility_requirements"|"requirements_verified"|"deadline_at">;
type Result={id:string;notice:Notice|null;failed:boolean};
export default function TenderAssistantLoader(){
 const params=useSearchParams(),values=params.getAll("tenderId");
 const id=values.length===1&&UUID.test(values[0])?values[0].toLowerCase():"";
 const [result,setResult]=useState<Result|null>(null);
 useEffect(()=>{
  if(!id)return;
  const abort=new AbortController();
  const timeout=setTimeout(()=>abort.abort(),8000);
  let active=true;
  async function load(){
   try{
    const r=await fetch("/api/tender/"+encodeURIComponent(id),{cache:"no-store",signal:abort.signal});
    if(!r.ok)throw Error("Tender unavailable");
    const item=await r.json() as PublicTender;
    if(item.id?.toLowerCase()!==id||typeof item.title!=="string"||Date.parse(item.deadline_at)<=Date.now())throw Error("Tender unavailable");
    if(active)setResult({id,notice:{id:item.id,title:item.title,buyer:item.buyer,source_reference:item.source_reference,source_url:item.source_url,eligibility_requirements:item.eligibility_requirements||{},requirements_verified:Boolean(item.requirements_verified),deadline_at:item.deadline_at},failed:false});
   }catch{if(active)setResult({id,notice:null,failed:true});}
   finally{clearTimeout(timeout);}
  }
  void load();
  return ()=>{active=false;clearTimeout(timeout);abort.abort();};
 },[id]);
 if(id&&result?.id!==id)return <main className="gth-container py-12"><p role="status">Loading the selected public tender…</p></main>;
 return <>{id&&result?.failed&&<p role="status" className="gth-container pt-5 text-sm">The selected notice could not be loaded. You can enter the official notice details manually.</p>}<TenderAssistant key={id||"manual"} initialTender={id?result?.notice??null:null}/></>;
}
