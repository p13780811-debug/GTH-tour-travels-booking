import Image from "next/image";
import Link from "next/link";
import {ArrowUpRight} from "lucide-react";
import ThemeToggle from "@/components/ThemeToggle";
/** Shared app masthead uses the owner's actual GTH PRO wordmark. */
export default function MobileAppHeader(){
 return <header className="sticky top-0 z-40 flex min-h-16 items-center justify-between gap-2 border-b border-[var(--border)] bg-[var(--card)] px-4 py-2 backdrop-blur-xl sm:px-6">
   <Link href="/app" aria-label="GTH PRO Home" className="flex min-w-0 items-center">
    <Image src="/app-brand/wordmark.png" alt="GTH PRO official logo" width={180} height={60} className="h-12 w-36 object-contain sm:w-44" priority/>
   </Link>
   <div className="flex shrink-0 items-center gap-2">
    <ThemeToggle/>
    <Link href="/app/destinations" className="inline-flex min-h-11 items-center gap-1 rounded-xl border border-[var(--border)] px-3 text-xs font-semibold">
     Discover <ArrowUpRight size={15} aria-hidden="true"/>
    </Link>
   </div>
  </header>;
}
