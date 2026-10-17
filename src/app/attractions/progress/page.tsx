import type {Metadata} from "next";
import Link from "next/link";
import {ArrowLeft,ArrowRight,Globe2,Database,RefreshCw} from "lucide-react";
import {sourceProgress} from "@/lib/travel/osmAttractions";
export const dynamic="force-dynamic";
export const metadata:Metadata={
 title:"Live Open Attractions Import Progress | GTH PRO",
 description:"Read real imported OSM country totals and completed licensed source sync runs without fabricated coverage.",
 robots:{index:false,follow:true}
};
export default async function AttractionsProgress(){
 const progress=await sourceProgress().catch(()=>null);
 return <main className="min-h-screen bg-[var(--bg)] text-[var(--text)]">
  <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
   <Link href="/attractions" className="inline-flex min-h-11 items-center gap-2 text-sm underline"><ArrowLeft size={16}/> Back to global attractions</Link>
   <p className="mt-5 inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-[var(--text-soft)]"><RefreshCw size={15}/> Public source transparency</p>
   <h1 className="mt-3 text-3xl font-bold sm:text-4xl">Live attractions import dashboard</h1>
   <p className="mt-3 max-w-3xl text-sm leading-7 text-[var(--text-soft)]">These are actual database records and completed GitHub source syncs—not estimates or promised worldwide coverage. Scheduled extraction moves through the publicly licensed Geofabrik regional index. Source scope is approximate near borders.</p>
   {!progress?<div role="status" className="mt-7 rounded-2xl border border-[var(--border)] bg-[var(--card)] p-6">Progress data temporarily unavailable. No completion claim is made.</div>:<>
    <div className="mt-7 grid gap-3 sm:grid-cols-3">
     <div className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-5"><Database size={18}/><p className="mt-3 text-xs text-[var(--text-soft)]">Imported OSM places</p><p className="mt-1 text-3xl font-bold">{progress.total.toLocaleString("en-IN")}</p></div>
     <div className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-5"><Globe2 size={18}/><p className="mt-3 text-xs text-[var(--text-soft)]">Countries containing records</p><p className="mt-1 text-3xl font-bold">{progress.countriesWithRecords}</p></div>
     <div className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-5"><RefreshCw size={18}/><p className="mt-3 text-xs text-[var(--text-soft)]">Recent completed import</p><p className="mt-2 text-sm font-semibold">{progress.runs[0]?progress.runs[0].country_name+" · "+new Date(progress.runs[0].completed_at).toLocaleString("en-IN",{dateStyle:"medium",timeStyle:"short"}):"No completion receipt recorded"}</p></div>
    </div>
    <section className="mt-9">
     <h2 className="text-xl font-semibold">Countries with real imported content</h2>
     <p className="mt-2 text-xs text-[var(--text-soft)]">Countries not listed have no indexed records yet. Imported count does not equal total places in the world.</p>
     <div className="mt-4 overflow-x-auto rounded-2xl border border-[var(--border)] bg-[var(--card)]">
      <table className="w-full min-w-[440px] text-left text-sm">
       <thead className="border-b border-[var(--border)] text-xs text-[var(--text-soft)]"><tr><th className="p-4">Country</th><th className="p-4">Source records</th><th className="p-4">Browse</th></tr></thead>
       <tbody>{progress.countries.map(item=><tr key={item.country_code} className="border-b border-[var(--border)] last:border-0">
        <td className="p-4 font-medium">{item.country_name} ({item.country_code})</td>
        <td className="p-4">{Number(item.records).toLocaleString("en-IN")}</td>
        <td className="p-4"><Link href={"/attractions?country="+item.country_code} className="inline-flex items-center gap-1 underline">Browse <ArrowRight size={13}/></Link></td>
       </tr>)}</tbody>
      </table>
     </div>
    </section>
    <section className="mt-9">
     <h2 className="text-xl font-semibold">Latest completed regional source runs</h2>
     {progress.runs.length===0?<p className="mt-3 text-sm text-[var(--text-soft)]">The historical India import happened before sync receipts were enabled. New successful worldwide runs will appear here.</p>:
     <div className="mt-4 grid gap-3 sm:grid-cols-2">
      {progress.runs.map(item=><article key={item.run_id} className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-4">
       <p className="text-sm font-semibold">{item.country_name} · {item.country_code}</p>
       <p className="mt-1 break-all text-xs text-[var(--text-soft)]">{item.source_region}</p>
       <p className="mt-2 text-sm">{item.accepted.toLocaleString("en-IN")} records accepted/upserted in this run</p>
       <p className="mt-1 text-xs text-[var(--text-soft)]">Completed {new Date(item.completed_at).toLocaleString("en-IN")}</p>
      </article>)}
     </div>}
    </section>
   </>}
   <p className="mt-9 rounded-xl border border-[var(--border)] bg-[var(--card)] p-4 text-xs leading-6 text-[var(--text-soft)]">Source: © OpenStreetMap contributors (ODbL 1.0) via Geofabrik. Imported records are distinct OSM source IDs; this is community mapping, not human venue verification, ticket inventory or official government certification. Coverage expands only on successful scheduled syncs.</p>
  </div>
 </main>;
}
