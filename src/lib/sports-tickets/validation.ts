/** Strict server-side filters for the future authorized sports-event catalogue. */
export const SPORT_CATEGORIES = [
  "cricket", "football", "basketball", "tennis", "motorsport", "baseball", "hockey", "rugby", "other",
] as const;

export type SportCategory = (typeof SPORT_CATEGORIES)[number];
export type SportsTicketFilters = {
  country: string;
  city: string;
  date: string;
  sport: SportCategory | "";
  team: string;
  stadium: string;
};

export type RawTicketFilters = URLSearchParams | Record<string, string | string[] | undefined>;
export type FilterParseResult =
  | { ok: true; value: SportsTicketFilters }
  | { ok: false; error: "Invalid search filters" };

const FILTER_KEYS = ["country", "city", "date", "sport", "team", "stadium"] as const;
const TEXT_PATTERN = /^[\p{L}\p{M}\p{N} .,'’()&/-]*$/u;
const MAX_LENGTH: Record<"country" | "city" | "team" | "stadium", number> = {
  country: 80,
  city: 100,
  team: 100,
  stadium: 120,
};

function readOne(input: RawTicketFilters, key: string): string | null {
  const value = input instanceof URLSearchParams ? input.getAll(key) : input[key];
  if (Array.isArray(value)) return value.length === 1 && typeof value[0] === "string" ? value[0] : null;
  return typeof value === "string" ? value : "";
}

/** Reject unexpected parameters instead of silently passing arbitrary values to future providers. */
export function parseSportsTicketFilters(input: RawTicketFilters): FilterParseResult {
  const receivedKeys = input instanceof URLSearchParams ? [...input.keys()] : Object.keys(input);
  if (receivedKeys.some((key) => !FILTER_KEYS.includes(key as (typeof FILTER_KEYS)[number]))) {
    return { ok: false, error: "Invalid search filters" };
  }

  const values: Record<(typeof FILTER_KEYS)[number], string> = {
    country: "", city: "", date: "", sport: "", team: "", stadium: "",
  };
  for (const key of FILTER_KEYS) {
    const raw = readOne(input, key);
    if (raw === null || raw.length > 150) return { ok: false, error: "Invalid search filters" };
    values[key] = raw.trim();
  }

  for (const key of ["country", "city", "team", "stadium"] as const) {
    if (values[key].length > MAX_LENGTH[key] || !TEXT_PATTERN.test(values[key])) {
      return { ok: false, error: "Invalid search filters" };
    }
  }
  if (values.sport && !SPORT_CATEGORIES.some((sport) => sport === values.sport)) {
    return { ok: false, error: "Invalid search filters" };
  }
  if (values.date) {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(values.date)) return { ok: false, error: "Invalid search filters" };
    const date = new Date(values.date + "T00:00:00.000Z");
    if (Number.isNaN(date.getTime()) || date.toISOString().slice(0, 10) !== values.date) {
      return { ok: false, error: "Invalid search filters" };
    }
  }

  return {
    ok: true,
    value: {
      country: values.country,
      city: values.city,
      date: values.date,
      sport: values.sport as SportCategory | "",
      team: values.team,
      stadium: values.stadium,
    },
  };
}

export const EMPTY_SPORTS_TICKET_FILTERS: SportsTicketFilters = {
  country: "", city: "", date: "", sport: "", team: "", stadium: "",
};
