import { supabase } from "@/lib/supabase"

// ==========================================================
// 🏛️ GTH PRO ESTATE — HYPER PROPERTY ENGINE V9
// AI + SaaS + Fraud Shield + Smart Ranking + Scale Ready
// ==========================================================

type PropertyPayload = {
    title: string
    slug?: string
    location?: string
    city?: string
    country?: string
    price?: number
    image?: string
    gallery?: string[]
    description?: string
    lat?: number
    lng?: number
    beds?: number
    baths?: number
    sqft?: number
    property_type?: string
    listing_type?: string
    amenities?: string[]
    created_by?: string
    status?: string
    is_featured?: boolean
    boost_expiry?: string
    ai_score?: number
    fraud_score?: number
}

type SearchFilters = {
    query?: string
    city?: string
    country?: string
    type?: string
    minPrice?: number
    maxPrice?: number
    featured?: boolean
    verified?: boolean
    sort?: "latest" | "price_high" | "price_low" | "ai"
    limit?: number
    page?: number
}

const CACHE = new Map<string, { data: any; expiry: number }>()

export function clearPropertyCache() { CACHE.clear() }

const CACHE_TTL = 1000 * 60 * 3

const DEFAULT_AMENITIES: string[] = []

const CITY_COORDS: Record<string, { lat: number; lng: number }> = {
    kolkata: { lat: 22.5726, lng: 88.3639 },
    mumbai: { lat: 19.076, lng: 72.8777 },
    dubai: { lat: 25.2048, lng: 55.2708 },
    bangkok: { lat: 13.7563, lng: 100.5018 },
}

const nowISO = () => new Date().toISOString()

const safeNumber = (v: any, fallback = 0) =>
    Number(v) > 0 ? Number(v) : fallback

// ==========================================================
// 🛡️ CORRECTION 1: SECURITY LAYER - DATA GUARD SANITIZER
// ==========================================================
const normalizeText = (v: any) => {
    const rawStr = String(v || "").trim();
    // HTML tags, dangerous script tokens, aur event handlers ko completely strip out karein
    return rawStr
        .replace(/<[^>]*>/g, "")
        .replace(/javascript:/gi, "")
        .replace(/onclick|onerror|onmouseover|onload/gi, "");
}

const createSlug = (text: string) =>
    text
        .toLowerCase()
        .replace(/[^a-z0-9\s-]/g, "")
        .replace(/\s+/g, "-")
        .replace(/-+/g, "-")

const getCache = (key: string) => {

    const cached = CACHE.get(key)

    if (!cached) return null

    if (Date.now() > cached.expiry) {

        CACHE.delete(key)

        return null
    }

    return cached.data
}

const setCache = (key: string, data: any) => {

    CACHE.set(key, {
        data,
        expiry: Date.now() + CACHE_TTL,
    })
}

const isBoostActive = (p: any) => {

    if (!p?.is_featured) return false

    if (!p?.boost_expiry) return false

    return new Date(p.boost_expiry) > new Date()
}

const calculateAIScore = (p: any) => {

    let score = 50

    if (safeNumber(p.price) >= 500) score += 20

    if (safeNumber(p.views) >= 1000) score += 10

    if (safeNumber(p.leads) >= 50) score += 10

    if (p.is_featured) score += 15

    if (p.status === "verified") score += 10

    return Math.min(100, score)
}

const calculateFraudScore = (p: any) => {

    let risk = 0

    if (!p.image) risk += 20

    if (!p.description) risk += 20

    if (safeNumber(p.price) <= 1) risk += 25

    if (!p.location) risk += 20

    if (!p.lat || !p.lng) risk += 10

    return Math.min(100, risk)
}

const generateDescription = (p: any) => {
    const title = normalizeText(p.title) || "Property listing"
    const location = normalizeText(p.city || p.location)
    return `${title}${location ? ` in ${location}` : ""}. Contact the listing agent to confirm availability and details.`
}

export const transformProperty = (p: any) => {

    const cityKey = normalizeText(
        p.city || p.location
    ).toLowerCase()

    const coords =
        CITY_COORDS[cityKey] ||
        { lat: undefined, lng: undefined }

    const price = safeNumber(p.price)

    const aiScore =
        safeNumber(p.ai_score ?? p.intelligence_score)

    const fraudScore =
        safeNumber(p.fraud_score)

    const boosted = isBoostActive(p)

    return {

        ...p,

        slug:
            p.slug ||
            createSlug(
                p.title || `property-${p.id}`
            ),

        title:
            normalizeText(p.title) ||
            "Luxury Property",

        description:
            normalizeText(p.description) ||
            generateDescription(p),

        image:
            normalizeText(p.image) ||
            "/placeholder.jpg",

        gallery:
            Array.isArray(p.gallery)
                ? p.gallery
                : [],

        location:
            normalizeText(p.location) ||
            "Premium Location",

        city:
            normalizeText(p.city) ||
            "Unknown",

        country:
            normalizeText(p.country) ||
            "India",

        property_type:
            normalizeText(p.property_type) ||
            "Apartment",

        listing_type:
            normalizeText(p.listing_type) ||
            "buy",

        amenities:
            Array.isArray(p.amenities)
                ? p.amenities
                : DEFAULT_AMENITIES,

        price,

        formatted_price:
            `₹ ${price.toLocaleString()} L`,

        beds:
            safeNumber(p.bedrooms ?? p.beds),

        baths:
            safeNumber(p.bathrooms ?? p.baths),

        sqft:
            safeNumber(p.area_sqft ?? p.sqft),

        views:
            safeNumber(p.views),

        leads:
            safeNumber(p.leads),

        ai_score: aiScore,

        fraud_score: fraudScore,

        verified:
            p.status === "verified",

        featured_active: boosted,

        luxury_tag:
            price >= 1000
                ? "Ultra Elite"
                : price >= 500
                    ? "Ultra Luxury"
                    : price >= 100
                        ? "Premium"
                        : "Smart Deal",

        rank_score:
            aiScore +
            (boosted ? 20 : 0) -
            fraudScore * 0.3,

        search_rank:
            aiScore +
            safeNumber(p.views) * 0.01,

        lat:
            typeof p.lat === "number" && Number.isFinite(p.lat) && Math.abs(p.lat) <= 90 ? p.lat : undefined,

        lng:
            typeof p.lng === "number" && Number.isFinite(p.lng) && Math.abs(p.lng) <= 180 ? p.lng : undefined,

        seo_title:
            `${p.title} | GTH ProEstate`,

        seo_description:
            generateDescription(p),

        card_variant:
            boosted
                ? "boosted"
                : price >= 500
                    ? "ultra"
                    : "standard",
    }
}

const smartSort = (items: any[]) => {

    return [...items].sort((a: any, b: any) =>
        b.rank_score - a.rank_score
    )
}

// ==========================================================
// 🚀 PROPERTY SERVICE
// ==========================================================

export const PropertyService = {

    // ======================================================
    // 🌍 GET ALL
    // ======================================================

    async getAll(filters: SearchFilters = {}) {

        const cacheKey =
            `all-${JSON.stringify(filters)}`

        const cached = getCache(cacheKey)

        if (cached) return cached

        const limit = Math.min(100, Math.max(1, Math.floor(filters.limit || 24)))

        const page = Math.max(1, Math.floor(filters.page || 1))

        const from = (page - 1) * limit

        let query = supabase
            .from("properties")
            .select("*")
            .range(from, from + limit - 1)

        if (filters.city) {
            query = query.ilike(
                "city",
                `%${filters.city}%`
            )
        }

        if (filters.country) {
            query = query.ilike(
                "country",
                `%${filters.country}%`
            )
        }

        if (filters.type) {
            query = query.eq(
                "property_type",
                filters.type
            )
        }

        if (filters.featured) {
            query = query.eq(
                "is_featured",
                true
            )
        }

        if (filters.minPrice !== undefined) query = query.gte("price", filters.minPrice)
        if (filters.maxPrice !== undefined && Number.isFinite(filters.maxPrice)) query = query.lte("price", filters.maxPrice)
        if (filters.verified) query = query.eq("status", "verified")
        if (filters.query) {
            const term = filters.query.replace(/[^\p{L}\p{N}\s-]/gu, "").trim().slice(0, 120)
            if (term) query = query.or(`title.ilike.%${term}%,city.ilike.%${term}%,location.ilike.%${term}%`)
        }
        const orderColumn = filters.sort === "price_high" || filters.sort === "price_low" ? "price" : filters.sort === "latest" ? "created_at" : "final_score"
        query = query.order(orderColumn, { ascending: filters.sort === "price_low", nullsFirst: false }).order("id", { ascending: false })

        const { data, error } =
            await query

        if (error) {

            console.error(
                "❌ GET ALL FAILED:",
                error.message
            )

            throw new Error("Property inventory is temporarily unavailable. Please retry.")
        }

        let transformed =
            (data || []).map(
                transformProperty
            )

        if (filters.minPrice) {
            transformed =
                transformed.filter(
                    (p) =>
                        p.price >=
                        filters.minPrice!
                )
        }

        if (filters.maxPrice) {
            transformed =
                transformed.filter(
                    (p) =>
                        p.price <=
                        filters.maxPrice!
                )
        }

        if (filters.verified) {
            transformed =
                transformed.filter(
                    (p) => p.verified
                )
        }

        switch (filters.sort) {

            case "price_high":
                transformed.sort(
                    (a, b) =>
                        b.price - a.price
                )
                break

            case "price_low":
                transformed.sort(
                    (a, b) =>
                        a.price - b.price
                )
                break

            case "latest":
                transformed.sort(
                    (a, b) =>
                        new Date(
                            b.created_at
                        ).getTime() -
                        new Date(
                            a.created_at
                        ).getTime()
                )
                break

            default:
                transformed =
                    smartSort(transformed)
        }

        setCache(cacheKey, transformed)

        return transformed
    },

    // ======================================================
    // 🔍 GET BY SLUG
    // ======================================================

    async getBySlug(slug: string) {

        const cacheKey = `slug-${slug}`

        const cached = getCache(cacheKey)

        if (cached) return cached

        const { data, error } =
            await supabase
                .from("properties")
                .select("*")
                .eq("slug", slug)
                .limit(1)

        if (error) {

            console.error(
                "❌ GET BY SLUG FAILED:",
                error.message
            )

            return null
        }

        const property =
            data?.[0]
                ? transformProperty(data[0])
                : null

        if (property) {
            setCache(cacheKey, property)
        }

        return property
    },

    // ======================================================
    // ➕ ADD PROPERTY
    // ======================================================

    async add(payload: PropertyPayload) {
        // Enforce Server Execution Context Guard
        if (typeof window !== "undefined") {
            throw new Error("SERVER-SIDE SECURITY VIOLATION: Write mutations blocked on client context.");
        }

        const cleanTitle = normalizeText(payload.title)
        const generatedSlug = payload.slug ? normalizeText(payload.slug) : createSlug(cleanTitle)

        const finalPayload = {
            ...payload,
            slug: generatedSlug,
            title: cleanTitle,
            location: normalizeText(payload.location),
            city: normalizeText(payload.city),
            country: normalizeText(payload.country),
            property_type: normalizeText(payload.property_type),
            listing_type: normalizeText(payload.listing_type),
            description: normalizeText(payload.description) || generateDescription(payload),
            created_at: nowISO(),
            updated_at: nowISO(),
            status: "review",
            views: 0,
            leads: 0,
            saves: 0,
            shares: 0,
            ai_score: calculateAIScore(payload),
            fraud_score: calculateFraudScore(payload),
            amenities: payload.amenities || DEFAULT_AMENITIES,
        }

        const { data, error } = await supabase.from("properties").insert([finalPayload]).select()
        if (error) {
            console.error("❌ ADD PROPERTY FAILED:", error.message)
            throw error
        }

        CACHE.clear()

        return data?.[0]
    },

    // ======================================================
    // 📈 INCREMENT VIEW
    // ======================================================

    async incrementViews(id: number) {

        await supabase.rpc(
            "increment_property_views",
            {
                row_id: id,
            }
        )
    },

    // ======================================================
    // ❤️ SAVE PROPERTY
    // ======================================================

    async saveProperty(payload: any) {

        const { data, error } =
            await supabase
                .from("saved_properties")
                .insert([{
                    ...payload,
                    created_at: nowISO(),
                }])

        if (error) throw error

        return data
    },

    // ======================================================
    // 📞 LEAD SYSTEM
    // ======================================================

    async addLead(payload: any) {

        const { data, error } =
            await supabase
                .from("leads")
                .insert([{
                    ...payload,
                    created_at: nowISO(),
                }])

        if (error) throw error

        if (payload.property_id) {

            await supabase.rpc(
                "increment_property_leads",
                {
                    row_id:
                        payload.property_id,
                }
            )
        }

        return data
    },

    // ======================================================
    // 🚀 BOOST PROPERTY
    // ======================================================

    async boostProperty(
        id: number,
        hours = 24
    ) {

        throw new Error("Paid boosts are unavailable until payment and administrative approval are enabled.")

    },

    // ======================================================
    // 🧠 SMART SEARCH
    // ======================================================

    async smartSearch(
        filters: SearchFilters = {}
    ) {

        return await PropertyService.getAll({
            ...filters,
            sort: "ai",
        })
    },

    // ======================================================
    // 🎬 SIMILAR PROPERTIES
    // ======================================================

    async getSimilar(
        slug: string,
        limit = 10
    ) {

        const current =
            await PropertyService.getBySlug(
                slug
            )

        if (!current) return []

        const all =
            await PropertyService.getAll({
                limit: 50,
            })

        return smartSort(
            all.filter((p: any) =>
                p.slug !== slug &&
                (
                    p.city ===
                    current.city ||
                    p.property_type ===
                    current.property_type
                )
            )
        ).slice(0, limit)
    },

    // ======================================================
    // 🏆 TRENDING
    // ======================================================

    async getTrending() {

        const data =
            await PropertyService.getAll({
                limit: 20,
            })

        return smartSort(data).slice(0, 12)
    },

    // ======================================================
    // 🧠 AI RECOMMENDATIONS
    // ======================================================

    async getAIRecommendations(
        slug: string
    ) {

        const current =
            await PropertyService.getBySlug(
                slug
            )

        if (!current) return []

        const all =
            await PropertyService.getAll({
                limit: 40,
            })

        return smartSort(
            all.filter((p: any) =>
                p.slug !== slug &&
                p.price >=
                current.price * 0.7 &&
                p.price <=
                current.price * 1.4
            )
        ).slice(0, 8)
    },

    // ======================================================
    // 🛡️ FRAUD SCAN
    // ======================================================

    async fraudScan(id: number) {

        throw new Error("Verification requires an authorized moderation workflow.")

    },

    // ======================================================
    // 🧹 DELETE
    // ======================================================

    async remove(id: number) {

        const { error } =
            await supabase
                .from("properties")
                .delete()
                .eq("id", id)

        if (error) throw error

        CACHE.clear()

        return true
    },
}

// ==========================================================
// 🔥 COMPATIBILITY EXPORTS
// OLD PAGES / COMPONENTS SUPPORT
// ==========================================================

export const getPropertyBySlug = async (
    slug: string
) => {

    return await PropertyService.getBySlug(
        slug
    )
}

export const getSimilarProperties = async (
    slug: string,
    limit: number = 10
) => {

    return await PropertyService.getSimilar(
        slug,
        limit
    )
}

export const getAIRecommendations = async (
    slug: string
) => {

    return await PropertyService.getAIRecommendations(
        slug
    )
}

// ==========================================================
// 🏛️ MISSING INFRASTRUCTURE PIECE: GET FEATURED PROPERTIES
// ==========================================================
export const getFeaturedProperties = async (filters: { limit?: number } = {}) => {
    return await PropertyService.getAll({
        featured: true,
        limit: filters.limit || 8,
    });
};