"use client"

import { useEffect, useRef, useState } from "react"
import styles from "./Listing.module.css"

const houseAds = [
  {
    id: "thali-treats",
    shortLabel: "Thali",
    eyebrow: "Food brand · Social campaign",
    title: "Thali Treats Palava",
    description: "Cinematic local-business campaign created for Thali Treats Palava.",
    video: "https://gth-pro-portfolio.pages.dev/assets/thali-treats-palava-ad.mp4",
    href: "https://thali-treats-palava.lovable.app/",
    cta: "Visit Thali Treats",
    fit: "contain",
  },
  {
    id: "gth-travel",
    shortLabel: "Travel",
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
    shortLabel: "GTH PRO",
    eyebrow: "Technology · Creative portfolio",
    title: "GTH PRO Portfolio",
    description: "AI, automation, web products and cinematic campaign work from GTH PRO.",
    video: "https://gth-pro-portfolio.pages.dev/assets/gth-pro-capabilities-ad.mp4",
    href: "https://gth-pro-portfolio.pages.dev/",
    cta: "Open GTH PRO Portfolio",
    fit: "contain",
  },
] as const

function HouseAdVideo({
  src,
  title,
  fit,
  onEnded,
}: {
  src:string
  title:string
  fit:"cover"|"contain"
  onEnded:() => void
}) {
  const ref = useRef<HTMLVideoElement | null>(null)
  const [failed,setFailed] = useState(false)

  useEffect(() => {
    setFailed(false)
  }, [src])

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
  }, [src])

  if (failed) return <div className={styles.houseAdFallback}><p className="font-bold">Campaign preview unavailable</p><p className="text-xs opacity-70 mt-2">Use the campaign link below to continue.</p></div>

  return <video
    ref={ref}
    className={styles.houseAdVideo}
    src={src}
    aria-label={title}
    muted
    playsInline
    controls
    preload="metadata"
    onEnded={onEnded}
    onError={() => setFailed(true)}
    style={{ objectFit:fit }}
  />
}

export default function OwnerProjectAds() {
  const [active,setActive] = useState(0)
  const ad = houseAds[active]

  const next = () => setActive(index => (index + 1) % houseAds.length)

  return <aside aria-label="Advertisement: GTH PRO house campaigns" className={`gth-glass ${styles.ownerAds}`}>
    <div className={styles.houseAdHeader}>
      <div>
        <p className={styles.adDisclosure}>Advertisement · GTH PRO house campaigns</p>
        <h2 className="text-xl font-bold mt-2">Featured from our network</h2>
      </div>
      <span className={styles.houseAdLabel}>House ad</span>
    </div>

    <article className={styles.houseAdCard}>
      <div className={styles.houseAdMedia}>
        <HouseAdVideo
          key={ad.id}
          src={ad.video}
          title={`${ad.title} advertisement`}
          fit={ad.fit}
          onEnded={next}
        />
      </div>
      <div className={styles.houseAdBody}>
        <p className="text-xs opacity-70">{ad.eyebrow}</p>
        <h3 className="font-bold mt-2">{ad.title}</h3>
        <p className="text-sm opacity-70 leading-6 mt-2">{ad.description}</p>
        <a href={ad.href} target="_blank" rel="noopener noreferrer" className={`gth-btn ${styles.action} mt-4`}>
          {ad.cta}<span className="sr-only"> (opens in a new tab)</span>
        </a>
      </div>
    </article>

    <div className={styles.houseAdSwitcher} aria-label="Choose a GTH PRO house advertisement">
      {houseAds.map((item,index) => <button
        key={item.id}
        type="button"
        aria-pressed={index === active}
        onClick={() => setActive(index)}
      >
        {item.shortLabel}
      </button>)}
    </div>

    <a href="https://gth-pro-portfolio.pages.dev/" target="_blank" rel="noopener noreferrer" className="text-sm underline inline-flex items-center min-h-11 mt-3">
      View full GTH PRO portfolio<span className="sr-only"> (opens in a new tab)</span>
    </a>
  </aside>
}
