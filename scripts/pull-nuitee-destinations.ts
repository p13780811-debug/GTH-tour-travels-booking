import { config } from "dotenv";
import { resolve } from "node:path";
import { createHash } from "node:crypto";
import { createClient } from "@supabase/supabase-js";

config({ path: resolve(process.cwd(), ".env") });

const API = "https://api.liteapi.travel/v3.0/data";
const BATCH_SIZE = 250;
const BATCH_DELAY_MS = 500;
const COUNTRY_DELAY_MS = 750;

type Country = { code: string; name: string };
type Destination = {
  country_code: string;
  country_name: string;
  city_name: string;
  slug: string;
};

const sleep = (ms: number) =>
  new Promise<void>(r => setTimeout(r, ms));

function slugify(value: string): string {
  const ascii = value.normalize("NFKD")
    .replace(/\p{M}/gu, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");

  if (ascii && ascii.length <= 140) return ascii;

  const hash = createHash("sha256")
    .update(value.normalize("NFKC"))
    .digest("hex").slice(0, 16);

  return `${ascii.slice(0, 120).replace(/-$/g, "") || "city"}-${hash}`;
}

function clean(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const text = value.normalize("NFKC")
    .replace(/[\u0000-\u001f\u007f]/g, "")
    .replace(/\s+/g, " ").trim();

  return text && text.length <= 160 ? text : null;
}

async function getStaticData(
  path: string,
  apiKey: string,
): Promise<unknown[]> {
  const url = new URL(`${API}/${path}`);

  // Explicitly block chargeable Places and other API families.
  if (!["/v3.0/data/countries", "/v3.0/data/cities"]
    .includes(url.pathname)) {
    throw new Error("Non-free endpoint blocked");
  }

  const response = await fetch(url, {
    headers: {
      "X-API-Key": apiKey,
      Accept: "application/json",
    },
    signal: AbortSignal.timeout(20000),
    redirect: "error",
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error(`Nuitee static endpoint HTTP ${response.status}`);
  }

  const length = Number(response.headers.get("content-length") || 0);
  if (length > 10_000_000) {
    throw new Error("Response exceeds safety limit");
  }

  const body = await response.text();
  if (body.length > 10_000_000) {
    throw new Error("Response exceeds safety limit");
  }

  const payload: unknown = JSON.parse(body);
  if (
    !payload ||
    typeof payload !== "object" ||
    !("data" in payload) ||
    !Array.isArray(payload.data)
  ) {
    throw new Error("Unexpected Nuitee static response");
  }

  return payload.data;
}

async function main(): Promise<void> {
  const args = process.argv.slice(2);
  const write = args.includes("--write");
  const all = args.includes("--all-countries");
  const countryArg = args.find(x => x.startsWith("--country="));
  const country = countryArg?.split("=")[1]?.toUpperCase();

  if (
    all === Boolean(country) ||
    (country && !/^[A-Z]{2}$/.test(country)) ||
    args.some(x =>
      x !== "--write" &&
      x !== "--all-countries" &&
      !/^--country=[A-Za-z]{2}$/.test(x)
    )
  ) {
    throw new Error(
      "Choose --country=IN or --all-countries, " +
      "optionally with --write"
    );
  }

  const apiKey =
    process.env.NUITEE_API_KEY ||
    process.env.NUITEE_PRODUCTION_API_KEY;

  if (!apiKey) throw new Error("Missing NUITEE_API_KEY");

  // Write access is never initialized during dry runs.
  const db = write ? (() => {
    const url =
      process.env.SUPABASE_URL ||
      process.env.NEXT_PUBLIC_SUPABASE_URL;

    const key =
      process.env.SUPABASE_SERVICE_ROLE_KEY ||
      process.env.SUPABASE_INGESTION_KEY;

    if (!url || !key) {
      throw new Error("Missing server-side Supabase credentials");
    }

    return createClient(url, key, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    });
  })() : null;

  const countries = await getStaticData("countries", apiKey);

  const validCountries: Country[] = countries.flatMap(row => {
    if (!row || typeof row !== "object") return [];
    const item = row as Record<string, unknown>;
    const name = clean(item.name);

    return (
      typeof item.code === "string" &&
      /^[A-Z]{2}$/.test(item.code) &&
      name
    ) ? [{ code: item.code, name }] : [];
  });

  const selected = validCountries
    .filter(c => all || c.code === country)
    .sort((a, b) => a.code.localeCompare(b.code));

  if (!selected.length) {
    throw new Error("No matching official country");
  }

  let total = 0;

  for (const [index, countryRow] of selected.entries()) {
    const rawCities = await getStaticData(
      `cities?countryCode=${countryRow.code}`,
      apiKey
    );

    if (rawCities.length > 100_000) {
      throw new Error("Country response exceeds row limit");
    }

    const seen = new Map<string, string>();
    const rows: Destination[] = [];

    for (const item of rawCities) {
      if (!item || typeof item !== "object") continue;

      // Documented Cities API field: city (not placeId).
      const city = clean((item as Record<string, unknown>).city);
      if (!city) continue;

      const slug = slugify(city);
      const prior = seen.get(slug);

      if (prior) {
        if (prior !== city) {
          console.warn(
            `Skipped ambiguous city slug in ${countryRow.code}: ${slug}`
          );
        }
        continue;
      }

      seen.set(slug, city);
      rows.push({
        country_code: countryRow.code,
        country_name: countryRow.name,
        city_name: city,
        slug,
      });
    }

    for (let i = 0; i < rows.length; i += BATCH_SIZE) {
      const batch = rows.slice(i, i + BATCH_SIZE);

      if (db) {
        const { error } = await db
          .from("nuitee_destinations")
          .upsert(batch, {
            onConflict: "country_code,slug",
            ignoreDuplicates: true,
          });

        if (error) {
          throw new Error(
            `Database import failed for ${countryRow.code}: ${error.code}`
          );
        }
      }

      total += batch.length;
      await sleep(BATCH_DELAY_MS);
    }

    console.info(
      `${countryRow.code}: ${rows.length} destinations ` +
      (write ? "submitted" : "validated (dry-run)")
    );

    if (index < selected.length - 1) {
      await sleep(COUNTRY_DELAY_MS);
    }
  }

  console.info(
    `Finished: ${total} rows processed. ` +
    `Mode: ${write ? "INSERT-ONLY UPSERT" : "DRY RUN"}.`
  );
}

main().catch(error => {
  console.error(
    error instanceof Error ? error.message : "Importer failed"
  );
  process.exitCode = 1;
});
