import Link from "next/link";
import type {Metadata} from "next";
import {createClient} from "@supabase/supabase-js";
import RegistryTable,{type ReraProjectRow} from "@/components/real-estate/RegistryTable";
import {isPublicLaunch,siteUrl} from "@/lib/seo/site";
import {isIndexableProperty} from "@/lib/real-estate/property-seo";
import {officialMahaReraUrl} from "@/lib/real-estate/explorer-presentation";

export const dynamic="force-dynamic";
const PAGE_SIZE=35;
type Props={searchParams:Promise<{q?:string;page?:string}>};
export const metadata:Metadata={
 title:"MahaRERA Project Registration & Timeline Explorer | GTH PRO",
 description:"Search source-backed Maharashtra real-estate registrations, recorded project details and dates. Verify current status and possession directly on MahaRERA.",
 alternates:{canonical:siteUrl("/real-estate/registry")},
 robots:{index:isPublicLaunch(),follow:isPublicLaunch()},
};
type DbRow=ReraProjectRow&{status?:string|null;source_type?:string|null;ingestion_source?:string|null;last_verified_at?:string|null};
function safeQuery(value:unknown){
 return typeof value==="string"?value.normalize("NFKC").replace(/[^\p{L}\p{N} -]/gu,"").trim().slice(0,70):"";
}
async function readRegistry(q:string,page:number):Promise<{rows:DbRow[];error:boolean}>{
 const url=process.env.NEXT_PUBLIC_SUPABASE_URL,key=process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
 if(!url||!key)return {rows:[],error:true};
 try{
  const db=createClient(url,key,{auth:{persistSession:false,autoRefreshToken:false}});
  let request=db.from("properties")
   .select("slug,title,rera_id,developer,builder_name,city,district,completion_date,official_source_url,status,source_type,ingestion_source,last_verified_at")
   .in("source_type",["registry","rera"])
   .ilike("ingestion_source","%maharera%")
   .not("rera_id","is",null);
  // Query is restricted to letters, numbers, spaces and hyphens; no PostgREST
  // operator syntax, commas or wildcard input enters the .or expression.
  if(q)request=request.or("title.ilike.%"+q+"%,rera_id.ilike.%"+q+"%");
  const {data,error}=await request.order("slug",{ascending:true})
   .range((page-1)*PAGE_SIZE,page*PAGE_SIZE-1)
   .abortSignal(AbortSignal.timeout(5_000));
  if(error||!Array.isArray(data))return {rows:[],error:true};
  // Exact SEO gate: invalid or unsourced records must not look verified.
  const rows=(data as DbRow[]).filter(item=>isIndexableProperty(item)&&Boolean(officialMahaReraUrl(item.official_source_url)));
  return {rows,error:false};
 }catch{return {rows:[],error:true};}
}
export default async function RegistryExplorer({searchParams}:Props){
 const params=await searchParams,q=safeQuery(params.q);
 const rawPage=typeof params.page==="string"?params.page:"1";
 const page=/^[1-9][0-9]{0,2}$/.test(rawPage)?Math.min(Number(rawPage),100):1;
 const {rows,error}=await readRegistry(q,page);
 const path=(next:number)=>"/real-estate/registry"+(q||next>1?"?"+new URLSearchParams({
  ...(q?{q}:{}),...(next>1?{page:String(next)}:{})
 }).toString():"");
 return <main className="gth-container mx-auto max-w-7xl px-4 py-10 sm:px-6">
  <nav className="mb-7 text-sm"><Link href="/real-estate" className="underline underline-offset-4">Real Estate</Link><span aria-hidden="true"> / </span>Project Registry</nav>
  <p className="text-xs font-semibold uppercase tracking-wider text-[var(--gold)]">Official-source research</p>
  <h1 className="mt-3 text-3xl font-bold">MahaRERA Project Status & Timeline Explorer</h1>
  <p className="mt-3 max-w-3xl text-sm leading-7 text-[var(--text-soft)]">Search recorded registrations, developer identities and source-linked completion dates. This is a registry research table, not a sale/rent inventory. GTH PRO does not issue possession or delay certifications. Current status must be checked on the official MahaRERA record.</p>
  <form method="get" action="/real-estate/registry" role="search" className="mt-6 flex max-w-2xl flex-wrap gap-3">
   <label className="min-w-[240px] flex-1"><span className="sr-only">Project name or RERA reference</span><input name="q" type="search" defaultValue={q} maxLength={70} placeholder="Search project name or RERA number" className="w-full min-h-11 rounded-lg border border-[var(--border)] bg-[var(--card)] px-4 text-sm"/></label>
   <button type="submit" className="gth-btn-gold min-h-11 rounded-lg px-5 text-sm font-semibold">Check records</button>
  </form>
  <section className="mt-8" aria-label="MahaRERA records">
   {error?<p role="alert" className="rounded-xl border border-[var(--border)] p-4">Project registry data could not be reached. No records were invented. Please retry or use MahaRERA directly.</p>:
    <RegistryTable rows={rows} caption="Public source-backed Maharashtra project registry records"/>}
   {!error&&<nav aria-label="Registry results pages" className="mt-5 flex items-center gap-4 text-sm">
    {page>1&&<Link href={path(page-1)} className="gth-btn">Previous</Link>}
    <span>Page {page}</span>
    {rows.length===PAGE_SIZE&&<Link href={path(page+1)} className="gth-btn">Next</Link>}
   </nav>}
  </section>
  <p className="mt-6 text-xs leading-6 text-[var(--text-soft)]">A recorded completion date is not proof that a project is delayed, completed, occupied or currently available. The registry is informational; official portal updates control. No property photos or asking prices are inferred from these records.</p>
  <div className="mt-6 flex flex-wrap gap-3"><Link href="/real-estate" className="gth-btn">Explore approved-photo property listings</Link><Link href="/hotels" className="gth-btn">Holiday stays (separate booking category)</Link></div>
 </main>;
}
