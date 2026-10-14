import type {Metadata} from "next";
import Link from "next/link";
import {ArrowRight, Building2, Globe2, Plane, ShieldCheck, BriefcaseBusiness, BadgeCheck, Handshake} from "lucide-react";
export const metadata:Metadata={
  title:"Developers, Agents & Travel Partners | GTH PRO",
  description:"Explore how property developers, agents and travel suppliers can introduce verified inventory or request a commercial partnership review with GTH PRO.",
  alternates:{canonical:"/partners"}
};
const pillars=[
 {Icon:Building2,title:"Real Estate Developers",desc:"Introduce properties, developments and approved inventory with evidence for marketplace review.",href:"/real-estate/post-property",action:"Submit a property"},
 {Icon:BadgeCheck,title:"Real Estate Agents",desc:"Request agency onboarding and share your verifiable property listing portfolio.",href:"/partners/apply?type=agent",action:"Agency application"},
 {Icon:Plane,title:"Travel Suppliers",desc:"Hotels, tours, transfers and transportation providers can propose source-backed integrations.",href:"/partners/apply?type=travel_supplier",action:"Supplier application"},
 {Icon:BriefcaseBusiness,title:"Affiliate & B2B Partners",desc:"Introduce a travel affiliate or distribution programme; commercial participation is subject to approval.",href:"/partners/apply?type=affiliate",action:"Partnership enquiry"}
] as const;
export default function PartnersPage(){
  return <main className="min-h-screen bg-[var(--bg)] text-[var(--text)]">
    <section className="border-b border-[var(--border)] bg-[var(--card)]">
      <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 md:py-22">
        <p className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.2em] text-[var(--gold)]"><Globe2 size={16}/> Global Technical Hub · Business ecosystem</p>
        <h1 className="mt-5 max-w-4xl text-4xl font-semibold tracking-tight md:text-5xl">Grow with the GTH PRO ecosystem.</h1>
        <p className="mt-5 max-w-3xl text-sm leading-8 text-[var(--text-soft)] md:text-base">
          A direct entry point for property developers, real-estate agents, travel suppliers and prospective affiliate programmes.
          Introduce genuine services and projects for review—no fabricated partners or automatic publication.
        </p>
        <div className="mt-7 flex flex-wrap gap-3">
          <Link href="/partners/apply" className="gth-btn-gold inline-flex min-h-12 items-center gap-2 rounded-xl px-6 text-sm font-semibold">Request partnership review <ArrowRight size={17}/></Link>
          <Link href="/real-estate/post-property" className="inline-flex min-h-12 items-center rounded-xl border border-[var(--border)] px-6 text-sm font-semibold">Submit property inventory</Link>
        </div>
      </div>
    </section>
    <section className="mx-auto max-w-7xl px-4 py-14 sm:px-6 md:py-20">
      <p className="text-xs font-semibold uppercase tracking-widest text-[var(--gold)]">Who can join the conversation?</p>
      <h2 className="mt-3 text-3xl font-semibold">Business pathways</h2>
      <div className="mt-8 grid gap-4 sm:grid-cols-2">
        {pillars.map(({Icon,title,desc,href,action})=><article key={title} className="flex flex-col rounded-3xl border border-[var(--border)] bg-[var(--card)] p-6">
          <Icon className="text-[var(--gold)]" size={26} aria-hidden="true"/>
          <h3 className="mt-4 text-xl font-semibold">{title}</h3>
          <p className="mt-3 flex-1 text-sm leading-7 text-[var(--text-soft)]">{desc}</p>
          <Link href={href} className="mt-5 inline-flex min-h-11 items-center gap-2 text-sm font-semibold">{action}<ArrowRight size={17}/></Link>
        </article>)}
      </div>
    </section>
    <section className="border-y border-[var(--border)] bg-[var(--card)]/60 px-4 py-12 sm:px-6">
      <div className="mx-auto max-w-7xl">
        <h2 className="text-2xl font-semibold">Commercial and verification standards</h2>
        <p className="mt-4 max-w-4xl text-sm leading-8 text-[var(--text-soft)]">
          GTH PRO may display discovery information and redirect users to authorised supplier websites. Availability, booking and payments
          depend on independent supplier agreements, working APIs and actual inventory. GTH PRO is not claiming an active partnership with IRCTC,
          airlines, hotel chains or other providers unless separately confirmed in writing.
        </p>
        <p className="mt-4 text-sm leading-7 text-[var(--text-soft)]">Learn more about <Link href="/about" className="font-semibold text-[var(--gold)] underline">GTH PRO</Link> and read our <Link href="/affiliate-disclosure" className="font-semibold text-[var(--gold)] underline">affiliate disclosure</Link> before evaluating a commercial relationship.</p>
        <p className="mt-4 inline-flex items-start gap-2 text-sm leading-7 text-[var(--text-soft)]"><ShieldCheck className="mt-1 shrink-0" size={17}/> All submissions and marketing claims remain subject to identity, licence and inventory verification and administrator approval.</p>
      </div>
    </section>

    <section aria-labelledby="publisher-profile" className="mx-auto max-w-7xl px-4 py-14 sm:px-6 md:py-20">
      <p className="text-xs font-semibold uppercase tracking-widest text-[var(--gold)]">Publisher verification</p>
      <h2 id="publisher-profile" className="mt-3 text-3xl font-semibold">GTH PRO business and website profile</h2>
      <p className="mt-4 max-w-4xl text-sm leading-8 text-[var(--text-soft)]">
        Information for commercial partners evaluating the GTH PRO website. This describes the platform's actual
        publishing and discovery activity, not an approved affiliation with any named supplier.
      </p>
      <dl className="mt-8 grid gap-4 sm:grid-cols-2">
        <div className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-6">
          <dt className="text-sm font-semibold">Public platform name</dt>
          <dd className="mt-2 text-sm leading-7 text-[var(--text-soft)]">GTH PRO — Global Technical Hub</dd>
        </div>
        <div className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-6">
          <dt className="text-sm font-semibold">Official business contact</dt>
          <dd className="mt-2 text-sm leading-7"><a className="break-all font-semibold text-[var(--gold)] underline" href="mailto:official.gthpro@gmail.com">official.gthpro@gmail.com</a></dd>
        </div>
        <div className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-6">
          <dt className="text-sm font-semibold">Business model</dt>
          <dd className="mt-2 text-sm leading-7 text-[var(--text-soft)]">Independent discovery, original editorial content and referral to separately authorised suppliers where available. GTH PRO does not issue train or bus tickets or collect supplier booking payments on their behalf.</dd>
        </div>
        <div className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-6">
          <dt className="text-sm font-semibold">Published digital portfolio</dt>
          <dd className="mt-2 text-sm leading-7"><a href="https://gth-pro-portfolio.pages.dev/" target="_blank" rel="noopener noreferrer" className="break-all font-semibold text-[var(--gold)] underline">GTH PRO Portfolio (external website)</a></dd>
        </div>
      </dl>
      <h3 className="mt-10 text-xl font-semibold">Pages for website review</h3>
      <nav aria-label="Publisher verification resources" className="mt-5 flex flex-wrap gap-3 text-sm">
        <Link href="/" className="inline-flex min-h-11 items-center rounded-xl border border-[var(--border)] px-4">Homepage</Link>
        <Link href="/travel" className="inline-flex min-h-11 items-center rounded-xl border border-[var(--border)] px-4">Travel discovery</Link>
        <Link href="/hotels" className="inline-flex min-h-11 items-center rounded-xl border border-[var(--border)] px-4">Hotels</Link>
        <Link href="/blog" className="inline-flex min-h-11 items-center rounded-xl border border-[var(--border)] px-4">Editorial guides</Link>
        <Link href="/about" className="inline-flex min-h-11 items-center rounded-xl border border-[var(--border)] px-4">About</Link>
        <Link href="/contact" className="inline-flex min-h-11 items-center rounded-xl border border-[var(--border)] px-4">Contact</Link>
        <Link href="/privacy-policy" className="inline-flex min-h-11 items-center rounded-xl border border-[var(--border)] px-4">Privacy</Link>
        <Link href="/terms-and-conditions" className="inline-flex min-h-11 items-center rounded-xl border border-[var(--border)] px-4">Terms</Link>
        <Link href="/affiliate-disclosure" className="inline-flex min-h-11 items-center rounded-xl border border-[var(--border)] px-4">Affiliate disclosure</Link>
      </nav>
      <p className="mt-7 text-sm leading-7 text-[var(--text-soft)]">
        Legal identity, beneficial-owner details, registration documents, tax particulars, API credentials and traffic evidence,
        if required by a prospective partner, must be supplied through that partner's authorised and secure onboarding process.
        These details are not published here and no registration number or traffic claim has been invented.
      </p>
    </section>
  </main>;
}
