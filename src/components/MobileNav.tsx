"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { BriefcaseBusiness, Building2, Home, Hotel, Plane } from "lucide-react";

/** One reusable five-tab app bar, scoped to small screens. Real Estate keeps its approved own navigation. */
const items = [
  { href: "/app", appHref: "/app", name: "Home", Icon: Home, matches: ["/app", "/", "/mega-aggregator"] },
  { href: "/flights", appHref: "/app/flights", name: "Flights", Icon: Plane, matches: ["/flights", "/travel"] },
  { href: "/hotels", appHref: "/app/hotels", name: "Hotels", Icon: Hotel, matches: ["/hotels"] },
  { href: "/real-estate", appHref: "/app/property", name: "Property", Icon: Building2, matches: ["/real-estate"] },
  { href: "/tender", appHref: "/app/tenders", name: "Tenders", Icon: BriefcaseBusiness, matches: ["/tender"] },
];

export default function MobileNav() {
  const pathname = usePathname() || "/";
  const isApp = pathname === "/app" || pathname.startsWith("/app/");
  return (
    <nav aria-label="GTH PRO mobile app navigation"
      className="fixed inset-x-0 bottom-0 z-[180] border-t border-[var(--border)] bg-[var(--card)] shadow-[var(--shadow)] backdrop-blur-xl md:hidden"
      style={{ paddingBottom: "env(safe-area-inset-bottom, 0px)" }}>
      <div className="mx-auto grid max-w-lg grid-cols-5 px-1">
        {items.map(({href,appHref,name,Icon,matches}) => {
          const target = isApp ? appHref : href;
          const active = isApp ? pathname === appHref : matches.some(route => route === "/" ? pathname === "/" : pathname === route || pathname.startsWith(route + "/"));
          return (
            <Link key={href} href={target} aria-current={active ? "page" : undefined}
              className={`flex min-h-[64px] min-w-0 flex-col items-center justify-center gap-1 rounded-xl px-1 py-2 text-[11px] font-semibold transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 ${active ? "gold-text" : "text-[var(--text-soft)]"}`}>
              <Icon size={21} strokeWidth={active ? 2.4 : 1.8} aria-hidden="true" />
              <span className="truncate">{name}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
