import type {Metadata} from "next";
import Link from "next/link";
import {notFound} from "next/navigation";
import {ArrowLeft,ArrowUpRight,BedDouble,MapPin,ShieldCheck} from "lucide-react";
import TravelSectionNav from "@/components/travel/TravelSectionNav";
import HotelPropertyImage from "@/components/hotel/HotelPropertyImage";
import {getHotelEditorialExample,editorialPhotoUrl,editorialPhotoSource} from "@/lib/travel/hotel-editorial-examples";
import {HOTEL_SHOWCASE_INDIA,HOTEL_SHOWCASE_WORLD} from "@/lib/travel/nuitee-hotel-markets";
import {HOTEL_WHITE_LABEL_ENTRY_URL} from "@/lib/travel/hotel-whitelabel";

type Props={params:Promise<{slug:string}>};
export const dynamicParams=false;
export const revalidate=86400;
export function generateStaticParams(){
  return [...HOTEL_SHOWCASE_INDIA,...HOTEL_SHOWCASE_WORLD].map(slug=>({slug}));
}
export async function generateMetadata({params}:Props):Promise<Metadata>{
  const {slug}=await params,example=getHotelEditorialExample(slug);
  if(!example)return {title:"Hotel example unavailable | GTH PRO",robots:{index:false,follow:false}};
  return {title:example.name+" | "+example.city+" Hotel Guide | GTH PRO",description:
    "Read public-source background on "+example.name+" in "+example.city+". Use the existing Nuitee White Label for hotel availability and bookings.",
    robots:{index:false,follow:true}};
}
export default async function EditorialHotelDetail({params}:Props){
  const {slug}=await params,hotel=getHotelEditorialExample(slug);
  if(!hotel)notFound();
  return <main className="min-h-screen bg-[var(--bg)] text-[var(--text)]">
    <section data-travel-hero="true" className="border-b border-[var(--border)] bg-[var(--card)]">
      <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6">
        <Link href="/hotels" className="inline-flex min-h-11 items-center gap-2 text-sm text-[var(--text-soft)]">
          <ArrowLeft size={16} aria-hidden="true"/> Explore hotels
        </Link>
        <p className="mt-5 text-xs font-semibold uppercase tracking-[0.15em] text-[var(--gold)]">
          GTH PRO · Public-reference hotel guide
        </p>
        <h1 className="mt-3 text-3xl font-bold md:text-4xl">{hotel.name}</h1>
        <p className="mt-3 inline-flex items-center gap-2 text-sm text-[var(--text-soft)]">
          <MapPin size={16} aria-hidden="true"/>{hotel.city}, {hotel.country}
        </p>
      </div>
    </section>
    <TravelSectionNav/>
    <article className="mx-auto max-w-5xl px-4 py-8 sm:px-6">
      <div className="overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--card)]">
        {hotel.photo?<HotelPropertyImage src={editorialPhotoUrl(hotel.photo)} name={hotel.name}
          variant="detail" className="h-64 w-full object-cover md:h-96"
          placeholderClassName="flex h-64 flex-col items-center justify-center gap-3 text-[var(--text-soft)] md:h-96"/>:
          <div className="flex h-52 items-center justify-center bg-[var(--bg-soft)] p-5 text-sm text-[var(--text-soft)]">
            Property image pending verified publication rights
          </div>}
      </div>
      {hotel.photo&&<p className="mt-3 text-xs leading-6 text-[var(--text-soft)]">
        Hotel photograph: <a href={editorialPhotoSource(hotel.photo)} className="underline" target="_blank" rel="noopener noreferrer">
          {hotel.photo.author} · Wikimedia Commons
        </a> · <a href={hotel.photo.licenseUrl} className="underline" target="_blank" rel="noopener noreferrer">
          {hotel.photo.license}
        </a>. Photographer and file license govern reuse; no endorsement is implied.
      </p>}
      <section className="mt-8 rounded-2xl border border-[var(--border)] bg-[var(--card)] p-5 sm:p-7">
        <h2 className="text-xl font-semibold">About this hotel</h2>
        <p className="mt-4 text-sm leading-7 text-[var(--text-soft)]">{hotel.description}</p>
        <p className="mt-4 text-sm leading-7 text-[var(--text-soft)]">
          This independently sourced example is provided for destination discovery.
          GTH PRO has not verified room availability, star ratings, current ownership,
          exact supplier hotel identity, amenities or booking rates here. Confirm the property name and address on the provider website.
        </p>
        <div className="mt-6 flex flex-wrap gap-3">
          <a href={HOTEL_WHITE_LABEL_ENTRY_URL}
             className="gth-btn-gold inline-flex min-h-12 items-center justify-center gap-2 rounded-xl px-5 text-sm font-semibold">
            <BedDouble size={18} aria-hidden="true"/> Open Nuitee White Label to book <ArrowUpRight size={16} aria-hidden="true"/>
          </a>
          <Link href="/hotels" className="gth-btn inline-flex min-h-12 items-center rounded-xl px-4 text-sm font-semibold">
            Browse GTH hotel directory
          </Link>
        </div>
        <p className="mt-5 flex items-start gap-2 text-xs leading-6 text-[var(--text-soft)]">
          <ShieldCheck size={16} className="mt-0.5 shrink-0" aria-hidden="true"/>
          Your booking and payment take place on Nuitee's existing White Label. If this exact hotel is not listed there,
          search other available stays. We never fabricate a provider hotel ID.
        </p>
      </section>
    </article>
  </main>;
}
