import TravelSectionNav from "@/components/travel/TravelSectionNav";
import Link from "next/link";
import Image from "next/image";
import {ArrowLeft,ArrowRight,BookOpen,Compass,Hotel,Plane,MapPin,ExternalLink} from "lucide-react";
import JsonLd from "@/components/seo/JsonLd";
import {siteUrl} from "@/lib/seo/site";
import type {DestinationGuide,TopicGuide} from "@/lib/travel/guideCatalog";
import type {Place} from "@/lib/travel/osmAttractions";
import type {ApprovedGuideMedia} from "@/lib/travel/guideMedia";
import GuidePartnerHandoffs from "@/components/travel/GuidePartnerHandoffs";

type Props={guide:DestinationGuide|TopicGuide;media:ApprovedGuideMedia|null;indexable:boolean;places?:Place[]};
export default function GuideDetail({guide,media,indexable,places=[]}:Props){
 const full="countryCode" in guide;
 const city=full?guide.city:guide.parentSlug==="paris"?"Paris":null;
 const code=full?guide.countryCode:"FR";
 const links=[
  {name:"Explore tours & tickets",href:city?"/tours?city="+encodeURIComponent(city):"/tours",Icon:Compass},
  {name:"Search hotels",href:city?"/hotels/results?city="+encodeURIComponent(city):"/hotels",Icon:Hotel},
  {name:"Plan a trip",href:"/ai-trip",Icon:BookOpen},
  {name:"Travel insurance",href:"/insurance",Icon:Compass},
  {name:"Airport transfers",href:"/transfers",Icon:Plane},
  {name:"Explore mapped places",href:"/attractions?country="+code,Icon:MapPin}
 ];
 const url=siteUrl("/guides/"+guide.slug);
 const breadcrumb=[{ "@type":"ListItem",position:1,name:"Guides",item:siteUrl("/guides") }];
 if(!full)breadcrumb.push({"@type":"ListItem",position:2,name:"Paris",item:siteUrl("/guides/paris")});
 breadcrumb.push({"@type":"ListItem",position:breadcrumb.length+1,name:guide.title,item:url});
 return <main className="min-h-screen bg-[var(--bg)] text-[var(--text)]">
  <JsonLd data={{"@context":"https://schema.org","@graph":[
   {"@type":"BreadcrumbList",itemListElement:breadcrumb},
   {"@type":full?"TouristDestination":"Article",name:guide.title,description:guide.summary,url,
    ...(media?{image:media.image_url}:{})},
   ...(media?[{"@type":"ImageObject",contentUrl:media.image_url,url:media.source_page,license:media.license_url,
    creditText:media.attribution_text,caption:media.alt_text,width:media.width,height:media.height}]:[])
  ]}}/>
  <div className="mx-auto max-w-6xl px-4 py-9 sm:px-6">
   <nav className="flex flex-wrap items-center gap-2 text-xs text-[var(--text-soft)]" aria-label="Guide breadcrumbs">
    <Link href="/guides" className="inline-flex min-h-10 items-center gap-1 underline"><ArrowLeft size={14}/> Guides</Link>
    {!full&&<><span>/</span><Link href="/guides/paris" className="underline">Paris</Link></>}
    <span>/</span><span aria-current="page">{guide.title}</span>
   </nav>
   <header data-travel-hero="true" className="mt-6">
    <p className="text-xs font-semibold uppercase tracking-widest text-[var(--text-soft)]">GTH PRO · Editorial travel planning</p>
    <h1 className="mt-3 max-w-4xl text-3xl font-bold leading-tight sm:text-5xl">{guide.title}</h1>
    <p className="mt-4 max-w-3xl text-base leading-7 text-[var(--text-soft)]">{guide.summary}</p>
   </header>
   <figure className="mt-7 overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--card)]">
    {media?<Image src={media.image_url} width={media.width} height={media.height} alt={media.alt_text} priority sizes="(max-width: 768px) 100vw, 1100px" className="aspect-[16/9] max-h-[420px] w-full object-cover"/>:
    <div className="flex aspect-[16/9] max-h-[320px] items-center justify-center gap-2 text-sm text-[var(--text-soft)]"><Compass size={24}/> Rights-approved destination photo pending</div>}
    <figcaption className="px-4 py-3 text-xs text-[var(--text-soft)]">
     {media?<><a href={media.source_page} target="_blank" rel="noopener noreferrer nofollow" className="underline">{media.attribution_text} · {media.source_name}</a>{" · "}<a href={media.license_url} target="_blank" rel="noopener noreferrer nofollow" className="underline">{media.license_type}</a>{" · "}Photo shown in a responsive display crop; source file is unchanged.</>:
     "Only rights-reviewed real-place imagery is published; no unrelated stock imagery is presented as a destination."}
    </figcaption>
   </figure>
   <TravelSectionNav />
   {!indexable&&<p className="mt-4 rounded-xl border border-[var(--border)] bg-[var(--card)] p-3 text-xs text-[var(--text-soft)]">Editorial preview · This guide is excluded from search indexing until content and image rights are independently approved.</p>}
   <div className="mt-8 grid gap-10 lg:grid-cols-[minmax(0,1fr)_300px]">
    <div className="space-y-9">
     <section><h2 className="text-2xl font-bold">About this destination</h2><p className="mt-3 text-sm leading-8 text-[var(--text-soft)]">{guide.intro}</p></section>
     <section><h2 className="text-2xl font-bold">When to visit</h2><p className="mt-3 text-sm leading-8 text-[var(--text-soft)]">{guide.bestTime}</p></section>
     <section><h2 className="text-2xl font-bold">Places to consider</h2><div className="mt-4 grid gap-3 sm:grid-cols-2">
      {guide.highlights.map(x=><article key={x.name} className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-5">
       <h3 className="font-semibold">{x.name}</h3><p className="mt-2 text-sm leading-6 text-[var(--text-soft)]">{x.why}</p>
      </article>)}
     </div></section>
     {full&&<><section><h2 className="text-2xl font-bold">A comfortable one-day outline</h2>
      <ol className="mt-3 list-decimal space-y-3 pl-6 text-sm leading-7 text-[var(--text-soft)]">{guide.dayPlan.map(x=><li key={x}>{x}</li>)}</ol>
     </section><section><h2 className="text-2xl font-bold">Three-day itinerary</h2><div className="mt-3 grid gap-3">
      {guide.threeDayPlan.map(x=><div key={x.day} className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-4">
       <h3 className="font-semibold">{x.day}</h3><p className="mt-2 text-sm leading-6 text-[var(--text-soft)]">{x.plan}</p>
      </div>)}
     </div></section><section><h2 className="text-2xl font-bold">Practical planning tips</h2>
      <ul className="mt-3 list-disc space-y-2 pl-6 text-sm leading-7 text-[var(--text-soft)]">{guide.tips.map(x=><li key={x}>{x}</li>)}</ul>
     </section></>}
     <section><h2 className="text-2xl font-bold">Frequently asked questions</h2><div className="mt-3 space-y-3">{guide.faq.map(x=><div key={x.question} className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-4">
      <h3 className="font-semibold">{x.question}</h3><p className="mt-2 text-sm leading-7 text-[var(--text-soft)]">{x.answer}</p>
     </div>)}</div></section>
    </div>
    <aside className="space-y-5">
     <section className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-5">
      <h2 className="text-lg font-bold">Discover → Plan → Book</h2><p className="mt-2 text-xs leading-6 text-[var(--text-soft)]">Continue through the existing GTH PRO travel tools. Actual supplier inventory, eligibility, prices and checkout are confirmed by the provider.</p>
      <div className="mt-4 grid gap-2">{links.map(({name,href,Icon})=><Link key={name} href={href} className="gth-btn-gold inline-flex min-h-11 items-center justify-between gap-2 rounded-xl px-4 text-sm">
       <span className="inline-flex items-center gap-2"><Icon size={16}/>{name}</span><ArrowRight size={14}/>
      </Link>)}</div>
      <p className="mt-4 text-xs text-[var(--text-soft)]">Some external booking handoffs may be affiliate links. <Link href="/affiliate-disclosure" className="underline">Read disclosure</Link>.</p>
     </section>
     {full&&<section className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-5">
      <h2 className="flex items-center gap-2 font-bold"><BookOpen size={17}/> Community-mapped references</h2>
      {places.length>0?<ul className="mt-3 space-y-3 text-sm">{places.map(p=><li key={p.source_id}>
       <a href={p.source_url} target="_blank" rel="noopener noreferrer nofollow" className="inline-flex items-start gap-2 underline">{p.name} <ExternalLink size={13}/></a>
       <p className="mt-1 text-xs text-[var(--text-soft)]">{p.category.replaceAll("-"," ")} · OSM contributor record</p>
      </li>)}</ul>:<p className="mt-3 text-xs leading-6 text-[var(--text-soft)]">Local source records may not be tagged with this city's name. Browse the country directory instead.</p>}
      <p className="mt-3 text-[11px] leading-5 text-[var(--text-soft)]">© OpenStreetMap contributors · ODbL 1.0 via Geofabrik. Community mapping does not certify opening hours, ticket stock, accessibility or safety.</p>
     </section>}
    </aside>
   </div>
   <div className="mt-10 border-t border-[var(--border)] pt-6">
    <Link href="/guides" className="inline-flex min-h-11 items-center gap-2 text-sm underline"><ArrowLeft size={16}/> More editorial guides</Link>
    {full&&guide.slug==="paris"&&<Link href="/guides/paris/eiffel-tower-nearby-things-to-do" className="ml-5 inline-flex items-center gap-2 text-sm underline">Eiffel Tower nearby guide <ArrowRight size={16}/></Link>}
   </div>
   <GuidePartnerHandoffs city={city}/>
  </div>
 </main>;
}
