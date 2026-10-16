import Image from "next/image";
import Link from "next/link";
import {ArrowUpRight} from "lucide-react";
/** Shared compact PWA masthead. Uses GTH PRO's own local brand asset. */
export default function MobileAppHeader(){
 return <header className="sticky top-0 z-40 flex min-h-16 items-center justify-between gap-3 border-b border-[var(--border)] bg-[var(--card)] px-4 py-2 backdrop-blur-xl sm:px-6">
   <Link href="/app" aria-label="GTH PRO Home" className="flex min-w-0 items-center gap-2.5">
    <span className="relative flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-[var(--border)] bg-[var(--bg)]">
     <Image src="/gth-app-brand.svg" alt="GTH PRO official logo" fill sizes="44px" className="object-cover" priority/>
    </span>
    <span className="min-w-0 leading-tight">
     <strong className="block text-base font-bold tracking-tight">GTH <span className="gold-text">PRO</span></strong>
     <span className="block text-[10px] tracking-wide text-[var(--text-soft)]">Global Technical Hub</span>
    </span>
   </Link>
   <Link href="/app/destinations" className="inline-flex min-h-10 shrink-0 items-center gap-1 rounded-xl border border-[var(--border)] px-3 text-xs font-semibold">
    Discover <ArrowUpRight size={15} aria-hidden="true"/>
   </Link>
  </header>;
}
