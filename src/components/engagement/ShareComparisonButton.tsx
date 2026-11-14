"use client";
import {useState} from "react";
import {MessageCircle} from "lucide-react";
import type {ComparisonItem} from "@/lib/client/comparison-pdf";

const hints:Record<string,string[]>={
 property:["Listed price","Carpet area","Reported area","RERA status","Recorded completion date","Possession date","City"],
 registry:["Registration reference","Recorded completion date","City","District"],
 tender:["Estimated value","Deadline","Buyer","Qualification criteria"]
};
const neat=(raw:string,max=125)=>String(raw||"Not recorded").normalize("NFKC").replace(/[\u0000-\u001f\u007f]/g," ").trim().slice(0,max);
export default function ShareComparisonButton({kind,items}:{kind:"property"|"registry"|"tender";items:ComparisonItem[]}){
 const [status,setStatus]=useState("");
 function share(){
  setStatus("");
  try{
   if(items.length<2||items.length>3)throw Error("Choose 2 or 3 records");
   const lines=["GTH PRO | "+kind.toUpperCase()+" side-by-side comparison",""];
   for(const [index,item] of items.entries()){
    if(!item.path.startsWith("/"+(kind==="tender"?"tender":"real-estate")+"/")||item.path.startsWith("//")||item.path.includes("\\"))throw Error("Invalid record link");
    const url=new URL(item.path,window.location.origin);
    if(url.origin!==window.location.origin)throw Error("External record link");
    lines.push(String(index+1)+". "+neat(item.title,90));
    let added=0;
    for(const key of hints[kind]){
     const value=item.fields[key];
     if(value&&added<4){lines.push(key+": "+neat(value,95));added++;}
    }
    lines.push("View source: "+url.href,"");
   }
   lines.push("Research summary only. Recheck official sources, availability, eligibility and final prices before deciding.");
   window.open("https://wa.me/?text="+encodeURIComponent(lines.join("\n")),"_blank","noopener,noreferrer");
   setStatus("Choose a WhatsApp chat. No message was sent automatically.");
  }catch{setStatus("Select 2–3 valid public records before sharing.");}
 }
 return <span className="inline-flex flex-col gap-1">
   <button type="button" disabled={items.length<2||items.length>3} onClick={share} className="gth-btn inline-flex min-h-11 items-center justify-center gap-2 rounded-xl px-4 text-sm font-semibold disabled:opacity-50">
     <MessageCircle size={16} aria-hidden="true"/>Share comparison on WhatsApp
   </button>
   {status&&<span role="status" className="text-xs text-[var(--text-soft)]">{status}</span>}
 </span>;
}
