import type {Metadata} from "next";
import Image from "next/image";
import Link from "next/link";
import {notFound} from "next/navigation";
import ReactMarkdown from "react-markdown";
import {ArrowLeft,ArrowRight,BookOpen,ShieldCheck,Compass} from "lucide-react";
import {blogs} from "@/data/blogs";
import {ticketBlogGuides} from "@/data/blogTickets";
import {ecosystemGuides} from "@/data/blogEcosystem";
import EcosystemGuideResources from "@/components/seo/EcosystemGuideResources";
import TicketBlogLinks from "@/components/travel/TicketBlogLinks";
import TravelSectionNav from "@/components/travel/TravelSectionNav";
import {isPublicLaunch,siteUrl} from "@/lib/seo/site";
import JsonLd from "@/components/seo/JsonLd";

type Props={params:Promise<{slug:string}>};
export function generateStaticParams(){
  return blogs.map((blog) => ({ slug: blog.slug }));
}
export async function generateMetadata({params}:Props):Promise<Metadata>{
  const {slug}=await params;
  const blog=blogs.find(item=>item.slug===slug);
  if(!blog)return {title:"Guide not found | GTH PRO",robots:{index:false}};
  const ecosystemGuide=ecosystemGuides.find(item=>item.slug===slug);
  const section=ecosystemGuide?.pillar==="Real Estate"?"Property":ecosystemGuide?.pillar==="Tenders"?"Tender":"Travel";
  return {
    title:blog.title+" | GTH PRO "+section+" Guides",
    description:blog.description,
    robots:{index:isPublicLaunch(),follow:true},
    alternates:{canonical:"/blog/"+blog.slug},
    openGraph:{title:blog.title,description:blog.description,type:"article",images:[{url:blog.image,alt:blog.title}]},
  };
}

export default async function BlogPage({params}:Props){
  const {slug}=await params;
  const blog=blogs.find(article=>article.slug===slug);
  if(!blog)notFound();
  const ticketGuide=ticketBlogGuides.find(item=>item.slug===slug);
  const ecosystemGuide=ecosystemGuides.find(item=>item.slug===slug);
  const datedGuide=ticketGuide||ecosystemGuide;
  const related=blogs.filter(item=>item.slug!==blog.slug&&item.category===blog.category).slice(0,3);
  const more=related.length?related:blogs.filter(item=>item.slug!==blog.slug).slice(0,3);
  const pillar=ecosystemGuide?.pillar||"Travel";
  const hubHref=pillar==="Tenders"?"/knowledge/tenders":pillar==="Real Estate"?"/real-estate/guides":"/blog";
  const minutes=Math.max(2,Math.ceil(blog.content.trim().split(/\s+/).length/190));
  const articleData={
    "@context":"https://schema.org","@type": "BlogPosting",
    headline:blog.title,description:blog.description,
    image:siteUrl(blog.image),mainEntityOfPage:siteUrl("/blog/"+blog.slug),
    publisher:{"@id":siteUrl("/")+"#organization"},
    inLanguage:"en",
    ...(datedGuide?{datePublished:datedGuide.publishedAt,dateModified:datedGuide.publishedAt,
      author:{"@type":"Organization",name:"GTH PRO",url:siteUrl("/about")}}:{}),
  };
  const breadcrumbData={
    "@context":"https://schema.org","@type":"BreadcrumbList",
    itemListElement:[
      {"@type":"ListItem",position:1,name:"GTH PRO Knowledge",item:siteUrl("/blog")},
      {"@type":"ListItem",position:2,name:pillar+" guides",item:siteUrl(hubHref)},
      {"@type":"ListItem",position:3,name:blog.title,item:siteUrl("/blog/"+blog.slug)},
    ],
  };
  const researchLinks=pillar==="Real Estate"?
    [{href:"/real-estate",label:"Property explorer"},{href:"/real-estate/registry",label:"Project registry"},{href:"/real-estate/tools",label:"Property tools"},{href:hubHref,label:"Property guides"}]:
    pillar==="Tenders"?
    [{href:"/tender",label:"Tender discovery"},{href:"/tender/coverage",label:"Source coverage"},{href:hubHref,label:"Tender guides"},{href:"/tender/services",label:"Tender assistance"}]:
    [{href:"/flights",label:"Flights"},{href:"/hotels",label:"Hotels"},{href:"/activities",label:"Activities"},{href:"/tickets",label:"Tickets"},{href:"/destinations",label:"Destinations"}];
  return <main className="min-h-screen min-w-0 overflow-x-clip bg-[var(--bg)] text-[var(--text)]">
    <JsonLd data={articleData} />
    <JsonLd data={breadcrumbData}/>
    <header data-travel-hero="true" className="border-b border-[var(--border)]">
      <div className="mx-auto grid max-w-7xl min-w-0 items-center gap-7 px-4 py-8 sm:px-6 md:grid-cols-[minmax(0,1.3fr)_minmax(0,0.7fr)] md:py-12">
        <div className="min-w-0">
          <nav aria-label="Breadcrumb" className="flex min-w-0 flex-wrap items-center gap-2 text-xs font-semibold text-[var(--text-soft)]">
            <Link href="/blog" className="inline-flex items-center gap-1 underline"><ArrowLeft size={14}/> GTH PRO Knowledge</Link>
            <span aria-hidden="true">/</span>
            <Link href={hubHref} className="underline">{pillar}</Link>
          </nav>
          <p className="mt-5 flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-[var(--gold)]">
            <BookOpen size={16} aria-hidden="true"/> GTH PRO editorial research
          </p>
          <h1 className="mt-3 break-words text-3xl font-bold leading-tight tracking-tight sm:text-4xl">{blog.title}</h1>
          <p className="mt-4 max-w-3xl text-sm leading-7 text-[var(--text-soft)] sm:text-base">{blog.description}</p>
          <div className="mt-5 flex flex-wrap gap-2 text-xs text-[var(--text-soft)]">
            <span className="rounded-full border border-[var(--border)] bg-[var(--card)] px-3 py-2">{blog.category}</span>
            <span className="rounded-full border border-[var(--border)] bg-[var(--card)] px-3 py-2">{minutes} min read</span>
            <span className="rounded-full border border-[var(--border)] bg-[var(--card)] px-3 py-2">{pillar} research</span>
          </div>
        </div>
        <div className="relative aspect-[16/10] min-w-0 overflow-hidden rounded-2xl border border-[var(--border)]">
          <Image src={blog.image} alt={blog.title} fill priority sizes="(max-width: 768px) 100vw, 35vw" className="object-cover"/>
        </div>
      </div>
    </header>
    {(pillar==="Travel")&&<TravelSectionNav/>}
    <div className="mx-auto grid max-w-7xl min-w-0 gap-7 px-4 py-8 sm:px-6 md:py-12 lg:grid-cols-[minmax(0,1fr)_280px]">
      <article aria-label={blog.title} className="gth-glass min-w-0 overflow-hidden rounded-2xl border border-[var(--border)] p-5 sm:p-7 lg:p-9">
        <div className="mb-6 flex items-start gap-3 border-b border-[var(--border)] pb-5">
          <BookOpen size={20} className="shrink-0 text-[var(--gold)]" aria-hidden="true"/>
          <div>
            <p className="text-sm font-bold">
              {pillar==="Real Estate"?"Research before buying":pillar==="Tenders"?"Verify before bidding":"Knowledge before booking"}
            </p>
            <p className="mt-1 text-sm leading-6 text-[var(--text-soft)]">Source-aware guidance from GTH PRO Global.</p>
          </div>
        </div>
        <div className="prose prose-base max-w-none break-words prose-headings:font-semibold prose-headings:text-[var(--text)] prose-h2:mt-8 prose-h2:text-xl prose-h3:text-lg prose-p:leading-8 prose-p:text-[var(--text-soft)] prose-li:text-[var(--text-soft)] prose-li:leading-7 prose-strong:text-[var(--text)] prose-blockquote:text-[var(--text-soft)]">
          <ReactMarkdown components={{
            a:({href,children})=>
              href?.startsWith("/")&&!href.startsWith("//")
                ? <Link href={href} className="font-semibold text-[var(--gold)] underline underline-offset-4">{children}</Link>
                : ecosystemGuide&&href?.startsWith("https://")&&ecosystemGuide.resources.some(resource=>resource.href===href)
                  ? <a href={href} target="_blank" rel="noopener noreferrer" className="font-semibold text-[var(--gold)] underline underline-offset-4">{children}</a>
                  : <span>{children}</span>
          }}>{blog.content}</ReactMarkdown>
        </div>
        {ticketGuide&&<TicketBlogLinks slug={ticketGuide.slug}/>}
        {ecosystemGuide&&<EcosystemGuideResources slug={ecosystemGuide.slug}/>}
        <div className="mt-8 rounded-xl border border-[var(--border)] bg-[var(--card)] p-5">
          <h2 className="flex items-center gap-2 text-sm font-bold"><ShieldCheck size={18} className="text-[var(--gold)]" aria-hidden="true"/> Check current source information</h2>
          <p className="mt-2 text-sm leading-7 text-[var(--text-soft)]">
            Availability, prices, regulations and official procurement conditions may change. Confirm critical details with the original authority, seller or qualified professional before paying or applying.
          </p>
        </div>
        <nav aria-label="Article navigation" className="mt-6 flex flex-wrap gap-2 border-t border-[var(--border)] pt-6">
          <Link href="/blog" className="gth-btn inline-flex min-h-11 items-center gap-2 rounded-xl px-4 text-sm font-semibold"><ArrowLeft size={16}/> All articles</Link>
          <Link href={hubHref} className="gth-btn gth-btn-gold inline-flex min-h-11 items-center gap-2 rounded-xl px-4 text-sm font-semibold"><Compass size={16}/> {pillar} guides</Link>
        </nav>
      </article>
      <aside className="min-w-0 space-y-4 self-start lg:sticky lg:top-24">
        <div className="gth-glass rounded-2xl border border-[var(--border)] p-5">
          <h2 className="text-base font-bold">Continue researching</h2>
          <nav aria-label="Related GTH PRO research tools" className="mt-4 grid gap-2">
            {researchLinks.map(item=><Link href={item.href} key={item.href}
              className="gth-btn flex min-h-11 items-center justify-between gap-3 rounded-xl px-3 text-sm font-semibold">
              <span>{item.label}</span><ArrowRight size={16} className="shrink-0" aria-hidden="true"/>
            </Link>)}
          </nav>
        </div>
        <div className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-5">
          <h2 className="text-sm font-bold">Editorial standards</h2>
          <p className="mt-2 text-sm leading-7 text-[var(--text-soft)]">
            Independent research, not a promise of live stock, verified title, official tender eligibility or investment returns.
          </p>
        </div>
      </aside>
    </div>
    <section aria-labelledby="further-reading" className="border-t border-[var(--border)] bg-[var(--card)]">
      <div className="mx-auto max-w-7xl px-4 py-9 sm:px-6">
        <h2 id="further-reading" className="text-2xl font-bold">Related knowledge guides</h2>
        <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {more.map(item=><Link href={"/blog/" + item.slug} key={item.slug}
            className="gth-glass group flex min-w-0 flex-col overflow-hidden rounded-2xl border border-[var(--border)] hover:shadow-lg">
            <div className="relative aspect-[16/10] overflow-hidden">
              <Image src={item.image} alt={item.title} fill sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw" className="object-cover transition-transform duration-300 group-hover:scale-105"/>
            </div>
            <div className="flex flex-1 flex-col p-4">
              <p className="text-xs font-bold text-[var(--gold)]">{item.category}</p>
              <h3 className="mt-2 text-base font-semibold leading-6">{item.title}</h3>
              <span className="mt-auto inline-flex items-center gap-2 pt-4 text-sm font-semibold">Read guide <ArrowRight size={16}/></span>
            </div>
          </Link>)}
        </div>
      </div>
    </section>
  </main>;
}
