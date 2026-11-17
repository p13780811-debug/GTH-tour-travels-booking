/**
 * Curated, source-backed Bookaway routes. This is NOT a live inventory feed.
 *
 * Each path is an existing Bookaway destination/transport page observed on
 * their public site. Never synthesize country/route URLs from user input.
 * Add routes only after checking the exact Bookaway page and transport mode.
 */
export type BookawayMode = "bus" | "train" | "ferry";

export type BookawayRoute = Readonly<{
  mode: BookawayMode;
  from: string;
  to: string;
  path: string;
}>;

const ROUTES: readonly BookawayRoute[] = [
  { mode: "bus", from: "Bangkok", to: "Chiang Mai", path: "/bus/bangkok/chiang-mai" },
  { mode: "train", from: "Bangkok", to: "Chiang Mai", path: "/train/bangkok/chiang-mai" },
  { mode: "bus", from: "Hanoi", to: "Sapa", path: "/bus/hanoi/sapa" },
  { mode: "train", from: "Hanoi", to: "Sapa", path: "/train/hanoi/sapa" },
  { mode: "ferry", from: "Koh Phi Phi", to: "Phuket", path: "/ferry/koh-phi-phi/phuket" },
  { mode: "bus", from: "Dubrovnik", to: "Split", path: "/bus/dubrovnik/split" },
  { mode: "ferry", from: "Dubrovnik", to: "Split", path: "/ferry/dubrovnik/split" },
];

const cityKey = (value: string): string =>
  value.normalize("NFKC").trim().replace(/\s+/g, " ").toLocaleLowerCase("en");

export function findBookawayRoute(
  mode: string,
  from: string,
  to: string,
): BookawayRoute | undefined {
  if (mode !== "bus" && mode !== "train" && mode !== "ferry") return undefined;
  if (from.length < 2 || from.length > 80 || to.length < 2 || to.length > 80) return undefined;
  const fromKey = cityKey(from);
  const toKey = cityKey(to);
  return ROUTES.find(
    (route) =>
      route.mode === mode &&
      cityKey(route.from) === fromKey &&
      cityKey(route.to) === toKey,
  );
}
