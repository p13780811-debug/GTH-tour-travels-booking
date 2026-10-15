// GTH PRO: GitHub Actions OIDC -> Supabase official procurement intake.
// Custom authentication intentionally replaces Supabase JWT gateway auth.
// Only an RS256 GitHub-issued token for our DEFAULT-BRANCH workflow is accepted.
// No API key or service-role key ever goes to GitHub Actions or browser code.
import { createRemoteJWKSet, jwtVerify } from "npm:jose@5.9.6";

const EXPECTED_REPO = "p13780811-debug/GTH-tour-travels-booking";
const EXPECTED_REPO_ID = "1169920747";
const EXPECTED_WORKFLOW = EXPECTED_REPO + "/.github/workflows/tenders-sync.yml@refs/heads/main";
const EXPECTED_SUBJECT = "repo:" + EXPECTED_REPO + ":ref:refs/heads/main";
const EXPECTED_AUDIENCE = "gth-pro-tender-ingest:dqprqjmhxjnrllczqyhz";
const EXPECTED_ORIGIN = "https://dqprqjmhxjnrllczqyhz.supabase.co";
const GH_KEYS = createRemoteJWKSet(
  new URL("https://token.actions.githubusercontent.com/.well-known/jwks"),
  { timeoutDuration: 5000, cooldownDuration: 30000, cacheMaxAge: 600000 },
);

const SOURCES: Record<string, { host: string; path: RegExp }> = {
  "World Bank": {
    host: "projects.worldbank.org",
    path: /^\/en\/projects-operations\/procurement-detail\/OP\d{8,15}$/,
  },
  "TED EU": {
    host: "ted.europa.eu",
    path: /^\/en\/notice\/-\/detail\/\d{1,8}-20\d{2}$/,
  },
  "UK Find a Tender": {
    host: "www.find-tender.service.gov.uk",
    path: /^\/Notice\/\d{6}-20\d{2}$/,
  },
  "UK Contracts Finder": {
    host: "www.contractsfinder.service.gov.uk",
    path: /^\/Published\/Notice\/releases\/[a-fA-F0-9-]{36}-[0-9]{1,10}\.json$/,
  },
  "Ukraine Prozorro": {
    host: "prozorro.gov.ua",
    path: /^\/tender\/UA-20\d{2}-\d{2}-\d{2}-\d{6}-[a-z]$/i,
  },
  "CanadaBuys Open Data": {
    host: "canadabuys.canada.ca",
    path: /^\/en\/tender-opportunities\/tender-notice\/[A-Za-z0-9._%-]{3,170}$/,
  },
  "Brazil PNCP": {
    host: "pncp.gov.br",
    path: /^\/app\/editais\/\d{14}\/20\d{2}\/\d+$/,
  },
  "US SAM.gov": {
    host: "sam.gov",
    path: /^\/opp\/[0-9a-fA-F]{32}\/view$/,
  },
};
const SECTORS = new Set(["works", "goods", "services", "consultancy", "other"]);
const MAX_RECORDS = 100;
const MAX_BODY_BYTES = 450_000;
const RESPONSE_HEADERS = { "Cache-Control": "no-store", "Content-Type": "application/json", "X-Content-Type-Options": "nosniff" };

type JsonRecord = Record<string, unknown>;
const isObj = (value: unknown): value is JsonRecord =>
  typeof value === "object" && value !== null && !Array.isArray(value);
function text(value: unknown, max: number): string {
  if (typeof value !== "string") return "";
  const t = value.trim();
  return t.length <= max && !/[\u0000-\u001f]/.test(t) ? t : "";
}
function optionalText(value: unknown, max: number): string | null {
  if (value == null || value === "") return null;
  const v = text(value, max);
  if (!v) throw new Error("Invalid optional text");
  return v;
}
function timestamp(value: unknown, required: boolean): string | null {
  if (value == null || value === "") {
    if (required) throw new Error("Missing deadline");
    return null;
  }
  const raw = text(value, 60);
  if (!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{1,6})?(?:Z|[+-]\d{2}:\d{2})$/.test(raw)) {
    throw new Error("Not an explicit timezone timestamp");
  }
  const parsed = Date.parse(raw);
  if (!Number.isFinite(parsed)) throw new Error("Invalid timestamp");
  return new Date(parsed).toISOString();
}
function notice(row: unknown, source: string): JsonRecord {
  if (!isObj(row)) throw new Error("Invalid notice");
  const expected = SOURCES[source];
  if (!expected || row.source_name !== source) throw new Error("Unknown source");
  const source_reference = text(row.source_reference, 160);
  const title = text(row.title, 240);
  const buyer = text(row.buyer, 180);
  const country_code = text(row.country_code, 2);
  const sector = text(row.sector, 40);
  if (!/^[\w./:-]{2,160}$/.test(source_reference) ||
      title.length < 5 || buyer.length < 2 ||
      !/^[A-Z]{2}$/.test(country_code) || !SECTORS.has(sector)) {
    throw new Error("Invalid procurement fields");
  }
  const official_url = text(row.source_url, 2048);
  let parsed: URL;
  try {
    parsed = new URL(official_url);
  } catch {
    throw new Error("Missing official URL");
  }
  const approvedOfficial = parsed.hostname === expected.host && expected.path.test(parsed.pathname);
  const canadianGovernmentFeedLink = source === "CanadaBuys Open Data" &&
    parsed.hostname === "www.merx.com" &&
    /^\/public\/solicitations\/[0-9]{6,15}\/abstract$/.test(parsed.pathname);
  if (parsed.protocol !== "https:" || parsed.username || parsed.password ||
      parsed.port || parsed.search || parsed.hash ||
      !(approvedOfficial || canadianGovernmentFeedLink)) {
    throw new Error("Invalid official source link");
  }
  const deadline_at = timestamp(row.deadline_at, true)!;
  const ms = Date.parse(deadline_at);
  if (ms <= Date.now() || ms > Date.now() + 3 * 366 * 24 * 3600 * 1000) {
    throw new Error("Notice not currently active");
  }
  const published_at = timestamp(row.published_at, false);
  const estimated_value = row.estimated_value == null ? null : text(row.estimated_value, 40);
  if (estimated_value && !/^\d{1,16}(?:\.\d{1,2})?$/.test(estimated_value)) {
    throw new Error("Invalid official value");
  }
  const currency = row.currency == null ? null : text(row.currency, 3);
  if (currency && !/^[A-Z]{3}$/.test(currency)) throw new Error("Invalid currency");
  return {
    source_name: source,
    source_reference,
    source_url: parsed.toString(),
    title,
    buyer,
    country_code,
    sector,
    deadline_at,
    published_at,
    estimated_value: estimated_value || null,
    currency,
    region: optionalText(row.region, 160),
    summary: optionalText(row.summary, 4000),
    status: "published",
    source_verified: true, // GitHub OIDC + official API provenance, NOT bidder eligibility verification.
    requirements_verified: false,
    is_public: true,
  };
}
async function authenticate(req: Request): Promise<void> {
  const header = req.headers.get("Authorization") ?? "";
  if (!header.startsWith("Bearer ") || header.length > 5500) throw new Error("Invalid bearer");
  const token = header.slice(7);
  const { payload, protectedHeader } = await jwtVerify(token, GH_KEYS, {
    issuer: "https://token.actions.githubusercontent.com",
    audience: EXPECTED_AUDIENCE,
    algorithms: ["RS256"],
    clockTolerance: "5s",
  });
  if (protectedHeader.alg !== "RS256" ||
      payload.sub !== EXPECTED_SUBJECT ||
      payload.repository !== EXPECTED_REPO ||
      String(payload.repository_id) !== EXPECTED_REPO_ID ||
      payload.ref !== "refs/heads/main" ||
      payload.workflow_ref !== EXPECTED_WORKFLOW ||
      !["schedule", "workflow_dispatch", "push"].includes(String(payload.event_name))) {
    throw new Error("Untrusted GitHub run");
  }
}
async function readBoundedJson(req: Request): Promise<JsonRecord> {
  if (!req.body) throw new Error("Missing body");
  const chunks: Uint8Array[] = [];
  let size = 0;
  for await (const chunk of req.body) {
    size += chunk.length;
    if (size > MAX_BODY_BYTES) throw new Error("Body too large");
    chunks.push(chunk);
  }
  const data = new Uint8Array(size);
  let offset = 0;
  for (const chunk of chunks) { data.set(chunk, offset); offset += chunk.length; }
  const parsed: unknown = JSON.parse(new TextDecoder().decode(data));
  if (!isObj(parsed)) throw new Error("Invalid JSON");
  return parsed;
}
Deno.serve(async (req) => {
  if (req.method !== "POST") {
    return Response.json({ error: "Method not allowed" }, { status: 405, headers: { ...RESPONSE_HEADERS, Allow: "POST" } });
  }
  try {
    await authenticate(req);
  } catch {
    return Response.json({ error: "Unauthorized workflow" }, { status: 401, headers: RESPONSE_HEADERS });
  }
  try {
    const input = await readBoundedJson(req);
    const source = text(input.source, 50);
    const raw = input.records;
    if (!SOURCES[source] || !Array.isArray(raw) || raw.length > MAX_RECORDS) {
      return Response.json({ error: "Invalid source or batch" }, { status: 400, headers: RESPONSE_HEADERS });
    }
    const unique = new Set<string>();
    const records: JsonRecord[] = [];
    let rejected = 0;
    for (const item of raw) {
      try {
        const verified = notice(item, source);
        const ref = String(verified.source_reference);
        if (unique.has(ref)) continue;
        unique.add(ref);
        records.push(verified);
      } catch {
        // Real official releases may contain incomplete buyer/deadline information
        // or unsupported text. Reject that notice without losing valid records.
        rejected++;
      }
    }
    const url = Deno.env.get("SUPABASE_URL");
    const key = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    if (url !== EXPECTED_ORIGIN || !key) {
      return Response.json({ error: "Server unavailable" }, { status: 503, headers: RESPONSE_HEADERS });
    }
    if (records.length > 0) {
      const response = await fetch(
        EXPECTED_ORIGIN + "/rest/v1/tenders?on_conflict=source_name,source_reference",
        {
          method: "POST",
          headers: {
            apikey: key,
            Authorization: "Bearer " + key,
            "Content-Type": "application/json",
            Prefer: "resolution=ignore-duplicates,return=minimal",
          },
          body: JSON.stringify(records),
          signal: AbortSignal.timeout(18000),
        },
      );
      if (!response.ok) {
        return Response.json({ error: "Database ingestion failed" }, { status: 502, headers: RESPONSE_HEADERS });
      }
    }
    return Response.json({ accepted: records.length, rejected, source, mode: "official_source_import", published_count: null }, { headers: RESPONSE_HEADERS });
  } catch {
    return Response.json({ error: "Invalid or unavailable source records" }, { status: 400, headers: RESPONSE_HEADERS });
  }
});
