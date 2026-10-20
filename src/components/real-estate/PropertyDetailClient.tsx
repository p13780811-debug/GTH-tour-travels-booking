"use client"

import { useEffect, useState } from "react"
import dynamic from "next/dynamic"
import Link from "next/link"
import JourneyNav from "./JourneyNav"
import { MapPin, Share2, ArrowLeft, Building2, MessageSquare, BadgeCheck, FileCheck2 } from "lucide-react"
import { PropertyService } from "@/lib/real-estate/propertyService"
import PropertyGallery from "@/components/property/PropertyGallery"
import PropertyLeadActions from "@/components/property/PropertyLeadActions"
import HomeLoanCalculator from "@/components/property/HomeLoanCalculator"
import PartnerHandshake from "@/components/property/PartnerHandshake"
import SavePropertyButton from "./SavePropertyButton"
import RegistryDetails from "./RegistryDetails"
import EnquiryForm from "./EnquiryForm"
import OwnerProjectAds from "./OwnerProjectAds"
import PropertyCardPro from "./PropertyCardPro"
import ProjectInventory from "./ProjectInventory"
import styles from "./Listing.module.css"
import explorer from "./Explorer.module.css"

const MapWrapper = dynamic(() => import("@/components/MapWrapper"), { ssr: false, loading: () => <p role="status">Loading map…</p> })
const AIChat = dynamic(() => import("@/components/AIChat"), { ssr: false, loading: () => <p role="status">Loading listing assistant…</p> })

export default function PropertyDetailClient({ slug, initialData, related = [], inventory = [] }: { slug: string; initialData?: any; related?: any[]; inventory?: any[] }) {
    const [property, setProperty] = useState<any>(initialData || null)
    const [loading, setLoading] = useState(!initialData)
    const [shareMessage, setShareMessage] = useState("")
    const [showAI, setShowAI] = useState(false)

    useEffect(() => {
        if (initialData) { setProperty(initialData); setLoading(false); return }
        let active = true
        setLoading(true)
        PropertyService.getBySlug(slug).then(row => { if (active) setProperty(row) }).catch(() => { if (active) setProperty(null) }).finally(() => { if (active) setLoading(false) })
        return () => { active = false }
    }, [slug, initialData])

    if (loading) return <main className="gth-container py-24"><p role="status">Loading property details…</p></main>
    if (!property) return <main className="gth-container py-24"><h1 className="gth-title">Property unavailable</h1><p className="my-6 opacity-70">This listing could not be loaded. Please retry or browse available listings.</p><Link className={`gth-btn inline-flex items-center justify-center gap-2`} href="/real-estate">Browse properties</Link></main>

    const hasCoordinates = typeof property.lat === "number" && typeof property.lng === "number" && Number.isFinite(property.lat) && Number.isFinite(property.lng) && Math.abs(property.lat) <= 90 && Math.abs(property.lng) <= 180
    const isRegistryProject = Boolean(property.registry_only || property.source_type === "registry" || property.data_quality_limited)
    const hasInventory = Array.isArray(inventory) && inventory.length > 0
    const registryOnly = isRegistryProject && !hasInventory
    const officialSource = typeof property.official_source_url === "string" ? property.official_source_url : ""
    const facts = isRegistryProject ? [
        ["Project status", hasInventory ? "Active inventory available" : property.data_quality_limited ? "Project record · details pending review" : "Registry only"],
        ["Published inventory", hasInventory ? String(inventory.length) : "Not yet supplied to GTH PRO"],
        ["Registry reference", property.rera_id || "Not provided"],
    ] : [
        ["Property type", property.property_type],
        ["Listing purpose", property.listing_type === "buy" ? "For sale" : property.listing_type === "rent" ? "For rent" : "Not provided"],
        ["Reported bedrooms", property.beds || "Not provided"],
        ["Reported bathrooms", property.baths || "Not provided"],
        ["Reported area", property.sqft ? `${property.sqft} ft² · ${Math.round(Number(property.sqft) * 0.092903)} m²` : "Not provided"],
    ]
    const share = async () => {
        setShareMessage("")
        try {
            if (navigator.share) await navigator.share({ title: property.title, url: window.location.href })
            else { await navigator.clipboard.writeText(window.location.href); setShareMessage("Listing link copied") }
        } catch (error) { if (!(error instanceof Error && error.name === "AbortError")) setShareMessage("Could not share. Copy the page address from your browser.") }
    }

    return <main className={`gth-container pb-28 pt-6 md:pt-10 ${explorer.detailPage}`}>
        <JourneyNav />
        <div className="flex items-center justify-between gap-4 mb-8 flex-wrap">
            <Link href="/real-estate" className="inline-flex items-center gap-2 opacity-70 hover:opacity-100"><ArrowLeft size={16} aria-hidden="true" />All properties</Link>
            <div className="flex gap-3 items-center"><SavePropertyButton slug={slug} className="gth-btn inline-flex items-center justify-center" /><button onClick={share} className={`gth-btn inline-flex items-center justify-center gap-2`}><Share2 size={16} aria-hidden="true" />Share</button></div>
        </div>
        {shareMessage && <p role="status" className="mb-4">{shareMessage}</p>}
        <header className={styles.projectHeader}>
            <div><h1 className={styles.projectTitle}>{property.title}</h1><p className="flex items-center gap-2 mt-5 opacity-70"><MapPin size={18} className="gold-text shrink-0" aria-hidden="true" />{[property.location || property.city, property.country && property.country !== "Country not provided" ? property.country : ""].filter(Boolean).join(" · ") || "Location not provided"}</p><div className={styles.trustPills}>{isRegistryProject && <span className={styles.trustPill}><FileCheck2 size={14} aria-hidden="true" />Registry record</span>}{hasInventory && <span className={styles.trustPill}><FileCheck2 size={14} aria-hidden="true" />Reviewed inventory</span>}{property.verified && <span className={styles.trustPill}><BadgeCheck size={14} aria-hidden="true" />GTH Verified</span>}</div></div>
            {isRegistryProject ? <div className="gth-glass rounded-3xl p-6"><p className="text-xs uppercase tracking-widest opacity-70">Project status</p><p className="gold-text text-2xl md:text-3xl font-bold mt-3">{hasInventory ? `${inventory.length} active ${inventory.length === 1 ? "listing" : "listings"}` : property.data_quality_limited ? "Details pending review" : "Registry only"}</p><p className="text-sm opacity-70 mt-3">{hasInventory ? "Published inventory below is separate from the official MahaRERA registry record." : "No active unit inventory, current price or listing contact has been supplied to GTH PRO."}</p></div> : <div className="gth-glass rounded-3xl p-6"><p className="text-xs uppercase tracking-widest opacity-70">Listed price</p><p className="gold-text text-2xl md:text-3xl font-bold mt-3">{property.formatted_price || "Price on request"}</p><p className="text-sm opacity-70 mt-3">Confirm current pricing and availability.</p></div>}
        </header>
        <div className={`${styles.detailLayout} mt-8`}>
            <div className="min-w-0">
                <PropertyGallery slug={slug} title={property.title} image={property.image} gallery={property.gallery} district={property.district} locality={property.location || property.city} propertyType={property.property_type} reraId={property.rera_id} />
                <nav aria-label="Project sections" className={styles.sectionNav}><a href="#overview">Overview</a>{hasInventory && <a href="#inventory">Active inventory</a>}<a href="#recorded-details">Project records</a><a href="#location">Location</a><a href="#enquiry">{isRegistryProject ? "Request details" : "Enquire"}</a></nav>
                <section id="overview" className="gth-glass rounded-3xl p-6 md:p-8 mt-6 scroll-mt-24">
                    <h2 className="text-2xl md:text-3xl font-bold">{isRegistryProject ? "Project overview" : "Property overview"}</h2>
                    <p className="opacity-70 leading-8 mt-5 whitespace-pre-line">{property.description || "A detailed project description has not been provided."}</p>
                    <dl className={`${styles.facts} mt-6`}>{facts.map(([label, value]) => <div key={String(label)} className="gth-glass rounded-2xl p-4"><dt className="text-xs opacity-70">{label}</dt><dd className="font-bold mt-2">{value || "Not provided"}</dd></div>)}</dl>
                    {!isRegistryProject && <p className="text-sm opacity-70 mt-4">Measurements reflect stored listing data; confirm them against project documents.</p>}
                    {Array.isArray(property.amenities) && property.amenities.length > 0 && <div className="mt-6"><h3 className="font-bold">Reported amenities</h3><ul className="grid gap-3 sm:grid-cols-2 mt-3 list-disc pl-5">{property.amenities.filter((item: unknown) => typeof item === "string").map((item: string, index: number) => <li className="text-sm leading-6" key={`${item}-${index}`}>{item}</li>)}</ul></div>}
                </section>
                <ProjectInventory items={inventory} />
                <div id="recorded-details" className="scroll-mt-24"><RegistryDetails property={property} /></div>
                <section id="location" className="gth-glass rounded-3xl p-6 md:p-8 mt-6 scroll-mt-24"><h2 className="text-2xl font-bold">Location</h2><p className="opacity-70 mt-3">{[property.location || property.city, property.state, property.country].filter((value:any) => value && !/not provided/i.test(String(value))).join(" · ") || "Address not provided"}</p>{hasCoordinates ? <><div className="h-80 mt-6 rounded-2xl overflow-hidden"><MapWrapper data={[property]} active={{ coords: [property.lat, property.lng] }} /></div><p className="text-sm opacity-70 mt-3">Map uses stored coordinates. Confirm the precise project address.</p></> : <p className="gth-glass rounded-2xl p-6 mt-6 opacity-70">Project coordinates have not been provided. No approximate pin is shown.</p>}</section>
            </div>
            <aside className={styles.enquiryPanel}>
                {isRegistryProject ? <section id="enquiry" className="gth-glass rounded-3xl p-6 scroll-mt-24"><Building2 size={24} className="gold-text" aria-hidden="true" /><p className="gold-text text-xs uppercase tracking-widest mt-4">{hasInventory ? "Inventory interest" : "Project interest"}</p><h2 className="text-2xl font-bold mt-3">{hasInventory ? "Request current availability" : "Request current project details"}</h2><p className="opacity-70 leading-7 my-4">{hasInventory ? "Tell GTH PRO you want current availability or contact information for the published inventory on this registry project." : "This is a public registry profile, not an active seller listing. Tell GTH PRO you want current pricing, inventory or contact information and we can use that demand signal to source updated project data."}</p><PropertyLeadActions property={property} /><details className="mt-4"><summary className="cursor-pointer text-sm opacity-70">Quick phone enquiry</summary><EnquiryForm propertyId={property.id} mode="registry" /></details>{officialSource && <a href={officialSource} target="_blank" rel="noopener noreferrer" className={`gth-btn inline-flex items-center justify-center gap-2 mt-4`}>Open official MahaRERA</a>}</section> : <section id="enquiry" className="gth-glass rounded-3xl p-6 scroll-mt-24"><Building2 size={24} className="gold-text" aria-hidden="true" /><h2 className="text-2xl font-bold mt-4">Take the next step</h2><p className="opacity-70 leading-7 my-4">Request current project details, pricing or a visit. Submission sends an enquiry; it does not reserve a property.</p><PropertyLeadActions property={property} /><details className="mt-4"><summary className="cursor-pointer text-sm opacity-70">Quick phone enquiry</summary><EnquiryForm propertyId={property.id} /></details></section>}
                <section className="gth-glass rounded-3xl p-6 mt-5"><p className="gold-text text-xs uppercase tracking-widest">{isRegistryProject ? "Project assistant" : "Listing assistant"}</p><p className="opacity-70 text-sm leading-7 my-4">Ask about recorded details. The assistant cannot confirm availability or investment outcomes.</p><button className={`gth-btn inline-flex items-center justify-center gap-2`} aria-expanded={showAI} onClick={() => setShowAI(value => !value)}><MessageSquare size={16} aria-hidden="true" />{showAI ? "Close assistant" : isRegistryProject ? "Ask about this project" : "Ask about this listing"}</button>{showAI && <div className="h-[450px] mt-4 overflow-hidden rounded-2xl"><AIChat context={isRegistryProject ? `Public registry project: ${property.title}; Location: ${property.location}; Registration reference: ${property.rera_id || "not provided"}; Published inventory count: ${inventory.length}. Discuss only recorded project fields and explicitly published inventory. Do not invent missing details or verification.` : `Property: ${property.title}; Location: ${property.location}; Listed price: ${property.formatted_price}; Type: ${property.property_type}. Do not invent missing details.`} /></div>}</section>
                <HomeLoanCalculator />
                <OwnerProjectAds />
            </aside>
        </div>
        <nav aria-label="Mobile listing actions" className={styles.mobileEnquiry}>{isRegistryProject ? <><div><span className="text-xs opacity-70">Project status</span><p className="gold-text font-bold text-sm">{hasInventory ? `${inventory.length} active` : "Registry only"}</p></div><a href="#enquiry" className={`gth-btn gth-btn-gold inline-flex items-center justify-center gap-2`}>{hasInventory ? "Check availability" : "Request details"}</a></> : <><div><span className="text-xs opacity-70">Listed price</span><p className="gold-text font-bold text-sm">{property.formatted_price || "Price on request"}</p></div><a href="#enquiry" className={`gth-btn gth-btn-gold inline-flex items-center justify-center gap-2`}>Enquire</a></>}</nav>
        {related.length > 0 && <section className="mt-16"><h2 className="text-2xl md:text-3xl font-bold">More in this city</h2><p className="opacity-70 mt-3">Related inventory based on the recorded city.</p><div className="grid gap-5 mt-8 sm:grid-cols-2 xl:grid-cols-3">{related.filter(item => item.slug !== slug).slice(0, 6).map(item => <PropertyCardPro key={item.id} p={item} />)}</div></section>}
        <PartnerHandshake footer />
    </main>
}
