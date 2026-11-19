export const stadiumSports = ["Cricket", "Football", "Baseball", "Motorsport", "Rugby", "Australian rules", "Concerts"] as const;
export type StadiumSport = (typeof stadiumSports)[number];

type Source = { label: string; url: string };
type StadiumEvent = Source & { starts: string; ends?: string };
export type StadiumProduct = {
  label: string;
  kind: "Event tickets" | "Venue experience";
  provider: "klook" | "getyourguide";
  url: string;
};
export type Stadium = {
  slug: string;
  name: string;
  city: string;
  country: string;
  countryCode: string;
  timeZone: string;
  sports: readonly StadiumSport[];
  overview: string;
  seating: string;
  schedule: Source;
  tickets?: Source;
  seatMap?: Source;
  experience?: Source;
  events?: readonly StadiumEvent[];
  products?: readonly StadiumProduct[];
  aliases?: string;
  flightCity?: string;
};

const bcciHomeSeason = {
  label: "BCCI international home season",
  url: "https://www.bcci.tv/news/article/fixtures-unveiled-for-team-india-s-international-home-season-2026-27",
};

export const stadiums: readonly Stadium[] = [
  {
    slug: "eden-gardens", name: "Eden Gardens", city: "Kolkata", country: "India",
    countryCode: "IN", timeZone: "Asia/Kolkata", sports: ["Cricket"], aliases: "Calcutta KKR",
    overview: "Eden Gardens is a cricket ground in central Kolkata. Use the Cricket Association of Bengal notices for local announcements and confirm the venue for city-level fixtures before booking a trip.",
    seating: "Check the stand, entry gate and any bag restrictions on the event ticket. Use the organizer’s seating layout for your match.",
    schedule: bcciHomeSeason,
    tickets: { label: "Cricket Association of Bengal notices", url: "https://www.cricketassociationofbengal.com/notice.php" },
  },
  {
    slug: "wankhede-stadium", name: "Wankhede Stadium", city: "Mumbai", country: "India",
    countryCode: "IN", timeZone: "Asia/Kolkata", sports: ["Cricket"], aliases: "Bombay Mumbai Indians",
    overview: "Wankhede Stadium is the Mumbai Cricket Association’s ground in Churchgate. Check the season schedule for Mumbai fixtures and confirm the ground and ticketing announcement for each match.",
    seating: "Match tickets specify a stand and entry gate. Check the organizer’s seating plan and walking route from Churchgate before you travel.",
    schedule: bcciHomeSeason,
    tickets: { label: "Mumbai Cricket Association venue guide", url: "https://www.mumbaicricket.com/wankhede" },
  },
  {
    slug: "narendra-modi-stadium", name: "Narendra Modi Stadium", city: "Ahmedabad", country: "India",
    countryCode: "IN", timeZone: "Asia/Kolkata", sports: ["Cricket"], aliases: "Motera Gujarat Titans",
    overview: "Narendra Modi Stadium is in Motera, Ahmedabad. Use the BCCI calendar to find Ahmedabad fixtures, then confirm the ground and ticket release with the event organizer.",
    seating: "Confirm your stand and gate before arrival. At this large venue, the walk from the drop-off point to your gate can depend on the event’s traffic plan.",
    schedule: bcciHomeSeason,
    tickets: { label: "Gujarat Cricket Association venue information", url: "https://gujaratcricketassociation.com/contact-us/" },
  },
  {
    slug: "wembley-stadium", name: "Wembley Stadium", city: "London", country: "United Kingdom",
    countryCode: "GB", timeZone: "Europe/London", sports: ["Football", "Concerts"], aliases: "England FA Cup",
    overview: "Wembley hosts football and concerts in northwest London. The venue publishes event-specific information, including how to buy and when to arrive.",
    seating: "Use the venue’s seat view to compare sections. For concerts, check the event layout because stage position and restricted views can vary.",
    schedule: { label: "Wembley event calendar", url: "https://www.wembleystadium.com/events" },
    seatMap: { label: "Wembley view from your seat", url: "https://www.wembleystadium.com/plan-your-visit/stadium-guide/view-from-your-seat" },
    products: [{
      label: "Wembley Stadium guided tour", kind: "Venue experience", provider: "klook",
      url: "https://www.klook.com/en-GB/activity/10609-wembley-stadium-tour-london/",
    }],
  },
  {
    slug: "camp-nou", name: "Spotify Camp Nou", city: "Barcelona", country: "Spain",
    countryCode: "ES", timeZone: "Europe/Madrid", sports: ["Football"], aliases: "FC Barcelona Barça Barca",
    overview: "Follow FC Barcelona’s fixture and football ticket pages. Confirm the venue printed for your match and check the current scope of any museum or stadium experience.",
    seating: "Use the seating layout on the club’s ticket page for the fixture you select. Match-day areas and visitor tour access are listed separately.",
    schedule: { label: "FC Barcelona fixture schedule", url: "https://www.fcbarcelona.com/en/football/first-team/schedule" },
    tickets: { label: "FC Barcelona football tickets", url: "https://www.fcbarcelona.com/en/tickets/football" },
    experience: { label: "FC Barcelona official tours and museum", url: "https://www.fcbarcelona.com/en/entradas/camp-nou-experience" },
  },
  {
    slug: "old-trafford", name: "Old Trafford", city: "Manchester", country: "United Kingdom",
    countryCode: "GB", timeZone: "Europe/London", sports: ["Football"], aliases: "Manchester United Man Utd",
    overview: "This guide is for Manchester United’s football ground. Check the club’s fixtures and ticketing pages for home-match details, membership rules and sales windows.",
    seating: "Review the stand and tier in the club ticket flow. Away seating, hospitality and accessible seating can have different booking rules.",
    schedule: { label: "Manchester United fixture calendars", url: "https://www.manutd.com/en/team-fixture-calendars" },
    tickets: { label: "Manchester United tickets and hospitality", url: "https://www.manutd.com/en/tickets-and-hospitality" },
  },
  {
    slug: "melbourne-cricket-ground", name: "Melbourne Cricket Ground", city: "Melbourne", country: "Australia",
    countryCode: "AU", timeZone: "Australia/Melbourne", sports: ["Cricket", "Australian rules"], aliases: "MCG AFL Boxing Day",
    overview: "The MCG in Melbourne’s sports precinct hosts international cricket and Australian rules football. Its event pages give event-specific ticket and arrival information.",
    seating: "The MCC Members’ Reserve has its own seating maps. For general admission and accessible seating, use the layout for the specific event.",
    schedule: { label: "MCG event calendar", url: "https://www.mcg.org.au/events" },
    seatMap: { label: "MCC Members’ Reserve seating maps", url: "https://www.mcc.org.au/members-reserve/seating-maps" },
    // Event facts checked against MCG's published 2026/27 international programme.
    // Never label these as live ticket availability; dates may change.
    events: [
      {
        label: "Australia vs England men’s T20I", starts: "2026-11-21",
        url: "https://www.mcg.org.au/events/2026/november/australia-v-england-mens-t20i-21-nov-2026",
      },
      {
        label: "Australia vs New Zealand Boxing Day Test", starts: "2026-12-26", ends: "2026-12-30",
        url: "https://www.mcg.org.au/events/2026/december/boxing-day-test-day-1-australia-v-new-zealand",
      },
      {
        label: "Australia vs England 150th Anniversary Test", starts: "2027-03-11", ends: "2027-03-15",
        url: "https://www.mcg.org.au/news/2026/march/international-cricket-schedule-confirmed-for-202627",
      },
    ],
    products: [{
      label: "MCG guided tour", kind: "Venue experience", provider: "getyourguide",
      url: "https://www.getyourguide.com/melbourne-l202/melbourne-melbourne-cricket-ground-mcg-guided-tour-t115996/",
    }],
  },
  {
    slug: "yankee-stadium", name: "Yankee Stadium", city: "New York", country: "United States",
    countryCode: "US", timeZone: "America/New_York", sports: ["Baseball"], aliases: "Bronx New York Yankees MLB NYC",
    overview: "Yankee Stadium is the New York Yankees’ home in the Bronx. Check the home schedule and confirm the opponent, date and section before purchasing.",
    seating: "Use the seating chart for the package or game you select. Review the ticket delivery method, gate, and any view restrictions.",
    schedule: { label: "New York Yankees schedule", url: "https://www.mlb.com/yankees/schedule/printable" },
    tickets: { label: "New York Yankees tickets", url: "https://www.mlb.com/yankees/tickets" },
    products: [{
      label: "New York Yankees baseball game tickets", kind: "Event tickets", provider: "klook",
      url: "https://www.klook.com/activity/149423-new-york-yankees-baseball-game-at-yankee-stadium/",
    }],
  },
  {
    slug: "singapore-national-stadium", name: "Singapore National Stadium", city: "Singapore", country: "Singapore",
    countryCode: "SG", timeZone: "Asia/Singapore", sports: ["Football", "Rugby", "Concerts"], aliases: "Kallang Sports Hub",
    overview: "Singapore National Stadium is part of The Kallang. Filter the precinct calendar for events at the National Stadium, since the precinct also includes other venues.",
    seating: "Compare sections with the National Stadium seat viewer and use your event’s seating layout for stage configuration, accessible seats and entry details.",
    schedule: { label: "The Kallang event calendar", url: "https://thekallang.com.sg/calendar" },
    seatMap: { label: "National Stadium seat viewer", url: "https://www.thekallang.com.sg/en/plan-your-visit/stadium-seat-view.html" },
    events: [
      {
        label: "Guns N’ Roses World Tour — Singapore", starts: "2026-11-25",
        url: "https://www.thekallang.com.sg/en/things-to-do/events/guns-n--roses-world-tour-2026.html",
      },
      {
        label: "Jay Chou Carnival II World Tour — Singapore", starts: "2027-01-08", ends: "2027-01-10",
        url: "https://www.thekallang.com.sg/en/things-to-do/events/jay-chou--carnival---world-tour-2027-in-singapore.html",
      },
    ],
  },
  {
    slug: "tokyo-dome", name: "Tokyo Dome", city: "Tokyo", country: "Japan",
    countryCode: "JP", timeZone: "Asia/Tokyo", sports: ["Baseball", "Concerts"], aliases: "Yomiuri Giants",
    overview: "Tokyo Dome hosts baseball and concerts in Bunkyo. Its baseball guide links to game information. For concerts, follow the artist or promoter’s official event announcement.",
    seating: "Match the gate, floor and seat section on the organizer’s map. Baseball and concert layouts use different floor configurations.",
    schedule: { label: "Tokyo Dome baseball and event information", url: "https://www.tokyo-dome.co.jp/en/dome/baseball/" },
  },
  {
    slug: "silverstone", name: "Silverstone Circuit", city: "Silverstone", country: "United Kingdom",
    countryCode: "GB", timeZone: "Europe/London", sports: ["Motorsport"], aliases: "F1 Formula 1 British Grand Prix",
    flightCity: "London",
    overview: "Silverstone Circuit hosts the British Grand Prix. Compare race-day and weekend entry, then plan the last leg to the circuit before buying.",
    seating: "Compare grandstands by corner and check cover, accessibility and the days included. Follow the circuit’s event-specific shuttle and parking instructions.",
    schedule: { label: "Silverstone event calendar", url: "https://www.silverstone.co.uk/events" },
    seatMap: { label: "Silverstone grandstand guide", url: "https://www.silverstone.co.uk/events/formula-1-british-grand-prix/tickets/grandstands" },
    events: [{
      label: "Formula 1 British Grand Prix", starts: "2027-07-02", ends: "2027-07-04",
      url: "https://ticketing.formula1.com/great-britain/",
    }],
  },
];

export function findStadium(slug: string) {
  return stadiums.find(stadium => stadium.slug === slug);
}

function searchable(value: string) {
  return value.normalize("NFKD").replace(/\p{M}/gu, "").toLowerCase().trim();
}

export function filterStadiums(items: readonly Stadium[], query: string, sport: StadiumSport | "") {
  const terms = searchable(query.slice(0, 80)).split(/\s+/).filter(Boolean);
  return items.filter(stadium => {
    if (sport && !stadium.sports.includes(sport)) return false;
    const haystack = searchable([stadium.name, stadium.city, stadium.country, stadium.aliases, ...stadium.sports].join(" "));
    return terms.every(term => haystack.includes(term));
  });
}

export function upcomingStadiumEvents(stadium: Stadium, now = new Date()) {
  const parts = new Intl.DateTimeFormat("en", {
    timeZone: stadium.timeZone, year: "numeric", month: "2-digit", day: "2-digit",
  }).formatToParts(now);
  const today = ["year", "month", "day"].map(part => parts.find(item => item.type === part)?.value).join("-");
  return (stadium.events ?? [])
    .filter(event => (event.ends ?? event.starts) >= today)
    .sort((first, second) => first.starts.localeCompare(second.starts));
}
