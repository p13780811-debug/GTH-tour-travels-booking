import Link from "next/link";
import {createClient} from "@supabase/supabase-js";
import {ArrowRight,Compass,ImageOff,MapPin} from "lucide-react";
import {safeCommonsMedia} from "@/lib/travel/open-attractions";
type Card={wikidata_qid:string;name:string;category:string;region_slug:string;image_url:string|null;
 commons_page:string|null;image_author:string|null;image_license:string|null;image_license_url:string|null};
export default async function OpenAttractionsRail({region}:{region:"goa"|"maharashtra"}){
 if(process.env.GTH_OPEN_ATTRACTIONS_ENABLED==="false")return null;
 const url=process.env.NEXT_PUBLIC_SUPABASE_URL,key=process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
 if(!url||!key)return null;
 const db=createClient(url,key,{auth:{persistSession:false,autoRefreshToken:false}});
 const {data,error}=await db.from("gth_open_attractions").select("wikidata_qid,name,category,region_slug,image_url,commons_page,image_author,image_license,image_license_url")
  .eq("region_slug",region).eq("is_public",true).order("name",{ascending:true}).limit(16);
 if(error||!data?.length)return null;
 const places=data as Card[];
 return <section aria-label={"Source-backed attractions in "+region} className="border-y border-[var(--border)] bg-[var(--bg-soft)]">
 <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6">
  <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
   <div><p className="text-xs font-semibold uppercase tracking-widest text-[var(--text-soft)]">CC0 Wikidata destination discovery</p>
    <h2 className="mt-2 text-2xl font-semibold capitalize">{region.replaceAll("-"," ")} attractions & landmarks</h2>
    <p className="mt-2 text-xs text-[var(--text-soft)]">Public source records, not sold tours or verified tickets · photos individually attributed</p></div>
   <Link href="/tours" className="inline-flex items-center gap-2 text-sm font-semibold underline">Explore tours <ArrowRight size={16}/></Link>
  </div>
  <div role="region" tabIndex={0} aria-label="Attractions horizontal cards" className="flex snap-x snap-mandatory gap-4 overflow-x-auto overscroll-x-contain pb-4">
  {places.map(place=>{
   const picture=place.commons_page&&place.image_author&&place.image_license&&place.image_license_url?safeCommonsMedia(place.image_url):null;
   return <article key={place.wikidata_qid} className="flex h-64 w-60 shrink-0 snap-start flex-col overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--card)]">
    <div className="flex h-28 w-full shrink-0 items-center justify-center overflow-hidden bg-[var(--bg)]">
     {picture?<img src={picture} loading="lazy" alt={place.name+" — licensed Wikimedia Commons picture"} className="h-full w-full object-cover"/>:
      <span className="flex flex-col items-center gap-2 text-xs text-[var(--text-soft)]"><ImageOff size={25}/> Photo unavailable</span>}
    </div>
    <div className="flex min-h-0 flex-1 flex-col gap-2 p-3">
     <p className="flex items-center gap-1 text-xs capitalize text-[var(--text-soft)]"><MapPin size={13}/>{place.category.replaceAll("-"," ")}</p>
     <h3 className="line-clamp-2 text-sm font-semibold">{place.name}</h3>
     {picture&&<p className="line-clamp-1 text-[10px] text-[var(--text-soft)]">
      <a href={place.commons_page!} target="_blank" rel="noopener noreferrer nofollow" className="underline">{place.image_author} · Commons</a>{" · "}
      <a href={place.image_license_url!} target="_blank" rel="noopener noreferrer nofollow" className="underline">{place.image_license}</a></p>}
     <Link href={"/attractions/"+place.wikidata_qid} className="mt-auto inline-flex items-center gap-2 text-xs font-semibold">
      <Compass size={14}/> Explore source-backed place <ArrowRight size={14}/>
     </Link>
    </div>
   </article>
  })}
  </div>
 </div>
 </section>;
}