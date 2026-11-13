import Link from "next/link";
import {ArrowUpRight, Building2, FileSearch, Globe2, Plane, Ticket, ShieldCheck} from "lucide-react";
import styles from "./FlagshipHome.module.css";

/**
 * Plain, server-rendered public capability directory for human visitors and
 * text-only crawlers. All links point to existing public pages. No client
 * API calls, invented live metrics, hidden routes or privileged system details.
 */
const capabilityGroups = [
  {
    id: "real-estate",
    title: "Real Estate",
    eyebrow: "Property discovery and research",
    Icon: Building2,
    description:
      "Browse property markets, review recorded project-registry information and use buyer planning tools. Registry records and marketplace listings are identified separately.",
    actions: [
      {label: "Explore property markets", href: "/real-estate"},
      {label: "Browse project registry", href: "/real-estate/registry"},
      {label: "Open buyer planning tools", href: "/real-estate/tools"},
    ],
  },
  {
    id: "travel",
    title: "Travel",
    eyebrow: "Search, compare and plan journeys",
    Icon: Plane,
    description:
      "Discover flight, hotel, tour and destination options. Where a provider handles booking, it confirms the final price, availability and checkout.",
    actions: [
      {label: "Search flights", href: "/flights"},
      {label: "Explore hotels", href: "/hotels"},
      {label: "Find tours and experiences", href: "/tours"},
      {label: "Browse destinations", href: "/destinations"},
    ],
  },
  {
    id: "tenders",
    title: "Tender",
    eyebrow: "Public procurement and bid readiness",
    Icon: FileSearch,
    description:
      "Discover public tender notices, inspect source information and explore tender-assistance services. Always confirm deadlines and eligibility with the issuing authority.",
    actions: [
      {label: "Explore tender opportunities", href: "/tender"},
      {label: "Review tender services", href: "/tender/services"},
      {label: "Explore business partnerships", href: "/partners"},
    ],
  },
  {
    id:"tickets",
    title:"Worldwide Tickets",
    eyebrow:"Events, sports and venue research",
    Icon:Ticket,
    description:"Find public ticket-source directories for stadium events, music, theatre, festivals and attractions. Sellers confirm final availability and pricing.",
    actions:[
      {label:"Explore worldwide ticket sources",href:"/tickets"},
      {label:"Browse stadium and venue guides",href:"/stadiums"},
      {label:"Read ticket buying guides",href:"/blog"},
    ],
  },
] as const;

export default function HomeCapabilityProof() {
  return (
    <section className={styles.proofSection} id="platform-workflows" aria-labelledby="gth-public-capabilities">
      <div className={styles.proofInner}>
        <header className={styles.proofIntro}>
          <p className={styles.proofEyebrow}><ShieldCheck size={16} aria-hidden="true"/> Explore the GTH PRO platform</p>
          <h2 id="gth-public-capabilities">Four connected platforms. Real tools and searchable public pages.</h2>
          <p>
            GTH PRO is more than a homepage: explore property records and buyer tools, travel
            discovery and partner booking paths, public tender research and worldwide event ticket sources. Choose a service
            below to open its own dedicated page.
          </p>
        </header>

        <div className={styles.proofGrid}>
          {capabilityGroups.map(({id,title,eyebrow,description,Icon,actions}) => (
            <article className={styles.proofCard} key={id} aria-labelledby={"gth-proof-"+id}>
              <div className={styles.proofCardHeading}>
                <Icon size={25} strokeWidth={1.7} aria-hidden="true"/>
                <div>
                  <p className={styles.proofCardEyebrow}>{eyebrow}</p>
                  <h3 id={"gth-proof-"+id}>{title}</h3>
                </div>
              </div>
              <p className={styles.proofCardDescription}>{description}</p>
              <nav className={styles.proofLinks} aria-label={title+" public tools and services"}>
                {actions.map(({label,href}) => (
                  <Link href={href} key={href} prefetch={false} className={styles.proofLink}>
                    <span>{label}</span><ArrowUpRight size={16} aria-hidden="true"/>
                  </Link>
                ))}
              </nav>
            </article>
          ))}
        </div>

        <div className={styles.proofFooter}>
          <p>
            <Globe2 size={17} aria-hidden="true"/>
            Public pages explain available workflows; directory records do not by themselves
            guarantee verified inventory, real-time pricing, or a supplier booking.
          </p>
          <Link href="/mega-aggregator" prefetch={false} className={styles.proofExplore}>
            Explore the full ecosystem <ArrowUpRight size={17} aria-hidden="true"/>
          </Link>
        </div>
      </div>
    </section>
  );
}
