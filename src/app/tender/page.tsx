import type { Metadata } from "next";
import Link from "next/link";
import {
  ArrowRight, ArrowUpRight, Building2, CalendarDays, ClipboardCheck, FileSearch,
  Globe2, Plane, Search, ShieldCheck
} from "lucide-react";
import { parseTenderFilters, searchPublicTenders, TENDER_SECTORS, safeTenderSource } from "@/lib/tender/catalog";
export const dynamic = "force-dynamic";
export const metadata: Metadata = {
  title: "Tender Opportunities & Procurement Intelligence | GTH PRO",
  description: "Search source-verified, publicly released tender notices by country, sector and deadline. Review original documents with issuing authorities.",
  alternates: { canonical: "/tender" }
};

const sources = [
  {name:"Government e-Marketplace",label:"India public procurement",url:"https://gem.gov.in"},
  {name:"Central Public Procurement Portal",label:"India e-procurement",url:"https://eprocure.gov.in/eprocure/app"},
  {name:"UN Global Marketplace",label:"United Nations procurement",url:"https://www.ungm.org"},
  {name:"World Bank Procurement",label:"Worldwide financed projects",url:"https://projects.worldbank.org/en/projects-operations/procurement"},
  {name:"TED European Union",label:"EU procurement notices",url:"https://ted.europa.eu"},
  {name:"UK Find a Tender",label:"United Kingdom procurement",url:"https://www.find-tender.service.gov.uk"},
  {name:"Brazil PNCP",label:"Brazil public procurement",url:"https://pncp.gov.br"},
  {name:"USA SAM.gov",label:"United States federal opportunities",url:"https://sam.gov/opportunities"},
] as const;

type Props = { searchParams: Promise<Record<string, string | string[] | undefined>> };
function textParam(raw: string | string[] | undefined) { return typeof raw === "string" ? raw : ""; }
function formatted(iso: string) {
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? "Check source notice" :
    new Intl.DateTimeFormat("en", { dateStyle:"medium", timeZone:"UTC" }).format(d);
}
function filterHref(filters: {q:string;country:string;sector:string;closingBefore?:string}, page:number) {
  const q = new URLSearchParams();
  if (filters.q) q.set("q", filters.q);
  if (filters.country) q.set("country", filters.country);
  if (filters.sector) q.set("sector", filters.sector);
  if (filters.closingBefore) q.set("closingBefore", filters.closingBefore);
  q.set("page", String(page));
  return "/tender?" + q.toString();
}

export default async function TenderPage({searchParams}: Props) {
  const raw = await searchParams;
  const params = new URLSearchParams();
  for (const name of ["q","country","sector","closingBefore","page"] as const) {
    const value = textParam(raw[name]);
    if (value) params.set(name,value);
  }
  const parsed = parseTenderFilters(params);
  const result = parsed.ok ? await searchPublicTenders(parsed.filters) : null;
  const filters = parsed.ok ? parsed.filters : { q:"", country:"", sector:"", closingBefore:"", page:1 };
  const error = !parsed.ok ? parsed.error : result && !result.ok ? result.error : null;
  const notices = result?.ok ? result.items : [];
  const count = result?.ok ? result.total : 0;
  const pageCount = result?.ok ? Math.ceil(result.total / result.size) : 0;
  return <main className="min-h-screen bg-[var(--bg)] text-[var(--text)]">
    <section className="border-b border-[var(--border)] bg-[var(--card)]">
      <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6 md:py-20">
        <p className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.2em] text-[var(--gold)]">
          <Globe2 size={16} aria-hidden="true" /> GTH PRO · PILLAR 03
        </p>
        <h1 className="mt-4 max-w-4xl text-4xl font-semibold tracking-tight sm:text-5xl">
          Tender intelligence. <span className="gold-text">Source-first opportunities.</span>
        </h1>
        <p className="mt-5 max-w-3xl text-base leading-8 text-[var(--text-soft)]">
          Search source-attributed published procurement notices by sector, location and deadline.
          Confirm all deadlines, eligibility, amendments and bidding instructions on the issuing authority’s website.
        </p>
        <div className="mt-6 inline-flex items-center gap-2 rounded-full border border-[var(--border)] px-4 py-2 text-xs text-[var(--text-soft)]">
          <ShieldCheck size={16} aria-hidden="true"/> Only approved official-source notices with future deadlines appear here
        </div>
        <div className="mt-7 flex flex-wrap gap-3">
          <Link href="/tender/assistant" className="gth-btn-gold inline-flex min-h-12 items-center gap-2 rounded-xl px-6 text-sm font-semibold">
            <ClipboardCheck size={17} aria-hidden="true"/> Start Guided Tender Assistant <ArrowRight size={17} aria-hidden="true"/>
          </Link>
          <Link href="/tender/assistant" className="inline-flex min-h-12 items-center gap-2 rounded-xl border border-[var(--border)] px-6 text-sm font-semibold">
            Check My Eligibility
          </Link>
        </div>
      </div>
    </section>
    <section className="mx-auto max-w-7xl px-4 py-10 sm:px-6 md:py-14" aria-labelledby="tender-find">
      <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
        <div><p className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--gold)]">Procurement discovery</p>
          <h2 id="tender-find" className="mt-2 text-2xl font-semibold md:text-3xl">Find a tender notice</h2>
        </div>
        <span className="text-sm text-[var(--text-soft)]">{result?.ok ? `${count} published notice${count===1?"":"s"}` : "Source-backed catalog"}</span>
      </div>
      <form method="GET" action="/tender" role="search" className="grid gap-3 rounded-2xl border border-[var(--border)] bg-[var(--card)] p-4 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-[2fr_1fr_1fr_1fr_auto] lg:items-end lg:p-5">
        <label className="block text-xs font-semibold text-[var(--text-soft)]">Keywords
          <input name="q" maxLength={100} defaultValue={filters.q} placeholder="Search tender title" className="mt-2 min-h-12 w-full rounded-xl border border-[var(--border)] bg-[var(--bg)] px-4 text-sm text-[var(--text)] outline-offset-2 focus-visible:outline-2 focus-visible:outline-[var(--gold)]"/>
        </label>
        <label className="block text-xs font-semibold text-[var(--text-soft)]">Country (ISO code)
          <input name="country" maxLength={2} defaultValue={filters.country} placeholder="IN, AE, US…" className="mt-2 min-h-12 w-full rounded-xl border border-[var(--border)] bg-[var(--bg)] px-4 text-sm uppercase text-[var(--text)] outline-offset-2 focus-visible:outline-2 focus-visible:outline-[var(--gold)]"/>
        </label>
        <label className="block text-xs font-semibold text-[var(--text-soft)]">Sector
          <select name="sector" defaultValue={filters.sector} className="mt-2 min-h-12 w-full rounded-xl border border-[var(--border)] bg-[var(--bg)] px-4 text-sm capitalize text-[var(--text)] outline-offset-2 focus-visible:outline-2 focus-visible:outline-[var(--gold)]">
            <option value="">All sectors</option>
            {TENDER_SECTORS.map(value => <option value={value} key={value}>{value[0].toUpperCase()+value.slice(1)}</option>)}
          </select>
        </label>
        <label className="block text-xs font-semibold text-[var(--text-soft)]">Closing on or before
          <input type="date" name="closingBefore" defaultValue={filters.closingBefore} className="mt-2 min-h-12 w-full rounded-xl border border-[var(--border)] bg-[var(--bg)] px-4 text-sm text-[var(--text)] outline-offset-2 focus-visible:outline-2 focus-visible:outline-[var(--gold)]"/>
        </label>
        <button type="submit" className="gth-btn-gold inline-flex min-h-12 items-center justify-center gap-2 rounded-xl px-6 text-sm font-semibold">
          <Search size={17} aria-hidden="true"/> Search
        </button>
      </form>
      {error ? <div role="status" className="mt-6 rounded-2xl border border-[var(--border)] bg-[var(--card)] p-6">
        <h3 className="font-semibold">Tender catalog not available yet</h3>
        <p className="mt-2 text-sm leading-7 text-[var(--text-soft)]">{error}. Live data will appear after the reviewed database migration and authorised source import.</p>
      </div> : notices.length ? (
        <>
          <div className="mt-7 grid gap-4 md:grid-cols-2">
            {notices.map(tender=>(
              <article key={tender.id} className="flex flex-col rounded-2xl border border-[var(--border)] bg-[var(--card)] p-5 sm:p-6">
                <div className="flex flex-wrap items-center gap-2 text-xs font-semibold uppercase tracking-wide text-[var(--text-soft)]">
                  <span className="rounded-full border border-[var(--border)] px-3 py-1">{tender.country_code}</span>
                  <span className="rounded-full border border-[var(--border)] px-3 py-1 capitalize">{tender.sector}</span>
                  <span>Official source reference</span>
                </div>
                <h3 className="mt-4 text-lg font-semibold leading-7">{tender.title}</h3>
                <p className="mt-2 text-sm leading-7 text-[var(--text-soft)]">{tender.buyer}</p>
                <p className="mt-3 line-clamp-3 text-sm leading-7 text-[var(--text-soft)]">{tender.summary || "Open the notice to review source, eligibility and deadlines."}</p>
                <div className="mt-auto flex flex-wrap items-center justify-between gap-3 border-t border-[var(--border)] pt-5">
                  <span className="inline-flex items-center gap-2 text-xs text-[var(--text-soft)]"><CalendarDays size={15}/> Deadline {formatted(tender.deadline_at)} UTC</span>
                  <div className="flex flex-wrap gap-3">
                    <Link href={`/tender/${tender.id}`} className="inline-flex min-h-11 items-center gap-2 text-sm font-semibold text-[var(--text)]">
                      View notice <ArrowRight size={16}/>
                    </Link>
                    <Link href={`/tender/assistant?tenderId=${encodeURIComponent(tender.id)}`} className="inline-flex min-h-11 items-center gap-2 text-sm font-semibold text-[var(--text)]">
                      Check eligibility <ClipboardCheck size={16}/>
                    </Link>
                  </div>
                </div>
              </article>
            ))}
          </div>
          <nav aria-label="Tender results pages" className="mt-8 flex items-center justify-between gap-4">
            {filters.page>1?<Link href={filterHref(filters,filters.page-1)} className="min-h-11 rounded-xl border border-[var(--border)] px-5 py-3 text-sm font-semibold">Previous</Link>:<span/>}
            <span className="text-sm text-[var(--text-soft)]">Page {filters.page} of {pageCount}</span>
            {filters.page<pageCount?<Link href={filterHref(filters,filters.page+1)} className="min-h-11 rounded-xl border border-[var(--border)] px-5 py-3 text-sm font-semibold">Next</Link>:<span/>}
          </nav>
        </>
      ) : <div role="status" className="mt-6 rounded-2xl border border-[var(--border)] bg-[var(--card)] p-8 text-center">
        <FileSearch size={30} className="mx-auto text-[var(--gold)]" aria-hidden="true"/>
        <h3 className="mt-4 text-lg font-semibold">No published tenders match your search</h3>
        <p className="mx-auto mt-2 max-w-xl text-sm leading-7 text-[var(--text-soft)]">
          GTH PRO does not display fabricated procurement notices. After authorized official-source ingestion and publication validation, eligible notices will appear here.
        </p>
        <Link href="/tender" className="mt-5 inline-flex min-h-11 items-center gap-2 text-sm font-semibold">Clear filters <ArrowRight size={16}/></Link>
      </div>}
    </section>
    <section id="readiness" className="border-y border-[var(--border)] bg-[var(--card)]/60 px-4 py-12 sm:px-6 md:py-16">
      <div className="mx-auto max-w-7xl">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--gold)]">Bid-readiness guide</p>
        <h2 className="mt-3 text-2xl font-semibold md:text-3xl">Before you respond to a tender</h2>
        <div className="mt-7 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[
            ["Verify the buyer","Check the official issuing authority and latest corrigenda."],
            ["Review eligibility","Confirm prequalification, EMD, securities and local requirements."],
            ["Prepare documents","Gather financial, technical and compliance documents."],
            ["Submit officially","Apply and pay only through the authorised procurement portal."],
          ].map(([title,detail],i)=><article key={title} className="rounded-2xl border border-[var(--border)] bg-[var(--bg)] p-5">
            <span className="text-xs font-bold text-[var(--gold)]">0{i+1}</span>
            <h3 className="mt-3 font-semibold">{title}</h3><p className="mt-2 text-sm leading-7 text-[var(--text-soft)]">{detail}</p>
          </article>)}
        </div>
      </div>
    </section>
    <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6 md:py-16">
      <h2 className="text-2xl font-semibold">Go to the official procurement source</h2>
      <p className="mt-3 max-w-3xl text-sm leading-7 text-[var(--text-soft)]">These are independent official portals, not GTH PRO inventory. Check the issuing authority’s terms and eligibility.</p>
      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {sources.map(s=><a key={s.url} href={safeTenderSource(s.url) || "#"} target="_blank" rel="noopener noreferrer nofollow" className="flex min-h-32 flex-col justify-between rounded-2xl border border-[var(--border)] bg-[var(--card)] p-5 hover:border-[var(--gold)]">
          <span className="font-semibold">{s.name}</span><span className="mt-3 text-xs text-[var(--text-soft)]">{s.label}</span>
          <span className="mt-4 inline-flex items-center gap-2 text-sm font-semibold">Visit official portal <ArrowUpRight size={15}/></span>
        </a>)}
      </div>
    </section>
    <nav aria-label="Other GTH PRO pillars" className="mx-auto flex max-w-7xl flex-wrap gap-3 px-4 pb-12 sm:px-6">
      <Link href="/mega-aggregator" className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-[var(--border)] px-5 text-sm"><Globe2 size={16}/> Ecosystem</Link>
      <Link href="/travel" className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-[var(--border)] px-5 text-sm"><Plane size={16}/> Travel</Link>
      <Link href="/real-estate" className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-[var(--border)] px-5 text-sm"><Building2 size={16}/> Real Estate</Link>
    </nav>
  </main>;
}
