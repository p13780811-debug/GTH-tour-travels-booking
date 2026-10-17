import type {Metadata} from "next";
import Link from "next/link";
import {notFound} from "next/navigation";
import {createClient} from "@supabase/supabase-js";
import {ArrowLeft,ArrowUpRight,Compass,MapPin,ShieldCheck} from "lucide-react";
import {safeAffiliateUrl,safeCommonsMedia} from "@/lib/travel/open-attractions";
export const dynamic="force-dynamic";
type Props={params:Promise<{qid:string}>};
type Data={wikidata_qid:string;name:string;description:string|null;category:string;region_slug:string;country_code:string;
 latitude:number;longitude:number;wikidata_url:string;image_url:string|null;commons_page:string|null;image_author:string|null;
 image_license:string|null;image_license_url:string|null};
async function place(qid:string):Promise<Data|null>{
 if(process.env.GTH_OPEN_ATTRACTIONS_ENABLED==="false"||!/^Q[1-9][0-9]{0,14}$/.test(qid))return null;
 const u=process.env.NEXT_PUBLIC_SUPABASE_URL,k=process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
 if(!u||!k)return null;
 try{const db=createClient(u,k,{auth:{persistSession:false,autoRefreshToken:false}});
 const {data,error}=await db.from("gth_open_attractions")
 .select("wikidata_qid,name,description,category,region_slug,country_code,latitude,longitude,wikidata_url,image_url,commons_page,image_author,image_license,image_license_url")
 .eq("is_public",true).eq("wikidata_qid",qid).maybeSingle();
 return error?null:data as Data|null;}catch{return null;}
}
export async function generateMetadata({params}:Props):Promise<Metadata>{
 const {qid}=await params;const item=await place(qid);
 if(!item)return {title:"Attraction not available | GTH PRO",robots:{index:false,follow:false}};
 return {title:item.name+" | GTH PRO Attractions",description:item.description||"Source-backed community attraction reference with location and image credits.",
 alternates:{canonical:"/attractions/"+qid},robots:{index:true,follow:true}};
}
export default async function AttractionDetail({params}:Props){
 const {qid}=await params,item=await place(qid);if(!item)notFound();
 const image=item.image_author&&item.commons_page&&item.image_license&&item.image_license_url?safeCommonsMedia(item.image_url):null;
 const u=process.env.NEXT_PUBLIC_SUPABASE_URL,k=process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
 let links:{partner:string;url:string}[]=[];
 if(process.env.GTH_APPROVED_TOUR_LINKS_ENABLED==="true"&&u&&k){
  const db=createClient(u,k,{auth:{persistSession:false,autoRefreshToken:false}});
  const {data}=await db.from("gth_attraction_affiliate_links").select("partner,approved_url").eq("wikidata_qid",qid)
   .eq("is_active",true).eq("approved_by_admin",true).limit(2);
  links=(data||[]).map(x=>({partner:x.partner,url:safeAffiliateUrl(x.approved_url)})).filter((x):x is {partner:string;url:string}=>Boolean(x.url)&&["getyourguide","viator"].includes(x.partner));
 }
 return <main className="min-h-screen bg-[var(--bg)] text-[var(--text)]"><div className="mx-auto max-w-5xl px-4 py-10 sm:px-6 md:py-14">
  <Link href="/tours" className="inline-flex min-h-11 items-center gap-2 text-sm underline"><ArrowLeft size={16}/> Tours & experiences</Link>
  <p className="mt-5 text-xs font-semibold uppercase tracking-widest text-[var(--text-soft)]">GTH PRO · Source-backed attraction</p>
  <h1 className="mt-2 text-3xl font-semibold tracking-tight sm:text-4xl">{item.name}</h1>
  <p className="mt-3 flex items-center gap-2 text-sm capitalize text-[var(--text-soft)]"><Compass size={17}/>{item.category.replaceAll("-"," ")} · {item.region_slug}</p>
  <div className="mt-6 overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--card)]">
   {image?<img src={image} alt={item.name+" — Wikimedia Commons source photo"} loading="lazy" className="max-h-96 w-full object-contain"/>:
     <div className="flex h-48 items-center justify-center text-sm text-[var(--text-soft)]">No independently licensed photo available</div>}
   {image&&<p className="p-3 text-xs text-[var(--text-soft)]">Photo: <a href={item.commons_page!} target="_blank" rel="noopener noreferrer nofollow" className="underline">{item.image_author} · Wikimedia Commons</a>{" · "}<a href={item.image_license_url!} target="_blank" rel="noopener noreferrer nofollow" className="underline">{item.image_license}</a></p>}
  </div>
  <p className="mt-6 text-sm leading-7 text-[var(--text-soft)]">{item.description||"This source record is community maintained. Verify current access and visitor conditions with the official venue."}</p>
  <p className="mt-4 flex items-center gap-2 text-sm text-[var(--text-soft)]"><MapPin size={16}/>{item.latitude}, {item.longitude} · Wikidata coordinates</p>
  <a href={item.wikidata_url} target="_blank" rel="noopener noreferrer nofollow" className="mt-5 inline-flex items-center gap-2 rounded-xl border border-[var(--border)] bg-[var(--card)] px-4 py-3 text-sm">Original Wikidata record <ArrowUpRight size={16}/></a>
  {links.length>0&&<div className="mt-7 rounded-2xl border border-[var(--border)] bg-[var(--card)] p-5">
   <h2 className="text-lg font-semibold">Independent ticket and tour providers</h2>
   <p className="my-3 text-xs text-[var(--text-soft)]">Affiliate links may earn commission. Provider confirms actual price, availability, inclusions and checkout.</p>
   <div className="flex flex-wrap gap-2">{links.map(x=><a key={x.partner} href={x.url} target="_blank" rel="sponsored noopener noreferrer" className="gth-btn-gold inline-flex min-h-11 items-center gap-2 rounded-xl px-4 text-sm">Browse on {x.partner==="getyourguide"?"GetYourGuide":"Viator"} <ArrowUpRight size={16}/></a>)}</div>
  </div>}
  <p className="mt-7 flex items-start gap-2 rounded-xl border border-[var(--border)] bg-[var(--card)] p-4 text-xs leading-6 text-[var(--text-soft)]"><ShieldCheck size={17} className="mt-1 shrink-0"/>Community-maintained source facts are not official access verification, sellable tours, guaranteed opening hours, prices or booking availability.</p>
 </div></main>;
}