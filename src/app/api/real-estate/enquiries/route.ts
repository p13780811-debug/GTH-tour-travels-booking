import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { readJson, RequestError, requestError } from "@/lib/security/request";
import { cleanPositiveInteger, cleanString } from "@/lib/security/validators";
import { enforceRateLimit } from "@/lib/security/rate-limit";

export async function POST(req: Request) {
  try {
    const body = await readJson(req, 2048);
    const propertyId = cleanPositiveInteger(body.property_id);
    const phone = cleanString(body.phone, { min: 8, max: 24, pattern: /^\+?[\d ()-]+$/ });
    const digits = phone?.replace(/\D/g, "") ?? "";
    if (!propertyId || !phone || digits.length < 8 || digits.length > 15) throw new RequestError("Invalid enquiry", 400);
    await enforceRateLimit(req, "enquiries");
    const { data, error: lookupError } = await supabase.from("properties").select("id").eq("id", propertyId).limit(1);
    if (lookupError) throw new RequestError("Enquiries temporarily unavailable", 503);
    if (!data?.length) throw new RequestError("Property unavailable", 404);
    const { error } = await supabase.from("leads").insert({ property_id: propertyId, phone });
    if (error) throw new RequestError("Enquiry could not be sent", 503);
    return NextResponse.json({ success: true }, { status: 201, headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    return requestError(error instanceof RequestError ? error : new RequestError("Enquiry could not be sent", 503));
  }
}
