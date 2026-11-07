import type {Metadata} from "next";
import Link from "next/link";
import {notFound} from "next/navigation";
import {ArrowLeft,ArrowUpRight,BedDouble,MapPin,ShieldCheck,Star,Plane,Compass} from "lucide-react";
import TravelSectionNav from "@/components/travel/TravelSectionNav";
import HotelPropertyImage from "@/components/hotel/HotelPropertyImage";
import JsonLd from "@/components/seo/JsonLd";
import {getHotelMarket} from "@/lib/travel/nuitee-hotel-markets";
import {getNuiteeMarketFeed,validNuiteeHotelId} from "@/lib/travel/nuitee-hotel-catalog";
import {HOTEL_BOOKING_ORIGIN} from "@/lib/travel/hotel-whitelabel";
import {siteUrl} from "@/lib/seo/site";

// Generate each page on first request; cache output for a day to avoid per-visit Vercel work.
export const revalidate=86400;
type Props={params:Promise<{market:string;id:string}>};
async function resolve(params:Props["params"]){
 const {market:slug,id}=await params;
 const market=getHotelMarket(slug);
 if(!market||!validNuiteeHotelId(id))return null;
 const feed=await getNuiteeMarketFeed(market.slug);
 return {market,feed,hotel:feed.hotels.find(value=>value.id===id)??null,id};
}
export async function generateMetadata({params}:Props):Promise<Metadata>{
 const item=await resolve(params);
 if(!item||!item.hotel)return {title:"Hotel information unavailable | GTH PRO",robots:{index:false,follow:false}};
 const hotel=item.hotel;
 const title=`${hotel.name} in ${item.market.city} | GTH PRO Hotel Discovery`;
 const description=`Find source-attributed information for ${hotel.name} near ${item.market.city}. Compare its location and open the exact Nuitee hotel page to confirm rooms, dates and booking rules.`.slice(0,260);
 const canonical=siteUrl("/hotels/featured/"+item.market.slug+"/"+hotel.id);
 // Hotel detail SEO requires independently reviewed, licensed, original content.
 // Supplier-only excerpts and affiliate buttons are deliberately NOT indexable.
 return {title,description,alternates:{canonical},robots:{index:false,follow:true},
   openGraph:{title,description,url:canonical,type:"website"}};
}
export default async function BrandedHotelDetail({params}:Props){
 const item=await resolve(params);
 if(!item)notFound();
 const {market,feed,hotel}=item;
 const areaHref="/hotels/explore/"+market.slug;
 if(feed.status!=="ready")return <main className="min-h-[55vh] bg-[var(--bg)] text-[var(--text)]">
   <div className="mx-auto max-w-4xl px-4 py-12 sm:px-6">
     <h1 className="text-2xl font-semibold">Hotel information temporarily unavailable</h1>
     <p className="mt-3 text-sm text-[var(--text-soft)]">The independent hotel supplier catalogue could not be checked. No room offer or price is represented.</p>
     <Link href={areaHref} className="mt-5 inline-flex min-h-11 items-center gap-2 underline"><ArrowLeft size={16}/> Back to destination guide</Link>
   </div>
 </main>;
 if(!hotel)notFound();
 const direct=new URL("/hotels/"+encodeURIComponent(hotel.id),HOTEL_BOOKING_ORIGIN);
 direct.searchParams.set("language","en");direct.searchParams.set("currency","INR");
 const canonical=siteUrl("/hotels/featured/"+market.slug+"/"+hotel.id);
 const breadcrumb={"@context":"https://schema.org","@type":"BreadcrumbList",itemListElement:[
   {"@type":"ListItem",position:1,name:"Hotels",item:siteUrl("/hotels")},
   {"@type":"ListItem",position:2,name:market.city,item:siteUrl(areaHref)},
   {"@type":"ListItem",position:3,name:hotel.name,item:canonical}
 ]};
 return <main className="min-h-screen bg-[var(--bg)] text-[var(--text)]">
   <JsonLd data={breadcrumb}/>
   <TravelSectionNav/>
   <article className="mx-auto max-w-5xl px-4 py-10 sm:px-6 md:py-14">
     <nav aria-label="Hotel breadcrumb" className="flex flex-wrap gap-2 text-sm text-[var(--text-soft)]">
       <Link href="/hotels" className="underline">Hotels</Link><span>/</span>
       <Link href={areaHref} className="underline">{market.city}</Link><span>/</span>
       <span>{hotel.name}</span>
     </nav>
     <div className="mt-6 rounded-2xl border border-[var(--border)] bg-[var(--card)] p-5 sm:p-8">
       <header data-travel-hero="true">
         <p className="text-xs font-bold uppercase tracking-[0.15em] text-[var(--gold)]">GTH PRO · Supplier-attributed hotel discovery</p>
         <h1 className="mt-3 text-2xl font-bold sm:text-4xl">{hotel.name}</h1>
         <p className="mt-3 flex items-start gap-2 text-sm text-[var(--text-soft)]"><MapPin size={17} className="mt-0.5 shrink-0"/>{[hotel.address,hotel.city,market.country].filter(Boolean).join(", ")}</p>
         <div className="mt-6 overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--bg)]">
           <HotelPropertyImage src={hotel.photo} name={hotel.name} variant="detail"
             className="h-64 w-full object-cover sm:h-80"
             placeholderClassName="flex h-64 items-center justify-center sm:h-80"/>
         </div>
       </header>
       <div className="mt-5 flex flex-wrap gap-3 text-sm text-[var(--text-soft)]">
         {hotel.stars!==null&&<p className="inline-flex items-center gap-1"><Star size={16} className="text-[var(--gold)]"/>{hotel.stars.toFixed(1)} supplier-reported hotel stars</p>}
         {hotel.rating!==null&&<p>Supplier rating: {hotel.rating.toFixed(1)}/10 (not independently reviewed by GTH PRO)</p>}
       </div>
       <section className="mt-8">
         <h2 className="text-xl font-semibold">Stay details and booking</h2>
         <p className="mt-3 text-sm leading-7 text-[var(--text-soft)]">
           This GTH PRO page identifies the original Nuitee catalogue hotel. Complete room descriptions,
           amenities, date-specific availability, total charges, cancellation conditions and booking are shown by the supplier.
           We do not copy unverified nightly prices or present supplier reviews as our own.
         </p>
         {feed.sandbox&&<p role="note" className="mt-3 rounded-xl border border-[var(--border)] p-3 text-sm text-[var(--text-soft)]">
           Sandbox listing only. This does not represent a live-bookable hotel or confirmed rate.
         </p>}
         <a href={direct.toString()} rel="noopener noreferrer sponsored"
           className="gth-btn-gold mt-5 inline-flex min-h-12 items-center justify-center gap-2 rounded-xl px-5 text-sm font-semibold">
           <BedDouble size={18}/> View this hotel's rooms & details <ArrowUpRight size={17}/>
         </a>
       </section>
       <section className="mt-9 border-t border-[var(--border)] pt-7">
         <h2 className="text-xl font-semibold">Before booking in {market.city}</h2>
         <p className="mt-3 text-sm leading-7 text-[var(--text-soft)]">{market.tip}</p>
         <div className="mt-4 grid gap-3 sm:grid-cols-3">{market.areas.map(area=>
           <div key={area} className="rounded-xl border border-[var(--border)] bg-[var(--bg)] p-4 text-sm leading-6">{area}</div>
         )}</div>
         <p className="mt-4 text-sm leading-6 text-[var(--text-soft)]">
           Check the exact hotel address against your preferred transit stop, then confirm check-in rules, occupancy, inclusions, refund terms and full provider-side price.
         </p>
       </section>
       <section className="mt-8 border-t border-[var(--border)] pt-7">
         <h2 className="text-lg font-semibold">Continue your trip planning</h2>
         <div className="mt-3 flex flex-wrap gap-3">
           <Link href={areaHref} className="gth-btn inline-flex min-h-11 items-center gap-2 px-4 text-sm"><MapPin size={16}/> Other area hotels</Link>
           <Link href="/transfers" className="gth-btn inline-flex min-h-11 items-center gap-2 px-4 text-sm"><Compass size={16}/> Airport transfers</Link>
           <Link href="/flights" className="gth-btn inline-flex min-h-11 items-center gap-2 px-4 text-sm"><Plane size={16}/> Flights</Link>
         </div>
       </section>
       <p className="mt-8 flex items-start gap-2 text-xs leading-6 text-[var(--text-soft)]">
         <ShieldCheck size={16} className="mt-0.5 shrink-0"/> Nuitee is the independent hotel booking provider; GTH PRO does not hold rooms or charge guests on this page.
       </p>
     </div>
   </article>
 </main>;
}
