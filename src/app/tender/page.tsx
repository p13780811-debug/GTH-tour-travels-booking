import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, ArrowUpRight, Building2, CheckCircle2, ClipboardCheck, FileSearch, Globe2, Plane, ShieldCheck } from "lucide-react";

export const metadata: Metadata = {
  title: "Tender Intelligence & Procurement Research | GTH PRO",
  description: "Explore the planned GTH PRO tender intelligence platform, procurement research and bid-readiness resources. Official tenders remain on issuing authorities' websites.",
  alternates: { canonical: "/tender" },
};

const steps = [
  {title:"Verify the issuing authority",text:"Use the official procurement portal to confirm buyer identity, scope, corrigenda and deadlines."},
  {title:"Assess bidder eligibility",text:"Review qualifications, registration, documentation, EMD and other participation conditions."},
  {title:"Prepare supporting evidence",text:"Organise certificates, financial records, technical documents and response checklists."},
  {title:"Submit on the official portal",text:"Tender submission and payment must happen on the authorised issuing platform, never through this informational page."},
] as const;

export default function TenderGatewayPage() {
  return <main className="min-h-screen bg-[var(--bg)] text-[var(--text)]">
    <section className="relative overflow-hidden border-b border-[var(--border)] bg-[var(--card)] px-4 py-16 sm:px-6 md:py-24">
      <div className="pointer-events-none absolute right-0 top-0 h-72 w-72 rounded-full bg-[var(--gold)]/10 blur-3xl" aria-hidden="true" />
      <div className="relative mx-auto max-w-7xl">
        <p className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.2em] text-[var(--gold)]"><Globe2 size={16} /> GTH PRO · PILLAR 03</p>
        <h1 className="mt-5 max-w-4xl text-4xl font-semibold tracking-tight sm:text-5xl md:text-6xl">Tender intelligence. A clearer path to opportunity.</h1>
        <p className="mt-6 max-w-3xl text-base leading-8 text-[var(--text-soft)]">Our Tender platform is in development. The vision is to connect procurement research, bid-readiness tools and trustworthy source navigation into one professional workspace.</p>
        <div className="mt-6 inline-flex items-center gap-2 rounded-full border border-[var(--border)] bg-[var(--bg)] px-4 py-2 text-xs font-semibold text-[var(--text-soft)]">
          <ShieldCheck size={16} aria-hidden="true"/> Platform in development · No live tender listings or bidding services yet
        </div>
        <div className="mt-8 flex flex-wrap gap-3">
          <Link href="#readiness" className="gth-btn-gold inline-flex min-h-12 items-center gap-2 rounded-xl px-6 text-sm font-semibold">Explore bid-readiness <ArrowRight size={17}/></Link>
          <Link href="/contact" className="inline-flex min-h-12 items-center gap-2 rounded-xl border border-[var(--border)] bg-[var(--bg)] px-6 text-sm font-semibold">Contact GTH PRO <ArrowUpRight size={16}/></Link>
        </div>
      </div>
    </section>
    <section id="readiness" className="mx-auto max-w-7xl scroll-mt-24 px-4 py-14 sm:px-6 md:py-20">
      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--gold)]">A professional starting point</p>
      <h2 className="mt-3 text-3xl font-semibold">Tender readiness, step by step</h2>
      <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {steps.map((step,i)=><article key={step.title} className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-6">
          <span className="inline-flex h-11 w-11 items-center justify-center rounded-xl border border-[var(--border)] bg-[var(--bg)] text-sm font-semibold text-[var(--gold)]">0{i+1}</span>
          <h3 className="mt-5 text-lg font-semibold">{step.title}</h3>
          <p className="mt-3 text-sm leading-7 text-[var(--text-soft)]">{step.text}</p>
        </article>)}
      </div>
    </section>
    <section className="border-y border-[var(--border)] bg-[var(--card)] px-4 py-14 sm:px-6 md:py-20">
      <div className="mx-auto max-w-7xl">
        <h2 className="text-2xl font-semibold md:text-3xl">Research procurement through official sources</h2>
        <p className="mt-3 max-w-3xl text-sm leading-7 text-[var(--text-soft)]">The following are independent official procurement portals, not GTH PRO inventory. Verify jurisdiction and rules with the responsible authority.</p>
        <div className="mt-7 grid gap-4 sm:grid-cols-3">
          {[
            {name:"Government e-Marketplace (India)",url:"https://gem.gov.in",subtitle:"Indian public procurement"},
            {name:"Central Public Procurement Portal",url:"https://eprocure.gov.in/eprocure/app",subtitle:"Government tender notices"},
            {name:"UN Global Marketplace",url:"https://www.ungm.org",subtitle:"United Nations procurement"},
          ].map(item=><a key={item.url} href={item.url} target="_blank" rel="nofollow noopener noreferrer" className="flex min-h-36 flex-col justify-between gap-3 rounded-2xl border border-[var(--border)] bg-[var(--bg)] p-6 transition-colors hover:border-[var(--gold)]">
            <span className="text-base font-semibold">{item.name}</span><span className="text-xs text-[var(--text-soft)]">{item.subtitle}</span>
            <span className="inline-flex items-center gap-2 text-xs font-semibold text-[var(--gold)]">Official external portal <ArrowUpRight size={15}/></span>
          </a>)}
        </div>
      </div>
    </section>
    <nav aria-label="Other GTH PRO ecosystem pillars" className="mx-auto flex max-w-7xl flex-wrap gap-3 px-4 py-12 sm:px-6">
      <Link href="/mega-aggregator" className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-[var(--border)] px-5 text-sm"><Globe2 size={16}/> Ecosystem home</Link>
      <Link href="/travel" className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-[var(--border)] px-5 text-sm"><Plane size={16}/> Travel</Link>
      <Link href="/real-estate" className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-[var(--border)] px-5 text-sm"><Building2 size={16}/> Real Estate</Link>
    </nav>
  </main>;
}
