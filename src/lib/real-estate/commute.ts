export const COMMUTE_MODES = [
  ["driving", "Drive"],
  ["transit", "Public transport"],
  ["walking", "Walk"],
  ["bicycling", "Cycle"],
] as const

export type CommuteMode = typeof COMMUTE_MODES[number][0]

export function hasCommuteOrigin(lat: unknown, lng: unknown) {
  return typeof lat === "number" && typeof lng === "number" && Number.isFinite(lat) &&
    Number.isFinite(lng) && Math.abs(lat) <= 90 && Math.abs(lng) <= 180 && (lat !== 0 || lng !== 0)
}

export function commuteDirections(lat: number | undefined, lng: number | undefined, destination: string, mode: CommuteMode) {
  if (!hasCommuteOrigin(lat, lng)) return null
  const place = destination.trim()
  if (!place || place.length > 180 || /[\p{Cc}\u202a-\u202e\u2066-\u2069]/u.test(place) || !COMMUTE_MODES.some(([key]) => key === mode)) return null
  const params = new URLSearchParams({ api: "1", origin: `${lat},${lng}`, destination: place, travelmode: mode })
  return `https://www.google.com/maps/dir/?${params}`
}
