"use client";
import {useState} from "react";
import {Image as ImageIcon, LoaderCircle, ExternalLink} from "lucide-react";

type GooglePhoto={
  photoUrl:string;placeUrl:string;provider:"Google Maps";
  authors:{name:string;url:string|null}[];
};
/** Google content is retrieved only after the visitor requests it; nothing is cached in Supabase. */
export default function GoogleHotelPhoto({hotelId}:{hotelId:string}){
 const [photo,setPhoto]=useState<GooglePhoto|null>(null);
 const [busy,setBusy]=useState(false);
 const [error,setError]=useState(false);
 const load=async()=>{
  if(busy||photo)return;
  setBusy(true);setError(false);
  try{
   const result=await fetch("/api/hotels/google-photo?id="+encodeURIComponent(hotelId),{cache:"no-store"});
   if(!result.ok)throw Error("No verified Google Places photo");
   const body:unknown=await result.json();
   if(!body||typeof body!=="object"||!("photoUrl" in body)||!("placeUrl" in body))throw Error("Invalid photo response");
   const data=body as GooglePhoto;
   if(typeof data.photoUrl!=="string"||typeof data.placeUrl!=="string"||!Array.isArray(data.authors))throw Error("Invalid photo fields");
   setPhoto(data);
  }catch{setError(true);}finally{setBusy(false);}
 };
 return <section className="mt-5 rounded-2xl border border-[var(--border)] bg-[var(--card)] p-4">
   {!photo ? <>
     <button type="button" onClick={()=>void load()} disabled={busy}
       className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-[var(--border)] px-4 py-2 text-sm font-semibold disabled:opacity-50">
       {busy?<LoaderCircle size={17} className="animate-spin"/>:<ImageIcon size={17}/>}
       {busy?"Checking Google Maps...":"View matching Google Maps photo"}
     </button>
     <p className="mt-2 text-xs text-[var(--text-soft)]">Optional Google Maps lookup on request. A photo appears only if the property name and location match.</p>
     {error&&<p role="status" className="mt-2 text-sm text-[var(--text-soft)]">No confidently matched Google Maps photo available right now.</p>}
   </> : <>
     <a href={photo.placeUrl} target="_blank" rel="noopener noreferrer nofollow" className="block">
       <img src={photo.photoUrl} alt="Google Maps contributed photograph of the matched hotel" loading="lazy"
         className="max-h-96 w-full rounded-xl object-contain" referrerPolicy="no-referrer"/>
     </a>
     <div className="mt-3 flex flex-wrap items-center justify-between gap-2 text-xs text-[var(--text-soft)]">
       <span className="font-semibold">Photo via Google Maps — not GTH PRO inventory</span>
       <a href={photo.placeUrl} target="_blank" rel="noopener noreferrer nofollow"
         className="inline-flex items-center gap-1 underline">Open original photo on Google Maps <ExternalLink size={13}/></a>
     </div>
     {photo.authors.length>0&&<div className="mt-2 flex flex-wrap gap-x-3 gap-y-1 text-xs text-[var(--text-soft)]">
       {photo.authors.map((author,i)=><span key={i}>
         Photo: {author.url?<a className="underline" href={author.url} target="_blank" rel="noopener noreferrer nofollow">{author.name}</a>:author.name}
       </span>)}
     </div>}
   </>}
 </section>;
}
