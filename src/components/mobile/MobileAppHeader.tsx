import BrandVideo from "@/components/brand/BrandVideo";
import Link from "next/link";
import {ArrowUpRight} from "lucide-react";
import ThemeToggle from "@/components/ThemeToggle";
/** Same circular motion logo and brand identity as the approved website header. */
export default function MobileAppHeader(){
 return <header className="sticky top-0 z-40 flex min-h-16 items-center justify-between gap-2 border-b border-[var(--border)] bg-[var(--card)] px-4 py-2 backdrop-blur-xl sm:px-6">
   <Link href="/app" aria-label="GTH PRO Home" className="flex min-w-0 items-center">
    <span className="relative flex size-11 shrink-0 overflow-hidden rounded-full border border-[var(--border)]"><BrandVideo name="logo-motion" label="GTH PRO animated logo" className="h-full w-full object-cover" controls={false}/></span>
    <span className="ml-2 min-w-0 leading-tight"><strong className="block text-base">GTH <span className="gold-text">PRO</span></strong><span className="block text-[10px] text-[var(--text-soft)]">Global Platform</span></span>
   </Link>
   <div className="flex shrink-0 items-center gap-2">
    <ThemeToggle/>
    <Link href="/app/destinations" className="inline-flex min-h-11 items-center gap-1 rounded-xl border border-[var(--border)] px-3 text-xs font-semibold">
     Discover <ArrowUpRight size={15} aria-hidden="true"/>
    </Link>
   </div>
  </header>;
}
