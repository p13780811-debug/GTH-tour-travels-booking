import Image from "next/image";
import Link from "next/link";
import { ArrowRight, ArrowUpRight, BookOpen, Compass, Hotel, Plane, ShieldCheck } from "lucide-react";

type Partner = { name: string; url: string; description: string };
type Props = {
  eyebrow: string;
  title: string;
  description: string;
  image: string;
  whatToCheck: string[];
  partners?: Partner[];
  noLiveDataNotice?: string;
};

export default function TravelServicePage({
  eyebrow,
  title,
  description,
  image,
  whatToCheck,
  partners = [],
  noLiveDataNotice,
}: Props) {
  const travelLinks = [
    { name: "Flights", href: "/flights", Icon: Plane },
    { name: "Hotels", href: "/hotels", Icon: Hotel },
    { name: "Tours & Activities", href: "/activities", Icon: Compass },
    { name: "Travel guides", href: "/guides", Icon: BookOpen },
  ];

  return (
    <main className="min-h-screen bg-[var(--bg)] text-[var(--text)]">
      <section className="relative isolate overflow-hidden border-b border-[var(--border)]">
        <Image src={image} alt="" fill priority sizes="100vw" className="absolute inset-0 -z-20 object-cover opacity-25" />
        <div className="absolute inset-0 -z-10 bg-[var(--bg)]/75" />
        <div className="mx-auto max-w-7xl px-4 py-16 md:px-6 md:py-24">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--text-soft)]">{eyebrow}</p>
          <h1 className="mt-4 max-w-4xl text-4xl font-bold leading-tight md:text-6xl">{title}</h1>
          <p className="mt-5 max-w-3xl text-sm leading-7 text-[var(--text-soft)] md:text-base">{description}</p>
          {noLiveDataNotice && (
            <p role="status" className="gth-glass mt-6 max-w-3xl rounded-2xl border border-[var(--border)] p-5 text-sm leading-6">
              {noLiveDataNotice}
            </p>
          )}
        </div>
      </section>

      <div className="mx-auto grid max-w-7xl grid-cols-1 gap-8 px-4 py-12 md:px-6 lg:grid-cols-[minmax(0,1fr)_310px]">
        <section>
          <h2 className="text-2xl font-bold">What to check before booking</h2>
          <ul className="mt-5 space-y-3">
            {whatToCheck.map((item) => (
              <li key={item} className="gth-glass flex items-start gap-3 rounded-xl border border-[var(--border)] p-4 text-sm leading-6">
                <ShieldCheck size={18} className="mt-1 shrink-0" aria-hidden="true" />
                <span>{item}</span>
              </li>
            ))}
          </ul>
          <h2 className="mt-12 text-2xl font-bold">Booking & provider information</h2>
          <p className="mt-3 max-w-3xl text-sm leading-7 text-[var(--text-soft)]">
            GTH PRO is a discovery and referral website for these services. It does not confirm
            transport seats, issue tickets, process partner payments or provide insurance coverage.
            Partner eligibility, pricing, availability, booking support and refunds must be confirmed
            on the provider's own site.
          </p>
          {partners.length ? (
            <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
              {partners.map((partner) => (
                <article key={partner.url} className="gth-glass rounded-2xl border border-[var(--border)] p-5">
                  <h3 className="font-bold">{partner.name}</h3>
                  <p className="mt-2 text-sm leading-6 text-[var(--text-soft)]">{partner.description}</p>
                  <a href={partner.url} target="_blank" rel="noopener noreferrer sponsored"
                    className="gth-btn-gold mt-5 inline-flex min-h-11 items-center gap-2 rounded-xl px-4 py-3 text-sm font-semibold">
                    Open official provider <ArrowUpRight size={16} />
                  </a>
                </article>
              ))}
            </div>
          ) : (
            <div className="gth-glass mt-5 rounded-2xl border border-[var(--border)] p-5 text-sm text-[var(--text-soft)]">
              No verified live supplier connection is configured for this service. We are not displaying artificial seats, prices or availability.
            </div>
          )}
        </section>

        <aside className="self-start lg:sticky lg:top-24">
          <div className="gth-glass rounded-2xl border border-[var(--border)] p-5">
            <h2 className="mb-4 font-bold">Keep planning your trip</h2>
            <nav aria-label="Travel services" className="space-y-2">
              {travelLinks.map(({ name, href, Icon }) => (
                <Link key={href} href={href} className="flex items-center justify-between gap-2 rounded-xl border border-[var(--border)] px-3 py-3 text-sm">
                  <span className="inline-flex items-center gap-2"><Icon size={16} />{name}</span>
                  <ArrowRight size={16} />
                </Link>
              ))}
            </nav>
          </div>
        </aside>
      </div>
    </main>
  );
}
