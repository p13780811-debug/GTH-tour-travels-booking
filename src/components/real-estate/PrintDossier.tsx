"use client";
import { useState } from "react";
export default function PrintDossier({title,url}:{title:string;url:string}) {
 const [message,setMessage]=useState("");
 const share=()=>{
  const text=`GTH PRO property research: ${title} — ${window.location.origin}${url}`;
  window.open("https://wa.me/?text="+encodeURIComponent(text),"_blank","noopener,noreferrer");
  setMessage("WhatsApp sharing opened. Send the message yourself.");
 };
 return <div className="mt-8 flex flex-wrap gap-3 print:hidden">
  <button type="button" className="gth-btn-gold min-h-11 rounded-xl px-4" onClick={()=>window.print()}>Print / Save as PDF</button>
  <button type="button" className="gth-btn min-h-11 rounded-xl px-4" onClick={share}>Share via WhatsApp</button>
  {message && <p role="status" className="basis-full text-sm">{message}</p>}
  <p className="basis-full text-xs opacity-70">In the print dialog select “Save as PDF” to export a copy.</p>
 </div>;
}
