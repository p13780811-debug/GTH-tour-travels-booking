import { stadiums } from "@/lib/travel/stadiums";

/** Only three individually reviewed fixtures from the existing MCG guide.
 * Do not manufacture tennis fixtures, teams, start times or ticket inventory.
 */
const APPROVED = [
  { slug: "lords-cricket-ground", label: "England vs Australia men's Ashes Test", home: "England", away: "Australia", oddsKey: "cricket_test_match" },
  { slug: "melbourne-cricket-ground", label: "Australia vs England men’s T20I", home: "Australia", away: "England", oddsKey: "cricket_international_t20" },
  { slug: "melbourne-cricket-ground", label: "Australia vs New Zealand Boxing Day Test", home: "Australia", away: "New Zealand", oddsKey: "cricket_test_match" },
  { slug: "melbourne-cricket-ground", label: "Australia vs England 150th Anniversary Test", home: "Australia", away: "England", oddsKey: "cricket_test_match" },
] as const;
export type ReviewedFixture = {
  id: string; sport: "Cricket"; home: string; away: string;
  starts: string; ends?: string; venue: string;
  city: string; countryCode: string; timeZone: string; officialUrl: string;
  oddsKey: "cricket_test_match" | "cricket_international_t20";
};
export function reviewedSportsFixtures(now = new Date(), horizonDays = 365): ReviewedFixture[] {
  const startDay = now.toISOString().slice(0, 10);
  const endDay = new Date(now.getTime() + horizonDays * 86400000).toISOString().slice(0, 10);
  return APPROVED.flatMap(entry => {
    const venue = stadiums.find(s => s.slug === entry.slug && s.sports.includes("Cricket"));
    const event = venue?.events?.find(item => item.label === entry.label);
    if (!venue || !event || !/^\d{4}-\d{2}-\d{2}$/.test(event.starts) ||
        event.starts > endDay || (event.ends || event.starts) < startDay) return [];
    if (!/^https:\/\//.test(event.url)) return [];
    return [{
      id: "calendar:" + venue.slug + ":" + event.starts.replace(/-/g, "") +
        ":" + entry.home.toLowerCase().replace(/[^a-z]+/g, "-") + "-" + entry.away.toLowerCase().replace(/[^a-z]+/g, "-"),
      sport: "Cricket" as const, home: entry.home, away: entry.away,
      starts: event.starts, ends: event.ends, venue: venue.name,
      city: venue.city, countryCode: venue.countryCode,
      timeZone: venue.timeZone, officialUrl: event.url, oddsKey: entry.oddsKey,
    }];
  });
}
