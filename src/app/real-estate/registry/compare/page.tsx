import Link from "next/link";
import type {Metadata} from "next";
import {registryCompareSlugs} from "@/lib/real-estate/registry-search";
import {readRegistryComparison,type RegistryRecord} from "@/lib/real-estate/registry-reader";
import {officialMahaReraUrl} from "../explorer-presentation";
import SavePropertyButton from "@/components/real-estate/SavePropertyButton";
import ShareRegistryComparison from "@/components/real-estate/ShareRegistryComparison";
export const dynamic="force-dynamic";
export const metadata:Metadata={title:"Compare recorded project details | GTH PRO",description:"Compare source-backed project facts and recorded dates. No current availability, sale price or legal verification is implied.",robots:{index:false,follow:true},alternates:{canonical:"/real-estate/registry/compare"}};
const known=(v:string|null)=>v?.trim()&&!/not provided/i.test(v)?v:"Not recorded";
const date=(v:string|null)=>v&&/^\d{4}-\d{2}-\d{2}/.test(v)?v.slice(0,10):"Not recorded";
const fields:[string,(row:RegistryRecord)=>string][]=[
 ["Registration reference",r=>r.rera_id],["Recorded developer",r=>known(r.developer||r.builder_name)],
 ["City",r=>known(r.city)],["District",r=>known(r.district)],
 ["Registration date",r=>date(r.registration_date)],["Recorded completion date",r=>date(r.completion_date)],
 ["Imported record source",r=>known(r.ingestion_source)],["Stored last-check date",r=>date(r.last_verified_at)],
];
export default async function RegistryComparison({searchParams}:{searchParams:Promise<Record<string,unknown>>}){
 const slugs=registryCompareSlugs((await searchParams).projects);
 const result=slugs?await readRegistryComparison(slugs):{rows:[],error:false};
 return <main className="gth-container mx-auto max-w-7xl px-4 py-10 sm:px-6">
  <Link href="/real-estate/registry" className="text-sm underline">Back to registry research</Link><p className="gold-text mt-7 text-xs uppercase tracking-widest">Side-by-side research</p><h1 className="mt-3 text-3xl font-bold">Compare project records</h1>
  <p className="mt-4 max-w-3xl text-sm leading-7 text-[var(--text-soft)]">Compare recorded facts and gaps before shortlisting. Registry records are not sale/rent offers. Imported dates do not prove current possession, legal clearance or availability.</p>
  {!slugs?<p role="alert" className="mt-6">Select two or three distinct projects from Registry lookup to compare recorded details.</p>:result.error?<p role="alert" className="mt-6">Comparison records could not be reached. Please retry; no values were estimated.</p>:<>
   {result.rows.length!==slugs.length&&<p role="status" className="mt-5 text-sm">Some requested records are unavailable or no longer public. They have not been replaced by other projects.</p>}
   {result.rows.length>0&&<><div className="mt-6"><ShareRegistryComparison projects={slugs}/></div><div role="region" aria-label="Recorded project comparison" tabIndex={0} className="mt-5 overflow-x-auto rounded-2xl border border-[var(--border)] bg-[var(--card)]"><table className="w-full min-w-[650px] text-left text-sm"><caption className="sr-only">Recorded registry project comparison; missing information stays visible</caption><thead><tr><th scope="col" className="p-4">Recorded detail</th>{result.rows.map(row=><th scope="col" key={row.slug} className="p-4"><Link href={`/real-estate/${encodeURIComponent(row.slug)}`} className="underline">{row.title}</Link><div className="mt-3"><SavePropertyButton slug={row.slug} className="gth-btn inline-flex min-h-11 items-center justify-center"/></div></th>)}</tr></thead><tbody>
    {fields.map(([label,read])=><tr key={label} className="border-t border-[var(--border)]"><th scope="row" className="p-4 font-medium">{label}</th>{result.rows.map(row=><td key={row.slug} className="p-4">{read(row)}</td>)}</tr>)}<tr className="border-t border-[var(--border)]"><th scope="row" className="p-4">Official source</th>{result.rows.map(row=>{const source=officialMahaReraUrl(row.official_source_url);return <td key={row.slug} className="p-4">{source?<a href={source} target="_blank" rel="noopener noreferrer" className="underline">Check MahaRERA source</a>:"Official project URL not linked"}</td>;})}</tr>
   </tbody></table></div></>}
  </>}
  <div className="mt-7 flex flex-wrap gap-3"><Link href="/real-estate/saved#research-workspace" className="gth-btn">Private research workspace</Link><Link href="/real-estate/tools#buyer-planning-studio" className="gth-btn">Compare ownership costs</Link></div>
 </main>;
}
