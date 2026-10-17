import Link from "next/link";
import {createClient} from "@supabase/supabase-js";
import {ArrowRight,Compass,ExternalLink,MapPin} from "lucide-react";
export default async function OSMAttractionsRail({region}:{region:"goa"|"india"}){
 const u=process.env.NEXT_PUBLIC_SUPABASE_URL,k=process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
 if(!u||!k)return null;
 try{
  const db=createClient(u,k,{auth:{persistSession:false,autoRefreshToken:false}});
  const {data,error}=await db.from("gth_osm_attractions").select("source_id,name,category,region_scope,city,source_url")
   .eq("is_public",true).eq("is_community_directory",true).eq("region_scope",region)
   .order("name",{ascending:true}).limit(18);
  if(error||!data?.length)return null;
  return <section className="border-y border-[var(--border)] bg-[var(--bg-soft)]" aria-label={"OSM community places "+region}>
   <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
    <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
     <div><p className="text-xs font-semibold uppercase tracking-wider text-[var(--text-soft)]">© OpenStreetMap contributors · ODbL 1.0</p>
      <h2 className="mt-2 text-xl font-semibold sm:text-2xl">{region==="goa"?"Goa":"India"} community-mapped places</h2>
      <p className="mt-2 text-xs leading-6 text-[var(--text-soft)]">Real mapped source records, not independently verified venues, paid tours, images or bookable tickets.</p></div>
     <Link href={"/attractions?region="+region} className="inline-flex min-h-11 items-center gap-2 text-sm font-semibold underline">Browse directory <ArrowRight size={15}/></Link>
    </div>
    <div role="region" aria-label="OpenStreetMap attractions horizontal rail" tabIndex={0}
     className="flex snap-x snap-mandatory gap-4 overflow-x-auto overscroll-x-contain pb-4">
     {data.map(place=><article key={place.source_id}
      className="flex h-64 w-60 shrink-0 snap-start flex-col overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--card)] p-4">
       <div className="flex h-16 items-center justify-between"><span className="rounded-xl border border-[var(--border)] bg-[var(--bg)] p-3"><Compass size={24} aria-hidden="true"/></span><ExternalLink size={15} className="text-[var(--text-soft)]"/></div>
       <p className="mt-2 line-clamp-1 text-xs capitalize text-[var(--text-soft)]">{String(place.category).replaceAll("-"," ")}</p>
       <h3 className="mt-2 line-clamp-2 text-sm font-semibold">{place.name}</h3>
       {place.city&&<p className="mt-1 line-clamp-1 flex items-center gap-1 text-xs text-[var(--text-soft)]"><MapPin size={13}/>{place.city} · OSM</p>}
       <a href={place.source_url} target="_blank" rel="noopener noreferrer nofollow"
        className="mt-auto inline-flex items-center gap-2 text-xs font-semibold">View original OSM source <ExternalLink size={14}/></a>
      </article>)}
    </div>
   </div>
  </section>;
 }catch{return null;}
}
