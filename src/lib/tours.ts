import { createClient } from "@supabase/supabase-js"

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export async function getTours(filters: any) {
    let query = supabase.from("tours").select("*")

    if (filters.city) {
        query = query.eq("city_slug", filters.city)
    }

    if (filters.minPrice) {
        query = query.gte("price", filters.minPrice)
    }

    if (filters.maxPrice) {
        query = query.lte("price", filters.maxPrice)
    }

    if (filters.category) {
        query = query.eq("category", filters.category)
    }

    const { data, error } = await query

    if (error) {

        return []
    }

    return data
}