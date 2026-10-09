import { enforceRateLimit } from "@/lib/security/rate-limit";
import { readJson, RequestError, requestError } from "@/lib/security/request";
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
    const body = await readJson(req);

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

    await enforceRateLimit(req, "bookings");
    const { error } = await supabase
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
      ]);

    if (error) {
      return NextResponse.json({ error: "Booking could not be created" }, { status: 500 });
    }

    return NextResponse.json({ success: true }, { status: 201 });
  } catch (error) {
    if (error instanceof RequestError) return requestError(error);
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }
}
