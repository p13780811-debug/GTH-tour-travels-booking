/**
 * User-approved, fixed Travelpayouts publisher links. These are public referral
 * URLs, not secrets. Never accept a URL from a request parameter.
 *
 * Programs with a verified widget but no per-program affiliate link instead use
 * the appropriate internal GTH page, which hosts that widget.
 */
export const flightPartnerPrograms = [
  { slug: "aviasales", name: "Aviasales", group: "Flights", detail: "Full flight supplier search", destination: "https://aviasales.tpo.lv/hqP8zh9u", external: true },
  { slug: "airhelp", name: "AirHelp", group: "Flight protection", detail: "Check eligible disrupted flights", destination: "https://airhelp.tpo.lv/W9baN8JY", external: true },
  { slug: "compensair", name: "Compensair", group: "Flight protection", detail: "Claim eligibility for delays", destination: "https://compensair.tpo.lv/s1kibgeh", external: true },
  { slug: "ekta", name: "EKTA", group: "Flight protection", detail: "Travel insurance options", destination: "https://ektatraveling.tpo.lv/zRNsrOPf", external: true },
  { slug: "yesim", name: "Yesim", group: "Airport essentials", detail: "eSIM connectivity", destination: "https://yesim.tpo.lv/yZBVdtqT", external: true },
  { slug: "kiwitaxi", name: "Kiwitaxi", group: "Airport transfers", detail: "Airport transfer widget", destination: "/transfers", external: false },
  { slug: "intui", name: "intui.travel", group: "Airport transfers", detail: "Local airport pickup operators", destination: "/transfers", external: false },
  { slug: "welcome", name: "Welcome Pickups", group: "Airport transfers", detail: "Airport pickup booking", destination: "https://tpo.lv/GFuzmgYk", external: true },
  { slug: "gettransfer", name: "GetTransfer.com", group: "Airport transfers", detail: "Compare transfers", destination: "https://gettransfer.tpo.lv/jpv6nsqO", external: true },
  { slug: "qeeq", name: "QEEQ", group: "Car rentals", detail: "Self-drive car-rental options", destination: "/cars", external: false },
  { slug: "localrent", name: "Localrent", group: "Car rentals", detail: "Car-rental supplier widget", destination: "/cars", external: false },
  { slug: "radical", name: "Radical Storage", group: "Airport essentials", detail: "Luggage storage", destination: "https://radicalstorage.tpo.lv/iDuI1UD0", external: true },
  { slug: "klook", name: "Klook", group: "At destination", detail: "Tours and activities", destination: "https://klook.tpo.lv/IKb6eSUe", external: true },
  { slug: "wegotrip", name: "WeGoTrip", group: "At destination", detail: "Audio and self-guided tours", destination: "https://wegotrip.tpo.lv/ZQjE9yR2", external: true },
  { slug: "gocity", name: "Go City", group: "At destination", detail: "Sightseeing city passes", destination: "https://gocity.tpo.lv/NdfDWRGS", external: true },
  { slug: "kkday", name: "KKday", group: "At destination", detail: "Tours and day trips", destination: "https://kkday.tpo.lv/ytfvDLam", external: true },
  { slug: "tiqets", name: "Tiqets", group: "At destination", detail: "Attraction ticket widgets", destination: "/tours", external: false },
] as const;

export function findFlightPartner(slug: string) {
  return flightPartnerPrograms.find((program) => program.slug === slug) ?? null;
}
