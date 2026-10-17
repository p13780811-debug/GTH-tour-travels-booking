import Image from "next/image";
import Link from "next/link";
import {ArrowRight,Globe2,MapPin} from "lucide-react";

export type DestinationCardInfo={
 slug:string;title:string;image:string;description:string;
 location:string;country:string|null;region:string|null;
};
/** Exactly the same card geometry in every rail and every viewport. */
export default function DestinationCard({destination}: {destination:DestinationCardInfo}){
 return <Link href={"/destinations/"+destination.slug}
   className="group flex h-[320px] w-60 shrink-0 snap-start flex-col overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--card)] text-[var(--text)] shadow-sm transition hover:-translate-y-1 hover:shadow-lg focus-visible:outline focus-visible:outline-2 focus-visible:outline-[var(--gold)]">
   <div className="relative h-40 w-full shrink-0 overflow-hidden bg-[var(--bg-soft)]">
    <Image src={destination.image} alt={destination.title+" destination"}
      fill loading="lazy" sizes="240px" className="object-cover transition-transform duration-500 group-hover:scale-105"/>
   </div>
   <div className="flex min-h-0 flex-1 flex-col gap-2 p-4">
    <h3 className="line-clamp-1 text-base font-semibold">{destination.title}</h3>
    <p className="line-clamp-1 flex items-center gap-1 text-xs text-[var(--text-soft)]">
      <MapPin size={14} aria-hidden="true"/>{destination.country||"Country information unavailable"}
    </p>
    <p className="line-clamp-2 text-xs leading-5 text-[var(--text-soft)]">{destination.description}</p>
    <p className="mt-auto inline-flex items-center gap-1 text-xs font-semibold text-[var(--text)]">
      <Globe2 size={14} aria-hidden="true"/> Explore ecosystem <ArrowRight size={14} aria-hidden="true"/>
    </p>
   </div>
 </Link>;
}
