import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase"; // ✅ Same yahan bhi

export async function GET(req: Request) {
    try {
        const { searchParams } = new URL(req.url);
        const slug = searchParams.get("slug");

        const { data, error } = await supabase
            .from("properties")
            .select("*")
            .neq("slug", slug) // Current property ko skip karo
            .limit(10);

        if (error) throw error;

        return NextResponse.json(data || []);
    } catch (err) {
        console.error("Similar API Error:", err);
        return NextResponse.json([], { status: 500 });
    }
}