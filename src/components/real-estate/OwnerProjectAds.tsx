import Link from "next/link"
import { portfolioProjects } from "@/lib/portfolio/projects"
import styles from "./Listing.module.css"

export default function OwnerProjectAds() {
 const projects = portfolioProjects.filter(project => project.advertise).slice(0, 3)
 if (!projects.length) return null
 return <section aria-label="Advertisement: GTH PRO owner projects" className={`gth-glass ${styles.ownerAds}`}>
  <p className={styles.adDisclosure}>Advertisement · Our projects</p>
  <h2 className="text-xl font-bold mt-3">Discover our work</h2>
  <div className={styles.adProjects}>{projects.map(project => <article key={project.id}>
   <p className="text-xs opacity-70">{project.category}</p>
   <h3 className="font-bold mt-2">{project.title}</h3>
   <p className="text-sm opacity-70 leading-6 mt-2">{project.description}</p>
   <Link href={project.href} className={`gth-btn ${styles.action}`} target={project.href.startsWith("https://") ? "_blank" : undefined} rel={project.href.startsWith("https://") ? "noopener noreferrer" : undefined}>Visit website{project.href.startsWith("https://") && <span className="sr-only"> (opens in a new tab)</span>}</Link>
  </article>)}</div>
  <Link href="/real-estate/portfolio" className="text-sm underline inline-flex items-center min-h-11">View our portfolio</Link>
 </section>
}
