import { cleanString } from "./validators";

export class RequestError extends Error {
  constructor(message: string, public status: number, public headers: Record<string, string> = {}) { super(message); }
}

// Bound the streamed body as well as Content-Length (which is untrusted).
export async function readJson(req: Request, maxBytes = 32 * 1024): Promise<Record<string, unknown>> {
  if (req.headers.get("content-type")?.split(";", 1)[0].trim().toLowerCase() !== "application/json") {
    throw new RequestError("JSON body required", 415);
  }
  const bytes = await readBytes(req, maxBytes);
  try {
    const body: unknown = JSON.parse(new TextDecoder().decode(bytes));
    if (!body || typeof body !== "object" || Array.isArray(body)) throw new Error();
    return body as Record<string, unknown>;
  } catch { throw new RequestError("Invalid JSON body", 400); }
}

export async function readBytes(req: Request, maxBytes: number): Promise<Uint8Array> {
  const reader = req.body?.getReader();
  if (!reader) throw new RequestError("Request body required", 400);
  const chunks: Uint8Array[] = [];
  let size = 0;
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      size += value.byteLength;
      if (size > maxBytes) {
        await reader.cancel();
        throw new RequestError("Request body too large", 413);
      }
      chunks.push(value);
    }
    const bytes = new Uint8Array(size);
    let offset = 0;
    for (const chunk of chunks) { bytes.set(chunk, offset); offset += chunk.length; }
    return bytes;
  } finally { reader.releaseLock(); }
}

export function requestError(error: unknown): Response {
  return Response.json({ error: error instanceof RequestError ? error.message : "Service unavailable" },
    { status: error instanceof RequestError ? error.status : 502,
      headers: { "Cache-Control": "no-store", ...(error instanceof RequestError ? error.headers : {}) } });
}

export function chatHistory(value: unknown): { role: "user" | "model"; parts: { text: string }[] }[] {
  if (value === undefined) return [];
  if (!Array.isArray(value) || value.length > 20) throw new RequestError("Invalid conversation history", 400);
  return value.map(item => {
    if (!item || (item.role !== "user" && item.role !== "model") || !Array.isArray(item.parts) || item.parts.length !== 1) {
      throw new RequestError("Invalid conversation history", 400);
    }
    const text = cleanString(item.parts[0]?.text, { max: 4000 });
    if (!text) throw new RequestError("Invalid conversation history", 400);
    return { role: item.role, parts: [{ text }] };
  });
}
