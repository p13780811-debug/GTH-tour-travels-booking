import { supabase } from "@/lib/supabase"
import { NextResponse } from "next/server"

export async function POST(req: Request) {
    const body = await req.json()

    const { hotel_id, full_name, email, checkin, checkout, guests } = body

    const { data, error } = await supabase.from("bookings").insert([
        {
            hotel_id,
            full_name,
            email,
            checkin,
            checkout,
            guests,
        },
    ])

    if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true, data })
}