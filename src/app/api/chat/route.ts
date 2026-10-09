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
    const res = await fetch("https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent", {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-goog-api-key": key },
      signal: AbortSignal.timeout(20_000),
      body: JSON.stringify({ contents: [...history, { role: "user", parts: [{ text: message }] }],
        generationConfig: { maxOutputTokens: 2048 } }),
    });
    if (!res.ok) throw new RequestError("AI provider unavailable", 502);
    const data = await res.json();
    const reply = data?.candidates?.[0]?.content?.parts?.[0]?.text;
    if (typeof reply !== "string" || !reply.trim()) throw new RequestError("AI response unavailable", 502);
    return Response.json({ reply });
  } catch (error) { return requestError(error); }
}
