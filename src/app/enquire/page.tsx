import type {Metadata} from "next";
import Link from "next/link";
import IntelligenceLeadForm from "@/components/intelligence/IntelligenceLeadForm";
import {plainText} from "@/lib/intelligence/contracts";
export const metadata:Metadata={title:"Send your requirement | GTH PRO",robots:{index:false,follow:true}};
const TOPICS={property_research:"Property research & buyer requirements",tender_support:"Tender research & preparation",group_stay:"Group stays & travel requirements"} as const;
export default async function EnquiryPage({searchParams}:{searchParams:Promise<Record<string,string|string[]|undefined>>}){
 const query=await searchParams;
 const topic=typeof query.topic==="string"&&Object.hasOwn(TOPICS,query.topic)?query.topic as keyof typeof TOPICS:"property_research";
 const country=typeof query.country==="string"&&/^[A-Z]{2}$/.test(query.country)?query.country:"";
 return <main className="gth-container min-h-screen py-12 text-[var(--text)]"><Link href="/intelligence" className="text-sm underline">GTH Decision Desk</Link>
 <section className="gth-glass mx-auto mt-6 max-w-3xl rounded-2xl border border-[var(--border)] p-5 sm:p-8"><p className="gth-badge-gold text-xs">Private GTH enquiries</p><h1 className="mt-4 text-3xl font-semibold">Tell us what you need</h1>
 <p className="mt-4 text-sm leading-7 text-[var(--text-soft)]">Send a requirement without choosing a listed property or sharing a WhatsApp number. Registry records are research material; a sale offer needs an authorised owner or agent. Travel prices and availability are confirmed by the booking provider.</p>
 <nav aria-label="Enquiry topic" className="my-5 flex flex-wrap gap-3">{Object.entries(TOPICS).map(([key,title])=><Link key={key} href={"/enquire?topic="+key} aria-current={topic===key?"page":undefined} className="gth-btn min-h-11 aria-[current=page]:underline">{title}</Link>)}</nav>
 <h2 className="text-xl font-semibold">{TOPICS[topic]}</h2><IntelligenceLeadForm key={topic} kind="requirement" topic={topic} city={plainText(query.city,100)} country={country}/>
 <p className="mt-5 text-xs leading-6 text-[var(--text-soft)]">Saving a request does not confirm a supplier, agent, property offer or booking.</p></section></main>;
}
