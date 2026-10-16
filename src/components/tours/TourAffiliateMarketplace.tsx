import Link from "next/link";
import { ArrowUpRight, BookOpen, Compass, Globe2, MapPin, ShieldCheck, Ticket } from "lucide-react";
import TiqetsPartnerWidgets from "./TiqetsPartnerWidgets";

// These five programs were supplied/approved by the GTH PRO Travelpayouts
// publisher. The URLs here are fixed affiliate links, not invented deep links.
const partners = [
  {
    name: "WeGoTrip",
    category: "Audio & self-guided tours",
    description: "Explore audio guides and walking experiences. Languages, locations and ticket terms are controlled by WeGoTrip.",
    href: "https://wegotrip.tpo.lv/ZQjE9yR2",
    Icon: BookOpen,
  },
  {
    name: "Klook",
    category: "Activities & day trips",
    description: "Explore local experiences and activities with Klook. Prices and available dates must be confirmed there.",
    href: "https://klook.tpo.lv/IKb6eSUe",
    Icon: Compass,
  },
  {
    name: "Go City",
    category: "Sightseeing passes",
    description: "Browse multi-attraction city passes and check included attractions, validity and usage rules.",
    href: "https://gocity.tpo.lv/NdfDWRGS",
    Icon: Globe2,
  },
  {
    name: "KKday",
    category: "Day tours & experiences",
    description: "Explore tours, destination activities and selected packages where offered by KKday.",
    href: "https://kkday.tpo.lv/ytfvDLam",
    Icon: MapPin,
  },
] as const;

const categories = [
  { name: "Guided city tours", detail: "Walking tours and local guides", Icon: MapPin },
  { name: "Attractions & tickets", detail: "Landmarks, museums and admission", Icon: Ticket },
  { name: "City passes", detail: "Multi-attraction passes", Icon: Globe2 },
  { name: "Audio tours", detail: "Self-guided and listening experiences", Icon: BookOpen },
  { name: "Day trips & outdoors", detail: "Excursions and nature activities", Icon: Compass },
] as const;

export default function TourAffiliateMarketplace() {
  return (
    <section aria-labelledby="tours-partners-heading" className="mx-auto max-w-7xl px-4 py-12 md:px-6">
      <div className="mb-7">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--gold)]">
          Tours · Tickets · Experiences
        </p>
        <h2 id="tours-partners-heading" className="mt-2 text-2xl font-bold sm:text-3xl">
          Explore tours with international partners
        </h2>
        <p className="mt-3 max-w-3xl text-sm leading-7 text-[var(--text-soft)]">
          Browse publisher-linked booking programs alongside source-backed GTH PRO listings below.
          Our own tour search covers published database records only; opening a partner can offer
          other destinations and experiences not currently indexed in our database.
        </p>
      </div>

      <nav aria-label="Explore experience categories"
        className="flex snap-x snap-mandatory gap-3 overflow-x-auto pb-3 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {categories.map(({ name, detail, Icon }) => (
          <div key={name} className="gth-glass flex w-[min(70vw,190px)] shrink-0 snap-start flex-col rounded-2xl border border-[var(--border)] p-4 sm:w-[190px]">
            <Icon size={22} className="text-[var(--gold)]" aria-hidden="true" />
            <p className="mt-3 text-sm font-semibold">{name}</p>
            <p className="mt-1 text-xs leading-5 text-[var(--text-soft)]">{detail}</p>
          </div>
        ))}
      </nav>

      <div className="mt-8 flex items-center justify-between gap-3">
        <h3 className="text-xl font-semibold">Tour booking partners</h3>
        <Link href="/affiliate-disclosure" className="text-xs text-[var(--text-soft)] underline">
          Affiliate disclosure
        </Link>
      </div>
      <div className="mt-4 flex snap-x snap-mandatory gap-3 overflow-x-auto pb-3 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {partners.map(({ name, category, description, href, Icon }) => (
          <a key={name} href={href} target="_blank" rel="noopener noreferrer sponsored"
            className="gth-glass flex w-[min(80vw,265px)] min-w-0 shrink-0 snap-start flex-col rounded-2xl border border-[var(--border)] p-5 transition-transform hover:-translate-y-0.5 sm:w-[265px]">
            <Icon size={23} className="text-[var(--gold)]" aria-hidden="true" />
            <span className="mt-4 text-lg font-bold">{name}</span>
            <span className="mt-1 text-xs font-semibold uppercase tracking-wide text-[var(--text-soft)]">{category}</span>
            <span className="mt-3 flex-1 text-sm leading-6 text-[var(--text-soft)]">{description}</span>
            <span className="mt-5 inline-flex items-center gap-2 text-sm font-semibold">
              Explore with {name} <ArrowUpRight size={16} aria-hidden="true" />
            </span>
          </a>
        ))}
      </div>

      <TiqetsPartnerWidgets />

      <p className="mt-6 flex items-start gap-2 text-xs leading-6 text-[var(--text-soft)]">
        <ShieldCheck size={17} className="mt-1 shrink-0" aria-hidden="true" />
        All program links and embedded widgets lead to independent suppliers. GTH PRO does not issue tickets,
        reserve provider inventory or guarantee tour availability, pricing, language support or cancellations.
      </p>
    </section>
  );
}
