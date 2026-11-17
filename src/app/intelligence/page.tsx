import type { Metadata } from "next";
import Link from "next/link";
import { headers } from "next/headers";
import { Building2, FileSearch, Globe2, Hotel, MapPin, ShieldCheck } from "lucide-react";
import { GTH_MARKETS, gthMarketPath, marketsForCountry } from "@/lib/intelligence/markets";
import { isPublicLaunch } from "@/lib/seo/site";

export const runtime = "edge";
export const dynamic = "force-dynamic";
type Props = { searchParams: Promise<{country?:string|string[]}> };
export async function generateMetadata({ searchParams }:Props):Promise<Metadata>{
  const params=await searchParams;
  const specific=typeof params.country==="string"&&params.country.length>0;
  return { title:"GTH Cross-Sector Decision Desk | Global Markets", description:"Explore source-attributed public works, real estate project registry, mapped stays and attractions through GTH PRO's connected research desks.",alternates:{canonical:"/intelligence"},robots:{index:isPublicLaunch()&&!specific,follow:true} };
}
export default async function IntelligencePage({searchParams}:Props){
  const raw=await searchParams;
  const explicit=typeof raw.country==="string"?raw.country.toUpperCase():"";
  const supported=new Set(GTH_MARKETS.map(x=>x.countryCode));
  const countryHeaders=await headers();
  // Vercel overwrites its own deployment geolocation header. No exact IP or GPS
  // is accessed, stored, tracked or emitted to the client.
  const coarse=process.env.VERCEL==="1"?(countryHeaders.get("x-vercel-ip-country")||"").toUpperCase():"";
  const selected=supported.has(explicit)?explicit:supported.has(coarse)?coarse:"";
  const regional=selected?marketsForCountry(selected):[];
  const suggested=regional.length?regional:GTH_MARKETS.slice(0,4);
  return <main className="min-h-screen bg-[var(--bg)] text-[var(--text)]">
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
      <Link href="/" className="inline-flex min-h-11 items-center gap-2 text-sm font-semibold text-[var(--gold)]"><Globe2 size={17}/> GTH PRO Global</Link>
      <header className="mt-5">
        <p className="text-xs font-semibold uppercase tracking-[.18em] text-[var(--gold)]">Source-backed intelligence · Zero third-party AI calls</p>
        <h1 className="mt-3 text-3xl font-semibold leading-tight sm:text-5xl">Cross-Sector Decision Desk</h1>
        <p className="mt-5 max-w-4xl text-sm leading-7 text-[var(--text-soft)] sm:text-base">
          Research property registry records, active public tender notices, mapped accommodation and stadium experiences together.
          A shared city label is not evidence of an approved project, distance or investment return.
        </p>
      </header>
      <section className="mt-9 rounded-2xl border border-[var(--border)] bg-[var(--card)] p-5 sm:p-7" aria-labelledby="region-heading">
        <h2 id="region-heading" className="flex items-center gap-2 text-lg font-semibold"><MapPin size={18}/> Your regional discovery</h2>
        <p className="mt-2 text-sm text-[var(--text-soft)]">
          {selected?"Suggested based on the selected or approximate country: "+selected+". ":"Global suggestions. "}
          Location is a coarse estimate, not GPS. Select another country any time; no IP address is stored here.
          Currency labels are informational, not converted prices.
        </p>
        <form method="get" action="/intelligence" className="mt-4 flex flex-wrap items-end gap-3">
          <label className="min-w-[180px] flex-1 text-sm font-medium">Region
            <select name="country" defaultValue={selected} className="gth-input mt-2 w-full">
              <option value="">Worldwide</option>
              {[...supported].sort().map(code=><option key={code} value={code}>{GTH_MARKETS.find(x=>x.countryCode===code)?.countryName??code}</option>)}
            </select>
          </label>
          <button type="submit" className="gth-btn gth-btn-gold min-h-11">Apply region</button>
        </form>
        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {suggested.map(m=><Link key={m.slug} href={gthMarketPath(m)} prefetch={false}
            className="flex flex-col rounded-xl border border-[var(--border)] bg-[var(--bg)] p-5 transition hover:border-[var(--gold)]">
            <p className="text-xs font-semibold uppercase tracking-wide text-[var(--gold)]">{m.countryName} · {m.currency}</p>
            <h3 className="mt-2 text-xl font-semibold">{m.city}</h3>
            <p className="mt-3 flex-1 text-sm leading-6 text-[var(--text-soft)]">{m.focus}</p>
            <span className="mt-4 text-sm font-semibold text-[var(--gold)]">Open local intelligence</span>
          </Link>)}
        </div>
      </section>
      <section className="mt-9">
        <h2 className="text-xl font-semibold">Explore every connected market</h2>
        <div className="mt-5 flex flex-wrap gap-3">
          {GTH_MARKETS.map(m=><Link key={m.slug} href={gthMarketPath(m)} prefetch={false} className="gth-btn inline-flex min-h-11 items-center">{m.city} · {m.countryCode}</Link>)}
        </div>
      </section>
      <section className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4" aria-label="Four platform boundaries">
        {[
          {Icon:Building2,title:"Property registry",text:"Not proof of market availability or sale"},
          {Icon:FileSearch,title:"Public works",text:"Verified notices; not project award or investment appreciation"},
          {Icon:Hotel,title:"Worldwide stays",text:"OSM accommodation directory; booking requires supplier confirmation"},
          {Icon:ShieldCheck,title:"Trusted source labels",text:"Missing evidence is shown, never invented"},
        ].map(({Icon,title,text})=><article key={title} className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-5"><Icon size={23} className="text-[var(--gold)]"/><h3 className="mt-3 font-semibold">{title}</h3><p className="mt-2 text-sm text-[var(--text-soft)]">{text}</p></article>)}
      </section>
    </div>
  </main>;
}