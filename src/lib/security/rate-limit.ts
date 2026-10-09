import { createHmac } from "node:crypto";
import { isIP } from "node:net";
import { RequestError } from "./request";

export type LimitScope = "ai" | "images" | "bookings" | "upload" | "enquiries";

// Shared across all routes within a scope, not per instance or per endpoint.
const POLICIES: Record<LimitScope, { minute: number; day: number; globalMinute: number; globalDay: number }> = {
  ai: { minute: 20, day: 100, globalMinute: 100, globalDay: 1000 },
  images: { minute: 60, day: 500, globalMinute: 300, globalDay: 5000 },
  enquiries: { minute: 3, day: 10, globalMinute: 60, globalDay: 1000 },
  bookings: { minute: 3, day: 10, globalMinute: 60, globalDay: 1000 },
  upload: { minute: 10, day: 100, globalMinute: 200, globalDay: 5000 },
};

// Check every counter before incrementing any. EVAL serializes parallel requests.
// Each window starts on its first accepted request. TTL never extends on denial.
export const LIMIT_SCRIPT = `
local retry = 0
for i, key in ipairs(KEYS) do
  local count = tonumber(redis.call('GET', key) or '0')
  local limit = tonumber(ARGV[(i - 1) * 2 + 1])
  local window = tonumber(ARGV[(i - 1) * 2 + 2])
  local ttl = redis.call('TTL', key)
  if count >= limit then
    if ttl < 1 then ttl = window end
    retry = math.max(retry, ttl)
  end
end
if retry > 0 then return {0, retry} end
for i, key in ipairs(KEYS) do
  local count = redis.call('INCR', key)
  if count == 1 or redis.call('TTL', key) < 0 then
    redis.call('EXPIRE', key, tonumber(ARGV[(i - 1) * 2 + 2]))
  end
end
return {1, 0}
`;

// Ignore caller-controlled forwarding headers outside Vercel. Missing/invalid
// trusted identity collapses to a shared bucket; it cannot bypass the limits.
export function clientIdentity(req: Request): string {
  if (process.env.VERCEL !== "1") return "untrusted-origin";
  const raw = req.headers.get("x-vercel-forwarded-for")?.trim();
  if (!raw || !isIP(raw)) return "unknown-vercel-client";
  // Canonicalize equivalent IPv6 spellings through URL parsing.
  return isIP(raw) === 6 ? new URL(`http://[${raw}]/`).hostname : raw;
}

export async function enforceRateLimit(req: Request, scope: LimitScope, userId?: string): Promise<void> {
  const unavailable = () => new RequestError("Request protection unavailable", 503, { "Retry-After": "60" });
  const rawUrl = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;
  if (!rawUrl || !token) throw unavailable();
  let url: URL;
  try {
    url = new URL(rawUrl);
    if (url.protocol !== "https:" || !url.hostname.endsWith(".upstash.io") || url.port || url.username || url.password || url.search || url.hash || (url.pathname !== "/" && url.pathname !== "")) throw new Error();
  } catch { throw unavailable(); }
  const environment = process.env.VERCEL_ENV || (process.env.NODE_ENV === "production" ? "production" : "development");
  const namespace = process.env.GTH_RATE_LIMIT_NAMESPACE || "gth-pro";
  if (!/^[a-zA-Z0-9_-]{1,64}$/.test(namespace) || !/^[a-zA-Z0-9_-]{1,64}$/.test(environment)) throw unavailable();
  const identity = userId ? `user:${userId}` : `ip:${clientIdentity(req)}`;
  const digest = createHmac("sha256", token).update(identity).digest("hex");
  const prefix = `{${namespace}:${environment}:rl:v1:${scope}}`;
  const keys = [`${prefix}:${digest}:minute`, `${prefix}:${digest}:day`, `${prefix}:global:minute`, `${prefix}:global:day`];
  const policy = POLICIES[scope];
  const args = [policy.minute, 60, policy.day, 86400, policy.globalMinute, 60, policy.globalDay, 86400];
  let result: unknown;
  try {
    const response = await fetch(url, {
      method: "POST", cache: "no-store", redirect: "error",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      signal: AbortSignal.timeout(3000),
      body: JSON.stringify(["EVAL", LIMIT_SCRIPT, keys.length, ...keys, ...args]),
    });
    if (!response.ok) throw new Error();
    const payload = await response.json();
    if (payload.error) throw new Error();
    result = payload.result;
  } catch { throw unavailable(); }
  if (!Array.isArray(result) || result.length !== 2 || (result[0] !== 0 && result[0] !== 1) ||
      !Number.isSafeInteger(result[1]) || result[1] < 0 || result[1] > 86400 ||
      (result[0] === 0 && result[1] === 0) || (result[0] === 1 && result[1] !== 0)) throw unavailable();
  if (result[0] === 0) throw new RequestError("Too many requests. Please try again later.", 429, { "Retry-After": String(result[1]) });
}
