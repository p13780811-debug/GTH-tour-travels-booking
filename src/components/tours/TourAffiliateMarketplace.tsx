import Image from "next/image";
import Link from "next/link";
import { ArrowUpRight, ShieldCheck } from "lucide-react";
import TiqetsPartnerWidgets from "./TiqetsPartnerWidgets";
import TourCarousel from "./TourCarousel";
import { EMPTY_TOUR_SEARCH, TOUR_CATEGORIES, EXPERIENCE_MODES, experienceCategories, tourDiscoveryHref, type TourSearch } from "@/lib/tours/discovery";
import {partnerSearchHref} from "@/lib/travel/partner-search";

// All destination photography comes from existing GTH PRO local assets.
// It illustrates travel themes; it does not represent a verified supplier
// product, tour date, inventory or specific package.
const partners = [
  {
    name: "WeGoTrip", category: "Audio & city walks",
    description: "Self-guided audio tours",
    image: "/images/cities/london.jpg",
    imageAlt: "London destination travel scenery",
    href: "https://wegotrip.tpo.lv/ZQjE9yR2", external: true,
  },
  {
    name: "Tiqets", category: "Attraction tickets",
    description: "Museums & landmarks",
    image: "/images/paris1.jpg",
    imageAlt: "Paris travel scenery",
    href: "#tiqets-partners-heading", external: false,
  },
  {
    name: "Klook", category: "Tours & activities",
    description: "Activities & local trips",
    image: "/images/cities/bali.jpg",
    imageAlt: "Bali tropical landscape",
    href: "https://klook.tpo.lv/IKb6eSUe", external: true,
  },
  {
    name: "Go City", category: "Sightseeing passes",
    description: "Multi-attraction passes",
    image: "/images/cities/singapore.jpg",
    imageAlt: "Singapore city travel scenery",
    href: "https://gocity.tpo.lv/NdfDWRGS", external: true,
  },
  {
    name: "KKday", category: "Day trips & experiences",
    description: "Explore destinations",
    image: "/images/cities/tokyo.jpg",
    imageAlt: "Tokyo city travel scenery",
    href: "https://kkday.tpo.lv/ytfvDLam", external: true,
  },
] as const;

const categories = [
  {
    name: "Guided city tours", description: "Walks & local guides",
    image: "/images/cities/dubai.jpg", imageAlt: "Dubai city skyline",
    href: "https://wegotrip.tpo.lv/ZQjE9yR2", external: true,
  },
  {
    name: "Attraction tickets", description: "Museums & landmarks",
    image: "/images/paris2.jpg", imageAlt: "Paris landmark travel scenery",
    href: "#tiqets-partners-heading", external: false,
  },
  {
    name: "Audio tours", description: "Explore at your pace",
    image: "/images/cities/london.jpg", imageAlt: "London city travel scenery",
    href: "https://wegotrip.tpo.lv/ZQjE9yR2", external: true,
  },
  {
    name: "City passes", description: "More attractions together",
    image: "/images/cities/singapore.jpg", imageAlt: "Singapore city attractions scenery",
    href: "https://gocity.tpo.lv/NdfDWRGS", external: true,
  },
  {
    name: "Day trips", description: "Discover nearby places",
    image: "/images/cities/bangkok.jpg", imageAlt: "Bangkok destination scenery",
    href: "https://kkday.tpo.lv/ytfvDLam", external: true,
  },
  {
    name: "Outdoor experiences", description: "Nature & adventures",
    image: "/images/cities/bali.jpg", imageAlt: "Bali outdoor destination scenery",
    href: "https://klook.tpo.lv/IKb6eSUe", external: true,
  },
] as const;

type CardItem = {name:string;description:string;category?:string;image:string;imageAlt:string;href:string;external:boolean;action?:string;current?:boolean};

function TourImageCard({ item }: { item: CardItem }) {
  const cardClass = "group flex w-[188px] shrink-0 snap-start flex-col overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--card)] text-[var(--text)] shadow-sm transition duration-200 hover:-translate-y-0.5 hover:border-[var(--gold)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--gold)] sm:w-[206px]";
  const body = (
    <>
      <div className="relative h-[112px] w-full overflow-hidden bg-[var(--bg)] sm:h-[122px]">
        <Image
          src={item.image} alt={item.imageAlt} fill
          sizes="(max-width: 640px) 188px, 206px"
          quality={85}
          className="object-cover object-center transition-transform duration-300 group-hover:scale-105"
        />
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-transparent" aria-hidden="true" />
      </div>
      <span className="flex min-h-[93px] flex-col px-3 pb-3 pt-2.5">
        <span className="flex items-start justify-between gap-1.5 text-[14px] font-bold leading-[19px]">
          <span className="line-clamp-2">{item.name}</span>
          <ArrowUpRight size={16} className="mt-0.5 shrink-0 text-[var(--gold)]" aria-hidden="true" />
        </span>
        <span className="mt-1 line-clamp-2 text-[11px] leading-[16px] text-[var(--text-soft)]">
          {item.category || item.description}
        </span>
        <span className="mt-auto pt-2 text-[10px] font-medium text-[var(--text-soft)]">
          {item.action || (item.category ? item.description : "Explore partner options")}
        </span>
      </span>
    </>
  );

  return item.external ? (
    <a href={item.href} key={item.name} target="_blank" rel="noopener noreferrer sponsored"
      className={cardClass}>{body}</a>
  ) : (
    <Link href={item.href} key={item.name} aria-current={item.current?"page":undefined} className={cardClass}>{body}</Link>
  );
}

export default function TourAffiliateMarketplace({search=EMPTY_TOUR_SEARCH,basePath="/tours"}:{search?:TourSearch;basePath?:"/tours"|"/activities"}) {
  const mode=EXPERIENCE_MODES[basePath];
  const allowed=experienceCategories(basePath);
  return (
    <section aria-labelledby="tours-partners-heading" className="mx-auto max-w-7xl px-4 py-8 sm:px-6 md:py-10">
      <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[var(--gold)]">
            {basePath==="/tours"?"Guided tours · Audio walks · Day trips":"Tickets · City passes · Outdoor experiences"}
          </p>
          <h2 id="tours-partners-heading" className="mt-1.5 text-xl font-bold sm:text-2xl">
            Explore with global {mode.label.toLowerCase()} partners
          </h2>
          <p className="mt-2 max-w-3xl text-xs leading-5 text-[var(--text-soft)]">
            Browse established travel partners. Supplier bookings and availability are managed outside GTH PRO.
          </p>
        </div>
        <Link href="/affiliate-disclosure" className="text-xs text-[var(--text-soft)] underline">Affiliate disclosure</Link>
      </div>

      <TourCarousel label="Tour booking partners">
        {partners.filter(item=>basePath==="/activities"||item.name!=="Tiqets"&&item.name!=="Go City").map((item) => <TourImageCard key={item.name} item={item.name==="Klook"&&partnerSearchHref(basePath==="/tours"?"tours":"activities",search.city) ? {...item,href:partnerSearchHref(basePath==="/tours"?"tours":"activities",search.city)!,action:"Explore "+search.city+" experiences"} : item} />)}
      </TourCarousel>

      <div className="mb-3 mt-7">
        <h3 className="text-lg font-bold sm:text-xl">Find your experience</h3>
        <p className="mt-1 text-xs leading-5 text-[var(--text-soft)]">Choose an experience type{search.city?" for "+search.city:""}. Your destination stays selected.</p>
      </div>
      <TourCarousel label="Tour experience categories">
        {categories.flatMap((item,index) => allowed.some(category=>category.value===TOUR_CATEGORIES[index].value)?[{item,index}]:[]).map(({item,index}) => <TourImageCard key={item.name} item={{
          ...item, external:false,
          href:tourDiscoveryHref(basePath,search,"rail",{category:TOUR_CATEGORIES[index].value,page:1}),
          current:search.category===TOUR_CATEGORIES[index].value, action:"Choose this experience type",
        }} />)}
      </TourCarousel>

      {basePath==="/activities"&&<TiqetsPartnerWidgets />}

      <p className="mt-5 flex items-start gap-2 text-xs leading-6 text-[var(--text-soft)]">
        <ShieldCheck size={17} className="mt-1 shrink-0" aria-hidden="true" />
        Destination imagery is illustrative, not a listing or confirmed tour offer.
        All program links and embedded widgets lead to independent suppliers. GTH PRO does not issue tickets,
        reserve provider inventory or guarantee tour availability, pricing, language support or cancellations.
      </p>
    </section>
  );
}
