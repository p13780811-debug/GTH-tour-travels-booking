import type {Metadata} from "next";
import Link from "next/link";
import {Suspense} from "react";
import {notFound} from "next/navigation";
import {ArrowRight,BedDouble,Compass,MapPin,Plane,ShieldCheck} from "lucide-react";
import TravelSectionNav from "@/components/travel/TravelSectionNav";
import {FreeHotelDirectoryCards} from "@/components/hotel/NuiteeHotelOffers";
import JsonLd from "@/components/seo/JsonLd";
import {HOTEL_MARKETS,getHotelMarket,type HotelMarket} from "@/lib/travel/nuitee-hotel-markets";
import {isPublicLaunch,siteUrl} from "@/lib/seo/site";

// Generate each page on first request; cache output for a day to avoid per-visit Vercel work.
export const revalidate=86400;
type Props={params:Promise<{slug:string}>};
export async function generateMetadata({params}:Props):Promise<Metadata>{
 const {slug}=await params,market=getHotelMarket(slug);
 if(!market)return {title:"Hotel destination unavailable | GTH PRO",robots:{index:false}};
 const title=`Hotels in ${market.city} | Location Guide & Hotel Discovery | GTH PRO`;
 const description=`Explore hotel locations in ${market.city}, ${market.country}. ${market.tip} Search rooms on the existing Nuitee White Label search.`.slice(0,280);
 const canonical=siteUrl("/hotels/explore/"+market.slug);
 return {title,description,alternates:{canonical},robots:{index:isPublicLaunch(),follow:true},
   openGraph:{title,description,url:canonical,type:"website"}};
}
function SourceCards({market}:{market:HotelMarket}){
  return <FreeHotelDirectoryCards marketSlug={market.slug} limit={9}/>;
}
export default async function HotelMarketPage({params}:Props){
 const {slug}=await params,market=getHotelMarket(slug);
 if(!market)notFound();
 const canonical=siteUrl("/hotels/explore/"+market.slug);
 const breadcrumb={"@context":"https://schema.org","@type":"BreadcrumbList",itemListElement:[
   {"@type":"ListItem",position:1,name:"Hotels",item:siteUrl("/hotels")},
   {"@type":"ListItem",position:2,name:market.city,item:canonical},
 ]};
 return <main className="min-h-screen bg-[var(--bg)] text-[var(--text)]">
   <JsonLd data={breadcrumb}/>
   <section className="border-b border-[var(--border)] bg-[var(--card)]" data-travel-hero="true">
     <div className="mx-auto max-w-7xl px-4 py-12 text-[var(--text)] sm:px-6 md:py-20">
       <p className="text-xs font-bold uppercase tracking-[0.16em]">GTH PRO · Hotels worldwide</p>
       <h1 className="mt-3 max-w-3xl text-3xl font-bold leading-tight sm:text-5xl">Hotels in {market.city}</h1>
       <p className="mt-4 max-w-2xl text-sm leading-7 sm:text-base">
         Choose an area before choosing a hotel. Read original local travel guidance, view public source-backed hotel directory records, and confirm exact dates and rooms with the booking provider.
       </p>
       <Link href={"/hotels?"+new URLSearchParams({view:"booking",city:market.supplierCity,country:market.countryCode}).toString()} className="gth-btn-gold mt-5 inline-flex min-h-12 items-center gap-2 rounded-xl px-5 text-sm font-semibold">
         <BedDouble size={17} aria-hidden="true"/> Search bookable stays in {market.supplierCity} <ArrowRight size={16} aria-hidden="true"/>
       </Link>
     </div>
   </section>
   <TravelSectionNav/>
   <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
     <nav aria-label="Hotel page breadcrumb" className="mb-6 text-sm text-[var(--text-soft)]">
       <Link href="/hotels" className="underline">Hotels</Link> / {market.city}
     </nav>
     <section aria-labelledby="area-guide-title" className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-5 sm:p-7">
       <h2 id="area-guide-title" className="text-xl font-bold">Choosing where to stay in {market.city}</h2>
       <p className="mt-3 text-sm leading-7 text-[var(--text-soft)]">{market.tip}</p>
       <div className="mt-5 grid gap-3 sm:grid-cols-3">
         {market.areas.map(area=><div key={area} className="flex items-start gap-2 rounded-xl border border-[var(--border)] bg-[var(--bg)] p-4 text-sm leading-6">
           <MapPin size={17} aria-hidden="true" className="mt-1 shrink-0 text-[var(--gold)]"/>{area}
         </div>)}
       </div>
       <p className="mt-4 text-xs leading-6 text-[var(--text-soft)]">
         These are planning areas, not claims that any specific hotel, room, amenity or price is available.
         {market.supplierCity!==market.city?" The public hotel directory search is scoped to "+market.supplierCity+"; it does not include every property across the wider region.":""}
       </p>
     </section>
     <section aria-labelledby="city-supplier-hotel-title" className="mt-10">
       <h2 id="city-supplier-hotel-title" className="text-2xl font-bold">Explore local directory hotels</h2>
       <p className="mb-5 mt-2 max-w-3xl text-sm leading-6 text-[var(--text-soft)]">
         These source-backed hotel directory cards use existing public records, not Nuitee property IDs. Open GTH PRO hotel details to check location, then use the existing Nuitee booking search to find current rooms. Exact hotel matches are not assumed.
       </p>
       <Suspense fallback={<p role="status" className="rounded-xl border border-[var(--border)] p-5 text-sm">Checking available supplier hotel profiles…</p>}>
         <SourceCards market={market}/>
       </Suspense>
     </section>
     <section className="mt-10 rounded-2xl border border-[var(--border)] bg-[var(--card)] p-5 sm:p-7">
       <h2 className="text-xl font-bold">Plan beyond the hotel</h2>
       <p className="mt-2 text-sm leading-6 text-[var(--text-soft)]">Compare the location with your airport, rail or cruise arrival point and confirm local transport options separately.</p>
       <div className="mt-4 flex flex-wrap gap-3">
         <Link className="gth-btn inline-flex min-h-11 items-center gap-2 px-4 text-sm" href="/transfers"><Compass size={16}/> Airport transfers</Link>
         <Link className="gth-btn inline-flex min-h-11 items-center gap-2 px-4 text-sm" href="/flights"><Plane size={16}/> Flights</Link>
         <Link className="gth-btn inline-flex min-h-11 items-center gap-2 px-4 text-sm" href={"/tours?city="+encodeURIComponent(market.supplierCity)}><MapPin size={16}/> Tours</Link>
       </div>
     </section>
     <p className="mt-6 flex items-start gap-2 text-xs leading-6 text-[var(--text-soft)]"><ShieldCheck size={15} className="mt-0.5 shrink-0"/> GTH PRO does not issue a hotel reservation on this page. Confirm current supplier details, booking conditions, total taxes and final price before payment.</p>
     <section className="mt-8">
       <h2 className="text-lg font-semibold">Other hotel destinations</h2>
       <div className="mt-3 flex flex-wrap gap-2">{HOTEL_MARKETS.filter(item=>item.slug!==market.slug).slice(0,8).map(item=>
         <Link key={item.slug} href={"/hotels/explore/"+item.slug} className="inline-flex min-h-10 items-center rounded-xl border border-[var(--border)] bg-[var(--card)] px-3 text-sm">{item.city}</Link>)}
       </div>
     </section>
   </div>
 </main>;
}
