import type {Metadata} from "next";
import Link from "next/link";
import {ArrowUpRight} from "lucide-react";
import TravelSectionNav from "@/components/travel/TravelSectionNav";
import {isPublicLaunch,siteUrl} from "@/lib/seo/site";
import {ticketCategories} from "@/lib/travel/worldwide-ticket-sources";
import WorldwideTicketExplorer from "./WorldwideTicketExplorer";

export const metadata:Metadata={
 title:"Worldwide Tickets — Sports, Concerts, Theatre & Attractions | GTH PRO",
 description:"Find worldwide sports, music, theatre, museum, theme park and event ticket sources. Explore official boxes, venue guides and independent platforms, even without affiliate offers.",
 alternates:{canonical:siteUrl("/tickets")},
 robots:{index:isPublicLaunch(),follow:true},
};
export default function TicketsPage(){
 return <main className="min-h-screen min-w-0 bg-[var(--bg)] text-[var(--text)]">
  <TravelSectionNav/>
  <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 sm:py-12">
   <header className="gth-glass rounded-3xl border border-[var(--border)] p-6 sm:p-8">
    <p className="text-xs font-bold uppercase tracking-widest text-[var(--gold)]">GTH PRO · global events and admission</p>
    <h1 className="mt-3 text-3xl font-bold sm:text-5xl">Worldwide Ticket Finder</h1>
    <p className="mt-4 max-w-4xl text-sm leading-7 text-[var(--text-soft)]">
     Find the right place to research tickets for sports, concerts, theatre, comedy, festivals, attractions, museums, theme parks and films.
     Affiliate commission is not a condition for being listed. Browse our local guides first, then continue to the relevant organizer or ticket source.
    </p>
   </header>
   <nav aria-label="Ticket categories" className="mt-5 flex flex-wrap gap-2">
    {ticketCategories.map(category=><Link key={category.slug} href={"/tickets/"+category.slug}
      className="gth-btn inline-flex min-h-11 items-center rounded-xl px-4 text-sm font-semibold">{category.label}</Link>)}
   </nav>
   <WorldwideTicketExplorer/>
   <section aria-labelledby="ticket-trip-planning-title" className="gth-glass mt-8 rounded-2xl border border-[var(--border)] p-5 sm:p-7">
    <h2 id="ticket-trip-planning-title" className="text-xl font-bold sm:text-2xl">Plan the entire trip with GTH PRO</h2>
    <p className="mt-2 text-sm leading-6 text-[var(--text-soft)]">Once you confirm an event and venue with the seller, explore related travel services.</p>
    <div className="mt-4 flex flex-wrap gap-3">
     {[{href:"/stadiums",label:"Stadium & venue guides"},{href:"/hotels",label:"Hotels"},{href:"/flights",label:"Flights"},{href:"/transfers",label:"Airport transfers"},{href:"/attractions",label:"Attractions"}].map(item=>
       <Link href={item.href} key={item.href} className="gth-btn inline-flex min-h-11 items-center gap-2 rounded-xl px-4 text-sm font-semibold">{item.label}<ArrowUpRight size={15} aria-hidden="true"/></Link>
     )}
    </div>
   </section>
   <p className="mt-5 text-xs leading-6 text-[var(--text-soft)]">This is an editorial ticket-source directory, not a licensed worldwide ticket inventory or on-site checkout. Some other GTH PRO pages contain affiliate offers; independent links here do not imply provider approval. <Link href="/affiliate-disclosure" className="underline">Affiliate disclosure</Link></p>
  </div>
 </main>;
}
