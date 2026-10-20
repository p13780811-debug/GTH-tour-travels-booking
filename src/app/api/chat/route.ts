import { SITE_CONFIG } from "@/lib/site-config";
import { enforceRateLimit } from "@/lib/security/rate-limit";
import { cleanString } from "@/lib/security/validators";
import { chatHistory, readJson, RequestError, requestError } from "@/lib/security/request";

export async function POST(req: Request) {
  try {
    const body = await readJson(req, 96 * 1024);
    const message = cleanString(body.message, { max: 4000 });
    if (!message) throw new RequestError("Invalid message", 400);
    const history = chatHistory(body.history);
    const key = process.env.GEMINI_API_KEY;
    if (!key) throw new RequestError("AI service is not configured", 503);
    await enforceRateLimit(req, "ai");
    const assistantInstructions = [
      "You are GTH PRO AI receptionist, not a human staff member or a telephone operator.",
      "Reply conversationally and concisely in the user's chosen language (Hindi, Hinglish or English).",
      "Explain GTH PRO's three areas: travel and hotels, real estate, and tender information.",
      "Help visitors understand GTH PRO services and which page to visit, but do not claim a confirmed booking, live prices, inventory, provider approval, payment collection, personal legal/tender eligibility, or completed application unless a verified source confirms it.",
      "For hotels mention /hotels; flights /flights; tours /tours; property /real-estate; tenders /tender; business enquiries /contact.",
      "If the visitor needs a person, refer them to the human enquiry form at /contact or " + SITE_CONFIG.supportEmail + ". Never say a human is on the line.",
      "Do not request passwords, identity scans, payment card numbers, bank details, private keys or sensitive personal information.",
      "Do not invent company registration, IRCTC agent authorization, Booking.com or Agoda partnership.",
      "Keep responses brief (normally two to four sentences) for spoken conversation.",
    ].join(" ");
    const res = await fetch("https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent", {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-goog-api-key": key },
      signal: AbortSignal.timeout(20_000),
      body: JSON.stringify({ systemInstruction: { parts: [{ text: assistantInstructions }] },
        contents: [...history, { role: "user", parts: [{ text: message }] }],
        generationConfig: { maxOutputTokens: 500 } }),
    });
    if (!res.ok) throw new RequestError("AI provider unavailable", 502);
    const data = await res.json();
    const reply = data?.candidates?.[0]?.content?.parts?.[0]?.text;
    if (typeof reply !== "string" || !reply.trim()) throw new RequestError("AI response unavailable", 502);
    return Response.json({ reply });
  } catch (error) { return requestError(error); }
}
