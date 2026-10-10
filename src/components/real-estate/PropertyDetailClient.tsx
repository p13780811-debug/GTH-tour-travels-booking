"use client"

import { useEffect, useState } from "react"
import dynamic from "next/dynamic"
import Link from "next/link"
import JourneyNav from "./JourneyNav"
import { MapPin, Share2, ArrowLeft, Building2, MessageSquare } from "lucide-react"
import { PropertyService } from "@/lib/real-estate/propertyService"
import { approvedMedia } from "@/lib/real-estate/approved-media"
import PropertyImage from "./PropertyImage"
import SavePropertyButton from "./SavePropertyButton"
import RegistryDetails from "./RegistryDetails"
import EnquiryForm from "./EnquiryForm"
import PropertyCardPro from "./PropertyCardPro"
import styles from "./Listing.module.css"

const MapWrapper = dynamic(() => import("@/components/MapWrapper"), { ssr: false, loading: () => <p role="status">Loading map…</p> })
const AIChat = dynamic(() => import("@/components/AIChat"), { ssr: false, loading: () => <p role="status">Loading listing assistant…</p> })

export default function PropertyDetailClient({ slug, initialData, related = [] }: { slug: string; initialData?: any; related?: any[] }) {
    const [property, setProperty] = useState<any>(initialData || null)
    const [loading, setLoading] = useState(!initialData)
    const [selectedImage, setSelectedImage] = useState("")
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
    if (!property) return <main className="gth-container py-24"><h1 className="gth-title">Property unavailable</h1><p className="my-6 opacity-70">This listing could not be loaded. Please retry or browse available listings.</p><Link className={`gth-btn ${styles.action}`} href="/real-estate">Browse properties</Link></main>

    const images = Array.from(new Set<string>([property.image, ...(Array.isArray(property.gallery) ? property.gallery : [])].filter((url): url is string => typeof url === "string" && Boolean(approvedMedia(slug, url)))))
    const image = images.includes(selectedImage) ? selectedImage : images[0]
    const hasCoordinates = typeof property.lat === "number" && typeof property.lng === "number" && Number.isFinite(property.lat) && Number.isFinite(property.lng) && Math.abs(property.lat) <= 90 && Math.abs(property.lng) <= 180
    const facts = [
        ["Property type", property.property_type],
        ["Listing purpose", property.listing_type],
        ["Reported bedrooms", property.beds || "Not provided"],
        ["Reported bathrooms", property.baths || "Not provided"],
        ["Reported area", property.sqft ? `${property.sqft} ft²` : "Not provided"],
        ["Listing verification", "Confirm with source documents"],
    ]
    const share = async () => {
        setShareMessage("")
        try {
            if (navigator.share) await navigator.share({ title: property.title, url: window.location.href })
            else { await navigator.clipboard.writeText(window.location.href); setShareMessage("Listing link copied") }
        } catch (error) { if (!(error instanceof Error && error.name === "AbortError")) setShareMessage("Could not share. Copy the page address from your browser.") }
    }

    return <main className="gth-container pb-28 pt-6 md:pt-10">
        <JourneyNav />
        <nav aria-label="Breadcrumb" className="flex items-center justify-between gap-4 mb-8 flex-wrap">
            <Link href="/real-estate" className="inline-flex items-center gap-2 opacity-70 hover:opacity-100"><ArrowLeft size={16} aria-hidden="true" />All properties</Link>
            <div className="flex gap-3 items-center"><SavePropertyButton slug={slug} className="gth-glass rounded-xl p-3" /><button onClick={share} className={`gth-btn ${styles.action}`}><Share2 size={16} aria-hidden="true" />Share</button></div>
        </nav>
        {shareMessage && <p role="status" className="mb-4">{shareMessage}</p>}
        <header className={styles.projectHeader}>
            <div><p className="gold-text text-xs font-bold uppercase tracking-widest mb-4">GTH PRO / Property collection</p><h1 className={styles.projectTitle}>{property.title}</h1><p className="flex items-center gap-2 mt-5 opacity-70"><MapPin size={18} className="gold-text shrink-0" aria-hidden="true" />{property.location || property.city || "Location not provided"}</p></div>
            <div className="gth-glass rounded-3xl p-6"><p className="text-xs uppercase tracking-widest opacity-70">Listed price</p><p className="gold-text text-2xl md:text-3xl font-bold mt-3">{property.formatted_price || "Price on request"}</p><p className="text-sm opacity-70 mt-3">Confirm current pricing and availability.</p></div>
        </header>
        <div className={`${styles.detailLayout} mt-8`}>
            <div className="min-w-0">
                <section aria-label="Property gallery" className="gth-glass rounded-3xl overflow-hidden">
                    <div className={styles.gallery}><PropertyImage key={image || slug} slug={slug} src={image} alt={property.title} className="h-full w-full" /></div>
                    {images.length > 1 && <div className="flex gap-3 overflow-x-auto p-4">{images.map((url, index) => <button key={url} aria-label={`View approved image ${index + 1}`} aria-pressed={image === url} onClick={() => setSelectedImage(url)} className="gth-glass rounded-xl p-2 shrink-0 w-24 h-20"><PropertyImage slug={slug} src={url} alt={`Property view ${index + 1}`} className="h-full w-full" /></button>)}</div>}
                    <p className="p-4 text-sm opacity-70">{images.length ? "Approved listing media. Architectural renders are labeled separately." : "No approved property photos are available for this listing yet."}</p>
                </section>
                <nav aria-label="Project sections" className={styles.sectionNav}><a href="#overview">Overview</a><a href="#recorded-details">Project records</a><a href="#location">Location</a><a href="#enquiry">Enquire</a></nav>
                <section id="overview" className="gth-glass rounded-3xl p-6 md:p-8 mt-6 scroll-mt-24">
                    <p className="gold-text text-xs uppercase tracking-widest">01 / The listing</p><h2 className="text-2xl md:text-3xl font-bold mt-3">Project overview</h2>
                    <p className="opacity-70 leading-8 mt-5 whitespace-pre-line">{property.description || "A detailed project description has not been provided."}</p>
                    <dl className={`${styles.facts} mt-6`}>{facts.map(([label, value]) => <div key={String(label)} className="gth-glass rounded-2xl p-4"><dt className="text-xs opacity-70">{label}</dt><dd className="font-bold mt-2">{value || "Not provided"}</dd></div>)}</dl>
                    <p className="text-sm opacity-70 mt-4">Measurements reflect stored listing data; confirm them against project documents.</p>
                    {Array.isArray(property.amenities) && property.amenities.length > 0 && <div className="mt-6"><h3 className="font-bold">Reported amenities</h3><ul className="flex gap-3 flex-wrap mt-3">{property.amenities.filter((item: unknown) => typeof item === "string").map((item: string, index: number) => <li className="gth-badge" key={`${item}-${index}`}>{item}</li>)}</ul></div>}
                </section>
                <div id="recorded-details" className="scroll-mt-24"><RegistryDetails property={property} /></div>
                <section id="location" className="gth-glass rounded-3xl p-6 md:p-8 mt-6 scroll-mt-24"><p className="gold-text text-xs uppercase tracking-widest">02 / The location</p><h2 className="text-2xl font-bold mt-3">Find the project</h2><p className="opacity-70 mt-3">{property.location || "Address not provided"}</p>{hasCoordinates ? <><div className="h-80 mt-6 rounded-2xl overflow-hidden"><MapWrapper data={[property]} active={{ coords: [property.lat, property.lng] }} /></div><p className="text-sm opacity-70 mt-3">Map uses stored coordinates. Confirm the precise project address.</p></> : <p className="gth-glass rounded-2xl p-6 mt-6 opacity-70">Project coordinates have not been provided. No approximate pin is shown.</p>}</section>
            </div>
            <aside className={styles.enquiryPanel}>
                <section id="enquiry" className="gth-glass rounded-3xl p-6 scroll-mt-24"><Building2 size={24} className="gold-text" aria-hidden="true" /><h2 className="text-2xl font-bold mt-4">Take the next step</h2><p className="opacity-70 leading-7 my-4">Request current project details, pricing or a visit. Submission sends an enquiry; it does not reserve a property.</p><EnquiryForm propertyId={property.id} /></section>
                <section className="gth-glass rounded-3xl p-6 mt-5"><p className="gold-text text-xs uppercase tracking-widest">Listing assistant</p><p className="opacity-70 text-sm leading-7 my-4">Ask about recorded details. The assistant cannot confirm availability or investment outcomes.</p><button className={`gth-btn ${styles.action}`} aria-expanded={showAI} onClick={() => setShowAI(value => !value)}><MessageSquare size={16} aria-hidden="true" />{showAI ? "Close assistant" : "Ask about this listing"}</button>{showAI && <div className="h-[450px] mt-4 overflow-hidden rounded-2xl"><AIChat context={`Property: ${property.title}; Location: ${property.location}; Listed price: ${property.formatted_price}; Type: ${property.property_type}. Do not invent missing details.`} /></div>}</section>
            </aside>
        </div>
        <nav aria-label="Mobile listing actions" className={styles.mobileEnquiry}><div><span className="text-xs opacity-70">Listed price</span><p className="gold-text font-bold text-sm">{property.formatted_price || "Price on request"}</p></div><a href="#enquiry" className={`gth-btn-gold ${styles.action}`}>Enquire</a></nav>
        {related.length > 0 && <section className="mt-16"><p className="gold-text text-xs uppercase tracking-widest">03 / Keep exploring</p><h2 className="text-3xl font-bold mt-3">More in this city</h2><p className="opacity-70 mt-3">Related inventory based on the recorded city.</p><div className="grid gap-5 mt-8 sm:grid-cols-2 xl:grid-cols-3">{related.filter(item => item.slug !== slug).slice(0, 6).map(item => <PropertyCardPro key={item.id} p={item} />)}</div></section>}
    </main>
}
