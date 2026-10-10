import type { Metadata } from "next"
import Link from "next/link"
import { portfolioProjects } from "@/lib/portfolio/projects"
import styles from "@/components/real-estate/Listing.module.css"

const title = "Our project portfolio | GTH PRO"
const description = "Explore our food business website, travel hub and real estate platform."
const url = "https://gth-pro.vercel.app/real-estate/portfolio"
export const metadata: Metadata = {
 title, description,
 alternates: { canonical: url },
 openGraph: { title, description, url, siteName: "GTH PRO", type: "website" },
 twitter: { card: "summary", title, description },
}

export default function PortfolioPage() {
 return <main className="gth-container pt-8 pb-28">
  <Link href="/real-estate" className="text-sm underline inline-flex items-center min-h-11">Back to real estate</Link>
  <h1 className="text-3xl md:text-4xl font-bold mt-6">Our project portfolio</h1>
  <p className="opacity-70 leading-7 mt-4 max-w-2xl">Explore websites and platforms from our work. Each project links to its own website.</p>
  <div className={styles.guideGrid}>{portfolioProjects.map(project => <article key={project.id} className="gth-glass">
   <p className="text-xs opacity-70">{project.category}</p>
   <h2 className="text-xl font-bold mt-3">{project.title}</h2>
   <p className="text-sm opacity-70 leading-7 mt-3">{project.description}</p>
   <Link href={project.href} className={`gth-btn-gold ${styles.action} mt-5`} target={project.href.startsWith("https://") ? "_blank" : undefined} rel={project.href.startsWith("https://") ? "noopener noreferrer" : undefined}>Visit website{project.href.startsWith("https://") && <span className="sr-only"> (opens in a new tab)</span>}</Link>
  </article>)}</div>
 </main>
}
