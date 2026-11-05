import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ArrowRight, Clock3, Compass, Hotel, MapPin, Plane, ShieldCheck } from "lucide-react";
import { airportByCode, airports } from "@/lib/travel/nuiteeAirportDirectory";

type Props = { params: Promise<{ iata: string }> };

export const dynamicParams = false;

export function generateStaticParams() {
  return airports.map(airport => ({ iata: airport.code.toLowerCase() }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { iata } = await params;
  const airport = airportByCode(iata);
  if (!airport) return { title: "Airport not found | GTH PRO", robots: { index: false } };
  return {
    title: `${airport.city} Airport Guide (${airport.code}) | GTH PRO`,
    description: `Explore ${airport.name} (${airport.code}): airport details, local time zone, flight planning and ground transport links on GTH PRO.`,
    alternates: { canonical: `/travel/airports/${airport.code.toLowerCase()}` },
    openGraph: {
      title: `${airport.name} (${airport.code}) Airport Guide | GTH PRO`,
      description: `Airport codes and local time zone for ${airport.name} in ${airport.city}. Continue to flight and ground transfer planning with GTH PRO.`,
      url: `/travel/airports/${airport.code.toLowerCase()}`,
      type: "article",
      images: [{ url: "/images/mega/flights.jpg", alt: "Airport and flight route research with GTH PRO" }],
    },
    twitter: {
      card: "summary_large_image",
      title: `${airport.city} Airport (${airport.code}) | GTH PRO`,
      description: `Plan flights and airport transfers using verified reference information for ${airport.name}.`,
      images: ["/images/mega/flights.jpg"],
    },
  };
}

export default async function AirportGuidePage({ params }: Props) {
  const { iata } = await params;
  const airport = airportByCode(iata);
  if (!airport) notFound();

  const origin = airport.code === "CCU" ? "BOM" : "CCU";
  const otherAirports = airports
    .filter(item => item.code !== airport.code && item.countryCode === airport.countryCode)
    .slice(0, 5);

  return (
    <main className="min-h-screen bg-[var(--bg)] text-[var(--text)]">
      <article>
        <header className="border-b border-[var(--border)] bg-[var(--card)]">
          <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6 md:py-20">
            <Link href="/travel/airports" className="inline-flex items-center gap-2 text-sm text-[var(--text-soft)] underline">
              <ArrowLeft size={16} aria-hidden="true" /> All airports
            </Link>
            <p className="mt-7 text-xs font-semibold uppercase tracking-[0.16em] text-[var(--text-soft)]">GTH PRO · Airport planning guide</p>
            <h1 className="mt-3 max-w-4xl text-4xl font-bold leading-tight md:text-5xl">{airport.name}</h1>
            <p className="mt-4 text-base text-[var(--text-soft)]">{airport.city}, {airport.country} · {airport.code}</p>
            <p className="mt-6 max-w-3xl text-sm leading-7 md:text-base">{airport.description}</p>
            <div className="mt-7 flex flex-wrap gap-3">
              <Link href={`/flights?origin=${origin}&destination=${airport.code}`}
                className="gth-btn-gold inline-flex min-h-11 items-center gap-2 rounded-xl px-5 py-3 text-sm font-bold">
                Explore flights to {airport.code} <ArrowRight size={16} aria-hidden="true" />
              </Link>
              <Link href="/transfers" className="gth-glass inline-flex min-h-11 items-center gap-2 rounded-xl border border-[var(--border)] px-5 py-3 text-sm font-semibold">
                Plan transfers
              </Link>
            </div>
          </div>
        </header>

        <div className="mx-auto grid max-w-6xl gap-9 px-4 py-12 sm:px-6 lg:grid-cols-[minmax(0,1fr)_18rem]">
          <div>
            <section aria-labelledby="airport-info">
              <h2 id="airport-info" className="text-2xl font-bold">Airport reference details</h2>
              <p className="mt-3 text-sm leading-7 text-[var(--text-soft)]">
                Reference information was verified from Nuitee Connect airport metadata on 5 November 2026.
                This page does not make a live fare request, create a booking or guarantee a route is operating.
              </p>
              <dl className="mt-6 grid gap-4 sm:grid-cols-2">
                {[
                  ["IATA code", airport.code],
                  ["ICAO code", airport.icao],
                  ["City", airport.city],
                  ["Country", airport.country],
                  ["Time zone", airport.timezone],
                ].map(([label, value]) => (
                  <div key={label} className="gth-glass min-w-0 rounded-2xl border border-[var(--border)] p-5">
                    <dt className="text-xs font-semibold uppercase tracking-wide text-[var(--text-soft)]">{label}</dt>
                    <dd className="mt-2 break-words text-lg font-semibold">{value}</dd>
                  </div>
                ))}
              </dl>
            </section>

            <section aria-labelledby="plan-journey" className="mt-12">
              <h2 id="plan-journey" className="text-2xl font-bold">Plan your journey through {airport.code}</h2>
              <div className="mt-6 grid gap-4 sm:grid-cols-2">
                {[
                  { title: "Flight dates and fares", text: "Use the flight provider search to confirm available routes, final prices and baggage conditions. Airport reference data is not a flight offer.", href: "/flights", Icon: Plane },
                  { title: "Accommodation", text: "Compare hotels based on arrival time and where you need to stay. Confirm the property location with the provider.", href: "/hotels", Icon: Hotel },
                  { title: "Ground transfer", text: "Check pickup location, meeting instructions, luggage policy and the correct airport code before booking transportation.", href: "/transfers", Icon: MapPin },
                  { title: "Destination activities", text: "Explore tours and attractions, then check availability and terms with the operator or booking partner.", href: "/tours", Icon: Compass },
                ].map(({ title, text, href, Icon }) => (
                  <Link key={href} href={href} className="gth-glass rounded-2xl border border-[var(--border)] p-5">
                    <Icon size={23} aria-hidden="true" /><h3 className="mt-3 text-lg font-bold">{title}</h3>
                    <p className="mt-2 text-sm leading-6 text-[var(--text-soft)]">{text}</p>
                    <span className="gold-text mt-4 inline-flex items-center gap-2 text-sm font-semibold">Open service <ArrowRight size={16} aria-hidden="true" /></span>
                  </Link>
                ))}
              </div>
            </section>

            <section aria-labelledby="airport-faq" className="mt-12">
              <h2 id="airport-faq" className="text-2xl font-bold">Common questions</h2>
              <div className="mt-6 space-y-4">
                <div className="gth-glass rounded-2xl border border-[var(--border)] p-5">
                  <h3 className="font-semibold">What is the airport code for {airport.name}?</h3>
                  <p className="mt-2 text-sm leading-7 text-[var(--text-soft)]">
                    The IATA code is {airport.code} and the ICAO code is {airport.icao}. Always confirm that your ticket uses the airport you intended.
                  </p>
                </div>
                <div className="gth-glass rounded-2xl border border-[var(--border)] p-5">
                  <h3 className="font-semibold">Which time zone should I use for this airport?</h3>
                  <p className="mt-2 text-sm leading-7 text-[var(--text-soft)]">
                    The airport reference lists <strong>{airport.timezone}</strong>. Flight schedules generally show local times for each airport; verify the airline&apos;s current schedule.
                  </p>
                </div>
                <div className="gth-glass rounded-2xl border border-[var(--border)] p-5">
                  <h3 className="font-semibold">Can I book a flight directly from this guide?</h3>
                  <p className="mt-2 text-sm leading-7 text-[var(--text-soft)]">
                    This is a planning page. Use GTH PRO&apos;s existing flight search, select your dates and confirm the total price, availability and booking terms with the provider.
                  </p>
                </div>
              </div>
            </section>
          </div>

          <aside className="space-y-5">
            <div className="gth-glass rounded-2xl border border-[var(--border)] p-5">
              <h2 className="flex items-center gap-2 text-lg font-bold"><Clock3 size={20} aria-hidden="true" /> Check before travelling</h2>
              <ul className="mt-4 space-y-3 text-sm leading-6 text-[var(--text-soft)]">
                <li>Confirm the airport code, terminal and departure time.</li>
                <li>Check baggage, check-in, visa and transit requirements with official sources.</li>
                <li>Allow for travel time between the airport and your accommodation.</li>
                <li>Check any restrictions and final payment conditions with the booking provider.</li>
              </ul>
            </div>
            <div className="gth-glass rounded-2xl border border-[var(--border)] p-5">
              <h2 className="flex items-center gap-2 text-lg font-bold"><ShieldCheck size={20} aria-hidden="true" /> Reference only</h2>
              <p className="mt-3 text-sm leading-6 text-[var(--text-soft)]">
                No live fares or schedules are displayed. Flight availability, provider terms and airport operations can change.
              </p>
            </div>
            {otherAirports.length > 0 && (
              <div className="gth-glass rounded-2xl border border-[var(--border)] p-5">
                <h2 className="text-lg font-bold">Other airports in {airport.country}</h2>
                <div className="mt-4 flex flex-col gap-3">
                  {otherAirports.map(other => (
                    <Link key={other.code} href={`/travel/airports/${other.code.toLowerCase()}`}
                      className="inline-flex items-center justify-between gap-3 text-sm underline">
                      <span>{other.city} ({other.code})</span><ArrowRight size={15} aria-hidden="true" />
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </aside>
        </div>
      </article>
    </main>
  );
}
