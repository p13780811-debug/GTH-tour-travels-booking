import Link from "next/link";
import {ArrowUpRight,BookOpen,Ticket,ShieldCheck} from "lucide-react";
import {ticketBlogGuides} from "@/data/blogTickets";
import {isPublicTicketUrl,ticketCategories,worldwideTicketSources} from "@/lib/travel/worldwide-ticket-sources";
import {ticketDestinations} from "@/lib/travel/stadium-ticket-destinations";

/** Public-source links come exclusively from the curated registry.
 * Neither this component nor the editorial content invents ticket stock, prices or merchant approval.
 */
export default function TicketBlogLinks({slug}:{slug:string}){
 const guide=ticketBlogGuides.find(article=>article.slug===slug);
 if(!guide)return null;
 const providers=worldwideTicketSources.filter(source=>
   (guide.ticketCategory?source.categories.includes(guide.ticketCategory):
     source.region===guide.market||source.region==="Worldwide"||source.region==="Multiple markets")&&
   isPublicTicketUrl(source.url)
 );
 const sports=guide.ticketCategory==="sports"?
   ticketDestinations.filter(source=>source.kind==="official-tickets"&&isPublicTicketUrl(source.url)).slice(0,4):[];
 const relevant=providers.filter(source=>source.region!=="Worldwide"&&source.region!=="Multiple markets")
   .concat(providers.filter(source=>source.region==="Worldwide"||source.region==="Multiple markets")).slice(0,8);
 const further=ticketBlogGuides.filter(article=>article.slug!==slug&&
   (article.ticketCategory===guide.ticketCategory || article.market===guide.market ||
   (guide.market&&article.ticketCategory))).slice(0,6);
 const categories=ticketCategories;
 return <section aria-labelledby="ticket-article-resources" className="mt-9 space-y-6">
  <div className="gth-glass rounded-2xl border border-[var(--border)] p-5 sm:p-7">
   <p className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-[var(--gold)]">
    <Ticket size={16} aria-hidden="true"/> GTH PRO ticket research
   </p>
   <h2 id="ticket-article-resources" className="mt-2 text-xl font-bold sm:text-2xl">Find relevant ticket sources</h2>
   <p className="mt-2 text-sm leading-6 text-[var(--text-soft)]">
    These public destinations are for discovery and checking individual events. A calendar is not a ticket checkout.
    No live seats, prices or seller approval are implied.
   </p>
   <div className="mt-4 grid gap-2 sm:grid-cols-2">
    {relevant.map(source=><a key={source.id} href={source.url} target="_blank" rel="noopener noreferrer"
      className="flex min-h-12 items-center justify-between gap-3 rounded-xl border border-[var(--border)] px-4 py-3 text-sm font-semibold hover:underline">
     <span className="min-w-0">{source.name}<span className="mt-1 block text-xs font-normal text-[var(--text-soft)]">
       {source.kind==="official-box-office"?"Official ticket entry point":source.kind==="official-calendar"?"Official information only":source.kind==="discovery-platform"?"Ticket and attraction discovery":"Independent event-ticket platform"}
      </span></span><ArrowUpRight size={16} className="shrink-0" aria-hidden="true"/>
    </a>)}
    {sports.map(source=><a key={source.id} href={source.url} target="_blank" rel="noopener noreferrer"
      className="flex min-h-12 items-center justify-between gap-3 rounded-xl border border-[var(--border)] px-4 py-3 text-sm font-semibold hover:underline">
      <span>{source.name}<span className="mt-1 block text-xs font-normal text-[var(--text-soft)]">Competition ticket source</span></span>
      <ArrowUpRight size={16} className="shrink-0" aria-hidden="true"/>
    </a>)}
   </div>
   <Link href={guide.ticketCategory?"/tickets/"+guide.ticketCategory:"/tickets"}
     className="gth-btn-gold mt-5 inline-flex min-h-11 items-center rounded-xl px-5 text-sm font-semibold">
     Explore the full ticket directory
   </Link>
  </div>
  <div className="gth-glass rounded-2xl border border-[var(--border)] p-5 sm:p-7">
   <h2 className="flex items-center gap-2 text-lg font-bold"><BookOpen size={18} aria-hidden="true"/> Browse all ticket categories</h2>
   <nav aria-label="All ticket category links" className="mt-4 flex flex-wrap gap-2">
    {categories.map(category=><Link href={"/tickets/"+category.slug} key={category.slug}
      className="gth-btn inline-flex min-h-11 items-center rounded-xl px-3 py-2 text-xs font-semibold">
      {category.label}</Link>)}
   </nav>
   <h3 className="mt-6 text-base font-bold">Related ticket guides</h3>
   <nav aria-label="Related ticket editorial" className="mt-3 grid gap-2">
    {further.map(item=><Link key={item.slug} href={"/blog/"+item.slug}
      className="min-h-10 py-2 text-sm font-semibold underline underline-offset-2">{item.title}</Link>)}
   </nav>
   <h3 className="mt-6 text-base font-bold">Plan your journey</h3>
   <nav aria-label="GTH PRO related services" className="mt-3 flex flex-wrap gap-2">
    {[{href:"/tickets",label:"Worldwide tickets"},{href:"/stadiums",label:"Stadiums"},{href:"/attractions",label:"Attractions"},
    {href:"/activities",label:"Activities"},{href:"/hotels",label:"Hotels"},{href:"/flights",label:"Flights"},
    {href:"/train",label:"Trains"},{href:"/bus",label:"Buses"},{href:"/transfers",label:"Airport transfers"},
    {href:"/blog",label:"All travel guides"},{href:"/affiliate-disclosure",label:"Affiliate disclosure"}].map(item=>
      <Link href={item.href} key={item.href} className="gth-btn inline-flex min-h-11 items-center rounded-xl px-3 py-2 text-xs font-semibold">{item.label}</Link>
    )}
   </nav>
   <p className="mt-5 flex items-start gap-2 text-xs leading-6 text-[var(--text-soft)]">
    <ShieldCheck size={16} className="mt-1 shrink-0" aria-hidden="true"/>
    Booking and payment happen with each actual seller. Confirm the exact event, refund policy, identity requirements and full price there.
   </p>
  </div>
 </section>;
}
