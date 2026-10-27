import Link from "next/link";
import type {Metadata} from "next";
import {createClient} from "@supabase/supabase-js";
import {unstable_cache} from "next/cache";
import RegistryTable,{type ReraProjectRow} from "./RegistryTable";
import {isPublicLaunch,siteUrl} from "@/lib/seo/site";
import {validPropertySlug} from "@/lib/real-estate/property-seo";

export const dynamic="force-dynamic";
const PAGE_SIZE=35;
type Props={searchParams:Promise<{q?:string;page?:string}>};
export const metadata:Metadata={
 title:"MahaRERA Project Registration & Timeline Explorer | GTH PRO",
 description:"Search source-backed Maharashtra registration records and historical project timelines. Check current status and possession directly on MahaRERA.",
 alternates:{canonical:siteUrl("/real-estate/registry")},
 robots:{index:isPublicLaunch(),follow:isPublicLaunch()},
};
type DbRow=ReraProjectRow&{status?:string|null;source_type?:string|null;ingestion_source?:string|null;last_verified_at?:string|null};
function safeQuery(value:unknown){
 return typeof value==="string"?value.normalize("NFKC").replace(/[^\p{L}\p{N} -]/gu,"").trim().slice(0,70):"";
}
type ReadResult={rows:DbRow[];hasNext:boolean};
// Public, source-backed registry fields only — never authenticated data,
// project-claim evidence, private media or property_inventory.
// Cache a successful read for five minutes; failures always throw.
async function readRegistryUncached(q:string,page:number):Promise<ReadResult>{
 const url=process.env.NEXT_PUBLIC_SUPABASE_URL,key=process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
 if(!url||!key)throw new Error("registry_public_config_missing");
 const db=createClient(url,key,{auth:{persistSession:false,autoRefreshToken:false}});
 for(let attempt=0;attempt<2;attempt++){
 try{
  let request=db.from("properties")
   .select("slug,title,rera_id,developer,builder_name,city,district,completion_date,official_source_url,status,source_type,ingestion_source,last_verified_at")
   .in("source_type",["registry","rera"])
   .ilike("ingestion_source","%maharera%")
   .not("rera_id","is",null);
  // Query is restricted to letters, numbers, spaces and hyphens; no PostgREST
  // operator syntax, commas or wildcard input enters the .or expression.
  if(q)request=request.or("title.ilike.%"+q+"%,rera_id.ilike.%"+q+"%,city.ilike.%"+q+"%,district.ilike.%"+q+"%");
  const {data,error}=await request.order("slug",{ascending:true})
   .range((page-1)*PAGE_SIZE,page*PAGE_SIZE-1)
   .abortSignal(AbortSignal.timeout(7_000));
  if(error||!Array.isArray(data)){
    const temporary=error && (["57014","PGRST000","PGRST001","PGRST002","PGRST003"].includes(error.code||"") || /timeout|aborted|fetch failed/i.test(error.message||""));
    if(attempt===0 && temporary)continue;
    throw new Error("registry_public_query_failed");
  }
  // A legitimate public registry row does NOT need a photo or a usable
  // external project URL. The historic CSV source identity remains part
  // of the database query; show an absent link as "Not linked".
  // SEO indexability of an individual project is a separate stricter gate.
  const rows=(data as DbRow[]).filter(item=>
    validPropertySlug(item.slug)&&
    typeof item.title==="string"&&item.title.trim().length>=3&&
    typeof item.rera_id==="string"&&/^P[0-9]{11}$/.test(item.rera_id)&&
    item.status!=="archived"
  );
  return {rows,hasNext:data.length===PAGE_SIZE};
 }catch(cause){
   if(attempt===0 && cause instanceof Error && /abort|timeout|network/i.test(cause.message))continue;
   throw new Error("registry_public_backend_unavailable");
 }
 }
 throw new Error("registry_public_backend_unavailable");
}
const cachedRegistry=unstable_cache(readRegistryUncached,["gth-public-maharera-registry-v2"],{
 revalidate:300,tags:["gth-public-maharera-registry"],
});
async function readRegistry(q:string,page:number):Promise<{rows:DbRow[];error:boolean;hasNext:boolean}>{
 try{
  const result=await cachedRegistry(q,page);
  return {...result,error:false};
 }catch{
  return {rows:[],error:true,hasNext:false};
 }
}
export default async function RegistryExplorer({searchParams}:Props){
 const params=await searchParams,q=safeQuery(params.q);
 const rawPage=typeof params.page==="string"?params.page:"1";
 const page=/^[1-9][0-9]{0,3}$/.test(rawPage)?Math.min(Number(rawPage),1000):1;
 const {rows,error,hasNext}=await readRegistry(q,page);
 const path=(next:number)=>"/real-estate/registry"+(q||next>1?"?"+new URLSearchParams({
  ...(q?{q}:{}),...(next>1?{page:String(next)}:{})
 }).toString():"");
 return <main className="gth-container mx-auto max-w-7xl px-4 py-10 sm:px-6">
  <nav className="mb-7 text-sm"><Link href="/real-estate" className="underline underline-offset-4">Real Estate</Link><span aria-hidden="true"> / </span>Project Registry</nav>
  <p className="text-xs font-semibold uppercase tracking-wider text-[var(--gold)]">Official-source research</p>
  <h1 className="mt-3 text-3xl font-bold">MahaRERA Project Status & Timeline Explorer</h1>
  <p className="mt-3 max-w-3xl text-sm leading-7 text-[var(--text-soft)]">Search recorded registrations, developer identities and historical completion dates, including imported MahaRERA CSV snapshots. This registry research table is not a sale/rent inventory and does not certify live status, delay or possession. Missing official project URLs are marked clearly; verify current details on MahaRERA.</p>
  <form method="get" action="/real-estate/registry" role="search" className="mt-6 flex max-w-2xl flex-wrap gap-3">
   <label className="min-w-[240px] flex-1"><span className="sr-only">Project name or RERA reference</span><input name="q" type="search" defaultValue={q} maxLength={70} placeholder="Search project name or RERA number" className="w-full min-h-11 rounded-lg border border-[var(--border)] bg-[var(--card)] px-4 text-sm"/></label>
   <button type="submit" className="gth-btn-gold min-h-11 rounded-lg px-5 text-sm font-semibold">Check records</button>
  </form>
  <section className="mt-8" aria-label="MahaRERA records">
   {error?<div role="alert" className="rounded-xl border border-[var(--border)] p-4"><p>Project registry is temporarily unavailable because the data service did not respond. No records were invented or substituted with sale listings.</p><a href={path(page)} className="gth-btn mt-4 inline-flex">Retry registry lookup</a><p className="mt-3 text-xs">You can also check the official MahaRERA portal while service recovers.</p></div>:
    <RegistryTable rows={rows} caption="Public source-backed Maharashtra project registry records"/>}
   {!error&&<nav aria-label="Registry results pages" className="mt-5 flex items-center gap-4 text-sm">
    {page>1&&<Link href={path(page-1)} className="gth-btn">Previous</Link>}
    <span>Page {page}</span>
    {hasNext&&<Link href={path(page+1)} className="gth-btn">Next</Link>}
   </nav>}
  </section>
  <p className="mt-6 text-xs leading-6 text-[var(--text-soft)]">A recorded completion date is not proof that a project is delayed, completed, occupied or currently available. The registry is informational; official portal updates control. No property photos or asking prices are inferred from these records.</p>
  <div className="mt-6 flex flex-wrap gap-3"><Link href="/real-estate" className="gth-btn">Explore approved-photo property listings</Link><Link href="/real-estate/post-property" className="gth-btn">List your property</Link></div>
 </main>;
}
