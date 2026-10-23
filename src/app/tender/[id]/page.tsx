import type { Metadata } from "next";
import { cache } from "react";
import JsonLd from "@/components/seo/JsonLd";
import { isPublicLaunch, siteUrl } from "@/lib/seo/site";
import { isIndexableTender, tenderMetadata } from "@/lib/seo/public-listings";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ArrowUpRight, CalendarDays, Globe2, ShieldCheck } from "lucide-react";
import { getPublicTender, safeTenderSource } from "@/lib/tender/catalog";
import TenderIntelligencePanel from "@/components/tender/TenderIntelligencePanel";
import {resolveTenderAudience} from "@/lib/tender/localization";
import { TenderSaveCompare, TenderDeadlineDownload } from "@/components/tender/TenderDiscoveryActions";
import { formatTenderBudget } from "@/lib/tender/discovery-workspace";
export const dynamic = "force-dynamic";
const readTender = cache((id:string) => getPublicTender(id));
export async function generateMetadata({params}: {params:Promise<{id:string}>}):Promise<Metadata> {
  const {id}=await params;
  const result=await readTender(id);
  return tenderMetadata(result.ok ? result.item : null, id, isPublicLaunch());
}
function formatted(date: string) {
  const d = new Date(date);
  return Number.isNaN(d.getTime()) ? "Check original notice" : new Intl.DateTimeFormat("en",{dateStyle:"full",timeStyle:"short",timeZone:"UTC"}).format(d);
}
export default async function TenderDetailPage({params}: {params: Promise<{id:string}>}) {
  const {id}=await params;
  const response=await readTender(id);
  if (!response.ok) return <main className="mx-auto min-h-[60vh] max-w-4xl px-4 py-20 text-[var(--text)]">
    <h1 className="text-3xl font-semibold">Tender record unavailable</h1>
    <p className="mt-4 text-sm text-[var(--text-soft)]">{response.error}. Contact the issuing authority for authoritative information.</p>
    <Link href="/tender" className="mt-6 inline-flex min-h-11 items-center gap-2 text-sm font-semibold"><ArrowLeft size={16}/> Back to tender discovery</Link>
  </main>;
  const tender=response.item;
  if (!tender) notFound();
  const url=safeTenderSource(tender.source_url);
  const {language}=await resolveTenderAudience(tender.country_code);
  const canonical=siteUrl(`/tender/${encodeURIComponent(id)}`);
  const breadcrumbData={
    "@context":"https://schema.org",
    "@type":"BreadcrumbList",
    itemListElement:[
      {"@type":"ListItem",position:1,name:"Tenders",item:siteUrl("/tender")},
      {"@type":"ListItem",position:2,name:tender.title,item:canonical},
    ],
  };
  return <main className="min-h-screen bg-[var(--bg)] text-[var(--text)]">
    {isPublicLaunch()&&isIndexableTender(tender)&&<JsonLd data={breadcrumbData}/>}
    <article className="mx-auto max-w-6xl px-4 py-9 sm:px-6 md:py-12">
      <Link href="/tender" className="inline-flex min-h-11 items-center gap-2 text-sm font-semibold text-[var(--text-soft)] hover:text-[var(--text)]"><ArrowLeft size={16}/> All tenders</Link>
      <p className="mt-7 text-xs font-semibold uppercase tracking-[0.2em] text-[var(--gold)]">Verified-source procurement notice · {tender.country_code}</p>
      <h1 className="mt-4 max-w-4xl break-words text-2xl font-semibold leading-tight tracking-tight sm:text-3xl">{tender.title}</h1>
      <p className="mt-4 text-base text-[var(--text-soft)]">{tender.buyer}</p>
      <dl className="mt-6 grid gap-4 rounded-2xl border border-[var(--border)] bg-[var(--card)] p-5 sm:grid-cols-2 lg:grid-cols-3">
        {[
          ["Notice reference",tender.source_reference],
          ["Source",tender.source_name],
          ["Sector",tender.sector],
          ["Country",tender.country_code],
          ["Region",tender.region||"See original notice"],
          ["Deadline (UTC)",formatted(tender.deadline_at)],
          ["Estimated value",formatTenderBudget(tender.estimated_value,tender.currency,language)],
          ["Published",tender.published_at?formatted(tender.published_at):"Not recorded"],
          ["Qualification review",tender.requirements_verified?"Reviewed source conditions recorded":"Review original conditions"],
        ].map(([label,value])=><div key={label}><dt className="text-xs font-semibold uppercase tracking-wide text-[var(--text-soft)]">{label}</dt><dd className="mt-2 break-words text-sm font-semibold">{value}</dd></div>)}
      </dl>
      <TenderSaveCompare id={tender.id} title={tender.title}/>
      <div className="mt-5 flex flex-wrap items-center gap-3">
      <Link href={`/tender/assistant?tenderId=${encodeURIComponent(tender.id)}`}
        className="gth-btn gth-btn-gold inline-flex items-center justify-center gap-2">
        Check eligibility & prepare draft <ArrowUpRight size={17}/>
      </Link>
      <Link href={`/tender/services?tenderId=${encodeURIComponent(tender.id)}`} className="gth-btn inline-flex items-center justify-center gap-2">Request paid assistance quote</Link>
      <TenderDeadlineDownload tender={tender}/>
      <Link href="/tender/saved?view=compare" className="gth-btn inline-flex items-center justify-center gap-2">Open comparison</Link>
      </div>
      {tender.summary&&<section className="mt-9"><h2 className="text-xl font-semibold">Notice summary</h2><p className="mt-4 whitespace-pre-line text-sm leading-8 text-[var(--text-soft)]">{tender.summary}</p></section>}
      <TenderIntelligencePanel tenderId={tender.id} language={language} sourceUrl={url}
        notice={{
          title:tender.title,summary:tender.summary,sector:tender.sector,
          country_code:tender.country_code,buyer:tender.buyer,deadline_at:tender.deadline_at,
          source_name:tender.source_name,requirements_verified:tender.requirements_verified,
          eligibility_requirements:tender.eligibility_requirements
        }}/>
      <section className="mt-10 rounded-2xl border border-[var(--border)] bg-[var(--card)] p-6">
        <p className="inline-flex items-center gap-2 text-sm font-semibold"><ShieldCheck size={17}/> Original documents take precedence</p>
        <p className="mt-3 text-sm leading-7 text-[var(--text-soft)]">Check eligibility, amendments, tender fee and final deadline directly with the issuing authority. This is a source-attributed discovery listing, not an e-bidding or payment service.</p>
        {url?<a href={url} target="_blank" rel="noopener noreferrer nofollow" className="gth-btn gth-btn-gold mt-6 inline-flex items-center gap-2 justify-center">Open source notice <ArrowUpRight size={17}/></a>:
          <p className="mt-4 text-sm">Source link cannot be opened safely. Please search the official portal by reference.</p>}
      </section>
    </article>
  </main>;
}
