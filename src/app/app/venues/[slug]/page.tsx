import Link from "next/link";
import {notFound} from "next/navigation";
import MobileAppHeader from "@/components/mobile/MobileAppHeader";
import MarketplaceVisual from "@/components/mobile/MarketplaceVisual";
import {stadiums} from "@/lib/travel/stadiums";
import {safeHotelHandoff} from "@/lib/travel/stadium-concierge";
export default async function AppVenue({params}:{params:Promise<{slug:string}>}){
 const {slug}=await params;const venue=stadiums.find(v=>v.slug===slug);if(!venue)notFound();
 const media=slug==="melbourne-cricket-ground"?"melbourne":slug==="wankhede-stadium"?"mumbai":"stadiums";
 const plan="/app/packages?"+new URLSearchParams({city:venue.city,country:venue.countryCode})+"#package-builder";
 return <main className="min-h-dvh bg-[var(--bg)] pb-[calc(94px+env(safe-area-inset-bottom))] text-[var(--text)]"><MobileAppHeader/><section className="mx-auto max-w-3xl space-y-4 px-4 pt-4 sm:px-6"><Link href="/app/services/stadiums" className="text-sm underline">All stadium guides</Link><MarketplaceVisual media={media} priority/><h1 className="text-2xl font-bold">{venue.name}</h1><p className="text-sm text-[var(--text-soft)]">{venue.city} · {venue.country}</p><div className="grid gap-3">
 <Link prefetch={false} href={safeHotelHandoff(venue)} className="gth-btn-gold inline-flex min-h-12 items-center justify-center rounded-xl px-4 text-sm font-semibold">Find match-day stays</Link>
 <Link href={plan} prefetch={false} className="gth-btn inline-flex min-h-12 items-center justify-center rounded-xl px-4 text-sm font-semibold">Plan flights, hotels & experiences</Link>
 <Link href={"/stadiums/"+venue.slug} prefetch={false} className="gth-btn inline-flex min-h-12 items-center justify-center rounded-xl px-4 text-sm font-semibold">Open complete venue & ticket guide</Link>
 </div><p className="text-xs leading-6 text-[var(--text-soft)]">Illustrative visual, not an actual hospitality offer. Ticket and hotel availability is confirmed by the selected provider.</p></section></main>;
}
