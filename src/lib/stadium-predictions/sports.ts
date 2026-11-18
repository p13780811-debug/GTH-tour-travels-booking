/**
 * Free /v4/sports catalog determines currently active provider keys before
 * spending a single odds credit. Tennis keys are PER TOURNAMENT, not generic
 * tennis_atp or tennis_wta endpoints.
 */
export const CORE_ODDS_KEYS = [
  "soccer_epl", "basketball_nba",
  "cricket_test_match", "cricket_odi", "cricket_international_t20",
] as const;
export type SportFamily = "football" | "basketball" | "cricket" | "tennis" | null;
export function sportFamily(key: string): SportFamily {
  if (key === "soccer_epl") return "football";
  if (key === "basketball_nba") return "basketball";
  if (key === "cricket_test_match" || key === "cricket_odi" || key === "cricket_international_t20") return "cricket";
  if (/^tennis_(?:atp|wta)_[a-z0-9_]{3,70}$/.test(key)) return "tennis";
  return null;
}
export function activeOddsKeys(payload: unknown): string[] {
  if (!Array.isArray(payload)) return [];
  const seen = new Set<string>();
  for (const item of payload.slice(0, 300)) {
    if (!item || typeof item !== "object" || Array.isArray(item)) continue;
    const row = item as Record<string, unknown>;
    if (row.active !== true || typeof row.key !== "string" || !sportFamily(row.key)) continue;
    if (row.key.length > 90) continue;
    seen.add(row.key);
  }
  const allowed = [...seen];
  return [
    ...CORE_ODDS_KEYS.filter(key => seen.has(key)),
    ...allowed.filter(key => key.startsWith("tennis_atp_")).sort(),
    ...allowed.filter(key => key.startsWith("tennis_wta_")).sort(),
  ];
}
