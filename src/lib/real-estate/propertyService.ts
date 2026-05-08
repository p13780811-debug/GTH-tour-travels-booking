import { supabase } from "@/lib/supabase"

// ======================================================
// 🏛️ GTH PRO ESTATE — PROPERTY SERVICE ENGINE V3
// ======================================================

type PropertyPayload = {
    title: string
    slug: string
    location: string
    price: number
    image: string
    description?: string
    lat?: number
    lng?: number
    created_by?: string
    type?: string
    status?: string
    is_featured?: boolean
    boost_expiry?: string
}

type SearchFilters = {
    query?: string
    city?: string
    type?: string
    minPrice?: number
    maxPrice?: number
    featured?: boolean
}

// ======================================================
// ⚡ HELPERS
// ======================================================

const nowISO = () => new Date().toISOString()

const isBoostActive = (p: any) => {
    if (!p?.is_featured) return false
    if (!p?.boost_expiry) return false

    return new Date(p.boost_expiry) > new Date()
}

const luxurySort = (data: any[] = []) => {
    const boosted = data.filter(isBoostActive)

    const premium = data.filter(
        (p) =>
            !isBoostActive(p) &&
            Number(p.price) >= 100
    )

    const normal = data.filter(
        (p) =>
            !isBoostActive(p) &&
            Number(p.price) < 100
    )

    return [...boosted, ...premium, ...normal]
}

const transformProperty = (p: any) => {

    const price = Number(p.price) || 0

    const boosted = isBoostActive(p)

    return {

        ...p,

        // 🔥 UI FLAGS
        featured_active: boosted,

        // 🏛️ LUXURY TAG
        luxury_tag:
            price >= 500
                ? "Ultra Luxury"
                : price >= 100
                    ? "Premium"
                    : "Smart Deal",

        // 💎 CARD STYLE
        container_class:
            boosted || price >= 500
                ? "gth-glass-ultra gth-card-premium"
                : "gth-glass gth-card-premium",

        // 🟡 BADGE STYLE
        badge_class:
            price >= 500
                ? "gth-badge-ultra"
                : "gth-badge-gold",

        // ⚡ CARD TYPE
        card_variant:
            boosted
                ? "boosted"
                : price >= 500
                    ? "ultra"
                    : "standard",

        // 🧠 SEARCH SCORE
        search_rank:
            boosted
                ? 100
                : price >= 500
                    ? 80
                    : 50,

        // ⚡ IMAGE FALLBACK
        image:
            p.image ||
            "https://images.unsplash.com/photo-1560518883-ce09059eeffa?q=80&w=1400",

        // 🏷️ FORMAT
        formatted_price:
            `₹ ${Number(price || 0).toLocaleString()} L`,

        // 📍 SAFE LOCATION
        location:
            p.location || "Location not available",

        // 🌍 MAP SAFE
        lat: p.lat || 22.5726,
        lng: p.lng || 88.3639,
    }
}

// ======================================================
// 🏠 PROPERTY SERVICE
// ======================================================

export const PropertyService = {

    // ==================================================
    // 🌍 GET ALL PROPERTIES
    // ==================================================

    async getAll() {

        const { data, error } = await supabase
            .from("properties")
            .select("*")
            .order("created_at", { ascending: false })

        if (error) {
            console.error(
                "❌ Property Fetch Failed:",
                error.message
            )

            return []
        }

        const transformed =
            (data || []).map(transformProperty)

        return luxurySort(transformed)
    },

    // ==================================================
    // 🔍 GET BY SLUG
    // ==================================================

    async getBySlug(slug: string) {

        const { data, error } = await supabase
            .from("properties")
            .select("*")
            .eq("slug", slug)
            .single()

        if (error) {
            console.error(
                "❌ Property Details Failed:",
                error.message
            )

            return null
        }

        return transformProperty(data)
    },

    // ==================================================
    // ➕ ADD PROPERTY
    // ==================================================

    async add(property: PropertyPayload) {

        const payload = {
            ...property,

            created_at: nowISO(),

            views: 0,
            leads: 0,

            is_featured: false,

            status:
                property.status || "active",

            type:
                property.type || "buy",
        }

        const { data, error } = await supabase
            .from("properties")
            .insert([payload])
            .select()

        if (error) {
            console.error(
                "❌ Property Add Failed:",
                error.message
            )

            throw error
        }

        return data
    },

    // ==================================================
    // 📈 INCREMENT VIEW
    // ==================================================

    async incrementViews(id: number) {

        const { data } = await supabase
            .rpc("increment_property_views", {
                row_id: id,
            })

        return data
    },

    // ==================================================
    // ❤️ SAVE PROPERTY
    // ==================================================

    async saveProperty(payload: any) {

        const { data, error } = await supabase
            .from("saved_properties")
            .insert([payload])

        if (error) {
            console.error(error.message)
            throw error
        }

        return data
    },

    // ==================================================
    // 📞 LEAD SYSTEM
    // ==================================================

    async addLead(payload: any) {

        const leadPayload = {
            ...payload,
            created_at: nowISO(),
        }

        const { data, error } = await supabase
            .from("leads")
            .insert([leadPayload])

        if (error) {
            console.error(
                "❌ Lead Failed:",
                error.message
            )

            throw error
        }

        // 🔥 AUTO LEAD COUNT UPDATE
        if (payload.property_id) {

            await supabase.rpc(
                "increment_property_leads",
                {
                    row_id: payload.property_id,
                }
            )
        }

        return data
    },

    // ==================================================
    // 🚀 BOOST PROPERTY
    // ==================================================

    async boostProperty(
        id: number,
        hours: number = 24
    ) {

        const expiry = new Date()

        expiry.setHours(
            expiry.getHours() + hours
        )

        const { data, error } = await supabase
            .from("properties")
            .update({
                is_featured: true,
                boost_expiry:
                    expiry.toISOString(),
            })
            .eq("id", id)
            .select()

        if (error) {
            console.error(
                "❌ Boost Failed:",
                error.message
            )

            throw error
        }

        return data
    },

    // ==================================================
    // 🧠 AI SEARCH ENGINE
    // ==================================================

    async smartSearch(
        filters: SearchFilters = {}
    ) {

        const all =
            await PropertyService.getAll()

        const result = all.filter((p) => {

            const title =
                p.title?.toLowerCase() || ""

            const location =
                p.location?.toLowerCase() || ""

            const query =
                filters.query?.toLowerCase() || ""

            const price =
                Number(p.price) || 0

            return (

                (!filters.city ||
                    location.includes(
                        filters.city.toLowerCase()
                    )) &&

                (!filters.type ||
                    p.type?.toLowerCase() ===
                    filters.type.toLowerCase()) &&

                (!query ||
                    title.includes(query) ||
                    location.includes(query)) &&

                price >=
                (filters.minPrice || 0) &&

                price <=
                (filters.maxPrice || Infinity) &&

                (!filters.featured ||
                    p.featured_active)
            )
        })

        return luxurySort(result).sort(
            (a, b) => b.search_rank - a.search_rank
        )
    },

    // ==================================================
    // 🎬 SIMILAR PROPERTIES
    // ==================================================

    async getSimilar(
        slug: string,
        limit: number = 10
    ) {

        const current =
            await PropertyService.getBySlug(slug)

        if (!current) return []

        const all =
            await PropertyService.getAll()

        const filtered = all.filter(
            (p) =>
                p.slug !== slug &&
                (
                    p.location
                        ?.toLowerCase()
                        .includes(
                            current.location?.toLowerCase()
                        ) ||

                    p.type === current.type
                )
        )

        return filtered.slice(0, limit)
    },

    // ==================================================
    // 🏆 TRENDING PROPERTIES
    // ==================================================

    async getTrending() {

        const { data } = await supabase
            .from("properties")
            .select("*")
            .order("views", {
                ascending: false,
            })
            .limit(12)

        return luxurySort(
            (data || []).map(transformProperty)
        )
    },

    // ==================================================
    // 🧹 DELETE PROPERTY
    // ==================================================

    async remove(id: number) {

        const { error } = await supabase
            .from("properties")
            .delete()
            .eq("id", id)

        if (error) {
            console.error(
                "❌ Delete Failed:",
                error.message
            )

            throw error
        }

        return true
    },
}