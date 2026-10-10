// Client-facing messages are based on status, never raw internal error bodies.
export async function readApiJson<T>(response: Response): Promise<T> {
  if (!response.ok) {
    if (response.status === 429) {
      const seconds = Number(response.headers.get("Retry-After"));
      const wait = Number.isSafeInteger(seconds) && seconds > 0 && seconds <= 86400 ? ` Try again in ${seconds} seconds.` : " Please try again later.";
      throw new Error(`Request limit reached.${wait}`);
    }
    if (response.status === 401) throw new Error("Please sign in to continue.");
    if (response.status === 403) throw new Error("You do not have access to this feature.");
    if (response.status >= 500) throw new Error("This service is temporarily unavailable. Please try again later.");
    throw new Error("Please check your request and try again.");
  }
  try { return await response.json() as T; }
  catch { throw new Error("The service returned an invalid response. Please try again."); }
}

export async function readAIReply(response: Response): Promise<string> {
  const data = await readApiJson<{ reply?: unknown }>(response);
  if (!data || typeof data.reply !== "string" || !data.reply.trim()) throw new Error("No AI response is available. Please try again.");
  return data.reply;
}
