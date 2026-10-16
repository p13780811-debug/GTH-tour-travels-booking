"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight, ArrowUpRight, ShieldCheck } from "lucide-react";
import { flightPartnerPrograms } from "@/lib/flights/partners";

const categories = [
  {
    group: "Flight protection",
    title: "Flight protection",
    tagline: "Insurance & delay claims",
    image: "/images/mega/airhelp.jpg",
  },
  {
    group: "Airport transfers",
    title: "Airport transfers",
    tagline: "Pickup & drop-off services",
    image: "/images/mega/transfers.jpg",
  },
  {
    group: "Car rentals",
    title: "Car rentals",
    tagline: "Self-drive options",
    image: "/images/mega/tripcom.jpg",
  },
  {
    group: "Airport essentials",
    title: "Airport extras",
    tagline: "eSIM & luggage storage",
    image: "/images/cities/singapore.jpg",
  },
  {
    group: "At destination",
    title: "Tours & experiences",
    tagline: "See more after landing",
    image: "/images/mega/tours.jpg",
  },
] as const;

export default function FlightJourneyServices() {
  const [selected, setSelected] = useState<(typeof categories)[number]["group"]>("Airport transfers");
  const activeCategory = categories.find((category) => category.group === selected) ?? categories[1];
  const activeProviders = flightPartnerPrograms.filter((partner) => partner.group === selected);
  return (
    <section id="flight-extras" aria-labelledby="flight-extras-heading" className="mt-10 scroll-mt-24">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-[11px] font-bold uppercase tracking-[0.15em] text-[var(--gold)]">Beyond the flight</p>
          <h2 id="flight-extras-heading" className="mt-1.5">Complete your journey</h2>
          <p className="mt-2 max-w-2xl text-sm text-[var(--text-soft)]">
            Five simple travel categories. Choose a service to see booking partners and the dedicated airport hub.
          </p>
        </div>
        <Link href="/transfers" className="inline-flex min-h-10 items-center gap-2 rounded-xl border border-[var(--border)] bg-[var(--card)] px-4 text-xs font-bold shadow-sm">
          Airport services hub <ArrowRight size={16} aria-hidden="true" />
        </Link>
      </div>

      <nav aria-label="Travel services and extras" className="mt-5 flex snap-x snap-mandatory gap-3 overflow-x-auto bg-transparent pb-3 shadow-none">
        {categories.map((category) => (
          <button type="button" key={category.group} aria-pressed={selected === category.group}
            onClick={() => setSelected(category.group)}
            className={"group flex w-[166px] shrink-0 snap-start flex-col overflow-hidden rounded-2xl border bg-[var(--card)] text-left shadow-sm transition hover:border-[var(--gold)] sm:w-[194px] " + (selected === category.group ? "border-[var(--gold)] ring-1 ring-[var(--gold)]" : "border-[var(--border)]")}>
            <span className="relative block aspect-[16/9] w-full overflow-hidden bg-[var(--bg)]">
              <Image src={category.image} alt="" fill
                sizes="(max-width: 640px) 166px, 194px"
                className="object-cover transition-transform duration-300 group-hover:scale-105" />
            </span>
            <span className="flex min-h-[79px] flex-col px-3 pb-3 pt-2.5">
              <span className="inline-flex items-center justify-between gap-1 text-[13px] font-bold leading-5">
                {category.title} <ArrowUpRight size={15} className="shrink-0" aria-hidden="true" />
              </span>
              <span className="mt-1 text-[11px] leading-4 text-[var(--text-soft)]">{category.tagline}</span>
            </span>
          </button>
        ))}
      </nav>

      <section aria-labelledby="flight-partners-active-heading"
        className="mt-5 rounded-2xl border border-[var(--border)] bg-[var(--card)] p-4 shadow-sm sm:p-5">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h3 id="flight-partners-active-heading">{activeCategory.title}</h3>
            <p className="mt-1 text-xs text-[var(--text-soft)]">
              {activeProviders.length} providers · select a service above to view more options
            </p>
          </div>
          <Link href="/transfers" className="text-xs font-semibold text-[var(--gold)] underline">
            Explore airport hub
          </Link>
        </div>
        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {activeProviders.map((provider) => {
            const body = (
              <>
                <span className="flex items-center justify-between gap-2 text-sm font-semibold">
                  {provider.name}<ArrowUpRight size={15} className="shrink-0" aria-hidden="true" />
                </span>
                <span className="mt-1 text-xs leading-5 text-[var(--text-soft)]">{provider.detail}</span>
                <span className="mt-2 text-[10px] text-[var(--text-soft)]">
                  {provider.external ? "Partner booking website" : "GTH PRO partner tool"}
                </span>
              </>
            );
            const card = "flex min-h-[94px] flex-col rounded-xl border border-[var(--border)] bg-[var(--bg)] p-3 transition hover:border-[var(--gold)]";
            return provider.external ? (
              <a key={provider.slug} href={"/flights/out/" + provider.slug}
                target="_blank" rel="noopener noreferrer sponsored" className={card}>{body}</a>
            ) : (
              <Link key={provider.slug} href={"/flights/out/" + provider.slug} className={card}>{body}</Link>
            );
          })}
        </div>
      </section>
      <p className="mt-4 flex items-start gap-2 text-xs leading-6 text-[var(--text-soft)]">
        <ShieldCheck size={16} className="mt-1 shrink-0" aria-hidden="true" />
        Booking providers operate independently and determine prices, availability and conditions.
        Some referral links may earn GTH PRO a commission.
        <Link href="/affiliate-disclosure" className="font-semibold underline">Affiliate disclosure</Link>
      </p>
    </section>
  );
}
