import Link from "next/link";
import { ArrowUpRight, CarFront, Compass, Luggage, ShieldCheck, Smartphone } from "lucide-react";
import { flightPartnerPrograms } from "@/lib/flights/partners";

const sections = [
  { group: "Flight protection", title: "Prepare for your flight", Icon: ShieldCheck,
    description: "Claim eligibility and travel protection are assessed by external providers." },
  { group: "Airport transfers", title: "Airport transfers & pickups", Icon: CarFront,
    description: "Open transfer partners or the dedicated airport transfer marketplace." },
  { group: "Car rentals", title: "Car hire after landing", Icon: CarFront,
    description: "Self-drive hire is different from a vehicle-and-driver airport transfer." },
  { group: "Airport essentials", title: "Stay connected, store luggage", Icon: Smartphone,
    description: "Check local coverage, compatibility, storage hours and booking rules." },
  { group: "At destination", title: "Discover tours and attractions", Icon: Compass,
    description: "Activities, tickets, audio walks, city passes and curated day trips." },
] as const;

export default function FlightJourneyServices() {
  return (
    <section aria-labelledby="flight-extras-heading" className="mt-9">
      <div className="mb-5 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.15em] text-[var(--gold)]">Flight to destination</p>
          <h2 id="flight-extras-heading" className="mt-1 text-xl font-bold sm:text-2xl">
            Airport services & travel extras
          </h2>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-[var(--text-soft)]">
            Continue with verified publisher links or relevant GTH PRO partner widgets.
            Each provider has its own geographic coverage, policies and booking requirements.
          </p>
        </div>
        <Link href="/transfers"
          className="gth-glass inline-flex min-h-11 items-center gap-2 rounded-xl border border-[var(--border)] px-4 text-sm font-semibold">
          Airport services hub <ArrowUpRight size={16} aria-hidden="true" />
        </Link>
      </div>
      <nav aria-label="Flight service categories" className="flex snap-x gap-2 overflow-x-auto pb-3">
        {sections.map((section) => (
          <a key={section.group} href={"#flight-" + section.group.toLowerCase().replaceAll(" ", "-")}
            className="gth-glass inline-flex min-h-10 shrink-0 snap-start items-center rounded-full border border-[var(--border)] px-3 text-xs font-semibold">
            {section.title}
          </a>
        ))}
      </nav>
      {sections.map(({ group, title, description, Icon }) => {
        const providers = flightPartnerPrograms.filter((p) => p.group === group);
        return (
          <section id={"flight-" + group.toLowerCase().replaceAll(" ", "-")} key={group} className="mt-7 scroll-mt-24">
            <div className="flex items-center gap-2">
              <Icon size={18} className="text-[var(--gold)]" aria-hidden="true" />
              <h3 className="text-lg font-bold">{title}</h3>
            </div>
            <p className="mt-1 text-xs leading-5 text-[var(--text-soft)]">{description}</p>
            <div role="region" aria-label={group + " partners"} tabIndex={0}
              className="mt-3 flex snap-x snap-mandatory gap-3 overflow-x-auto overscroll-x-contain pb-3">
              {providers.map((provider) => {
                const contents = (
                  <>
                    <span className="flex items-start justify-between gap-2 text-sm font-bold">
                      {provider.name} <ArrowUpRight size={16} className="shrink-0" aria-hidden="true" />
                    </span>
                    <span className="mt-2 text-xs leading-5 text-[var(--text-soft)]">{provider.detail}</span>
                    <span className="mt-auto pt-4 text-[10px] text-[var(--text-soft)]">
                      {provider.external ? "Travelpayouts affiliate partner" : "GTH PRO supplier widget"}
                    </span>
                  </>
                );
                const style = "gth-glass flex w-[min(64vw,190px)] shrink-0 snap-start flex-col rounded-2xl border border-[var(--border)] p-4 transition hover:border-[var(--gold)] sm:w-[198px]";
                return provider.external ? (
                  <a key={provider.slug} href={"/flights/out/" + provider.slug} target="_blank"
                    rel="noopener noreferrer sponsored" className={style}>{contents}</a>
                ) : (
                  <Link key={provider.slug} href={"/flights/out/" + provider.slug}
                    className={style}>{contents}</Link>
                );
              })}
            </div>
          </section>
        );
      })}
      <nav aria-label="Related journeys" className="mt-7 flex flex-wrap gap-3 text-sm">
        <Link href="/hotels" className="underline">Hotels</Link>
        <Link href="/tours" className="underline">Tours</Link>
        <Link href="/cars" className="underline">Car rentals</Link>
        <Link href="/destinations" className="underline">Destinations</Link>
        <Link href="/insurance" className="underline">Travel insurance</Link>
      </nav>
      <p className="mt-6 flex items-start gap-2 text-xs leading-6 text-[var(--text-soft)]">
        <Luggage size={17} className="mt-1 shrink-0" aria-hidden="true" />
        Affiliate disclosure: GTH PRO may earn commissions from qualifying partner bookings.
        It does not dispatch transport, issue tickets or provide insurance coverage.
        <Link href="/affiliate-disclosure" className="underline">Full disclosure</Link>.
      </p>
    </section>
  );
}
