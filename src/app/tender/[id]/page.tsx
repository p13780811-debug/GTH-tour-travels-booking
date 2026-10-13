import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ArrowUpRight, CalendarDays, Globe2, ShieldCheck } from "lucide-react";
import { getPublicTender, safeTenderSource } from "@/lib/tender/catalog";
export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Tender Notice | GTH PRO", robots: { index: false, follow: false } };
function formatted(date: string) {
  const d = new Date(date);
  return Number.isNaN(d.getTime()) ? "Check original notice" : new Intl.DateTimeFormat("en",{dateStyle:"full",timeZone:"UTC"}).format(d);
}
export default async function TenderDetailPage({params}: {params: Promise<{id:string}>}) {
  const {id}=await params;
  const response=await getPublicTender(id);
  if (!response.ok) return <main className="mx-auto min-h-[60vh] max-w-4xl px-4 py-20 text-[var(--text)]">
    <h1 className="text-3xl font-semibold">Tender record unavailable</h1>
    <p className="mt-4 text-sm text-[var(--text-soft)]">{response.error}. Contact the issuing authority for authoritative information.</p>
    <Link href="/tender" className="mt-6 inline-flex min-h-11 items-center gap-2 text-sm font-semibold"><ArrowLeft size={16}/> Back to tender discovery</Link>
  </main>;
  const tender=response.item;
  if (!tender) notFound();
  const url=safeTenderSource(tender.source_url);
  return <main className="min-h-screen bg-[var(--bg)] text-[var(--text)]">
    <article className="mx-auto max-w-4xl px-4 py-12 sm:px-6 md:py-20">
      <Link href="/tender" className="inline-flex min-h-11 items-center gap-2 text-sm font-semibold text-[var(--text-soft)] hover:text-[var(--text)]"><ArrowLeft size={16}/> All tenders</Link>
      <p className="mt-7 text-xs font-semibold uppercase tracking-[0.2em] text-[var(--gold)]">Verified-source procurement notice · {tender.country_code}</p>
      <h1 className="mt-4 text-3xl font-semibold leading-tight tracking-tight sm:text-4xl">{tender.title}</h1>
      <p className="mt-4 text-base text-[var(--text-soft)]">{tender.buyer}</p>
      <div className="mt-8 grid gap-4 rounded-2xl border border-[var(--border)] bg-[var(--card)] p-6 sm:grid-cols-2">
        {[
          ["Notice reference",tender.source_reference],
          ["Source",tender.source_name],
          ["Sector",tender.sector],
          ["Country",tender.country_code],
          ["Region",tender.region||"See original notice"],
          ["Deadline (UTC)",formatted(tender.deadline_at)],
        ].map(([label,value])=><div key={label}><dt className="text-xs font-semibold uppercase tracking-wide text-[var(--text-soft)]">{label}</dt><dd className="mt-2 break-words text-sm font-semibold">{value}</dd></div>)}
      </div>
      <Link href={`/tender/assistant?tenderId=${encodeURIComponent(tender.id)}`}
        className="gth-btn-gold mt-7 inline-flex min-h-12 items-center gap-2 rounded-xl px-6 text-sm font-semibold">
        Check eligibility & prepare draft <ArrowUpRight size={17}/>
      </Link>
      {tender.summary&&<section className="mt-9"><h2 className="text-xl font-semibold">Notice summary</h2><p className="mt-4 whitespace-pre-line text-sm leading-8 text-[var(--text-soft)]">{tender.summary}</p></section>}
      <section className="mt-10 rounded-2xl border border-[var(--border)] bg-[var(--card)] p-6">
        <p className="inline-flex items-center gap-2 text-sm font-semibold"><ShieldCheck size={17}/> Original documents take precedence</p>
        <p className="mt-3 text-sm leading-7 text-[var(--text-soft)]">Check eligibility, amendments, tender fee and final deadline directly with the issuing authority. This is a source-attributed discovery listing, not an e-bidding or payment service.</p>
        {url?<a href={url} target="_blank" rel="noopener noreferrer nofollow" className="gth-btn-gold mt-6 inline-flex min-h-12 items-center gap-2 rounded-xl px-6 text-sm font-semibold">Open source notice <ArrowUpRight size={17}/></a>:
          <p className="mt-4 text-sm">Source link cannot be opened safely. Please search the official portal by reference.</p>}
      </section>
    </article>
  </main>;
}
