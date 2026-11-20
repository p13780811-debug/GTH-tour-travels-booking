import "server-only";

/**
 * Metadata only: existing supplier widgets, builders and handoff endpoints
 * remain the source of truth. No private keys, paid requests, or new links are
 * created here. External URLs are optional environment configuration.
 */
export const HOPEGOO_COUNTRIES = [
  "CN", "HK", "MO", "TW", "JP", "KR", "SG", "TH", "MY", "VN",
] as const;
export type HopeGooCountry = (typeof HOPEGOO_COUNTRIES)[number];

export type ProviderId =
  | "nuitee" | "hopegoo" | "aviasales" | "12go" | "bookaway"
  | "klook" | "getyourguide" | "wegotrip" | "kkday" | "gocity"
  | "tiqets" | "kiwitaxi" | "intui" | "welcome_pickups"
  | "gettransfer" | "qeeq" | "localrent";
export type ProviderService =
  | "hotels" | "flights" | "bus" | "train" | "ferry" | "transfers"
  | "tours" | "activities" | "tickets" | "cars" | "cruises";

type ProviderDefinition = Readonly<{
  id: ProviderId;
  services: readonly ProviderService[];
  existingEntry: string;
  implementation: "existing_widget" | "existing_route" | "reviewed_product" | "configured_search";
  /** Optional public booking/affiliate URL supplied by deployment environment. */
  envUrl?: string;
  /** Exact external hostnames only, never suffix or arbitrary wildcard matches. */
  allowedHosts: readonly string[];
}>;

export const PROVIDER_REGISTRY: Readonly<Record<ProviderId, ProviderDefinition>> = {
  nuitee: {
    id: "nuitee", services: ["hotels"], existingEntry: "/hotels?view=booking",
    implementation: "existing_widget", allowedHosts: ["hotel.gthproglobal.com"],
  },
  hopegoo: {
    id: "hopegoo", services: ["hotels"], existingEntry: "/hotels?view=booking",
    implementation: "configured_search", envUrl: "GTH_HOPEGOO_AFFILIATE_URL",
    allowedHosts: ["www.jdoqocy.com", "jdoqocy.com", "www.hopegoo.com", "hopegoo.com"],
  },
  aviasales: {
    id: "aviasales", services: ["flights"], existingEntry: "/flights",
    implementation: "existing_widget", allowedHosts: ["www.aviasales.com", "aviasales.tpo.lv"],
  },
  "12go": {
    id: "12go", services: ["bus", "train", "ferry", "flights", "transfers"],
    existingEntry: "/go/transport", implementation: "existing_route",
    allowedHosts: ["12go.asia", "transport.gthproglobal.com"],
  },
  bookaway: {
    id: "bookaway", services: ["bus", "train", "ferry"], existingEntry: "/go/transport",
    implementation: "existing_route", allowedHosts: ["www.bookaway.com"],
  },
  klook: {
    id: "klook", services: ["hotels", "tours", "activities", "tickets", "cruises"],
    existingEntry: "/tours", implementation: "existing_route",
    envUrl: "GTH_KLOOK_AFFILIATE_URL",
    allowedHosts: ["www.klook.com", "klook.tpo.lv", "tp.media"],
  },
  getyourguide: {
    id: "getyourguide", services: ["tours", "activities", "tickets", "cruises"],
    existingEntry: "/tours", implementation: "reviewed_product",
    envUrl: "GTH_GETYOURGUIDE_AFFILIATE_URL",
    allowedHosts: ["www.getyourguide.com"],
  },
  wegotrip: {
    id: "wegotrip", services: ["tours", "activities"],
    existingEntry: "/tours", implementation: "reviewed_product",
    envUrl: "GTH_WEGOTRIP_AFFILIATE_URL",
    allowedHosts: ["wegotrip.tpo.lv", "wegotrip.com", "www.wegotrip.com"],
  },
  kkday: {
    id: "kkday", services: ["tours", "activities", "tickets"],
    existingEntry: "/activities", implementation: "reviewed_product",
    envUrl: "GTH_KKDAY_AFFILIATE_URL",
    allowedHosts: ["kkday.tpo.lv", "www.kkday.com"],
  },
  gocity: {
    id: "gocity", services: ["activities", "tickets"],
    existingEntry: "/activities", implementation: "reviewed_product",
    envUrl: "GTH_GOCITY_AFFILIATE_URL",
    allowedHosts: ["gocity.tpo.lv"],
  },
  tiqets: {
    id: "tiqets", services: ["activities", "tickets"],
    existingEntry: "/activities", implementation: "existing_widget",
    allowedHosts: ["www.tiqets.com"],
  },
  kiwitaxi: {
    id: "kiwitaxi", services: ["transfers"], existingEntry: "/transfers",
    implementation: "existing_widget", allowedHosts: [],
  },
  intui: {
    id: "intui", services: ["transfers"], existingEntry: "/transfers",
    implementation: "existing_widget", allowedHosts: [],
  },
  welcome_pickups: {
    id: "welcome_pickups", services: ["transfers"], existingEntry: "/transfers",
    implementation: "existing_route", envUrl: "GTH_WELCOME_PICKUPS_AFFILIATE_URL",
    allowedHosts: ["tpo.lv"],
  },
  gettransfer: {
    id: "gettransfer", services: ["transfers"], existingEntry: "/transfers",
    implementation: "existing_route", envUrl: "GTH_GETTRANSFER_AFFILIATE_URL",
    allowedHosts: ["gettransfer.tpo.lv"],
  },
  qeeq: {
    id: "qeeq", services: ["cars"], existingEntry: "/cars",
    implementation: "existing_widget", allowedHosts: [],
  },
  localrent: {
    id: "localrent", services: ["cars"], existingEntry: "/cars",
    implementation: "existing_widget", allowedHosts: [],
  },
};

export function isHopeGooCountry(country: unknown): country is HopeGooCountry {
  return typeof country === "string" &&
    HOPEGOO_COUNTRIES.some(code => code === country);
}

export function providerSupports(id: ProviderId, service: ProviderService): boolean {
  return PROVIDER_REGISTRY[id].services.includes(service);
}

const BLOCKED_REDIRECT_FIELDS = [
  "redirect", "redirect_url", "redirect_uri", "return_url",
  "returnUrl", "target", "next", "dest",
];

/**
 * Use exact host membership rather than endsWith() to block lookalike hosts.
 * The existing tp.media tracker can wrap ONLY an exact Klook destination.
 * A CJ link must match its published click-ID path; it is never a city-specific
 * result merely because it is an approved affiliate tracking link.
 */
export function isSafeProviderOutboundUrl(
  provider: ProviderId,
  raw: unknown,
): raw is string {
  if (typeof raw !== "string" || raw.length < 12 || raw.length > 2048 ||
      /[\u0000-\u0020\\]/u.test(raw)) return false;
  let url: URL;
  try { url = new URL(raw); } catch { return false; }
  if (url.protocol !== "https:" || url.username || url.password || url.port ||
      url.hash || url.hostname.endsWith(".") ||
      !PROVIDER_REGISTRY[provider].allowedHosts.includes(url.hostname)) return false;

  if (BLOCKED_REDIRECT_FIELDS.some(field => url.searchParams.has(field))) return false;

  if (url.hostname === "tp.media") {
    if (provider !== "klook" || url.pathname !== "/r" ||
        url.searchParams.getAll("u").length !== 1) return false;
    const target = url.searchParams.get("u");
    if (!target || target.length > 1500) return false;
    try {
      const inner = new URL(target);
      return inner.protocol === "https:" && inner.hostname === "www.klook.com" &&
        !inner.username && !inner.password && !inner.port && !inner.hash &&
        !BLOCKED_REDIRECT_FIELDS.some(field => inner.searchParams.has(field));
    } catch { return false; }
  }
  if (url.searchParams.has("u")) return false;

  if (provider === "hopegoo" && (url.hostname === "www.jdoqocy.com" ||
      url.hostname === "jdoqocy.com")) {
    return /^\/click-\d{3,20}-\d{3,20}\/?$/.test(url.pathname);
  }
  if (provider === "nuitee") {
    return url.pathname === "/" || url.pathname === "/hotels" ||
      /^\/hotels\/[A-Za-z0-9_-]{1,100}$/.test(url.pathname);
  }
  if (provider === "12go") {
    return url.hostname === "transport.gthproglobal.com" ||
      url.pathname === "/" || /^\/(?:en\/)?(?:bus|train|ferry|flights)(?:\/[a-z0-9-]+){0,2}\/?$/.test(url.pathname);
  }
  return true;
}

export function isSafeInternalEntry(raw: unknown): raw is string {
  if (typeof raw !== "string" || raw.length > 600 ||
      !raw.startsWith("/") || raw.startsWith("//") ||
      /[\u0000-\u001f\\#]/u.test(raw) || /%2f|%5c|%00/iu.test(raw)) return false;
  try {
    const url = new URL(raw, "https://gthproglobal.com");
    return url.origin === "https://gthproglobal.com" &&
      !url.username && !url.password;
  } catch { return false; }
}

/** Reads the current deployment environment on demand. Never logs or exposes it. */
export function configuredProviderUrl(id: ProviderId): string | null {
  const variable = PROVIDER_REGISTRY[id].envUrl;
  if (!variable) return null;
  const raw = process.env[variable];
  return isSafeProviderOutboundUrl(id, raw) ? raw : null;
}
