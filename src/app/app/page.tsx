import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import AppInstall from "@/components/mobile/AppInstall";
import { ArrowUpRight, Building2, BriefcaseBusiness, Compass, FileSearch, Globe2, Hotel, MapPin, Plane, ShieldCheck, Sparkles } from "lucide-react";

export const metadata: Metadata = {
  title: "Mobile App | GTH PRO",
  description: "Installable mobile experience for GTH PRO flights, hotels, properties and tenders.",
  appleWebApp: { capable: true, title: "GTH PRO", statusBarStyle: "default" },
};

const pillars = [
  { title: "Travel", subtitle: "Flights · Hotels · Tours", href: "/travel", image: "/images/travel.jpg",
    Icon: Plane, links: [{name:"Flights",href:"/flights"},{name:"Hotels",href:"/hotels"},{name:"Tours",href:"/tours"}] },
  { title: "Real Estate", subtitle: "Buy · Rent · Discover", href: "/real-estate", image: "/images/real-estate.jpg",
    Icon: Building2, links: [{name:"Properties",href:"/real-estate"},{name:"Saved",href:"/real-estate/saved"},{name:"List property",href:"/real-estate/post-property"}] },
  { title: "Tenders", subtitle: "Discover · Evaluate · Prepare", href: "/tender", image: "/images/tender.jpg",
    Icon: FileSearch, links: [{name:"Opportunities",href:"/tender"},{name:"Tender assistant",href:"/tender/assistant"},{name:"Partners",href:"/partners"}] },
] as const;

export default function MobileAppHome() {
  return (
    <main className="min-h-dvh min-w-0 overflow-x-clip bg-[var(--bg)] pb-6 text-[var(--text)]">
      <div className="mx-auto w-full max-w-6xl px-4 pt-[max(1rem,env(safe-area-inset-top))] sm:px-6">
        <header className="flex min-w-0 items-center justify-between gap-3 border-b border-[var(--border)] pb-4">
          <Link href="/app" className="flex min-w-0 items-center gap-3" aria-label="GTH PRO mobile home">
            <span className="gth-glass flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-[var(--border)]"><Globe2 size={24} className="gold-text" /></span>
            <span className="min-w-0"><strong className="block text-lg leading-tight">GTH PRO</strong><span className="block text-[11px] text-[var(--text-soft)]">Global Technical Hub</span></span>
          </Link>
          <Link href="/mega-aggregator" className="inline-flex min-h-11 items-center gap-1 rounded-xl border border-[var(--border)] px-3 text-xs font-semibold">
            Ecosystem <ArrowUpRight size={14} />
          </Link>
        </header>

        <section className="py-7 sm:py-12" aria-labelledby="app-intro">
          <p className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.16em] text-[var(--text-soft)]"><Sparkles size={14} /> Your mobile ecosystem</p>
          <h1 id="app-intro" className="mt-3 max-w-2xl text-[clamp(1.9rem,8vw,3.4rem)] font-bold leading-[1.12] tracking-tight">One app. Three worlds.</h1>
          <p className="mt-3 max-w-2xl text-sm leading-7 text-[var(--text-soft)] sm:text-base">Discover journeys, properties and global business opportunities. The same GTH PRO account and source-backed services, adapted for your phone.</p>
          <div className="mt-5"><AppInstall /></div>
        </section>

        <nav aria-label="Quick mobile actions" className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {[
            {name:"Search flights",href:"/flights",Icon:Plane},
            {name:"Find hotels",href:"/hotels",Icon:Hotel},
            {name:"Explore homes",href:"/real-estate",Icon:MapPin},
            {name:"Find tenders",href:"/tender",Icon:BriefcaseBusiness},
          ].map(item=><Link key={item.href} href={item.href}
            className="gth-glass flex min-h-24 flex-col justify-between gap-3 rounded-2xl border border-[var(--border)] p-4 transition-transform active:scale-[0.98] focus-visible:outline-2 focus-visible:outline-offset-2">
            <item.Icon className="gold-text" size={23} aria-hidden="true" /><span className="flex items-center justify-between gap-2 text-sm font-semibold">{item.name}<ArrowUpRight size={15} aria-hidden="true"/></span>
          </Link>)}
        </nav>

        <section aria-labelledby="mobile-pillars" className="mt-10 pb-6">
          <div className="flex flex-wrap items-end justify-between gap-2">
            <h2 id="mobile-pillars" className="text-xl font-bold sm:text-2xl">Explore the ecosystem</h2>
            <p className="text-xs text-[var(--text-soft)]">Real services · no demo inventory</p>
          </div>
          <div className="mt-4 grid min-w-0 gap-4 lg:grid-cols-3">
            {pillars.map(pillar=><article key={pillar.title} className="gth-glass min-w-0 overflow-hidden rounded-3xl border border-[var(--border)]">
              <Link href={pillar.href} className="group relative block h-44 overflow-hidden sm:h-52" aria-label={`Explore ${pillar.title}`}>
                <Image src={pillar.image} alt="" fill sizes="(max-width: 1024px) 100vw, 33vw" className="object-cover transition-transform duration-500 group-hover:scale-105" />
                <span className="absolute inset-0 bg-black/45" aria-hidden="true" />
                <span className="absolute bottom-4 left-4 right-4 flex items-end justify-between gap-3 text-white">
                  <span><span className="mb-1 flex items-center gap-2 text-xs font-medium"><pillar.Icon size={16}/>{pillar.subtitle}</span><strong className="text-2xl">{pillar.title}</strong></span>
                  <ArrowUpRight size={20} />
                </span>
              </Link>
              <div className="grid grid-cols-3 gap-2 p-3">
                {pillar.links.map(link=><Link key={link.href} href={link.href} className="flex min-h-12 items-center justify-center rounded-xl border border-[var(--border)] bg-[var(--card)] px-2 text-center text-[11px] font-semibold sm:text-xs">{link.name}</Link>)}
              </div>
            </article>)}
          </div>
        </section>

        <section className="mb-5 mt-4 flex items-start gap-3 rounded-2xl border border-[var(--border)] bg-[var(--card)] p-4 text-xs leading-6 text-[var(--text-soft)]">
          <ShieldCheck size={20} className="mt-1 shrink-0" aria-hidden="true" />
          <p>Flight prices and hotel availability are confirmed by authorized providers. Property and tender records retain their original verification and official-source disclosures. Online connectivity is needed for live data.</p>
        </section>
        <div className="flex flex-wrap gap-4 pb-5 text-xs text-[var(--text-soft)]">
          <Link href="/affiliate-disclosure" className="underline">Affiliate disclosure</Link>
          <Link href="/privacy-policy" className="underline">Privacy</Link>
          <Link href="/terms" className="underline">Terms</Link>
          <Link href="/mega-aggregator" className="underline">Full website</Link>
          <span><Compass size={12} className="mr-1 inline"/>GTH PRO</span>
        </div>
      </div>
    </main>
  );
}
