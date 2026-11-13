import Link from "next/link";
import {ArrowRight,BookOpen,ShieldCheck} from "lucide-react";
import {ecosystemGuides} from "@/data/blogEcosystem";
import JsonLd from "@/components/seo/JsonLd";
import {siteUrl} from "@/lib/seo/site";

type Pillar="Real Estate"|"Tenders";
export default function PillarGuideIndex({pillar}:{pillar:Pillar}){
 const guides=ecosystemGuides.filter(item=>item.pillar===pillar);
 const property=pillar==="Real Estate";
 const base=property?"/real-estate":"/tender";
 const page=base+"/guides";
 const pathways=property?[
   {href:"/real-estate",label:"Property explorer"},
   {href:"/real-estate/registry",label:"Project registry"},
   {href:"/real-estate/worldwide",label:"Worldwide markets"},
   {href:"/real-estate/market-intelligence",label:"Market evidence"},
   {href:"/real-estate/tools",label:"Property calculators"},
   {href:"/real-estate/post-property",label:"Submit a listing"},
 ]:[
   {href:"/tender",label:"Search procurement notices"},
   {href:"/tender/coverage",label:"Source coverage"},
   {href:"/tender/assistant",label:"Bid preparation assistant"},
   {href:"/tender/services",label:"Optional business assistance"},
 ];
 const structured={
  "@context":"https://schema.org","@type":"CollectionPage",
  name:property?"Real Estate Research Guides":"Tender and Procurement Research Guides",
  url:siteUrl(page),
  inLanguage:"en",
  mainEntity:{"@type":"ItemList",itemListElement:guides.map((g,i)=>({
   "@type":"ListItem",position:i+1,name:g.title,url:siteUrl("/blog/"+g.slug)
  }))}
 };
 return <main className="min-h-screen bg-[var(--bg)] text-[var(--text)]">
  <JsonLd data={structured}/>
  <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
   <nav aria-label="Breadcrumb" className="text-sm">
    <Link href="/" className="underline">GTH PRO</Link> {" / "}
    <Link href={base} className="underline">{pillar}</Link> {" / "} Research guides
   </nav>
   <header className="gth-glass mt-6 rounded-3xl border border-[var(--border)] p-6 sm:p-9">
    <p className="text-xs font-bold uppercase tracking-widest text-[var(--gold)]">GTH PRO · {pillar} knowledge</p>
    <h1 className="mt-3 text-3xl font-bold sm:text-4xl">{property?"Research Property With Better Evidence":"Understand Public Tenders Before You Bid"}</h1>
    <p className="mt-4 max-w-3xl text-sm leading-7 text-[var(--text-soft)]">
     {property?"Original buyer and seller research on RERA records, title checks, pricing, international markets and responsible submissions. A listing does not prove ownership, sale availability or legal title.":
     "Clear procurement guides on eligibility, portal rules, bid security, corrigenda, response documents and international sources. Only the issuing authority sets official submission rules."}
    </p>
    <Link href={base} className="gth-btn-gold mt-6 inline-flex min-h-11 items-center gap-2 rounded-xl px-5 text-sm font-semibold">
     Open {pillar} platform <ArrowRight size={16} aria-hidden="true"/>
    </Link>
   </header>
   <section aria-labelledby="research-guides" className="mt-10">
    <h2 id="research-guides" className="text-2xl font-bold">Practical research articles</h2>
    <p className="mt-2 text-sm text-[var(--text-soft)]">Every article includes current GTH PRO research paths and relevant official source links where documented.</p>
    <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
     {guides.map(g=><Link key={g.slug} href={"/blog/"+g.slug}
       className="gth-glass flex min-h-56 flex-col justify-between rounded-2xl border border-[var(--border)] p-6 transition hover:underline">
      <div><p className="text-xs font-bold uppercase tracking-wider text-[var(--gold)]">{pillar} · Editorial</p>
       <h3 className="mt-3 text-lg font-bold">{g.title}</h3>
       <p className="mt-3 text-sm leading-6 text-[var(--text-soft)]">{g.description}</p></div>
      <span className="mt-5 inline-flex items-center gap-2 text-sm font-semibold">Read guide <ArrowRight size={16} aria-hidden="true"/></span>
     </Link>)}
    </div>
   </section>
   <section aria-label="Related source tools" className="gth-glass mt-10 rounded-2xl border border-[var(--border)] p-6 sm:p-8">
    <h2 className="text-xl font-bold">Continue with GTH PRO tools</h2>
    <nav className="mt-5 flex flex-wrap gap-3">
     {pathways.map(path=><Link href={path.href} key={path.href}
       className="gth-btn inline-flex min-h-11 items-center rounded-xl px-4 text-sm font-semibold">{path.label}</Link>)}
     <Link href="/blog" className="gth-btn inline-flex min-h-11 items-center rounded-xl px-4 text-sm font-semibold">All knowledge articles</Link>
    </nav>
    <p className="mt-5 flex items-start gap-2 text-xs leading-6 text-[var(--text-soft)]">
     <ShieldCheck size={16} className="mt-1 shrink-0" aria-hidden="true"/>
     Research is informational and independent. Confirm every official filing or bid rule with the original authority.
    </p>
   </section>
  </div>
 </main>;
}
