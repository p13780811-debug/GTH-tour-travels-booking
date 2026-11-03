import { AUTHORIZED_TICKET_PROVIDERS, normalizeAuthorizedEvent, type PublicSportsEvent } from "./providers";
import type { SportsTicketFilters } from "./validation";

/** No public launch merely by merging code or toggling an env var without providers. */
export function sportsTicketingPubliclyEnabled(): boolean {
  return process.env.GTH_SPORTS_TICKETS_PUBLIC_ENABLED === "true" && AUTHORIZED_TICKET_PROVIDERS.length > 0;
}

/** Local development can inspect the shell; never permit a production preview bypass. */
export function sportsTicketingPageAccessible(): boolean {
  return sportsTicketingPubliclyEnabled() ||
    (process.env.NODE_ENV === "development" && process.env.GTH_SPORTS_TICKETS_LOCAL_PREVIEW === "true");
}

export async function searchAuthorizedSportsEvents(filters: SportsTicketFilters): Promise<PublicSportsEvent[]> {
  if (!AUTHORIZED_TICKET_PROVIDERS.length) return [];
  const now = Date.now();
  const results = await Promise.allSettled(AUTHORIZED_TICKET_PROVIDERS.map(async (provider) => {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 6500);
    try {
      const events = await provider.search(filters, controller.signal);
      if (!Array.isArray(events)) return [];
      return events.slice(0, 80).map((event) => normalizeAuthorizedEvent(provider, event, now)).filter(
        (event): event is PublicSportsEvent => Boolean(event),
      );
    } finally {
      clearTimeout(timeout);
    }
  }));
  const unique = new Map<string, PublicSportsEvent>();
  for (const result of results) if (result.status === "fulfilled") {
    for (const event of result.value) {
      const match = (field: string, query: string) => !query || field.toLocaleLowerCase().includes(query.toLocaleLowerCase());
      if (filters.date && !event.startsAt.startsWith(filters.date)) continue;
      if (filters.sport && event.sport !== filters.sport) continue;
      if (!match(event.country, filters.country) || !match(event.city, filters.city) ||
          !match(event.stadium, filters.stadium) || !match(event.teams?.join(" ") || "", filters.team)) continue;
      unique.set(event.id, event);
    }
  }
  return [...unique.values()].sort((a, b) => a.startsAt.localeCompare(b.startsAt)).slice(0, 60);
}
