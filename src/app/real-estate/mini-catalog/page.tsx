import type {Metadata} from "next";
import Link from "next/link";
import {catalogContact,catalogSlugs} from "@/lib/real-estate/broker-catalog";

export const metadata:Metadata={
 title:"Shared Property Mini-Catalog | GTH PRO",
 description:"A shareable selection of GTH PRO property research links, not a verified agent endorsement.",
 robots:{index:false,follow:false},
};
type Props={searchParams:Promise<Record<string,string|string[]|undefined>>};
export default async function PropertyMiniCatalog({searchParams}:Props){
 const raw=await searchParams;
 const slugs=catalogSlugs(raw.projects),contact=catalogContact(raw.broker,raw.phone);
 return <main className="min-h-screen bg-[var(--bg)] px-4 py-12 text-[var(--text)]">
  <div className="mx-auto max-w-4xl">
    <Link href="/real-estate" className="text-sm underline">Explore Real Estate</Link>
    <p className="mt-6 text-xs font-bold uppercase tracking-widest text-[var(--gold)]">GTH PRO · Shared research collection</p>
    <h1 className="mt-3 text-3xl font-bold">Property mini-catalog</h1>
    <p className="mt-3 max-w-2xl text-sm leading-7 text-[var(--text-soft)]">This is a selection of property-record links shared by a visitor, not an endorsement, verified agency affiliation, official project claim, live sale listing or guaranteed price. Review every record and source before contacting anyone.</p>
    {contact?<div className="gth-glass mt-6 rounded-2xl border border-[var(--border)] p-5"><h2 className="text-base font-semibold">Shared business contact (user supplied)</h2><p className="mt-2 break-words">{contact.name}</p><a className="mt-2 inline-block text-[var(--gold)] underline" href={"tel:"+contact.phone}>{contact.phone}</a><p className="mt-2 text-xs text-[var(--text-soft)]">GTH PRO has not verified this person or business. Never send an advance payment based on a shared catalog alone.</p></div>:null}
    {slugs.length>0?<div className="mt-6 grid gap-3 sm:grid-cols-2">{slugs.map((slug,index)=><article key={slug} className="gth-glass rounded-2xl border border-[var(--border)] p-5"><p className="text-xs text-[var(--gold)]">Selected property {index+1}</p><h2 className="mt-2 break-words font-semibold">{slug.replace(/[-_]/g," ")}</h2><p className="mt-2 text-xs leading-5 text-[var(--text-soft)]">Project name, availability, location and ownership must be checked on its actual details page.</p><Link href={"/real-estate/"+encodeURIComponent(slug)} prefetch={false} className="gth-btn mt-4 inline-flex min-h-11 items-center rounded-xl px-4">View source-backed details</Link></article>)}</div>:<p role="alert" className="mt-6">No valid projects were supplied. Ask the sender for a valid GTH PRO catalog link.</p>}
    <Link href="/real-estate/broker-catalog" className="gth-btn-gold mt-7 inline-flex min-h-11 items-center rounded-xl px-4">Make your own catalog</Link>
  </div>
 </main>;
}
