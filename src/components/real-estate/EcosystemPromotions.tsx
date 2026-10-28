import Image from "next/image"
import Link from "next/link"
import { ArrowUpRight } from "lucide-react"

/** Our other platforms, separate from property offers and registry research. */
export default function EcosystemPromotions() {
  return <section aria-labelledby="estate-ecosystem-title" className="mt-10">
    <p className="gold-text text-xs font-semibold uppercase tracking-widest">GTH PRO ecosystem · In-house promotion</p>
    <h2 id="estate-ecosystem-title" className="mt-2 text-2xl font-semibold">More ways to explore with GTH PRO</h2>
    <div className="mt-4 grid gap-4 md:grid-cols-2">
      <article className="gth-glass overflow-hidden rounded-2xl">
        <div className="relative aspect-video sm:aspect-[3/1]"><Image src="/images/travel.jpg" alt="GTH PRO travel destination brand visual" fill sizes="(max-width: 768px) 100vw, 50vw" className="object-cover"/></div>
        <div className="p-5"><h3 className="text-xl font-semibold">Plan your next journey</h3><p className="mt-2 text-sm leading-6">Explore destinations, flights, hotel searches, tours and activities through our Travel platform.</p><Link href="/travel" className="gth-btn mt-4 inline-flex min-h-11 items-center gap-2">Explore Travel<ArrowUpRight size={15}/></Link><nav aria-label="Travel shortcuts" className="mt-3 flex flex-wrap gap-4 text-sm"><Link href="/hotels" className="inline-flex min-h-11 items-center underline">Hotels & stays</Link><Link href="/tours" className="inline-flex min-h-11 items-center underline">Tours</Link><Link href="/activities" className="inline-flex min-h-11 items-center underline">Activities</Link></nav></div>
      </article>
      <article className="gth-glass overflow-hidden rounded-2xl">
        <div className="relative aspect-video sm:aspect-[3/1]"><Image src="/images/tender.jpg" alt="GTH PRO tender platform infrastructure brand visual" fill sizes="(max-width: 768px) 100vw, 50vw" className="object-cover"/></div>
        <div className="p-5"><h3 className="text-xl font-semibold">Research tender opportunities</h3><p className="mt-2 text-sm leading-6">Explore public procurement sources and readiness tools on our Tender platform.</p><Link href="/tender" className="gth-btn mt-4 inline-flex min-h-11 items-center gap-2">Explore Tenders<ArrowUpRight size={15}/></Link><p className="mt-4 text-xs leading-6">Read the official notice for current eligibility, deadlines and submission requirements.</p></div>
      </article>
    </div>
  </section>
}
