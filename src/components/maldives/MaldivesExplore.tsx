import Image from "next/image";
import Link from "next/link";
import {ArrowRight,BookOpen,Globe2,CarFront} from "lucide-react";
import {guideCatalog} from "@/lib/travel/guideCatalog";

const countries=[
  {name:"India",photo:"/images/cities/mumbai.jpg",photoCity:"Mumbai"},
  {name:"United Arab Emirates",photo:"/images/cities/dubai.jpg",photoCity:"Dubai"},
  {name:"France",photo:"/images/cities/paris.jpg",photoCity:"Paris"},
  {name:"Japan",photo:"/images/cities/tokyo.jpg",photoCity:"Tokyo"},
  {name:"Singapore",photo:"/images/cities/singapore.jpg",photoCity:"Singapore"},
  {name:"Thailand",photo:"/images/cities/bangkok.jpg",photoCity:"Bangkok"},
  {name:"Indonesia",photo:"/images/cities/bali.jpg",photoCity:"Bali"},
  {name:"United Kingdom",photo:"/images/cities/london.jpg",photoCity:"London"},
  {name:"United States",photo:"/images/cities/new-york.jpg",photoCity:"New York"},
] as const;
const countryGuidePhotos:Readonly<Record<string,{src:string,city:string}>>={
  india:{src:"/images/cities/mumbai.jpg",city:"Mumbai"},
  france:{src:"/images/cities/paris.jpg",city:"Paris"},
};
const countryGuides=guideCatalog.filter(item=>item.kind==="country");

export default function MaldivesExplore(){
  return <div className="mx-auto w-full max-w-7xl space-y-12 px-4 pb-16 pt-4 sm:px-6 lg:space-y-16">
    <section aria-labelledby="maldives-explore-destinations">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest text-[var(--gold)]">Worldwide destinations</p>
          <h2 id="maldives-explore-destinations" className="mt-2 text-2xl font-bold sm:text-3xl">Explore Destinations</h2>
        </div>
        <Link href="/destinations" className="inline-flex min-h-11 items-center gap-2 text-sm font-semibold text-[var(--gold)]">
          All countries &amp; cities <ArrowRight size={16} aria-hidden="true"/>
        </Link>
      </div>
      <div role="region" aria-label="Explore countries by destination cards — swipe horizontally" tabIndex={0}
        className="mt-5 flex min-w-0 snap-x snap-mandatory gap-3 overflow-x-auto overscroll-x-contain pb-4 lg:grid lg:grid-cols-4 lg:overflow-visible xl:grid-cols-5">
        {countries.map(item=><Link key={item.name} href={"/destinations?country="+encodeURIComponent(item.name)+"#discover"}
          className="group flex w-[67vw] max-w-[235px] shrink-0 snap-start flex-col overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--card)] text-[var(--text)] shadow-sm transition-transform hover:-translate-y-1 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--gold)] lg:w-full lg:max-w-none">
          <span className="relative block aspect-[5/4] overflow-hidden bg-[var(--bg-soft)]">
            <Image src={item.photo} alt={item.photoCity+" destination scenery"} fill loading="lazy"
              sizes="(max-width: 640px) 67vw, (max-width: 1024px) 35vw, 220px"
              className="object-cover transition-transform duration-300 group-hover:scale-105"/>
          </span>
          <span className="flex min-h-[106px] flex-1 flex-col p-3">
            <span className="line-clamp-2 text-sm font-semibold">{item.name}</span>
            <span className="mt-1 text-xs text-[var(--text-soft)]">{item.photoCity} &amp; beyond</span>
            <span className="mt-auto inline-flex min-h-11 items-center gap-1 text-xs font-semibold text-[var(--gold)]">
              <Globe2 size={15} aria-hidden="true"/> Explore country <ArrowRight size={14} aria-hidden="true"/>
            </span>
          </span>
        </Link>)}
      </div>
    </section>

    <section aria-labelledby="maldives-explore-guides">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest text-[var(--gold)]">Travel planning</p>
          <h2 id="maldives-explore-guides" className="mt-2 text-2xl font-bold sm:text-3xl">Explore Guides</h2>
        </div>
        <Link href="/guides" className="inline-flex min-h-11 items-center gap-2 text-sm font-semibold text-[var(--gold)]">
          All travel guides <ArrowRight size={16} aria-hidden="true"/>
        </Link>
      </div>
      <div role="region" aria-label="Country travel guides — swipe horizontally" tabIndex={0}
        className="mt-5 flex min-w-0 snap-x snap-mandatory gap-3 overflow-x-auto overscroll-x-contain pb-4 md:grid md:grid-cols-3 md:overflow-visible">
        {countryGuides.map(guide=>{
          const picture=countryGuidePhotos[guide.slug];
          return <Link key={guide.slug} href={"/guides/"+encodeURIComponent(guide.slug)}
            className="group flex w-[75vw] max-w-[315px] shrink-0 snap-start flex-col overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--card)] text-[var(--text)] shadow-sm transition-transform hover:-translate-y-1 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--gold)] md:w-full md:max-w-none">
            <span className="relative flex aspect-[16/9] items-center justify-center overflow-hidden bg-[var(--bg-soft)]">
              {picture?<Image src={picture.src} alt={picture.city+" scenery for "+guide.country+" travel planning"}
                fill sizes="(max-width: 767px) 75vw, 33vw" className="object-cover transition-transform duration-300 group-hover:scale-105"/>:
                <BookOpen size={44} aria-hidden="true" className="text-[var(--gold)]"/>}
            </span>
            <span className="flex flex-1 flex-col gap-2 p-4">
              <span className="text-lg font-bold">{guide.country}</span>
              <span className="line-clamp-2 text-xs leading-5 text-[var(--text-soft)]">{guide.summary}</span>
              <span className="mt-auto inline-flex min-h-11 items-center gap-2 text-sm font-semibold text-[var(--gold)]">
                <BookOpen size={16} aria-hidden="true"/> Open country guide <ArrowRight size={15} aria-hidden="true"/>
              </span>
            </span>
          </Link>;
        })}
      </div>
    </section>

    <section aria-labelledby="maldives-explore-transport">
      <h2 id="maldives-explore-transport" className="text-2xl font-bold sm:text-3xl">Explore Transport</h2>
      <Link href="/transfers"
        className="gth-glass mt-4 flex min-h-[132px] flex-wrap items-center justify-between gap-4 rounded-2xl border border-[var(--border)] bg-[var(--card)] p-5 text-[var(--text)] transition-shadow hover:shadow-lg focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--gold)] sm:p-7">
        <span className="flex items-center gap-4">
          <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl border border-[var(--border)] bg-[var(--bg-soft)] text-[var(--gold)]">
            <CarFront size={26} aria-hidden="true"/>
          </span>
          <span className="min-w-0">
            <span className="block text-lg font-bold">Airport &amp; Local Transfers</span>
            <span className="mt-1 block text-sm leading-6 text-[var(--text-soft)]">
              Explore the existing GTH PRO transport and transfer booking hub.
            </span>
          </span>
        </span>
        <span className="gth-btn-gold inline-flex min-h-11 items-center justify-center gap-2 rounded-xl px-5 text-sm font-semibold">
          Explore Transport <ArrowRight size={16} aria-hidden="true"/>
        </span>
      </Link>
    </section>
  </div>;
}
