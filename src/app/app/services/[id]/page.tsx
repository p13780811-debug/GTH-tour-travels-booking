import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ArrowUpRight, ExternalLink, ShieldCheck } from "lucide-react";
import { appServiceWebsiteHref } from "@/lib/mobile/universal-search";
import {MarketplaceHero} from "@/components/mobile/LuxuryMarketplace";
import {destinationServicePhoto} from "@/lib/destinations/visual-media";
import MobileAppHeader from "@/components/mobile/MobileAppHeader";
import { mobileWebService, mobileWebServices } from "@/lib/mobile/app-dashboard";

export const metadata: Metadata = {
  title: "App Services | GTH PRO",
  description: "Access GTH PRO services from the installed app with explicit website handoffs.",
  robots: { index: false, follow: false },
};

export function generateStaticParams() {
  return mobileWebServices().map((service) => ({ id: service.id }));
}

export const dynamicParams = false;

const serviceInfo: Record<string, { detail: string; note: string; cta: string }> = {
  contact: {
    detail: "Find the existing GTH PRO contact channels.",
    note: "Use the official contact page for the right service.",
    cta: "Contact GTH PRO",
  },
  "property-search": {
    detail: "Search with property type, bedrooms and budget using the full search tools.",
    note: "Confirm listing details and asking prices with the listing party.",
    cta: "Open advanced property search",
  },
  "property-registry": {
    detail: "Look up source-attributed project registrations by city, project or promoter.",
    note: "Check the original registry for current registration information.",
    cta: "Search project registry",
  },
  "list-property": {
    detail: "Submit an owned or authorized property listing with accurate specifications and photos.",
    note: "Publication follows the existing account, listing and photo review.",
    cta: "Start a property submission",
  },
  "claim-project": {
    detail: "Request a claim as a builder or authorized representative of a registered project.",
    note: "Prepare the project reference and evidence of your authority for review.",
    cta: "Start a project claim",
  },
  "travel-deals": {
    detail: "Browse the existing travel deals collection.",
    note: "Confirm availability and terms with the travel provider.",
    cta: "Browse travel deals",
  },
  activities: {
    detail: "Browse the existing collection of travel activities.",
    note: "Check the current offer and terms with the supplier.",
    cta: "Browse activities",
  },
  transfers: {
    detail: "Compare airport pickup and transfer options using the existing GTH PRO travel service.",
    note: "A provider controls available vehicles, pickup requirements, rates and booking confirmation.",
    cta: "Continue to airport transfers",
  },
  tickets: {
    detail: "Browse GTH PRO worldwide event-ticket source directories for sports, music, theatre and stadiums.",
    note: "This is a curated research directory, not a live ticket inventory. Sellers independently confirm dates, seats, prices and booking conditions.",
    cta: "Explore worldwide tickets",
  },
  stadiums: {
    detail: "Explore stadium calendars, seating sources and selected partner event tickets or venue experiences.",
    note: "The organizer or supplier confirms dates, available seats, included admission and booking terms.",
    cta: "Explore stadium guides",
  },
  cruises: {
    detail: "Explore cruise holidays, harbour sailings and dinner cruises in the GTH PRO cruise collection.",
    note: "The selected cruise booking provider and vessel operator confirm sailing dates, cabin availability, package fares and booking conditions.",
    cta: "Explore cruise options",
  },
  cars: {
    detail: "Explore car rental options for your destination through the existing website tools.",
    note: "Vehicle inventory, licensing rules, taxes and confirmed rental prices come from the provider.",
    cta: "Explore car rentals",
  },
  tours: {
    detail: "Browse guided tours and activities with source-aware descriptions and partner links.",
    note: "A tour is bookable only when an authorized supplier provides an actual matching offer.",
    cta: "Explore tours and activities",
  },
  insurance: {
    detail: "Review travel protection and assistance options before choosing a provider.",
    note: "Coverage, exclusions, eligibility and policy terms are set by the issuing insurer.",
    cta: "Review travel protection",
  },
  esim: {
    detail: "Explore travel connectivity and eSIM options through the existing partner handoff.",
    note: "The partner controls compatibility, data allowances, prices and activation.",
    cta: "Visit eSIM partner",
  },
  "saved-property": {
    detail: "Return to properties you previously shortlisted using the existing property workspace.",
    note: "Your saved listings and sign-in requirements remain within the established Real Estate service.",
    cta: "Open saved properties",
  },
  "property-tools": {
    detail: "Use the existing property planning and finance tools without copying calculations into a second app.",
    note: "Any estimate is indicative; confirm finance eligibility, costs and property facts independently.",
    cta: "Open property tools",
  },
  "broker-catalog": {
    detail: "Generate an offline branded QR for public property research records; disclose your business number only with consent.",
    note: "A self-published collection is not a verified broker endorsement, marketing authorization or live property inventory.",
    cta: "Create broker QR catalog",
  },
  "saved-tenders": {
    detail: "Review tenders saved in your existing GTH PRO Tender workspace.",
    note: "Official procurement notices and eligibility remain controlled by issuing authorities.",
    cta: "Open saved tenders",
  },
  "tender-help": {
    detail: "Find the existing assistance workflow for tender documents and service enquiries.",
    note: "A service enquiry is not a submitted bid, approved qualification or guaranteed award.",
    cta: "Open tender assistance",
  },
};

export default async function AppServiceGateway({
  params, searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { id } = await params;
  const service = mobileWebService(id);
  if (!service) notFound();

  const info = serviceInfo[service.id];
  if (!info) notFound();
  const {q} = await searchParams;
  const websiteHref = appServiceWebsiteHref(service.id, service.href, q);
  const related =
    service.pillar === "property"
      ? { href: "/app/property", label: "Browse property records in app" }
      : service.pillar === "tender"
        ? { href: "/app/tenders", label: "Browse published tenders in app" }
        : service.pillar === "tickets"
          ? { href: "/app/explore", label: "Search other GTH PRO services" }
          : { href: "/app/destinations", label: "Explore destinations in app" };

  return (
    <main className="min-h-dvh min-w-0 overflow-x-clip bg-[var(--bg)] pb-[calc(94px+env(safe-area-inset-bottom))] text-[var(--text)]">
      <MobileAppHeader />
      <MarketplaceHero title="Discover more with GTH PRO" subtitle="Explore the existing specialist tools and booking providers" image={destinationServicePhoto(service.pillar==="property"?"properties":service.pillar==="tender"?"tenders":service.pillar==="tickets"?"tickets":service.id)}/>
      <div className="mx-auto max-w-2xl px-4 pt-4 sm:px-6">
        <Link
          href="/app"
          className="inline-flex min-h-11 items-center gap-2 text-xs font-semibold text-[var(--text-soft)]"
        >
          <ArrowLeft size={16} aria-hidden="true" />
          All app services
        </Link>
        <section className="mt-3 rounded-2xl border border-[var(--border)] bg-[var(--card)] p-5 sm:p-7">
          <p className="text-xs font-semibold uppercase tracking-widest text-[var(--gold)]">
            GTH PRO · {service.pillar === "travel" ? "Travel" : service.pillar === "property" ? "Real Estate" : service.pillar === "tickets" ? "Tickets & Events" : "Tender"}
          </p>
          <h1 className="mt-2 text-2xl font-semibold tracking-tight">{service.label}</h1>
          <p className="mt-4 text-sm leading-7 text-[var(--text-soft)]">
            {info.detail}
          </p>
          <div className="mt-5 rounded-xl border border-[var(--border)] bg-[var(--bg)] p-4">
            <p className="flex items-start gap-2 text-xs leading-6 text-[var(--text-soft)]">
              <ShieldCheck size={17} className="mt-1 shrink-0 text-[var(--gold)]" aria-hidden="true" />
              {info.note}
            </p>
          </div>
          <div className="mt-6 grid gap-3">
            <Link
              href={related.href}
              className="gth-btn-gold inline-flex min-h-12 items-center justify-center gap-2 rounded-xl px-4 text-sm font-semibold"
            >
              {related.label} <ArrowUpRight size={16} aria-hidden="true" />
            </Link>
            <a
              href={websiteHref}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl border border-[var(--border)] px-4 text-center text-sm font-semibold"
            >
              {info.cta} on GTH PRO website <ExternalLink size={16} aria-hidden="true" />
            </a>
          </div>
          <p className="mt-4 text-xs leading-6 text-[var(--text-soft)]">
            The website link opens separately, so you can return to this app screen.
          </p>
        </section>
      </div>
    </main>
  );
}
