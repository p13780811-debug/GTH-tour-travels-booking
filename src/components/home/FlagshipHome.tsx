import Image from "next/image";
import Link from "next/link";
import { ArrowUpRight, Building2, ChartNoAxesCombined, Database, FileSearch, Globe2, Hotel, MapPinned, Plane, Search, ShieldCheck, Sparkles, Users, Zap } from "lucide-react";
import styles from "./FlagshipHome.module.css";

const pillars = [
  {
    id: "estate",
    title: "Real Estate",
    image: "/dubai.jpg",
    alt: "Luxury property architecture at sunset",
    href: "/real-estate",
    eyebrow: "Buy · Sell · Discover",
    description: "Global property intelligence",
    Icon: Building2,
    links: [
      { label: "Explore Properties", href: "/real-estate", Icon: Building2 },
      { label: "Global Markets", href: "/real-estate", Icon: Globe2 },
      { label: "Property Tools", href: "/real-estate/tools", Icon: ChartNoAxesCombined },
      { label: "List a Property", href: "/real-estate/post-property", Icon: ShieldCheck },
    ],
  },
  {
    id: "travel",
    title: "Travel",
    image: "/images/mega/tours.jpg",
    alt: "Cinematic international travel destination",
    href: "/travel",
    eyebrow: "Flights · Hotels · Tours",
    description: "Discover the world",
    Icon: Plane,
    links: [
      { label: "Flights", href: "/flights", Icon: Plane },
      { label: "Hotels", href: "/hotels", Icon: Hotel },
      { label: "Tours", href: "/tours", Icon: MapPinned },
      { label: "Destinations", href: "/destinations", Icon: Globe2 },
    ],
  },
  {
    id: "tender",
    title: "Tender",
    image: "/images/cities/dubai.jpg",
    alt: "Global skyline representing public procurement and infrastructure",
    href: "/tender",
    eyebrow: "Research · Readiness · Sources",
    description: "Source-first opportunities",
    Icon: FileSearch,
    links: [
      { label: "Tender Gateway", href: "/tender", Icon: FileSearch },
      { label: "Find Opportunities", href: "/tender", Icon: Search },
      { label: "Tender Assistant", href: "/tender/assistant", Icon: Sparkles },
      { label: "Business Partners", href: "/partners", Icon: Users },
    ],
  },
] as const;

const capabilities = [
  { title: "AI-powered", detail: "Intelligence", Icon: Sparkles },
  { title: "Data-driven", detail: "Discovery", Icon: Database },
  { title: "Connected", detail: "Technology", Icon: Zap },
  { title: "Source-aware", detail: "Workflows", Icon: ShieldCheck },
  { title: "One global", detail: "Ecosystem", Icon: Globe2 },
] as const;

function BrandGlobe() {
  return (
    <svg className={styles.brandGlobe} viewBox="0 0 180 180" role="img" aria-label="Golden globe with aircraft">
      <defs>
        <linearGradient id="flagship-logo-gold" x1="0" y1="0" x2=".8" y2="1">
          <stop offset="0" stopColor="#fff4ad" /><stop offset=".45" stopColor="#ffe074" /><stop offset="1" stopColor="#e89c0d" />
        </linearGradient>
        <radialGradient id="flagship-sphere" cx=".32" cy=".24" r=".8">
          <stop offset="0" stopColor="#113b56" /><stop offset="1" stopColor="#000a15" />
        </radialGradient>
        <clipPath id="flagship-clip"><circle cx="76" cy="104" r="57" /></clipPath>
      </defs>
      <path d="M34 58C2 83 4 130 28 155c29 29 79 31 109 4 27-24 36-56 22-86" fill="none" stroke="url(#flagship-logo-gold)" strokeWidth="5.8"/>
      <circle cx="76" cy="104" r="61" fill="url(#flagship-logo-gold)" />
      <circle cx="76" cy="104" r="57" fill="url(#flagship-sphere)" />
      <g clipPath="url(#flagship-clip)" fill="url(#flagship-logo-gold)">
        <path d="m65 47 10 1-3 7-6 3 1 7-6 3-4-6 2-10ZM79 48l6 4 4-1 6 5-4 7-9-2-2 4-6-3 1-6ZM96 51l14 4 10 9 10 12 3 13-10-1-5-7-9-1-3 6-11-2-8 4-9-3-4-6 5-4-3-4 7-5 8 4 4-5-6-6Z" />
        <path d="m67 72 7 2 1 7 7 5 10 1 6 9 7 6-2 9-5 3-2 12-9 11-4 11-7 3-6-13 1-8-8-10-4-8-9-3-2-10 4-12 7-5 6 1Z" />
        <path d="m108 100 10-3 4 6 8 4-1 10-7-1-5-7-7-2Zm-7 31 4-2 2 5-4 12-4-2Z" />
        <path d="m16 68 7-6 11-2 8 5-1 8-8 2-3 7-9 4-5 10-7-2Zm14 28 8 2 5 10 3 8-6 3-4-12-7-3Zm11 24 10 4 8 12-3 10-8 10-8-13-3-13Z" />
      </g>
      <circle cx="76" cy="104" r="57" fill="none" stroke="#fff2a1" strokeWidth="1.2" opacity=".8" />
      <path d="M29 66c24-27 59-30 85-14" fill="none" stroke="#fff6ba" strokeWidth="2.1" />
      <g transform="translate(117 5) rotate(37 22 30)">
        <path fill="url(#flagship-logo-gold)" d="M22 0c-2.1 0-3.4 2.1-3.4 4.6v12L0 28.7v4.5l18.6-6.3v12.3l-6.3 4.7v3.3L22 44l9.7 3.2v-3.3l-6.3-4.7V26.9L44 33.2v-4.5L25.4 16.6v-12C25.4 2.1 24.1 0 22 0Z" />
      </g>
    </svg>
  );
}

export default function FlagshipHome() {
  return (
    <main className={styles.site} id="main-content">
      <a className={styles.skipLink} href="#pillars">Skip to platforms</a>
      <section className={styles.hero} aria-labelledby="flagship-heading">
        <div className={styles.earth} aria-hidden="true" />
        <header className={styles.topbar}>
          <Link href="/" aria-label="GTH PRO homepage" className={styles.headerBrand}>GTH <span>PRO</span></Link>
          <nav className={styles.topNav} aria-label="GTH PRO platforms">
            <Link href="/mega-aggregator" className={styles.ecosystemLink}>Ecosystem <ArrowUpRight size={15}/></Link>
            <Link href="/real-estate">Real Estate</Link>
            <Link href="/travel">Travel</Link>
            <Link href="/tender">Tender</Link>
          </nav>
        </header>
        <div className={styles.heroCenter}>
          <h1 className={styles.brand} id="flagship-heading" aria-label="GTH PRO">
            <span className={styles.brandSilver}>GTH</span>
            <span className={styles.brandPro}><span className={styles.brandGold}>PR</span><BrandGlobe /></span>
          </h1>
          <p className={styles.ecosystemTitle}>Global Intelligence Ecosystem</p>
          <nav className={styles.sectorNav} aria-label="Explore the three GTH PRO pillars">
            <Link href="/real-estate">Real Estate</Link>
            <Link href="/travel">Travel</Link>
            <Link href="/tender">Tender</Link>
          </nav>
        </div>
        <div className={styles.motto} aria-hidden="true"><span>Ideas</span><span>Technology</span><span>Solutions</span><span>Global Impact</span></div>
        <p className={styles.tagline}><span>From opportunities to real results</span></p>
      </section>

      <section className={styles.pillars} id="pillars" aria-label="Explore Real Estate, Travel and Tender platforms">
        {pillars.map(({id,title,image,alt,href,eyebrow,description,Icon,links})=>(
          <article key={id} className={styles.pillar}>
            <Image src={image} alt={alt} fill priority={id==="travel"} sizes="(max-width: 680px) 100vw, 34vw" className={styles.pillarImage} />
            <div className={styles.pillarShade} aria-hidden="true"/>
            <div className={styles.pillarTitle}>
              <Icon className={styles.pillarIcon} strokeWidth={1.4}/>
              <div><h2>{title}</h2><p>{eyebrow}<span>{description}</span></p></div>
            </div>
            <Link href={href} className={styles.panelEntry} aria-label={`Explore ${title}`}><span>Explore {title}</span><ArrowUpRight size={20}/></Link>
            <nav className={styles.featureTray} aria-label={`${title} features`}>
              {links.map(({label,href:featureHref,Icon:FeatureIcon})=>(
                <Link key={label} href={featureHref} className={styles.feature}>
                  <FeatureIcon strokeWidth={1.7} aria-hidden="true"/><span>{label}</span>
                </Link>
              ))}
            </nav>
          </article>
        ))}
      </section>

      <section className={styles.capabilities} aria-label="GTH PRO technology values">
        {capabilities.map(({title,detail,Icon})=>(
          <div className={styles.capability} key={title}>
            <Icon aria-hidden="true" strokeWidth={1.5}/><p>{title}<span>{detail}</span></p>
          </div>
        ))}
      </section>
      <footer className={styles.cityFooter}>
        <div className={styles.cityOverlay}/>
        <div className={styles.footerContent}>
          <p className={styles.footerEyebrow}>One global vision. Three connected platforms.</p>
          <Link href="/mega-aggregator" className={styles.portalLink}><Globe2 aria-hidden="true" size={28}/><span>Enter the GTH PRO Ecosystem</span><ArrowUpRight aria-hidden="true" size={25}/></Link>
          <p className={styles.footerCategory}>Real Estate <span>·</span> Travel <span>·</span> Tenders</p>
          <div className={styles.footerSmall}><span>© {new Date().getFullYear()} GTH PRO · Global Technical Hub</span><Link href="/contact">Contact & Partnerships</Link></div>
        </div>
      </footer>
    </main>
  );
}
