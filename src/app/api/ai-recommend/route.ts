import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { cleanSlug, cleanStringArray } from "@/lib/security/validators";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const slug = cleanSlug(body?.slug);
    const history = cleanStringArray(body?.history, { maxItems: 20, maxLength: 160 });

    if (!slug) {
      return NextResponse.json({ error: "Invalid property slug" }, { status: 400 });
    }

    let query = supabase.from("properties").select("*");

    if (history.length > 0) {
      query = query.in("slug", history).limit(6);
    } else {
      query = query.neq("slug", slug).limit(6);
    }

    const { data, error } = await query;
    if (error) {
      return NextResponse.json([], { status: 500 });
    }

    return NextResponse.json(data || []);
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }
}
