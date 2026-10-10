"use client"
import { useEffect, useRef, useState, type MouseEvent } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { Menu, X } from "lucide-react"
import BrandVideo from "@/components/brand/BrandVideo"
import ThemeToggle from "@/components/ThemeToggle"
import styles from "./Listing.module.css"
const links = [{href:"/real-estate",label:"Explore"},{href:"/real-estate?listing=buy",label:"Buy"},{href:"/real-estate?listing=rent",label:"Rent"},{href:"/real-estate/saved",label:"Saved & compare"},{href:"/real-estate/tools",label:"Property tools"}]
export default function EstateHeader() {
 const pathname = usePathname()
 const [open,setOpen] = useState(false)
 const toggle = useRef<HTMLButtonElement>(null)
 useEffect(() => { setOpen(false) },[pathname])
 useEffect(() => { const close = (event:KeyboardEvent) => { if(event.key === "Escape") { setOpen(false); toggle.current?.focus() } }; window.addEventListener("keydown",close); return () => window.removeEventListener("keydown",close) },[])
 const navigate = (event:MouseEvent<HTMLAnchorElement>,href:string) => {
  if(pathname === "/real-estate" && (href === "/real-estate" || href.startsWith("/real-estate?")) && !event.metaKey && !event.ctrlKey && !event.shiftKey && !event.altKey) {
   event.preventDefault(); window.history.pushState(null,"",href); window.dispatchEvent(new Event("gth-discovery-filters")); window.dispatchEvent(new Event("gth-search-load"))
  }
 }
 return <header className={styles.estateHeader}><div className={`gth-container ${styles.headerRow}`}>
  <Link href="/real-estate" onClick={event => navigate(event,"/real-estate")} className={styles.brand} aria-label="GTH PRO Real Estate home"><BrandVideo name="logo-motion" label="GTH PRO animated logo" controls={false} className={styles.brandLogo}/><span><strong>GTH PRO</strong><small>Real Estate</small></span></Link>
  <nav aria-label="Primary real estate navigation" className={styles.desktopNav}>{links.map(link => <Link key={link.href} href={link.href} onClick={event => navigate(event,link.href)} aria-current={!link.href.includes("?") && pathname === link.href ? "page" : undefined}>{link.label}</Link>)}</nav>
  <div className={styles.headerActions}><Link href="/real-estate/post-property" className={`gth-btn-gold ${styles.action}`}>List property</Link><Link href="/real-estate/profile" className={styles.accountLink}>Account</Link><ThemeToggle/><button ref={toggle} type="button" className={`gth-btn ${styles.menuToggle}`} aria-label={open ? "Close navigation" : "Open navigation"} aria-expanded={open} aria-controls="estate-menu" onClick={() => setOpen(value => !value)}>{open ? <X size={20}/> : <Menu size={20}/>}</button></div>
 </div>{open && <nav id="estate-menu" aria-label="Mobile property menu" className={`gth-container ${styles.mobileMenu}`}>{[...links,{href:"/real-estate/profile",label:"Your account"},{href:"/",label:"GTH PRO ecosystem"}].map(link => <Link key={link.href} href={link.href} onClick={event => { setOpen(false); navigate(event,link.href) }}>{link.label}</Link>)}</nav>}</header>
}
