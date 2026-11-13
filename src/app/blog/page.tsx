import type {Metadata} from "next";
import Image from "next/image";
import Link from "next/link";
import {ArrowRight,BookOpen,Compass,Search,Ticket,Building2,Landmark} from "lucide-react";
import TravelSectionNav from "@/components/travel/TravelSectionNav";
import {blogs,type Blog} from "@/data/blogs";
import {groundTransportBlogs} from "@/data/blogGroundTransport";
import {ticketBlogGuides} from "@/data/blogTickets";
import {ecosystemGuides} from "@/data/blogEcosystem";
import {listMappedCities} from "@/lib/travel/mappedCities";
import MappedCityDiscovery from "@/components/travel/MappedCityDiscovery";

export const metadata:Metadata={
  title:"GTH PRO Global Knowledge Blog | Travel, Property & Tender Guides",
  description:"Source-aware travel, real estate, procurement and ticket research. Read practical guides and follow verified official or existing supplier links.",
  alternates:{canonical:"/blog"},
  openGraph:{
    title:"GTH PRO Global Knowledge Blog",
    description:"Original guides for travel, property and tender decisions, with contextual research tools and supplier disclosures.",
    type:"website",images:[{url:"/images/global-city.jpg",alt:"GTH PRO global research guides"}],
  },
};
type Category=Blog["category"]|"All";
const categories:Category[]=["All","Flights","Hotels","Experiences","Planning","Safety","Tickets","Real Estate","Tenders"];
type Props={searchParams:Promise<{category?:string|string[];search?:string|string[]}>};
function filterLink(category:Category,search:string){
  const params=new URLSearchParams();
  if(category!=="All")params.set("category",category);
  if(search)params.set("search",search);
  return "/blog"+(params.size?"?"+params.toString():"")+"#journal";
}
function readingTime(text:string){return Math.max(2,Math.ceil(text.trim().split(/\s+/).length/190));}

export default async function BlogList({searchParams}:Props){
  const params=await searchParams;
  const selected:Category=typeof params.category==="string"&&categories.includes(params.category as Category)
    ? params.category as Category:"All";
  const search=typeof params.search==="string"?params.search.trim().slice(0,70):"";
  const query=search.toLowerCase();
  const articles=blogs.filter(article=>(selected==="All"||article.category===selected)&&
    (!query||[article.title,article.description,article.category,article.content].some(value=>value.toLowerCase().includes(query))));
  const lead=blogs[0];
  const featured=ecosystemGuides.filter(guide=>guide.pillar==="Travel").slice(0,2);
  const mapped=await listMappedCities({pageSize:48}).catch(()=>null);
  return <main className="min-h-screen min-w-0 overflow-x-clip bg-[var(--bg)] text-[var(--text)]">
    <TravelSectionNav/>
    <header className="border-b border-[var(--border)]">
      <div className="mx-auto grid max-w-7xl min-w-0 items-center gap-7 px-4 py-8 sm:px-6 md:grid-cols-[minmax(0,1.2fr)_minmax(0,0.8fr)] md:py-12">
        <div className="min-w-0">
          <p className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-[var(--gold)]">
            <BookOpen size={17} aria-hidden="true"/> GTH PRO Global Knowledge
          </p>
          <h1 className="mt-4 max-w-3xl text-3xl font-bold leading-tight tracking-tight sm:text-4xl lg:text-5xl">
            Better decisions begin with knowledge.
          </h1>
          <p className="mt-4 max-w-2xl text-sm leading-7 text-[var(--text-soft)] sm:text-base">
            Independent research for Travel, Real Estate and Tenders. Learn what to verify, compare practical options and continue to official or supplier-controlled sources.
          </p>
          <nav aria-label="Knowledge hub shortcuts" className="mt-6 flex flex-wrap gap-2">
            <Link href="/blog#journal" className="gth-btn gth-btn-gold inline-flex min-h-11 items-center gap-2 rounded-xl px-4 text-sm font-semibold">Browse articles <ArrowRight size={16}/></Link>
            <Link href="/real-estate/guides" className="gth-btn inline-flex min-h-11 items-center rounded-xl px-4 text-sm font-semibold">Property guides</Link>
            <Link href="/knowledge/tenders" className="gth-btn inline-flex min-h-11 items-center rounded-xl px-4 text-sm font-semibold">Tender guides</Link>
          </nav>
        </div>
        <Link href={"/blog/"+lead.slug} className="gth-glass group min-w-0 overflow-hidden rounded-2xl border border-[var(--border)]">
          <div className="relative aspect-[16/9] overflow-hidden">
            <Image src={lead.image} alt={lead.title} fill priority sizes="(max-width: 768px) 100vw, 38vw" className="object-cover transition-transform duration-300 group-hover:scale-105"/>
          </div>
          <div className="p-4 sm:p-5">
            <p className="text-xs font-bold uppercase tracking-wider text-[var(--gold)]">Featured article</p>
            <h2 className="mt-2 text-lg font-semibold leading-snug">{lead.title}</h2>
            <span className="mt-3 inline-flex items-center gap-2 text-sm font-semibold text-[var(--text-soft)]">Read guide <ArrowRight size={16}/></span>
          </div>
        </Link>
      </div>
    </header>

    <section id="ecosystem-guides" aria-labelledby="ecosystem-guides-heading" className="mx-auto max-w-7xl px-4 py-9 sm:px-6">
      <h2 id="ecosystem-guides-heading" className="text-2xl font-bold sm:text-3xl">One knowledge hub. Three connected pillars.</h2>
      <p className="mt-3 max-w-3xl text-sm leading-7 text-[var(--text-soft)]">
        Read useful guidance before booking a trip, researching property or preparing a bid. Every article connects to the relevant GTH PRO tools.
      </p>
      <nav aria-label="Explore GTH PRO research pillars" className="mt-6 grid min-w-0 gap-4 sm:grid-cols-3">
        {[
          {href:"/blog?category=Planning#journal",label:"Travel",detail:"Hotels, flights, transfers and experiences",Icon:Compass},
          {href:"/real-estate/guides",label:"Real Estate",detail:"Registry, ownership and property research",Icon:Building2},
          {href:"/knowledge/tenders",label:"Tenders",detail:"Eligibility, documents and official sources",Icon:Landmark},
        ].map(({href,label,detail,Icon})=><Link key={href} href={href}
          className="gth-glass flex min-w-0 items-start gap-3 rounded-2xl border border-[var(--border)] p-5 hover:underline">
          <Icon size={21} aria-hidden="true" className="shrink-0 text-[var(--gold)]"/>
          <span className="min-w-0"><strong className="block text-base">{label}</strong><span className="mt-2 block text-sm leading-6 text-[var(--text-soft)]">{detail}</span></span>
        </Link>)}
      </nav>
      <div className="mt-5 grid gap-3 sm:grid-cols-2">
        {featured.map(guide=><Link key={guide.slug} href={"/blog/"+guide.slug} className="flex min-w-0 items-center justify-between gap-3 rounded-xl border border-[var(--border)] bg-[var(--card)] p-4 text-sm font-semibold hover:underline">
          <span>{guide.title}</span><ArrowRight size={17} className="shrink-0" aria-hidden="true"/>
        </Link>)}
      </div>
    </section>

    <section id="ticket-guides" aria-labelledby="ticket-guides-heading" className="border-y border-[var(--border)] bg-[var(--card)]">
      <div className="mx-auto max-w-7xl px-4 py-9 sm:px-6">
        <p className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-[var(--gold)]"><Ticket size={16}/> Worldwide Tickets</p>
        <h2 id="ticket-guides-heading" className="mt-2 text-2xl font-bold">Ticket research and event admission</h2>
        <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {ticketBlogGuides.slice(0,6).map(guide=><Link key={guide.slug} href={"/blog/"+guide.slug} className="flex min-h-24 flex-col justify-between rounded-xl border border-[var(--border)] bg-[var(--bg)] p-4 hover:underline">
            <strong className="text-sm leading-6">{guide.title}</strong><span className="mt-3 text-xs text-[var(--text-soft)]">Read guide</span>
          </Link>)}
        </div>
        <Link href="/blog?category=Tickets#journal" className="gth-btn mt-5 inline-flex min-h-11 items-center gap-2 rounded-xl px-4 text-sm font-semibold">All ticket guides <ArrowRight size={16}/></Link>
      </div>
    </section>

    <section aria-labelledby="ground-travel-guides" className="mx-auto max-w-7xl px-4 py-9 sm:px-6">
      <h2 id="ground-travel-guides" className="text-xl font-bold sm:text-2xl">Bus and rail planning guides</h2>
      <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {groundTransportBlogs.slice(0,3).map(guide=><Link key={guide.slug} href={"/blog/"+guide.slug}
          className="gth-glass flex min-h-24 flex-col justify-between rounded-xl border border-[var(--border)] p-4 hover:underline">
          <strong className="text-sm leading-6">{guide.title}</strong><span className="mt-3 text-xs text-[var(--text-soft)]">Read transport guide</span>
        </Link>)}
      </div>
      <nav className="mt-4 flex flex-wrap gap-2" aria-label="Ground transportation research">
        <Link href="/bus" className="gth-btn inline-flex min-h-11 items-center rounded-xl px-4 text-sm font-semibold">Buses</Link>
        <Link href="/train" className="gth-btn inline-flex min-h-11 items-center rounded-xl px-4 text-sm font-semibold">Trains</Link>
        <Link href="/ferry" className="gth-btn inline-flex min-h-11 items-center rounded-xl px-4 text-sm font-semibold">Ferries</Link>
      </nav>
    </section>

    <section id="journal" aria-labelledby="journal-heading" className="mx-auto max-w-7xl scroll-mt-20 px-4 py-9 sm:px-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div className="min-w-0">
          <p className="text-xs font-bold uppercase tracking-widest text-[var(--gold)]">Research library</p>
          <h2 id="journal-heading" className="mt-2 text-2xl font-bold sm:text-3xl">Explore every guide</h2>
          <p className="mt-2 text-sm text-[var(--text-soft)]">Travel, tickets, real estate and tenders. No fictional prices, live seats or procurement approvals.</p>
        </div>
        <span role="status" className="rounded-full border border-[var(--border)] bg-[var(--card)] px-4 py-2 text-xs text-[var(--text-soft)]">{articles.length} articles</span>
      </div>
      <form role="search" action="/blog" method="get" className="mt-6 flex min-w-0 flex-col gap-3 sm:flex-row">
        {selected!=="All"&&<input type="hidden" name="category" value={selected}/>}
        <label className="flex min-h-12 min-w-0 flex-1 items-center gap-3 rounded-xl border border-[var(--border)] bg-[var(--card)] px-4">
          <Search size={18} className="shrink-0 text-[var(--gold)]"/>
          <span className="sr-only">Search guides</span>
          <input type="search" name="search" maxLength={70} defaultValue={search} placeholder="Search topics, cities, property or tenders"
            className="min-w-0 w-full bg-transparent text-sm text-[var(--text)] outline-none placeholder:text-[var(--text-soft)]"/>
        </label>
        <button type="submit" className="gth-btn gth-btn-gold min-h-12 rounded-xl px-6 text-sm font-semibold">Search guides</button>
      </form>
      <nav aria-label="Filter articles by category" className="mt-5 flex min-w-0 gap-2 overflow-x-auto pb-3">
        {categories.map(category=><Link key={category} href={filterLink(category,search)} aria-current={selected===category?"page":undefined}
          className={"gth-btn inline-flex min-h-10 shrink-0 items-center rounded-full px-4 text-xs font-semibold "+(selected===category?"gth-btn-gold":"")}>
          {category}
        </Link>)}
      </nav>
      {articles.length?
        <div className="mt-5 grid min-w-0 gap-5 sm:grid-cols-2 xl:grid-cols-3">
          {articles.map(article=><Link key={article.slug} href={"/blog/"+article.slug}
            className="gth-glass group flex min-w-0 flex-col overflow-hidden rounded-2xl border border-[var(--border)] transition hover:shadow-lg">
            <div className="relative aspect-[16/10] w-full overflow-hidden">
              <Image src={article.image} alt={article.title} fill sizes="(max-width: 640px) 100vw, (max-width: 1280px) 50vw, 33vw" className="object-cover transition-transform duration-300 group-hover:scale-105"/>
            </div>
            <div className="flex flex-1 flex-col p-5">
              <div className="flex flex-wrap justify-between gap-2 text-xs text-[var(--text-soft)]">
                <span className="font-bold text-[var(--gold)]">{article.category}</span><span>{readingTime(article.content)} min read</span>
              </div>
              <h3 className="mt-3 text-lg font-bold leading-snug">{article.title}</h3>
              <p className="mt-3 line-clamp-3 text-sm leading-6 text-[var(--text-soft)]">{article.description}</p>
              <span className="mt-auto inline-flex items-center gap-2 pt-5 text-sm font-semibold">Read article <ArrowRight size={16}/></span>
            </div>
          </Link>)}
        </div>:
        <div role="status" className="gth-glass mt-6 rounded-2xl border border-[var(--border)] p-7 text-center">
          <p className="font-bold">No matching guides found.</p>
          <p className="mt-2 text-sm text-[var(--text-soft)]">Try a different keyword or category.</p>
          <Link href="/blog#journal" className="gth-btn mt-4 inline-flex min-h-11 items-center rounded-xl px-4 text-sm font-semibold">Show all guides</Link>
        </div>}
    </section>
    <div className="border-t border-[var(--border)]">
      <MappedCityDiscovery cities={mapped?.items??[]} title="Explore destinations for your next journey"/>
    </div>
  </main>;
}
