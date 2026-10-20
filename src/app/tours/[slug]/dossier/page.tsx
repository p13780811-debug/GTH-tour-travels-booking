import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@supabase/supabase-js";
import DossierActions from "@/components/real-estate/DossierActions";

export const dynamic="force-dynamic";
export const metadata:Metadata={title:"Tour Research Dossier | GTH PRO",robots:{index:false,follow:false}};
type Props={params:Promise<{slug:string}>};
export default async function TourDossierPage({params}:Props){
 const {slug}=await params;
 if(!/^[a-zA-Z0-9-]{1,100}$/.test(slug))notFound();
 const url=process.env.NEXT_PUBLIC_SUPABASE_URL,key=process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
 if(!url||!key)notFound();
 const client=createClient(url,key,{auth:{persistSession:false,autoRefreshToken:false}});
 const isId=/^\d+$/.test(slug)||/^[a-f0-9]{8}-(?:[a-f0-9]{4}-){3}[a-f0-9]{12}$/i.test(slug);
 const q=client.from("tours").select("id,title,city,city_slug,country,price_numeric,currency,provider,source_name,source_url,image_url,is_public,media_rights_verified")
  .eq("is_public",true).eq("media_rights_verified",true).limit(1);
 const {data:tour,error}=isId?await q.eq("id",slug).maybeSingle():await q.eq("city_slug",slug).maybeSingle();
 if(error||!tour)notFound();
 const price=typeof tour.price_numeric==="number"&&tour.price_numeric>0&&typeof tour.currency==="string"&&/^[A-Z]{3}$/.test(tour.currency)
  ?new Intl.NumberFormat("en-IN",{style:"currency",currency:tour.currency,maximumFractionDigits:0}).format(tour.price_numeric)+" (listed; not live)"
  :"Ask provider for current pricing";
 const href="/tours/"+encodeURIComponent(slug);
 const dossier=href+"/dossier";
 const goodImage=typeof tour.image_url==="string"&&tour.image_url.startsWith("/")&&!tour.image_url.startsWith("//")?tour.image_url:
  typeof tour.image_url==="string"&&/^https:\/\//.test(tour.image_url)?tour.image_url:"";
 return <main className="gth-container min-h-screen bg-[var(--bg)] py-8 text-[var(--text)]">
  <nav className="mb-6 flex flex-wrap justify-between gap-4 print:hidden">
   <Link href={href} className="text-sm underline">← Back to tour</Link>
   <DossierActions title={String(tour.title)} url={dossier} printMode />
  </nav>
  <article className="mx-auto max-w-3xl rounded-2xl border border-[var(--border)] bg-[var(--card)] p-6 sm:p-9 print:border-0 print:p-0">
   <p className="text-xs font-bold uppercase tracking-widest text-[var(--gold)]">GTH PRO · Travel & Experiences</p>
   <h1 className="mt-4 text-3xl font-bold">{tour.title}</h1>
   <p className="mt-2 text-sm text-[var(--text-soft)]">Shareable experience research dossier · Not a confirmed itinerary</p>
   {goodImage&&<figure className="mt-6">
     <img src={goodImage} alt={"Published image for "+tour.title} className="max-h-80 w-full rounded-xl object-contain" />
     <figcaption className="mt-2 text-xs text-[var(--text-soft)]">Published rights-reviewed tour catalog image; confirm actual experience visuals with the operator.</figcaption>
   </figure>}
   <dl className="mt-6 grid gap-3 sm:grid-cols-2">
     {([["Experience",tour.title],["Destination",tour.city||tour.city_slug||"Not recorded"],
       ["Country",tour.country||"Not recorded"],["Published provider",tour.provider||tour.source_name||"Not recorded"],
       ["Price indication",price],["Tour schedule","Confirm dates and meeting point with provider"]] as [string,string][]).map(([label,value])=>
       <div key={label} className="rounded-xl border border-[var(--border)] p-3"><dt className="text-xs text-[var(--text-soft)]">{label}</dt><dd className="mt-1 text-sm font-semibold">{value}</dd></div>)}
   </dl>
   <section className="mt-7"><h2 className="text-lg font-bold">Before you book</h2>
     <ul className="mt-3 list-inside list-disc space-y-2 text-sm leading-7">
       <li>Confirm daily itinerary, pickup and drop-off details with the provider</li>
       <li>Confirm ticket inclusions, accessibility, group size and age rules</li>
       <li>Verify date-specific price, taxes, cancellations and refunds</li>
     </ul>
   </section>
   <p className="mt-7 border-t border-[var(--border)] pt-5 text-sm">GTH PRO support: <a className="underline" href="mailto:official@gthproglobal.com">official@gthproglobal.com</a></p>
   <p className="mt-2 break-all text-xs text-[var(--text-soft)]">Reference: https://gthproglobal.com{href}</p>
   <p className="mt-4 text-xs leading-6 text-[var(--text-soft)]">This document summarizes public, rights-reviewed source data. It is not a ticket, booking confirmation or guaranteed operating schedule.</p>
  </article>
 </main>;
}
