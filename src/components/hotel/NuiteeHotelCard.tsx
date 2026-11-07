import Link from "next/link";
import {ArrowUpRight,MapPin,Star,ShieldCheck} from "lucide-react";
import HotelPropertyImage from "@/components/hotel/HotelPropertyImage";
import {HOTEL_BOOKING_ORIGIN} from "@/lib/travel/hotel-whitelabel";

type HotelCardData={id:string;name:string;city:string;address:string;photo:string|null;stars:number|null;rating:number|null};

/** Two distinct destinations: GTH editorial information or the exact supplier's hotel detail.
 * All visual styling uses approved GTH design tokens; no vendor iframe/CSS is injected.
 */
export default function NuiteeHotelCard({hotel,market,sandbox}:{hotel:HotelCardData;market:string;sandbox:boolean}){
 const detail="/hotels/featured/"+encodeURIComponent(market)+"/"+encodeURIComponent(hotel.id);
 const provider=new URL("/hotels/"+encodeURIComponent(hotel.id),HOTEL_BOOKING_ORIGIN);
 provider.searchParams.set("language","en");
 provider.searchParams.set("currency","INR");
 return <article className="flex min-w-0 flex-col overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--card)] text-[var(--text)] shadow-sm">
   <Link href={detail} aria-label={"Read hotel information for "+hotel.name}>
     <div className="h-44 overflow-hidden bg-[var(--bg-soft)] sm:h-48">
       <HotelPropertyImage src={hotel.photo} name={hotel.name}
        className="h-full w-full object-cover" placeholderClassName="flex h-full w-full items-center justify-center text-[var(--text-soft)]"/>
     </div>
   </Link>
   <div className="flex flex-1 flex-col gap-2 p-4">
     <p className="text-xs text-[var(--text-soft)]">{hotel.city} · Source: Nuitee</p>
     <h3 className="line-clamp-2 text-base font-semibold"><Link href={detail} className="hover:underline">{hotel.name}</Link></h3>
     <div className="flex flex-wrap gap-3 text-xs text-[var(--text-soft)]">
       {hotel.stars!==null&&<span className="inline-flex items-center gap-1"><Star size={14} className="text-[var(--gold)]" aria-hidden="true"/>{hotel.stars.toFixed(1)} supplier stars</span>}
       {hotel.rating!==null&&<span>Supplier rating {hotel.rating.toFixed(1)}/10</span>}
     </div>
     {hotel.address&&<p className="line-clamp-2 flex items-start gap-1.5 text-xs leading-5 text-[var(--text-soft)]"><MapPin size={14} className="mt-0.5 shrink-0" aria-hidden="true"/>{hotel.address}</p>}
     <p className="mt-auto pt-2 text-xs text-[var(--text-soft)]">
       {sandbox?"Test catalogue: not live availability":"Rates, conditions and availability are confirmed by the provider"}
     </p>
     <div className="grid gap-2 sm:grid-cols-2">
       <Link href={detail} className="gth-btn inline-flex min-h-11 items-center justify-center rounded-xl px-3 text-center text-xs font-semibold">Hotel details</Link>
       <a href={provider.toString()} rel="noopener noreferrer sponsored"
         className="gth-btn-gold inline-flex min-h-11 items-center justify-center gap-1 rounded-xl px-3 text-center text-xs font-semibold">
         View rooms <ArrowUpRight size={14} aria-hidden="true"/>
       </a>
     </div>
     <p className="flex items-center gap-1 text-[11px] text-[var(--text-soft)]"><ShieldCheck size={12} aria-hidden="true"/> Supplier handles bookings and payments</p>
   </div>
 </article>;
}
