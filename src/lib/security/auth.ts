import { createClient } from "@supabase/supabase-js";
import { RequestError } from "./request";

export async function authenticatedStorage(req: Request) {
  const token = req.headers.get("authorization")?.match(/^Bearer ([^\s]+)$/i)?.[1];
  if (!token) throw new RequestError("Sign in required", 401);
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) throw new RequestError("Upload service is not configured", 503);
  const client = createClient(url, key, {
    global: { headers: { Authorization: `Bearer ${token}` } },
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
  });
  const { data, error } = await client.auth.getUser(token);
  if (error || !data.user) throw new RequestError("Invalid session", 401);
  return { client, user: data.user };
}
