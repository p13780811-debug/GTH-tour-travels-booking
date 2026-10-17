import type {Metadata} from "next";
import Link from "next/link";
import {createClient} from "@supabase/supabase-js";
import {ArrowLeft,ArrowRight,Compass,ExternalLink,MapPin,Search} from "lucide-react";
export const dynamic="force-dynamic";
export const metadata:Metadata={title:"Community-Mapped Attractions | GTH PRO",description:"Browse source-linked OpenStreetMap mapped places across India. Community-contributed directory, not ticket inventory or verified operating venues.",robots:{index:false,follow:true}};
type Props={searchParams:Promise<{region?:string;category?:string;page?:string}>};
const types=["attraction","museum","viewpoint","zoo","theme-park","fort","castle","ruins","monument","archaeological-site","beach","national-park","park","nature-reserve"];
export default async function AttractionsDirectory({searchParams}:Props){
 const args=await searchParams;
 const region=["all","goa","india"].includes(args.region||"all")?args.region||"all":"all";
 const category=types.includes(args.category||"")?args.category||"":"";
 const raw=args.page||"1",page=/^[1-9][0-9]{0,2}$/.test(raw)?Math.min(Number(raw),100):1;
 const url=process.env.NEXT_PUBLIC_SUPABASE_URL,key=process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
 let records:{source_id:string;name:string;category:string;region_scope:string;city:string|null;source_url:string;latitude:number;longitude:number}[]=[];
 let unavailable=false;
 if(url&&key){
  try{
   const db=createClient(url,key,{auth:{persistSession:false,autoRefreshToken:false}});
   let q=db.from("gth_osm_attractions")
    .select("source_id,name,category,region_scope,city,source_url,latitude,longitude")
    .eq("is_public",true).eq("is_community_directory",true)
    .order("name",{ascending:true}).order("source_id",{ascending:true})
    .range((page-1)*24,page*24-1);
   if(region!=="all")q=q.eq("region_scope",region);
   if(category)q=q.eq("category",category);
   const {data,error}=await q;if(error)throw new Error("OSM query unavailable");
   records=data||[];
  }catch{unavailable=true;}
 }else unavailable=true;
 const getHref=(n:number)=>"/attractions?"+new URLSearchParams({
  ...(region!=="all"?{region}:{}),...(category?{category}:{}),page:String(n)}).toString();
 return <main className="min-h-screen bg-[var(--bg)] text-[var(--text)]">
  <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6">
   <Link href="/tours" className="inline-flex min-h-11 items-center gap-2 text-sm underline"><ArrowLeft size={16}/> Tours & Activities</Link>
   <p className="mt-4 text-xs font-semibold uppercase tracking-wider text-[var(--text-soft)]">© OpenStreetMap contributors · ODbL 1.0</p>
   <h1 className="mt-2 text-3xl font-bold sm:text-4xl">Real mapped attractions directory</h1>
   <p className="mt-3 max-w-3xl text-sm leading-7 text-[var(--text-soft)]">Discover original map-linked landmarks, beaches, heritage and nature areas. Community mapping is not independent verification of entry rules, opening hours, real tickets or guided tour availability.</p>
   <form action="/attractions" method="get" className="mt-6 flex flex-wrap items-end gap-3 rounded-2xl border border-[var(--border)] bg-[var(--card)] p-4">
    <label className="flex min-w-44 flex-1 flex-col gap-2 text-xs font-semibold">Source region
     <select name="region" defaultValue={region} className="min-h-11 rounded-xl border border-[var(--border)] bg-[var(--bg)] px-3 text-sm">
      <option value="all">All imported India regions</option><option value="goa">Goa coordinate group</option><option value="india">Other India source regions</option>
     </select>
    </label>
    <label className="flex min-w-44 flex-1 flex-col gap-2 text-xs font-semibold">Mapped category
     <select name="category" defaultValue={category} className="min-h-11 rounded-xl border border-[var(--border)] bg-[var(--bg)] px-3 text-sm">
      <option value="">All categories</option>{types.map(t=><option key={t} value={t}>{t.replaceAll("-"," ")}</option>)}
     </select>
    </label>
    <button type="submit" className="gth-btn-gold inline-flex min-h-11 items-center gap-2 rounded-xl px-5 text-sm"><Search size={16}/> Filter places</button>
    <Link href="/attractions" className="inline-flex min-h-11 items-center px-2 text-xs underline">Clear</Link>
   </form>
   {unavailable?<p role="status" className="mt-8 rounded-2xl border border-[var(--border)] bg-[var(--card)] p-6 text-sm">Source directory temporarily unavailable.</p>:
    records.length===0?<p role="status" className="mt-8 rounded-2xl border border-[var(--border)] bg-[var(--card)] p-6 text-sm">No mapped source places for these filters yet. Regional import is automatic and coverage varies.</p>:
    <div className="mt-8">
     <p className="mb-4 text-xs text-[var(--text-soft)]">Page {page} · Showing {records.length} source records · No ticket prices or stock photographs</p>
     <div role="region" aria-label="Community places horizontal card collection" tabIndex={0}
       className="flex snap-x snap-mandatory gap-4 overflow-x-auto overscroll-x-contain pb-4">
       {records.map(item=><article key={item.source_id} className="flex h-64 w-60 shrink-0 snap-start flex-col rounded-2xl border border-[var(--border)] bg-[var(--card)] p-4">
         <div className="rounded-xl border border-[var(--border)] bg-[var(--bg)] p-3 self-start"><Compass size={22}/></div>
         <p className="mt-3 text-xs capitalize text-[var(--text-soft)]">{item.category.replaceAll("-"," ")}</p>
         <h2 className="mt-2 line-clamp-2 text-sm font-semibold">{item.name}</h2>
         {item.city&&<p className="mt-2 line-clamp-1 flex items-center gap-1 text-xs text-[var(--text-soft)]"><MapPin size={13}/>{item.city}</p>}
         <a href={item.source_url} target="_blank" rel="noopener noreferrer nofollow" className="mt-auto inline-flex items-center gap-2 text-xs font-semibold">Original OSM source <ExternalLink size={13}/></a>
       </article>)}
     </div>
    </div>}
   <nav aria-label="Directory pages" className="mt-7 flex items-center justify-center gap-4 text-sm">
    {page>1&&<Link href={getHref(page-1)} className="rounded-xl border border-[var(--border)] px-4 py-3">Previous</Link>}
    <span>Page {page}</span>
    {records.length===24&&page<100&&<Link href={getHref(page+1)} className="inline-flex items-center gap-2 rounded-xl border border-[var(--border)] px-4 py-3">Next <ArrowRight size={16}/></Link>}
   </nav>
   <p className="mt-8 rounded-xl border border-[var(--border)] bg-[var(--card)] p-4 text-xs leading-6 text-[var(--text-soft)]">Source: © OpenStreetMap contributors, Open Database License (ODbL 1.0). Imported from licensed Geofabrik regional extracts. A location is community mapped, not officially certified or necessarily currently operating. This is an informational directory, not a GetYourGuide/Viator ticket catalog.</p>
  </div>
 </main>;
}
