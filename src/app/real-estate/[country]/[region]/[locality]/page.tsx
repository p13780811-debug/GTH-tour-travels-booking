import Link from "next/link";
import type {Metadata} from "next";
import {notFound} from "next/navigation";
import {cache} from "react";
import JsonLd from "@/components/seo/JsonLd";
import {isPublicLaunch,siteUrl} from "@/lib/seo/site";
import {readMicroSnapshot,readMicroDirectory,type MicroSnapshot} from "@/lib/real-estate/micro-market";

export const revalidate=21600;
export const dynamicParams=true;
export async function generateStaticParams(){return [];}
type Params={country:string;region:string;locality:string};
type PageProps={params:Promise<Params>};
const getSnapshot=cache(async(p:Params)=>readMicroSnapshot(p.country,p.region,p.locality));

function titleFor(s:MicroSnapshot){
  return s.place.localityName+" property records, nearby stays & tenders | GTH PRO";
}
function descriptionFor(s:MicroSnapshot){
  return "Research source-attributed project records for "+s.place.localityName+
    ", "+s.place.regionName+", "+s.place.countryName+
    ". Explore geocoded OSM hotel directory records and publicly verified regional procurement notices where available. Confirm official details.";
}
export async function generateMetadata({params}:PageProps):Promise<Metadata>{
  const s=await getSnapshot(await params);
  if(!s)return {title:"Micro-market unavailable | GTH PRO",robots:{index:false,follow:true}};
  const canonical=siteUrl(s.place.path);
  return {
    title:titleFor(s),description:descriptionFor(s),
    alternates:{canonical},
    robots:{index:isPublicLaunch()&&s.indexable,follow:true},
    openGraph:{title:titleFor(s),description:descriptionFor(s),url:canonical,
      siteName:"GTH PRO Global",type:"website"},
  };
}
export default async function MicroLocalityPage({params}:PageProps){
  const s=await getSnapshot(await params);
  if(!s)notFound();
  const p=s.place;
  const canonical=siteUrl(p.path);
  const regionPath="/real-estate/"+p.countrySlug+"/"+p.regionSlug;
  const related=(await readMicroDirectory(p.countrySlug,p.regionSlug)).filter(item=>item.path!==p.path).slice(0,8);
  const activeTenders=s.tenders.filter(t=>Date.parse(t.deadline)>Date.now());
  const registered=s.projects.filter(project=>project.sourceUrl);
  const jsonld:Record<string,unknown>={
    "@context":"https://schema.org",
    "@graph":[
      {"@type":"CollectionPage","@id":canonical+"#page",url:canonical,name:titleFor(s),
        description:descriptionFor(s),
        about:{"@type":"Place",name:p.localityName,
          address:{"@type":"PostalAddress",addressRegion:p.regionName,addressCountry:p.countryCode}},
        mainEntity:{"@type":"ItemList",itemListElement:registered.map((project,index)=>({
          "@type":"ListItem",position:index+1,name:project.title,
          url:siteUrl("/real-estate/"+encodeURIComponent(project.slug)),
        }))}},
      {"@type":"BreadcrumbList","@id":canonical+"#breadcrumb",itemListElement:[
        {"@type":"ListItem",position:1,name:"Real Estate",item:siteUrl("/real-estate")},
        {"@type":"ListItem",position:2,name:p.regionName,item:siteUrl(regionPath)},
        {"@type":"ListItem",position:3,name:p.localityName,item:canonical},
      ]},
    ],
  };
  return <main className="gth-container min-h-screen pb-28 pt-8 text-[var(--text)]">
    <JsonLd data={jsonld}/>
    <nav aria-label="Micro-market breadcrumbs" className="flex flex-wrap gap-2 text-sm text-[var(--text-soft)]">
      <Link href="/real-estate" className="underline">Real Estate</Link><span>/</span>
      <Link href="/real-estate/markets" className="underline">Markets</Link><span>/</span>
      <Link href={regionPath} className="underline">{p.regionName}</Link><span>/</span>
      <span aria-current="page">{p.localityName}</span>
    </nav>
    <header className="gth-glass mt-6 rounded-3xl border border-[var(--border)] p-6 sm:p-8">
      <p className="gold-text text-xs font-bold uppercase tracking-widest">Source-backed micro-market research</p>
      <h1 className="mt-3 text-3xl font-bold sm:text-4xl">{p.localityName}, {p.regionName}</h1>
      <p className="mt-3 text-sm leading-7 text-[var(--text-soft)]">{p.countryName} · Project records, nearby OSM places and regional tender notices in one research view.</p>
      <p className="mt-3 text-xs text-[var(--text-soft)]">
        Coverage changes as independently sourced records are added. A registration number does not prove current approval, inventory, builder authority or asking price.
      </p>
      {!s.indexable&&<p className="mt-3 text-sm">Local source evidence is not yet sufficient for search indexing. This page does not invent missing projects or stays.</p>}
      {!s.complete&&<p role="status" className="mt-3 text-sm">Some public directories are temporarily unavailable; retry after the next scheduled refresh.</p>}
    </header>
    <div className="mt-7 grid gap-5 lg:grid-cols-3">
      <section className="gth-glass rounded-2xl border border-[var(--border)] p-5 lg:col-span-2" aria-labelledby="local-projects-title">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 id="local-projects-title" className="text-xl font-bold">Local project registry references</h2>
          <Link className="gth-btn" href="/real-estate/registry">Registry directory</Link>
        </div>
        <p className="mt-2 text-xs text-[var(--text-soft)]">Only records explicitly tagged to this exact locality. District-wide projects are not silently relabelled as local.</p>
        {s.projects.length===0?<p className="mt-5 text-sm">No source-attributed project records are currently tagged to {p.localityName}. <Link className="underline" href="/real-estate/post-property#global-registry-onboarding">Submit a missing registration for review</Link>.</p>
        :<ul className="mt-4 divide-y divide-[var(--border)]">
          {s.projects.slice(0,12).map(project=><li key={project.id} className="py-4">
            <h3 className="font-semibold"><Link className="underline underline-offset-2" href={"/real-estate/"+encodeURIComponent(project.slug)}>{project.title}</Link></h3>
            <p className="mt-1 text-sm text-[var(--text-soft)]">Registration: {project.rera_id||"Not recorded"} · {project.developer||"Developer not recorded"}</p>
            {project.sourceUrl?<a className="mt-2 inline-flex text-xs underline" href={project.sourceUrl} target="_blank" rel="noopener noreferrer nofollow">Check official registry reference</a>
            :<p className="mt-1 text-xs text-[var(--text-soft)]">Independent official source not linked; verify before relying on this record.</p>}
          </li>)}
        </ul>}
      </section>
      <section className="gth-glass rounded-2xl border border-[var(--border)] p-5" aria-labelledby="local-hotels-title">
        <h2 id="local-hotels-title" className="text-xl font-bold">OSM hotels within 5 km</h2>
        <p className="mt-2 text-xs text-[var(--text-soft)]">Straight-line radius from the midpoint of source-linked project coordinates, not walking distance, price or bookable availability.</p>
        {s.hotels.length?<ol className="mt-4 space-y-4">{s.hotels.map(h=><li key={h.id} className="text-sm">
          <Link className="font-semibold underline underline-offset-2" href={"/hotels/stay/"+encodeURIComponent(h.id)}>{h.name}</Link>
          <p className="mt-1 text-xs text-[var(--text-soft)]">{h.distanceKm.toFixed(2)} km straight-line · OSM directory record</p>
        </li>)}</ol>:<p className="mt-4 text-sm">No geocoded local hotel matches can be established from the current public data. A 5-km radius is not asserted without a grounded location center.</p>}
        <Link className="gth-btn mt-4 inline-flex" href="/hotels">Search hotels and booking partners</Link>
      </section>
    </div>
    <section className="gth-glass mt-6 rounded-2xl border border-[var(--border)] p-5" aria-labelledby="local-tenders-title">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 id="local-tenders-title" className="text-xl font-bold">Active regional tenders</h2>
        <Link href="/tender" className="gth-btn">Global tender search</Link>
      </div>
      <p className="mt-2 text-xs text-[var(--text-soft)]">These notices are matched to the broader {p.regionName} region, not verified to the exact micro-locality. Check original procurement deadlines.</p>
      {activeTenders.length?<ul className="mt-4 grid gap-3 md:grid-cols-2">{activeTenders.map(t=><li key={t.id} className="rounded-xl border border-[var(--border)] p-4">
        <h3 className="font-semibold"><Link className="underline" href={"/tender/"+encodeURIComponent(t.id)}>{t.title}</Link></h3>
        <p className="mt-2 text-xs text-[var(--text-soft)]">{t.buyer} · Deadline {new Date(t.deadline).toLocaleDateString("en",{timeZone:"UTC"})} UTC</p>
      </li>)}</ul>:<p className="mt-4 text-sm">No currently published, source-verified notices are tagged to this broader region in the public catalog.</p>}
    </section>
    <section className="mt-7" aria-labelledby="more-markets-heading">
      <h2 id="more-markets-heading" className="text-xl font-bold">Explore connected markets</h2>
      <div className="mt-3 flex flex-wrap gap-2">
        <Link href={regionPath} className="gth-btn">{p.regionName} market hub</Link>
        <Link href="/real-estate/markets" className="gth-btn">All micro-markets</Link>
        {related.map(r=><Link key={r.path} href={r.path} className="gth-btn">{r.name}</Link>)}
      </div>
    </section>
  </main>;
}
