import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import {
  cleanDate,
  cleanEmail,
  cleanPositiveInteger,
  cleanString,
} from "@/lib/security/validators";

export async function POST(req: Request) {
  try {
    const body = await req.json();

    const hotelId = cleanString(body?.hotel_id, { min: 1, max: 120 });
    const fullName = cleanString(body?.full_name, { min: 2, max: 120 });
    const email = cleanEmail(body?.email);
    const checkin = cleanDate(body?.checkin);
    const checkout = cleanDate(body?.checkout);
    const guests = cleanPositiveInteger(body?.guests, { min: 1, max: 20 });

    if (!hotelId || !fullName || !email || !checkin || !checkout || !guests) {
      return NextResponse.json({ error: "Invalid booking data" }, { status: 400 });
    }

    if (checkout <= checkin) {
      return NextResponse.json(
        { error: "Checkout must be after check-in" },
        { status: 400 },
      );
    }

    const { data, error } = await supabase
      .from("bookings")
      .insert([
        {
          hotel_id: hotelId,
          full_name: fullName,
          email,
          checkin,
          checkout,
          guests,
        },
      ])
      .select();

    if (error) {
      return NextResponse.json({ error: "Booking could not be created" }, { status: 500 });
    }

    return NextResponse.json({ success: true, data }, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }
}
