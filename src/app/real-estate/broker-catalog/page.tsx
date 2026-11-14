import type {Metadata} from "next";
import Link from "next/link";
import BrokerCatalogGenerator from "@/components/real-estate/BrokerCatalogGenerator";
import {catalogSlugs} from "@/lib/real-estate/broker-catalog";
export const metadata:Metadata={title:"Broker QR & Property Mini-Catalog Tool | GTH PRO",description:"Create a printable, local-only QR code for your public GTH PRO property shortlist.",robots:{index:false,follow:true}};
export default async function BrokerCatalogPage({searchParams}:{searchParams:Promise<{projects?:string}>}){
 const params=await searchParams;
 return <main className="min-h-screen bg-[var(--bg)] px-4 py-12 text-[var(--text)]"><div className="mx-auto max-w-4xl">
   <Link href="/real-estate/saved" className="text-sm underline">Back to saved properties</Link>
   <h1 className="mt-5 text-3xl font-bold">Broker & partner QR toolkit</h1>
   <p className="mt-3 mb-7 text-sm leading-7 text-[var(--text-soft)]">Build a lightweight visiting-card QR with links to existing public property records. Nothing is uploaded or stored by this generator.</p>
   <BrokerCatalogGenerator initialSlugs={catalogSlugs(params.projects)}/>
 </div></main>;
}
