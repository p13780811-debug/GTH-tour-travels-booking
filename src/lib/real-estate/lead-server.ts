import "server-only"
import { createClient } from "@supabase/supabase-js"
import { RequestError } from "@/lib/security/request"
export function propertyLeadWriter() {
  const url = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) throw new RequestError("Project enquiries are temporarily unavailable.", 503)
  try { const parsed = new URL(url); if (parsed.protocol !== "https:" || !parsed.hostname.endsWith(".supabase.co") || parsed.username || parsed.password || parsed.port) throw new Error() } catch { throw new RequestError("Project enquiries are temporarily unavailable.", 503) }
  return createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false } })
}
