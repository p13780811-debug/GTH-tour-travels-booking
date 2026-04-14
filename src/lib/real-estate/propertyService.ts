import { supabase } from "@/lib/supabase"

// =========================
// 🏠 PROPERTY SERVICE (OBJECT STYLE)
// =========================

export const PropertyService = {
    async getAll() {
        const { data, error } = await supabase
            .from("properties")
            .select("*")
            .order("created_at", { ascending: false })

        if (error) {
            console.error(error.message)
            return []
        }

        return data ?? []
    },

    async getBySlug(slug: string) {
        const { data, error } = await supabase
            .from("properties")
            .select("*")
            .eq("slug", slug)
            .single()

        if (error) {
            console.error(error.message)
            return null
        }

        return data
    },

    async add(property: any) {
        const { data, error } = await supabase
            .from("properties")
            .insert([property])

        if (error) throw error
        return data
    },

    async addLead(payload: any) {
        const { data, error } = await supabase
            .from("leads")
            .insert([payload])

        if (error) throw error
        return data
    },


    async boostProperty(id: number, hours: number = 24) {
        const expiry = new Date();
        expiry.setHours(expiry.getHours() + hours);

        const { data, error } = await supabase
            .from("properties")
            .update({
                is_featured: true,
                boost_expiry: expiry.toISOString(),
            })
            .eq("id", id);

        if (error) throw error;
        return data;
    }
}