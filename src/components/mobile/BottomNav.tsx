"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { Home, Search, Plus, Bookmark, User } from "lucide-react"

const items = [
    { href:"/real-estate", label:"Explore", Icon:Home },
    { href:"/real-estate#property-search", label:"Search", Icon:Search },
    { href:"/real-estate/post-property", label:"List", Icon:Plus },
    { href:"/real-estate/saved", label:"Saved", Icon:Bookmark },
    { href:"/real-estate/profile", label:"Account", Icon:User },
]

export default function BottomNav(_props: { user?: unknown }) {
    const pathname = usePathname()
    return <nav aria-label="Mobile real estate navigation" className="fixed bottom-0 inset-x-0 z-50 md:hidden border-t border-[var(--border)] bg-[var(--card)] grid grid-cols-5" style={{ paddingBottom:"env(safe-area-inset-bottom)" }}>
        {items.map(({ href,label,Icon }) => {
            const active = !href.includes("#") && pathname === href
            return <Link key={href} href={href} aria-current={active ? "page" : undefined} className={`flex flex-col items-center justify-center min-h-[64px] gap-1 text-xs ${active ? "gold-text font-bold" : "opacity-70"}`}><Icon size={20} aria-hidden="true" /><span>{label}</span></Link>
        })}
    </nav>
}
