import Link from "next/link";
import type {Metadata} from "next";
import {cache} from "react";
import {notFound} from "next/navigation";
import {isPublicLaunch,siteUrl} from "@/lib/seo/site";
import {parseMicroRegion,readMicroDirectory} from "@/lib/real-estate/micro-market";

export const revalidate=21600;
export const dynamicParams=true;
export async function generateStaticParams(){return [];}
type Params={country:string;region:string};
type PageProps={params:Promise<Params>};
const getRegion=cache(async(p:Params)=>{
  const parsed=parseMicroRegion(p.country,p.region);
  if(!parsed)return null;
  const locations=await readMicroDirectory(parsed.countrySlug,parsed.regionSlug);
  return {place:parsed,locations};
});
export async function generateMetadata({params}:PageProps):Promise<Metadata>{
  const item=await getRegion(await params);
  if(!item)return {title:"Region unavailable | GTH PRO",robots:{index:false,follow:true}};
  const canonical=siteUrl("/real-estate/"+item.place.countrySlug+"/"+item.place.regionSlug);
  const title=item.place.regionName+" property micro-markets | GTH PRO";
  const description="Source-linked micro-location property research in "+item.place.regionName+
    ", "+item.place.countryName+". Local project records, nearby OSM stays and regional tenders where supported by evidence.";
  return {title,description,alternates:{canonical},
    robots:{index:isPublicLaunch()&&item.locations.length>=3,follow:true},
    openGraph:{title,description,url:canonical,siteName:"GTH PRO Global",type:"website"}};
}
export default async function RegionMarketHub({params}:PageProps){
  const data=await getRegion(await params);
  if(!data)notFound();
  const {place,locations}=data;
  return <main className="gth-container min-h-screen pb-28 pt-8 text-[var(--text)]">
    <nav aria-label="Market breadcrumbs" className="flex flex-wrap gap-2 text-sm text-[var(--text-soft)]">
      <Link className="underline" href="/real-estate">Real Estate</Link><span>/</span>
      <Link className="underline" href="/real-estate/markets">Markets</Link><span>/</span>
      <span>{place.regionName}</span>
    </nav>
    <header className="gth-glass mt-6 rounded-3xl p-6 sm:p-8">
      <p className="gold-text text-xs font-bold uppercase tracking-widest">Hyper-local discovery</p>
      <h1 className="mt-3 text-3xl font-bold">{place.regionName}, {place.countryName} micro-markets</h1>
      <p className="mt-3 text-sm leading-7 text-[var(--text-soft)]">Only project records with explicit, officially linked locality fields appear below. Missing micro-market coverage is not filled with unrelated district-wide listings.</p>
    </header>
    <section className="mt-6">
      <h2 className="text-xl font-bold">Recorded localities</h2>
      {locations.length?
        <ul className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">{locations.map(location=><li key={location.path}>
          <Link href={location.path} className="gth-glass block min-h-24 rounded-2xl border border-[var(--border)] p-5 hover:border-[var(--gold)]">
            <strong>{location.name}</strong>
            {location.city&&<p className="mt-1 text-xs text-[var(--text-soft)]">{location.city}</p>}
          </Link>
        </li>)}</ul>
        :<p className="mt-4 text-sm">There are no source-linked micro-locality records ready for this directory yet. Projects can still be researched in the existing registry directory.</p>}
    </section>
    <div className="mt-6 flex flex-wrap gap-3">
      <Link href="/real-estate/registry" className="gth-btn">Explore registry projects</Link>
      <Link href="/real-estate/post-property#global-registry-onboarding" className="gth-btn">Submit a missing project for review</Link>
    </div>
  </main>;
}
