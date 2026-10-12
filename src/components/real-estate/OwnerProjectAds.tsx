"use client"

import { useEffect, useRef } from "react"
import styles from "./Listing.module.css"

const houseAds = [
  {
    id: "thali-treats",
    eyebrow: "Food brand · Social campaign",
    title: "Thali Treats Palava",
    description: "Cinematic local-business campaign created for Thali Treats Palava.",
    video: "/ads/thali-treats-palava-ad.mp4",
    href: "https://thali-treats-palava.lovable.app/",
    cta: "Visit Thali Treats",
    fit: "contain",
  },
  {
    id: "gth-travel",
    eyebrow: "Travel · GTH PRO",
    title: "GTH PRO Travel",
    description: "Flights, hotels, tours and destination discovery from the GTH PRO travel ecosystem.",
    video: "/brand/travel-story.mp4",
    href: "https://gth-tour-travels-booking.vercel.app/",
    cta: "Explore GTH PRO Travel",
    fit: "cover",
  },
  {
    id: "gth-portfolio",
    eyebrow: "Technology · Creative portfolio",
    title: "GTH PRO Portfolio",
    description: "AI, automation, web products and cinematic campaign work from GTH PRO.",
    video: "/brand/security-story.mp4",
    href: "https://gth-pro-portfolio.pages.dev/",
    cta: "Open GTH PRO Portfolio",
    fit: "cover",
  },
] as const

function HouseAdVideo({ src, title, fit }: { src:string; title:string; fit:"cover"|"contain" }) {
  const ref = useRef<HTMLVideoElement | null>(null)

  useEffect(() => {
    const video = ref.current
    if (!video || typeof IntersectionObserver === "undefined") return

    const observer = new IntersectionObserver(entries => {
      for (const entry of entries) {
        if (entry.isIntersecting && entry.intersectionRatio >= 0.35) {
          video.play().catch(() => {})
        } else {
          video.pause()
        }
      }
    }, { threshold:[0, .35, .75] })

    observer.observe(video)
    return () => observer.disconnect()
  }, [])

  return <video
    ref={ref}
    className={styles.houseAdVideo}
    src={src}
    aria-label={title}
    muted
    loop
    playsInline
    controls
    preload="metadata"
    style={{ objectFit:fit }}
  />
}

export default function OwnerProjectAds() {
  return <aside aria-label="Advertisement: GTH PRO house campaigns" className={`gth-glass ${styles.ownerAds}`}>
    <div className={styles.houseAdHeader}>
      <div>
        <p className={styles.adDisclosure}>Advertisement · GTH PRO house campaigns</p>
        <h2 className="text-xl font-bold mt-2">Featured from our network</h2>
      </div>
      <span className={styles.houseAdLabel}>House ads</span>
    </div>

    <div className={styles.houseAdStack}>
      {houseAds.map(ad => <article key={ad.id} className={styles.houseAdCard}>
        <div className={styles.houseAdMedia}>
          <HouseAdVideo src={ad.video} title={`${ad.title} advertisement`} fit={ad.fit} />
        </div>
        <div className={styles.houseAdBody}>
          <p className="text-xs opacity-70">{ad.eyebrow}</p>
          <h3 className="font-bold mt-2">{ad.title}</h3>
          <p className="text-sm opacity-70 leading-6 mt-2">{ad.description}</p>
          <a href={ad.href} target="_blank" rel="noopener noreferrer" className={`gth-btn ${styles.action} mt-4`}>
            {ad.cta}<span className="sr-only"> (opens in a new tab)</span>
          </a>
        </div>
      </article>)}
    </div>

    <a href="https://gth-pro-portfolio.pages.dev/" target="_blank" rel="noopener noreferrer" className="text-sm underline inline-flex items-center min-h-11 mt-4">
      View full GTH PRO portfolio<span className="sr-only"> (opens in a new tab)</span>
    </a>
  </aside>
}
