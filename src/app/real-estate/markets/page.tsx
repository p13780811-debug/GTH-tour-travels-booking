import Link from "next/link";
import type {Metadata} from "next";
import {isPublicLaunch,siteUrl} from "@/lib/seo/site";
import {readMicroDirectory} from "@/lib/real-estate/micro-market";

export const revalidate=21600;
const regions=[
  {country:"india",region:"maharashtra",label:"Maharashtra · India"},
  {country:"india",region:"west-bengal",label:"West Bengal · India"},
  {country:"united-arab-emirates",region:"dubai",label:"Dubai · United Arab Emirates"},
] as const;

export const metadata:Metadata={
  title:"Verified-source property micro-market research | GTH PRO",
  description:"Browse region hubs and emerging source-linked property micro-localities with nearby hotel directory and public procurement context.",
  alternates:{canonical:siteUrl("/real-estate/markets")},
  robots:{index:isPublicLaunch(),follow:true},
  openGraph:{title:"GTH PRO Global micro-markets",url:siteUrl("/real-estate/markets"),type:"website"},
};
export default async function MicroMarketsHub(){
  const found=await Promise.all(regions.map(async r=>({
    ...r,items:(await readMicroDirectory(r.country,r.region)).slice(0,10),
  })));
  return <main className="gth-container min-h-screen pb-28 pt-8">
    <nav aria-label="Market breadcrumbs" className="text-sm"><Link className="underline" href="/real-estate">Real Estate</Link> / Markets</nav>
    <header className="gth-glass mt-6 rounded-3xl p-6 sm:p-8">
      <p className="gold-text text-xs font-bold uppercase tracking-widest">Zero-cost location research</p>
      <h1 className="mt-3 text-3xl font-bold sm:text-4xl">Explore source-backed micro-markets</h1>
      <p className="mt-3 max-w-3xl text-sm leading-7 text-[var(--text-soft)]">GTH PRO connects registered project research, nearby OpenStreetMap hotel directory records and region-tagged procurement notices. Each locality page only publishes the specific facts currently supported by public records; a registry entry does not mean a bookable or for-sale unit.</p>
    </header>
    <div className="mt-6 grid gap-5 lg:grid-cols-3">
      {found.map(region=><section key={region.label} className="gth-glass rounded-2xl border border-[var(--border)] p-5">
        <h2 className="text-lg font-bold"><Link className="underline" href={"/real-estate/"+region.country+"/"+region.region}>{region.label}</Link></h2>
        {region.items.length?<ul className="mt-4 space-y-3">{region.items.map(item=><li key={item.path}>
          <Link href={item.path} className="underline underline-offset-2">{item.name}</Link>
        </li>)}</ul>:<p className="mt-3 text-sm text-[var(--text-soft)]">Exact verified-source micro-locality tags are not yet available for this region.</p>}
      </section>)}
    </div>
    <div className="mt-8 flex flex-wrap gap-3">
      <Link href="/real-estate/registry" className="gth-btn">Full registry directory</Link>
      <Link href="/real-estate/post-property#global-registry-onboarding" className="gth-btn">Add a missing registration</Link>
    </div>
  </main>;
}
