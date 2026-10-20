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
  <a download className="gth-btn-gold inline-flex min-h-11 items-center rounded-xl px-4" href={`/api/real-estate/dossier/${encodeURIComponent(url.split("/").filter(Boolean).pop() || "")}`}>Download PDF</a><button type="button" className="gth-btn min-h-11 rounded-xl px-4" onClick={()=>window.print()}>Print instead</button>
  <button type="button" className="gth-btn min-h-11 rounded-xl px-4" onClick={share}>Share via WhatsApp</button>
  {message && <p role="status" className="basis-full text-sm">{message}</p>}
  <p className="basis-full text-xs opacity-70">Only independently approved media with explicit dossier redistribution rights may appear in the downloadable PDF. You can print this page as a fallback.</p>
 </div>;
}
