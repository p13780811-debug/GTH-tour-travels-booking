import type { Metadata } from "next";
import Link from "next/link";
import { headers } from "next/headers";
import { notFound } from "next/navigation";
import { ArrowLeft, MapPin, Star } from "lucide-react";
import HotelPropertyImage from "@/components/hotel/HotelPropertyImage";
import { getLiteApiHotel } from "@/lib/travel/liteapi-client";
import { normalizeLiteApiHotel, providerHotelDetail } from "@/lib/travel/liteapi-view-model";
import { verifiedLiteApiCardPhoto } from "@/lib/travel/liteapi-photo-proof";
import { hotelProviderSearchUrl } from "@/lib/travel/hotel-provider-search";
import { enforceRateLimit } from "@/lib/security/rate-limit";

export const dynamic = "force-dynamic";
type Props = {params:Promise<{id:string}>;searchParams:Promise<{photo?:string;proof?:string}>};
export const metadata: Metadata = {
  title:"Provider hotel details | GTH PRO Travel",
  robots:{index:false,follow:true},
};
export default async function LiveHotelDetail({params,searchParams}:Props) {
  const {id}=await params;
  if(!/^[A-Za-z0-9_-]{1,128}$/.test(id))notFound();
  const search=await searchParams;
  let hotel=null;
  try{
    const requestHeaders=await headers();
    await enforceRateLimit(new Request("https://gthproglobal.com/hotels/live/"+id,{headers:requestHeaders}),"hotels");
    hotel=normalizeLiteApiHotel(providerHotelDetail(await getLiteApiHotel(id)));
  }catch{
    return <main className="min-h-screen bg-[var(--bg)] px-4 py-24 text-[var(--text)]"><div className="gth-glass mx-auto max-w-3xl rounded-xl border border-[var(--border)] p-8"><h1 className="text-xl font-bold">Hotel information unavailable</h1><p className="mt-2 text-sm">Please retry your search. No bookings have been created.</p><Link href="/hotels/live" className="gold-text mt-4 inline-block underline">Back to hotel search</Link></div></main>;
  }
  if(!hotel)notFound();
  const cardPhoto=verifiedLiteApiCardPhoto(id,search.photo,search.proof);
  const hero=cardPhoto??hotel.image;
  const gallery=[...new Set([...(hero?[hero]:[]),...hotel.gallery])].slice(0,10);
  const destination=[hotel.name,hotel.city,hotel.country].filter(Boolean).join(", ");
  const searchUrl=hotelProviderSearchUrl(destination);
  return <main className="min-h-screen bg-[var(--bg)] text-[var(--text)]"><div className="mx-auto max-w-6xl space-y-7 px-4 py-8 md:px-6 md:py-14">
    <Link href="/hotels/live" className="inline-flex items-center gap-2 text-sm text-[var(--text-soft)] hover:underline"><ArrowLeft size={17}/> Worldwide hotel search</Link>
    <section className="gth-glass overflow-hidden rounded-3xl border border-[var(--border)]">
      <HotelPropertyImage src={hero} name={hotel.name} variant="detail" className="max-h-[520px] w-full object-cover" placeholderClassName="flex min-h-72 items-center justify-center"/>
      <div className="space-y-4 p-5 md:p-9">
        <span className="gold-text text-xs font-bold uppercase tracking-wider">LiteAPI / Nuitée · Exact provider property</span>
        <h1 className="text-3xl font-bold md:text-5xl">{hotel.name}</h1>
        <p className="flex flex-wrap items-center gap-2 text-sm text-[var(--text-soft)]"><MapPin size={17}/>{[hotel.address,hotel.city,hotel.country].filter(Boolean).join(", ")||"Address not provided"}</p>
        <div className="flex flex-wrap gap-2">{hotel.category&&<span className="rounded-full border border-[var(--border)] px-4 py-2 text-sm">{hotel.category}</span>}
          {hotel.stars!==null&&<span className="inline-flex items-center gap-2 rounded-full border border-[var(--border)] px-4 py-2 text-sm"><Star size={16}/>{hotel.stars} provider stars</span>}</div>
        {hotel.description&&<p className="whitespace-pre-line text-sm leading-7 text-[var(--text-soft)]">{hotel.description}</p>}
        {hotel.amenities.length>0&&<div><h2 className="mb-3 text-xl font-bold">Provider-listed amenities</h2><div className="flex flex-wrap gap-2">{hotel.amenities.map(a=><span key={a} className="rounded-full border border-[var(--border)] bg-[var(--card)] px-3 py-2 text-xs">{a}</span>)}</div></div>}
        <div className="rounded-xl border border-[var(--border)] p-4 text-sm"><strong>Availability not checked.</strong> This provider search is not an exact hotel booking, a confirmed rate or a reservation. Confirm the hotel identity, current rates, taxes and cancellation terms on the booking partner.</div>
        <a href={searchUrl} target="_blank" rel="noopener noreferrer nofollow sponsored" className="gth-btn-gold inline-flex min-h-12 items-center justify-center rounded-xl px-6 font-semibold">Search options with booking partner</a>
      </div>
    </section>
    {gallery.length>1&&<section><h2 className="mb-4 text-xl font-bold">Provider-supplied photographs</h2><div className="grid grid-cols-2 gap-3 md:grid-cols-4">{gallery.slice(1).map((url,i)=><HotelPropertyImage key={url} src={url} name={hotel.name+" image "+(i+2)} className="h-40 w-full rounded-xl object-cover" placeholderClassName="flex h-40 items-center justify-center rounded-xl"/>)}</div></section>}
    <p className="text-xs leading-6 text-[var(--text-soft)]">Source: LiteAPI / Nuitée. Hotel names, amenities and photographs are supplied by the provider. No hotel record or photo from this API was bulk-imported into the GTH PRO database.</p>
  </div></main>;
}
