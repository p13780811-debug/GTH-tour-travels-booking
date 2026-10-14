import Link from "next/link";
import { ArrowUpRight, Globe2, ShieldCheck } from "lucide-react";
import HousePromotions from "@/components/sections/HousePromotions";

const columns = [
  { heading: "Travel", links: [
    ["Travel Homepage","/travel"], ["Flights","/flights"], ["Hotels","/hotels"],
    ["Tours & Activities","/tours"], ["Destinations","/destinations"],
    ["Airport Transfers","/transfers"], ["Bus","/bus"], ["Rail","/train"]
  ] },
  { heading: "Real Estate", links: [
    ["Property Marketplace","/real-estate"], ["Explore Properties","/real-estate#property-search"],
    ["Submit Listing","/real-estate/post-property"], ["Property Tools","/real-estate/tools"],
  ] },
  { heading: "Tenders & Intelligence", links: [
    ["Tender Gateway","/tender"], ["Tender Readiness","/tender#readiness"],
    ["Travel Guides","/guides"], ["Editorial","/blog"],
  ] },
  { heading: "Company & Support", links: [
    ["About GTH PRO","/about"], ["Contact","/contact"], ["Travel Insurance","/insurance"],
    ["Privacy Policy","/privacy-policy"], ["Terms & Conditions","/terms-and-conditions"],
    ["Refund Policy","/refund-policy"], ["Affiliate Disclosure","/affiliate-disclosure"],
    ["Business Partners","/partners"],
    ["Partner & Developer Applications","/partners/apply"],
  ] },
] as const;

export default function EcosystemFooter() {
  return (
    <>
      <HousePromotions />
    <footer aria-label="GTH PRO ecosystem navigation" className="border-t border-[var(--border)] bg-[var(--card)]/65">
      <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6 md:py-18">
        <div className="grid gap-10 lg:grid-cols-[1fr_2fr]">
          <div className="max-w-sm">
            <Link href="/" className="inline-flex items-center gap-3 text-2xl font-bold tracking-[0.13em] text-[var(--text)]">
              <Globe2 size={27} className="text-[var(--gold)]" aria-hidden="true" /> GTH <span className="gold-text">PRO</span>
            </Link>
            <p className="mt-5 text-sm leading-7 text-[var(--text-soft)]">
              Global Technical Hub connects Tours & Travels, Real Estate and developing Tender Intelligence in one ecosystem.
            </p>
            <div className="mt-6 inline-flex items-center gap-2 rounded-full border border-[var(--border)] bg-[var(--bg)] px-4 py-2 text-xs text-[var(--text-soft)]">
              <ShieldCheck size={15} aria-hidden="true" /> Confirm bookings and policy terms with each provider
            </div>
          </div>
          <nav aria-label="Ecosystem footer links" className="grid grid-cols-2 gap-x-5 gap-y-10 sm:grid-cols-4">
            {columns.map(({heading,links})=>(
              <div key={heading}>
                <h2 className="text-sm font-semibold text-[var(--text)]">{heading}</h2>
                <ul className="mt-5 space-y-3">
                  {links.map(([label,href])=>(
                    <li key={href}>
                      <Link href={href} className="inline-flex min-h-8 items-center text-sm leading-6 text-[var(--text-soft)] transition-colors hover:text-[var(--text)]">
                        {label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </nav>
        </div>
        <div className="mt-12 flex flex-col gap-4 border-t border-[var(--border)] pt-6 text-xs text-[var(--text-soft)] sm:flex-row sm:items-center sm:justify-between">
          <p>© {new Date().getFullYear()} GTH PRO · Global Technical Hub</p>
          <a href="mailto:official.gthpro@gmail.com" className="break-all font-semibold text-[var(--text)] underline">official.gthpro@gmail.com</a><Link href="/contact" className="inline-flex items-center gap-2 font-semibold text-[var(--text)]">Talk to our team <ArrowUpRight size={14} aria-hidden="true" /></Link>
        </div>
      </div>
    </footer>
    </>
  );
}
