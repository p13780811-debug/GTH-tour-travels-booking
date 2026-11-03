import type { SportCategory, SportsTicketFilters } from "./validation";

/**
 * Providers are registered in server source only after written authorization.
 * Do not put API keys in this file or any NEXT_PUBLIC_ variable.
 * An empty registry is intentional: no contract, no ticket inventory, no checkout.
 */
export type TicketAvailability = "available" | "sold_out" | "check_provider";

export type ProviderSportsEvent = {
  providerEventId: string;
  title: string;
  sport: SportCategory;
  startsAt: string; // ISO-8601 timestamp with timezone
  country: string;
  city: string;
  stadium: string;
  teams?: string[];
  ticketUrl: string;
  availability: TicketAvailability;
  price?: { amount: number; currency: string }; // Only supplier-confirmed display values
  verifiedAt: string;
};

export type PublicSportsEvent = Omit<ProviderSportsEvent, "providerEventId"> & {
  id: string;
  providerName: string;
};

export type AuthorizedTicketProvider = {
  id: string;
  name: string;
  /** Allowed absolute HTTPS origins: e.g. https://tickets.authorized-provider.example */
  approvedTicketOrigins: readonly string[];
  /** Date of written legal/affiliate authorization — required to publish a listing. */
  authorizationReference: string;
  /** Server-owned adapter; never run vendor code in the browser. */
  search: (filters: SportsTicketFilters, signal: AbortSignal) => Promise<ProviderSportsEvent[]>;
};

/** Deliberately empty until a real authorized ticketing agreement is verified. */
export const AUTHORIZED_TICKET_PROVIDERS: readonly AuthorizedTicketProvider[] = Object.freeze([]);

function safeText(value: unknown, max: number): string | null {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  if (!trimmed || trimmed.length > max || /[<>\u0000-\u001f\u007f]/.test(trimmed)) return null;
  return trimmed;
}

export function approvedTicketUrl(input: unknown, allowedOrigins: readonly string[]): string | null {
  if (typeof input !== "string" || input.length > 2048 || !allowedOrigins.length) return null;
  try {
    const url = new URL(input);
    if (url.protocol !== "https:" || url.username || url.password || !allowedOrigins.includes(url.origin)) return null;
    if (url.hash) url.hash = "";
    return url.toString();
  } catch {
    return null;
  }
}

/**
 * Reject unverifiable partner payloads instead of inventing dates, fees or seats.
 * Authorized ticket inventory is only supplied by registered server-side adapters.
 */
export function normalizeAuthorizedEvent(
  provider: AuthorizedTicketProvider,
  event: ProviderSportsEvent,
  now = Date.now(),
): PublicSportsEvent | null {
  if (!provider.id || !provider.name || !provider.authorizationReference) return null;
  const url = approvedTicketUrl(event.ticketUrl, provider.approvedTicketOrigins);
  const externalId = safeText(event.providerEventId, 120);
  const title = safeText(event.title, 180);
  const country = safeText(event.country, 80);
  const city = safeText(event.city, 100);
  const stadium = safeText(event.stadium, 160);
  const startsAt = new Date(event.startsAt).getTime();
  const verifiedAt = new Date(event.verifiedAt).getTime();
  const validSport = ["cricket", "football", "basketball", "tennis", "motorsport", "baseball", "hockey", "rugby", "other"].includes(event.sport);
  const validAvailability = ["available", "sold_out", "check_provider"].includes(event.availability);
  if (!url || !externalId || !title || !country || !city || !stadium || !validSport || !validAvailability ||
      !Number.isFinite(startsAt) || startsAt < now || !Number.isFinite(verifiedAt) || verifiedAt > now ||
      now - verifiedAt > 24 * 60 * 60 * 1000) return null;

  if (event.teams?.some((team) => !safeText(team, 100))) return null;
  const price = event.price;
  if (price && (!Number.isFinite(price.amount) || price.amount < 0 || !/^[A-Z]{3}$/.test(price.currency))) return null;
  return {
    id: provider.id + ":" + externalId,
    providerName: provider.name,
    title, sport: event.sport,
    startsAt: new Date(startsAt).toISOString(),
    country, city, stadium,
    teams: event.teams?.slice(0, 2),
    ticketUrl: url,
    availability: event.availability,
    ...(price ? { price } : {}),
    verifiedAt: new Date(verifiedAt).toISOString(),
  };
}
