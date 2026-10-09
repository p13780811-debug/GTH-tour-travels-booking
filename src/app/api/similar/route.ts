import { cleanSlug } from "@/lib/security/validators";
import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase"; // ✅ Same yahan bhi

export async function GET(req: Request) {
    try {
        const { searchParams } = new URL(req.url);
        const slug = cleanSlug(searchParams.get("slug"));
        if (!slug) return NextResponse.json({ error: "Invalid property slug" }, { status: 400 });

        const { data, error } = await supabase
            .from("properties")
            .select("*")
            .neq("slug", slug) // Current property ko skip karo
            .limit(10);

        if (error) throw error;

        return NextResponse.json(data || []);
    } catch (err) {

        return NextResponse.json([], { status: 500 });
    }
}