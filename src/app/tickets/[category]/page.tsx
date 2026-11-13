import type {Metadata} from "next";
import Link from "next/link";
import {notFound} from "next/navigation";
import TravelSectionNav from "@/components/travel/TravelSectionNav";
import {isPublicLaunch,siteUrl} from "@/lib/seo/site";
import {ticketCategories} from "@/lib/travel/worldwide-ticket-sources";
import WorldwideTicketExplorer from "../WorldwideTicketExplorer";

type Props={params:Promise<{category:string}>};
export const generateStaticParams=()=>ticketCategories.map(({slug})=>({category:slug}));
export async function generateMetadata({params}:Props):Promise<Metadata>{
 const {category}=await params;
 const selected=ticketCategories.find(item=>item.slug===category);
 if(!selected)return {title:"Ticket category not found",robots:{index:false}};
 return {
  title:`${selected.label} Tickets Worldwide | GTH PRO`,
  description:`${selected.description} Find relevant official ticket pages, venue guides and independent event sources with GTH PRO.`,
  alternates:{canonical:siteUrl("/tickets/"+selected.slug)},
  robots:{index:isPublicLaunch(),follow:true}
 };
}
export default async function TicketCategoryPage({params}:Props){
 const {category}=await params;
 const selected=ticketCategories.find(item=>item.slug===category);
 if(!selected)notFound();
 return <main className="min-h-screen min-w-0 bg-[var(--bg)] text-[var(--text)]">
   <TravelSectionNav/>
   <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 sm:py-12">
    <nav aria-label="Breadcrumb" className="text-sm text-[var(--text-soft)]"><Link href="/tickets" className="underline">Worldwide tickets</Link> / {selected.label}</nav>
    <header className="gth-glass mt-5 rounded-3xl border border-[var(--border)] p-6 sm:p-8">
      <p className="text-xs font-bold uppercase tracking-widest text-[var(--gold)]">Worldwide ticket categories</p>
      <h1 className="mt-3 text-3xl font-bold sm:text-4xl">{selected.label} tickets</h1>
      <p className="mt-3 max-w-3xl text-sm leading-7 text-[var(--text-soft)]">{selected.description} Discover public event sources worldwide; GTH PRO does not claim live inventory or guaranteed seat availability.</p>
    </header>
    <WorldwideTicketExplorer initialCategory={selected.slug}/>
    <p className="mt-5 text-sm text-[var(--text-soft)]">Explore more: <Link href="/tickets" className="font-semibold underline">All ticket categories</Link> · <Link href="/stadiums" className="font-semibold underline">Stadium guides</Link> · <Link href="/hotels" className="font-semibold underline">Hotels</Link></p>
   </div>
 </main>;
}
