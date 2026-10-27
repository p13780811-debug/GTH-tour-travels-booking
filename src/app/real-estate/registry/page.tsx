import Link from "next/link";
import {Suspense} from "react";
import type {Metadata} from "next";
import RegistryTable from "./RegistryTable";
import {isPublicLaunch,siteUrl} from "@/lib/seo/site";
import {parseRegistryFilters,registryHref,type RegistryFilters} from "@/lib/real-estate/registry-search";
import {readRegistryRecords} from "@/lib/real-estate/registry-reader";
export const dynamic="force-dynamic";
export const metadata:Metadata={title:"MahaRERA Project Registration & Timeline Explorer | GTH PRO",description:"Search source-backed Maharashtra project records by district, developer and recorded timeline. Compare recorded facts and check current details on MahaRERA.",alternates:{canonical:siteUrl("/real-estate/registry")},robots:{index:isPublicLaunch(),follow:isPublicLaunch()}};
async function RegistryResults({filters}:{filters:RegistryFilters}){
 const {rows,error,hasNext}=await readRegistryRecords(filters);
 return <section className="mt-8" aria-label="MahaRERA records">
  {error?<div role="alert" className="rounded-xl border border-[var(--border)] p-4"><p>Project registry is temporarily unavailable because the data service did not respond. No records were invented or substituted with sale listings.</p><a href={registryHref(filters)} className="gth-btn mt-4 inline-flex">Retry registry lookup</a><p className="mt-3 text-xs">You can also check the official MahaRERA portal while service recovers.</p></div>:<RegistryTable rows={rows} caption="Public source-backed Maharashtra project registry records"/>}
  {!error&&<nav aria-label="Registry results pages" className="mt-5 flex items-center gap-4 text-sm">{filters.page>1&&<Link href={registryHref(filters,filters.page-1)} className="gth-btn">Previous</Link>}<span>Page {filters.page}</span>{hasNext&&filters.page<1000&&<Link href={registryHref(filters,filters.page+1)} className="gth-btn">Next</Link>}</nav>}
 </section>;
}
export default async function RegistryExplorer({searchParams}:{searchParams:Promise<Record<string,unknown>>}){
 const parsed=parseRegistryFilters(await searchParams);
 const f=parsed.ok?parsed.filters:{q:"",district:"",developer:"",year:"",sort:"name" as const,page:1};
 const input="mt-2 min-h-11 w-full rounded-lg border border-[var(--border)] bg-[var(--card)] px-3 text-sm";
 return <main className="gth-container mx-auto max-w-7xl px-4 py-10 sm:px-6">
  <nav className="mb-7 text-sm"><Link href="/real-estate" className="underline">Real Estate</Link> / Project Registry</nav>
  <p className="gold-text text-xs font-semibold uppercase tracking-wider">Official-source research</p><h1 className="mt-3 text-3xl font-bold">MahaRERA Project Status & Timeline Explorer</h1>
  <p className="mt-3 max-w-3xl text-sm leading-7 text-[var(--text-soft)]">Search recorded registrations, developer identities and historical completion dates, including imported MahaRERA CSV snapshots. This registry research table is not a sale/rent inventory and does not certify live status, delay or possession. Missing official project URLs are marked clearly; verify current details on MahaRERA.</p>
  <form method="get" action="/real-estate/registry" role="search" aria-label="Advanced registry search" className="mt-6 grid gap-4 rounded-2xl border border-[var(--border)] p-4 sm:grid-cols-2 lg:grid-cols-3">
   <label className="min-w-0 text-sm">Project name, city or RERA reference<input name="q" type="search" defaultValue={f.q} maxLength={70} placeholder="Project name or RERA number" className={input}/></label>
   <label className="min-w-0 text-sm">District<input name="district" type="search" defaultValue={f.district} maxLength={70} placeholder="e.g. Thane" className={input}/></label>
   <label className="min-w-0 text-sm">Developer name<input name="developer" type="search" defaultValue={f.developer} maxLength={70} placeholder="Recorded developer or builder" className={input}/></label>
   <label className="min-w-0 text-sm">Recorded completion year<input name="year" type="number" min="1900" max="2100" defaultValue={f.year} placeholder="Any recorded year" className={input}/></label>
   <label className="min-w-0 text-sm">Sort records<select name="sort" defaultValue={f.sort} className={input}><option value="name">Project name / registry order</option><option value="registered_newest">Registration date: newest recorded</option><option value="completion_earliest">Recorded completion: earliest</option></select></label>
   <div className="flex flex-wrap items-end gap-3"><button type="submit" className="gth-btn-gold min-h-11 rounded-lg px-5 text-sm font-semibold">Check records</button><Link href="/real-estate/registry" className="gth-btn inline-flex min-h-11 items-center">Reset</Link></div>
   <p className="text-xs leading-6 text-[var(--text-soft)] sm:col-span-2 lg:col-span-3">Filters combine together. Dates describe imported records, not confirmed possession; unknown dates are not inferred.</p>
  </form>
  {parsed.ok?<Suspense key={registryHref(f)} fallback={<p role="status" className="mt-8 rounded-xl border border-[var(--border)] p-4">Loading source-backed registry records… Search and research tools remain available while the data service responds.</p>}><RegistryResults filters={f}/></Suspense>:<p role="alert" className="mt-5">{parsed.error} <Link href="/real-estate/registry" className="underline">Reset search</Link></p>}
  <p className="mt-6 text-xs leading-6 text-[var(--text-soft)]">A recorded completion date is not proof that a project is delayed, completed, occupied or currently available. The registry is informational; official portal updates control. No property photos or asking prices are inferred from these records.</p>
  <div className="mt-6 flex flex-wrap gap-3"><Link href="/real-estate/saved#research-workspace" className="gth-btn">Private research workspace</Link><Link href="/real-estate/tools#buyer-planning-studio" className="gth-btn">Ownership cost & affordability</Link><Link href="/real-estate/post-property" className="gth-btn">List your property</Link></div>
 </main>;
}
