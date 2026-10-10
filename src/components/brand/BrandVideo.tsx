"use client"

import { useEffect, useRef, useState } from "react"

type Props = { name: "property-story" | "travel-story" | "security-story" | "logo-motion"; className?: string; label: string; controls?: boolean }

export default function BrandVideo({ name, className = "", label, controls = true }: Props) {
 const video = useRef<HTMLVideoElement>(null)
 const [failed, setFailed] = useState(false)
 useEffect(() => {
  const element = video.current
  if (!element) return
  const preference = window.matchMedia("(prefers-reduced-motion: reduce)")
  let visible = false
  const sync = () => {
   if (!visible || document.hidden || preference.matches) element.pause()
   else void element.play().catch(() => { /* Poster remains visible if autoplay is blocked. */ })
  }
  const observer = new IntersectionObserver(entries => { visible = entries[0]?.isIntersecting ?? false; sync() })
  observer.observe(element)
  preference.addEventListener("change",sync)
  document.addEventListener("visibilitychange",sync)
  return () => { observer.disconnect(); preference.removeEventListener("change",sync); document.removeEventListener("visibilitychange",sync); element.pause() }
 }, [name, failed])
 if (failed) return <img src={`/brand/${name}.jpg`} alt={label} className={className} />
 return <video ref={video} className={className} src={`/brand/${name}.mp4`} poster={`/brand/${name}.jpg`} muted loop={controls} playsInline controls={controls} preload="none" aria-label={label} onTimeUpdate={() => { if (!controls && video.current && video.current.currentTime >= 5) video.current.pause() }} onError={() => setFailed(true)} />
}
