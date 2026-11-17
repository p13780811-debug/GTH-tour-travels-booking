import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowUpRight, Building2, FileSearch, Globe2, Hotel, MapPin, ShieldCheck, Ticket } from "lucide-react";
import { findGthMarket, GTH_MARKETS } from "@/lib/intelligence/markets";
import { marketIndexable, readMarketDecision } from "@/lib/intelligence/market-decision";
import { isPublicLaunch, siteUrl } from "@/lib/seo/site";
import { stadiums } from "@/lib/travel/stadiums";

type Props = {params:Promise<{market:string}>};
export const revalidate = 3600;
export const dynamicParams = true;
// No 200k build-time page enumeration: only the markets a visitor requests.
export function generateStaticParams(){return [];}
export async function generateMetadata({params}:Props):Promise<Metadata>{
  const slug=(await params).market;
  const market=findGthMarket(slug);
  if(!market)notFound();
  const snapshot=await readMarketDecision(slug);
  const index=Boolean(snapshot && isPublicLaunch() && marketIndexable(snapshot));
  return {
    title:market.headline+" | GTH PRO Decision Desk",
    description:market.focus+". Verified source labels, directory boundaries and cross-sector connections. Check official notices before making decisions.",
    alternates:{canonical:siteUrl("/intelligence/"+slug)},
    robots:{index,follow:true},
  };
}
export default async function MarketDecisionPage({params}:Props){
  const market=findGthMarket((await params).market);
  if(!market)notFound();
  const snapshot=await readMarketDecision(market.slug);
  if(!snapshot)notFound();
  const venues=stadiums.filter(venue=>venue.city.toLowerCase()===market.city.toLowerCase()&&
    venue.countryCode===market.countryCode).slice(0,4);
  const propertyHref="/real-estate?"+new URLSearchParams({city:market.city}).toString();
  const tenderHref="/tender?"+new URLSearchParams({country:market.countryCode,scope:"world"}).toString();
  const hotelHref="/hotels?"+new URLSearchParams({view:"booking",city:market.city,country:market.countryCode}).toString();
  const updated=new Date(snapshot.checkedAt);
  const activePulses=Object.entries(snapshot.pulses).filter(([,pulse])=>pulse.count>0);
  return <main className="min-h-screen bg-[var(--bg)] text-[var(--text)]">
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
      <nav aria-label="Breadcrumb" className="flex flex-wrap items-center gap-2 text-sm text-[var(--text-soft)]">
        <Link href="/" className="underline">GTH PRO</Link><span>/</span>
        <Link href="/intelligence" className="underline">Decision Desk</Link><span>/</span>{market.city}
      </nav>
      <header className="mt-7 rounded-2xl border border-[var(--border)] bg-[var(--card)] p-6 sm:p-9">
        <p className="text-xs font-semibold uppercase tracking-[.15em] text-[var(--gold)]">GTH Source-Aware Decision Platform · {market.countryCode}</p>
        <h1 className="mt-4 max-w-4xl text-3xl font-semibold leading-tight sm:text-4xl">{market.headline}</h1>
        <p className="mt-4 max-w-4xl text-sm leading-7 text-[var(--text-soft)]">{market.focus}. Data shown is source-attributed research, not a supplier booking, official procurement award or property investment recommendation.</p>
        <div className="mt-5 flex flex-wrap gap-3">
          <Link href={propertyHref} className="gth-btn gth-btn-gold inline-flex min-h-11 items-center gap-2"><Building2 size={17}/> Property research</Link>
          <Link href={tenderHref} className="gth-btn inline-flex min-h-11 items-center gap-2"><FileSearch size={17}/> Country tenders</Link>
          <Link href={hotelHref} className="gth-btn inline-flex min-h-11 items-center gap-2"><Hotel size={17}/> Book &amp; Stay</Link>
        </div>
        <p className="mt-5 text-xs leading-6 text-[var(--text-soft)]">Local currency label: {market.currency}. No foreign exchange conversion, invented prices or automatic country-specific supplier inventory. Last public snapshot: {Number.isFinite(updated.getTime())?updated.toISOString().slice(0,16).replace("T"," ")+" UTC":"Unavailable"}.</p>
      </header>
      {snapshot.unavailable.length>0&&<p role="status" className="mt-5 rounded-lg border border-[var(--border)] bg-[var(--card)] p-4 text-sm">Some source lookups are temporarily unavailable: {snapshot.unavailable.join(", ")}. Missing data is not a zero-result or no-project claim.</p>}
      <section aria-labelledby="region-property" className="mt-9">
        <h2 id="region-property" className="flex items-center gap-2 text-2xl font-semibold"><Building2 className="text-[var(--gold)]"/> Property project registry</h2>
        <p className="mt-3 text-sm text-[var(--text-soft)]">Publicly readable project records only. Registry projects are not necessarily purchasable offers. Explicit official references are displayed where recorded.</p>
        {snapshot.properties.length?<div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{snapshot.properties.map(p=><article key={p.id} className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-5">
          <h3 className="font-semibold">{p.title}</h3>
          <p className="mt-2 text-xs text-[var(--text-soft)]">Official reference: {p.projectReference||"Not available"} · {p.city}</p>
          <div className="mt-4 flex flex-wrap gap-2">
            <Link href={"/real-estate/"+p.slug} className="text-sm font-semibold underline">Open recorded project</Link>
            {p.officialSourceUrl&&<a href={p.officialSourceUrl} target="_blank" rel="noopener noreferrer nofollow" className="text-sm underline">Official source <ArrowUpRight size={13} className="inline"/></a>}
          </div>
          {snapshot.pulses[p.id]&&<div className="mt-4 rounded-lg border border-[var(--border)] p-3">
            <p className="text-sm font-semibold text-[var(--gold)]">Infra-Pulse: {snapshot.pulses[p.id].count} published public-works notice(s)</p>
            <p className="mt-2 text-xs text-[var(--text-soft)]">Same recorded administrative area; not proof of nearby distance, project award or appreciation.</p>
            {snapshot.pulses[p.id].notices.slice(0,2).map(n=><Link key={n.id} href={"/tender/"+n.id} className="mt-2 block text-xs underline">{n.title}</Link>)}
          </div>}
        </article>)}</div>:<p className="mt-4 text-sm text-[var(--text-soft)]">No eligible public project records in this bounded city snapshot. Use property search for other locations.</p>}
      </section>
      <section aria-labelledby="region-tenders" className="mt-10">
        <h2 id="region-tenders" className="flex items-center gap-2 text-2xl font-semibold"><FileSearch className="text-[var(--gold)]"/> Active public tender notices</h2>
        <p className="mt-3 text-sm text-[var(--text-soft)]">Only active, published and source-verified notices whose recorded region contains this city name. That text match is not a geospatial match or an approved local project.</p>
        {snapshot.tenders.length?<div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{snapshot.tenders.map(n=><article key={n.id} className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-5">
          <p className="text-xs font-semibold uppercase text-[var(--gold)]">Public notice · {n.region}</p>
          <h3 className="mt-2 font-semibold">{n.title}</h3>
          <p className="mt-2 text-sm text-[var(--text-soft)]">{n.buyer}</p>
          <p className="mt-2 text-xs text-[var(--text-soft)]">Closes: {n.deadlineAt.slice(0,16).replace("T"," ")} UTC</p>
          <Link href={"/tender/"+n.id} className="mt-4 inline-flex text-sm font-semibold underline">Notice &amp; Decision PDF <ArrowUpRight size={15}/></Link>
        </article>)}</div>:<p className="mt-4 text-sm text-[var(--text-soft)]">No currently qualifying notice matched this city label. Country-wide notices may still exist.</p>}
      </section>
      <section aria-labelledby="region-stays" className="mt-10">
        <h2 id="region-stays" className="flex items-center gap-2 text-2xl font-semibold"><Hotel className="text-[var(--gold)]"/> Mapped accommodation and booking handoff</h2>
        <p className="mt-3 text-sm text-[var(--text-soft)]">The source-attributed OSM directory contains places, not confirmed rooms. Booking search uses the existing GTH provider-operated handoff.</p>
        {snapshot.hotelDirectory.length?<div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">{snapshot.hotelDirectory.map((h,i)=><article key={h.url+i} className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-4">
          <h3 className="font-semibold">{h.name}</h3><p className="mt-2 text-sm text-[var(--text-soft)]">{h.city} · {h.type}</p>
          <a href={h.url} target="_blank" rel="noopener noreferrer nofollow" className="mt-3 inline-flex text-sm underline">Map source</a>
        </article>)}</div>:<p className="mt-4 text-sm text-[var(--text-soft)]">No matching mapped accommodation directory entries in this snapshot.</p>}
        <Link href={hotelHref} className="gth-btn gth-btn-gold mt-5 inline-flex min-h-11 items-center gap-2">Search GTH Worldwide Stays <ArrowUpRight size={16}/></Link>
      </section>
      <section aria-labelledby="region-places" className="mt-10 grid gap-7 lg:grid-cols-2">
        <div><h2 id="region-places" className="flex items-center gap-2 text-xl font-semibold"><MapPin className="text-[var(--gold)]"/> Source-mapped attractions</h2>
          <div className="mt-4 space-y-3">{snapshot.attractions.length?snapshot.attractions.map(a=><Link key={a.url} href={a.url} className="block rounded-xl border border-[var(--border)] bg-[var(--card)] p-4">
            <span className="font-semibold">{a.name}</span><span className="mt-1 block text-xs text-[var(--text-soft)]">OSM · {a.category}; check actual venue status</span></Link>):
            <p className="text-sm text-[var(--text-soft)]">No eligible mapped attractions in this snapshot.</p>}</div>
        </div>
        <div><h2 className="flex items-center gap-2 text-xl font-semibold"><Ticket className="text-[var(--gold)]"/> Stadium and venue guides</h2>
          <div className="mt-4 space-y-3">{venues.length?venues.map(v=><Link key={v.slug} href={"/stadiums/"+v.slug} className="block rounded-xl border border-[var(--border)] bg-[var(--card)] p-4">
            <span className="font-semibold">{v.name}</span><span className="mt-1 block text-xs text-[var(--text-soft)]">Guide only · Ticket availability from organizer</span></Link>):
            <p className="text-sm text-[var(--text-soft)]">No curated stadium venue guide matched this city.</p>}</div>
        </div>
      </section>
      <aside className="mt-10 rounded-2xl border border-[var(--border)] bg-[var(--card)] p-6">
        <h2 className="flex items-center gap-2 text-lg font-semibold"><ShieldCheck className="text-[var(--gold)]"/> What the decision layer does not infer</h2>
        <p className="mt-3 text-sm leading-7 text-[var(--text-soft)]">A tender is not an awarded infrastructure contract. A registered project is not a live for-sale listing. An OSM hotel point is not confirmed bookable inventory. Same-city links are not proof of walking distance, legal eligibility or future property value. Always check original official documents and suppliers.</p>
        <Link href="/intelligence" className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-[var(--gold)]"><Globe2 size={16}/> Compare another market</Link>
      </aside>
    </div>
  </main>;
}