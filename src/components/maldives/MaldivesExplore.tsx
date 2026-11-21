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
  {name:"Maldives",photo:"/images/cities/maldives.jpg",photoCity:"Maldives"},
  {name:"Sri Lanka",photo:"/images/cities/colombo.jpg",photoCity:"Colombo"},
  {name:"China",photo:"/images/cities/beijing.jpg",photoCity:"Beijing"},
  {name:"Hungary",photo:"/images/cities/budapest.jpg",photoCity:"Budapest"},
  {name:"South Africa",photo:"/images/cities/cape-town.jpg",photoCity:"Cape Town"},
  {name:"Denmark",photo:"/images/cities/copenhagen.jpg",photoCity:"Copenhagen"},
  {name:"Ireland",photo:"/images/cities/dublin.jpg",photoCity:"Dublin"},
  {name:"Switzerland",photo:"/images/cities/geneva.jpg",photoCity:"Geneva"},
  {name:"Vietnam",photo:"/images/cities/hanoi.jpg",photoCity:"Hanoi"},
  {name:"Finland",photo:"/images/cities/helsinki.jpg",photoCity:"Helsinki"},
  {name:"South Korea",photo:"/images/cities/seoul.jpg",photoCity:"Seoul"},
  {name:"Taiwan",photo:"/images/cities/taipei.jpg",photoCity:"Taipei"},
  {name:"Netherlands",photo:"/images/cities/amsterdam.jpg",photoCity:"Amsterdam"},
  {name:"Spain",photo:"/images/cities/barcelona.jpg",photoCity:"Barcelona"},
  {name:"Greece",photo:"/images/cities/athens.jpg",photoCity:"Athens"},
  {name:"Poland",photo:"/images/cities/krakow.jpg",photoCity:"Krakow"},
  {name:"Canada",photo:"/images/cities/toronto.jpg",photoCity:"Toronto"},
  {name:"Nepal",photo:"/images/cities/kathmandu.jpg",photoCity:"Kathmandu"},
  {name:"Malaysia",photo:"/images/cities/kuala-lumpur.jpg",photoCity:"Kuala Lumpur"},
  {name:"Philippines",photo:"/images/cities/manila.jpg",photoCity:"Manila"},
  {name:"Norway",photo:"/images/cities/oslo.jpg",photoCity:"Oslo"},
  {name:"Portugal",photo:"/images/cities/lisbon.jpg",photoCity:"Lisbon"},
  {name:"Czechia",photo:"/images/cities/prague.jpg",photoCity:"Prague"},
  {name:"Austria",photo:"/images/cities/vienna.jpg",photoCity:"Vienna"},
  {name:"Sweden",photo:"/images/cities/stockholm.jpg",photoCity:"Stockholm"},
  {name:"Italy",photo:"/images/cities/rome.jpg",photoCity:"Rome"},
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
          <p className="text-xs font-semibold uppercase tracking-widest text-[var(--gold)]">Featured countries · worldwide</p>
          <h2 id="maldives-explore-destinations" className="mt-2 text-2xl font-bold sm:text-3xl">Explore Destinations</h2>
        </div>
        <Link href="/destinations" className="inline-flex min-h-11 items-center gap-2 text-sm font-semibold text-[var(--gold)]">
          Browse all countries &amp; cities <ArrowRight size={16} aria-hidden="true"/>
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
        className="gth-glass group mt-4 flex min-w-0 flex-col overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--card)] text-[var(--text)] transition-shadow hover:shadow-lg focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--gold)] sm:flex-row">
        <span className="relative block aspect-[16/9] w-full overflow-hidden bg-[var(--bg-soft)] sm:aspect-auto sm:min-h-[185px] sm:w-[37%] sm:shrink-0">
          <Image src="/images/mega/transfers.jpg" alt="Ground transport and airport transfers"
            fill loading="lazy" sizes="(max-width:640px) 100vw, 400px"
            className="object-cover transition-transform duration-300 group-hover:scale-105"/>
        </span>
        <span className="flex min-w-0 flex-1 flex-col justify-center gap-3 p-5 sm:p-7">
          <span className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-[var(--gold)]">
            <CarFront size={17} aria-hidden="true"/> GTH Mobility
          </span>
          <span className="block text-xl font-bold">Airport &amp; Local Transfers</span>
          <span className="block text-sm leading-6 text-[var(--text-soft)]">
            Compare transfers and airport pickups through the existing GTH PRO transport page.
          </span>
          <span className="gth-btn-gold inline-flex min-h-11 w-fit items-center justify-center gap-2 rounded-xl px-5 text-sm font-semibold">
            Explore Transport <ArrowRight size={16} aria-hidden="true"/>
          </span>
        </span>
      </Link>
    </section>
  </div>;
}
