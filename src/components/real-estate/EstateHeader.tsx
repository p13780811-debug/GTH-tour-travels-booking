"use client"

import { useEffect, useState } from "react"
import { usePathname } from "next/navigation"
import Link from "next/link"
import { Building2, ChevronDown, Globe2, Heart, Menu, UserRound, X } from "lucide-react"
import ThemeToggle from "@/components/ThemeToggle"
import BrandVideo from "@/components/brand/BrandVideo"

const links = [
 { href: "/real-estate", label: "Explore" },
 { href: "/real-estate?listing=buy", label: "Buy" },
 { href: "/real-estate?listing=rent", label: "Rent" },
 { href: "/real-estate/saved", label: "Saved & compare", icon: Heart },
 { href: "/real-estate/post-property", label: "List property", icon: Building2 },
 { href: "/real-estate/profile", label: "Account", icon: UserRound },
]

export default function EstateHeader() {
 const [open, setOpen] = useState(false)
 const pathname = usePathname()
 useEffect(() => { setOpen(false) }, [pathname])
 useEffect(() => { if (!open) return; const dismiss = (event: KeyboardEvent) => { if (event.key === "Escape") setOpen(false) }; window.addEventListener("keydown", dismiss); return () => window.removeEventListener("keydown", dismiss) }, [open])
 return <header className="sticky top-0 z-[120] border-b border-[var(--border)] bg-[var(--card-strong)] backdrop-blur-xl">
  <div className="gth-container flex min-h-[76px] items-center justify-between gap-3">
   <Link href="/" className="flex shrink-0 items-center gap-2.5" aria-label="GTH PRO ecosystem home">
    <div className="h-10 w-10 overflow-hidden rounded-full border border-[var(--border)]"><BrandVideo name="logo-motion" label="GTH PRO animated logo" controls={false} className="h-full w-full object-cover" /></div>
    <span className="flex flex-col leading-tight"><strong className="text-lg tracking-tight">GTH <span className="gold-text">PRO</span></strong><small className="text-[10px] tracking-[.16em] text-[var(--muted)] uppercase">Real Estate</small></span>
   </Link>
   <nav aria-label="Real estate primary navigation" className="hidden xl:flex items-center gap-1">
    {links.map(link => <Link key={link.href} href={link.href} className="flex min-h-11 items-center gap-1.5 rounded-xl px-3 text-[13px] font-semibold text-[var(--text)] transition hover:bg-[var(--surface-2)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--primary)]">{link.icon && <link.icon size={15} aria-hidden="true" />}{link.label}</Link>)}
   </nav>
   <div className="flex items-center gap-2">
    <Link href="/" className="hidden items-center gap-1.5 text-xs text-[var(--muted)] lg:flex"><Globe2 size={15} aria-hidden="true" /> Ecosystem <ChevronDown size={12} aria-hidden="true" /></Link>
    <ThemeToggle />
    <button className="xl:hidden inline-flex min-h-11 min-w-11 items-center justify-center rounded-xl border border-[var(--border)]" type="button" aria-label={open ? "Close navigation" : "Open navigation"} aria-expanded={open} aria-controls="estate-mobile-navigation" onClick={() => setOpen(v => !v)}>{open ? <X size={22} /> : <Menu size={22} />}</button>
   </div>
  </div>
  {open && <nav id="estate-mobile-navigation" aria-label="Real estate mobile navigation" className="xl:hidden border-t border-[var(--border)] bg-[var(--card)] px-4 py-3"><div className="gth-container grid gap-1 sm:grid-cols-2">{links.map(link => <Link key={link.href} href={link.href} onClick={() => setOpen(false)} className="flex min-h-11 items-center gap-3 rounded-xl px-3 py-2 text-sm hover:bg-[var(--surface-2)]">{link.icon && <link.icon size={16} aria-hidden="true" />}{link.label}</Link>)}<Link href="/" onClick={() => setOpen(false)} className="flex min-h-11 items-center gap-3 px-3 text-sm"><Globe2 size={16} /> GTH PRO ecosystem</Link></div></nav>}
 </header>
}
