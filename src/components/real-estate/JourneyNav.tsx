"use client"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { ChevronRight } from "lucide-react"

const routes: Record<string,string> = {
 "/real-estate/saved":"Saved & compare",
 "/real-estate/post-property":"List a property",
 "/real-estate/profile":"Your account",
 "/real-estate/admin":"Review workspace",
}

export default function JourneyNav() {
 const pathname = usePathname()
 const current = routes[pathname] || (pathname?.startsWith("/real-estate/") ? "Property details" : "Explore")
 return <nav aria-label="Breadcrumb" className="mb-7 flex min-h-10 items-center gap-2 border-b border-[var(--border)] pb-4 text-sm text-[var(--text-soft)]">
  <Link href="/real-estate" className="hover:underline focus-visible:underline">Real Estate</Link>
  <ChevronRight size={14} aria-hidden="true" />
  <span aria-current="page" className="font-semibold text-[var(--text)]">{current}</span>
 </nav>
}
