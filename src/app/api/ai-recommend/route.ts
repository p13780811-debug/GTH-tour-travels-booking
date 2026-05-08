import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase"; // ✅ Aapki existing file se call

export async function POST(req: Request) {
    try {
        const { slug, history } = await req.json();

        // 🔥 GTH PRO Logic: Agar history hai toh milte-julte dikhao, 
        // warna latest properties fetch karo.
        let query = supabase.from("properties").select("*");

        if (history && history.length > 0) {
            query = query.in('slug', history).limit(6);
        } else {
            query = query.neq("slug", slug).limit(6);
        }

        const { data, error } = await query;

        if (error) throw error;

        return NextResponse.json(data || []);
    } catch (err) {
        console.error("AI API Error:", err);
        return NextResponse.json([], { status: 500 });
    }
}