/**
 * Editorial transfer-discovery categories and airport reference cards.
 * Images are pre-existing GTH PRO site assets. These are NOT supplier
 * inventory records, vehicle photos, confirmed routes or bookable products.
 * Availability and fares are supplied exclusively by the existing widgets.
 */
export type TransferJourneyCategory = {
  slug: string;
  title: string;
  tag: string;
  description: string;
  image: string;
  imageAlt: string;
  check: string;
};

export type TransferAirportSpotlight = {
  code: string;
  city: string;
  airport: string;
  image: string;
  imageAlt: string;
  note: string;
  guideHref?: string;
  /** Photography must match its claim; local city photos are only destination scenery. */
  imageKind?: "airport" | "city";
  photoCredit?: string;
  photoCreditUrl?: string;
};

export type TransferSupplier = {
  name: string;
  description: string;
  action: string;
  href: string;
  external: boolean;
  disclosure: string;
  /** Only GTH PRO's own illustrative photo assets; never a provider product image. */
  image: string;
  imageAlt: string;
};

export const transferJourneyCategories: readonly TransferJourneyCategory[] = [
  {
    slug: "private-pickups",
    title: "Private airport pickups",
    tag: "One vehicle · Your group",
    description: "Compare private airport arrivals and departure rides, where offered by the chosen transfer supplier.",
    image: "/images/mega/transfers.jpg",
    imageAlt: "Airport transfer and ground transport illustration",
    check: "Confirm driver meeting point, waiting time and total price.",
  },
  {
    slug: "chauffeur",
    title: "Driver & meet-and-greet",
    tag: "Meet your driver",
    description: "Explore hosted pickups and chauffeur-style options. Service levels vary by airport and provider.",
    image: "/images/mega/welcome.jpg",
    imageAlt: "Airport pickup travel partner illustration",
    check: "Check terminal signage, name board and flight tracking terms.",
  },
  {
    slug: "shared-shuttle",
    title: "Shared airport shuttles",
    tag: "Compare shared travel",
    description: "Look for shared or scheduled shuttles in locations supported by the selected supplier.",
    image: "/images/cities/london.jpg",
    imageAlt: "London destination view illustrating city-bound airport journeys",
    check: "Confirm whether the booking is shared, stops and wait times.",
  },
  {
    slug: "family-group",
    title: "Family & group transfers",
    tag: "Travelling together",
    description: "Compare suitable ride sizes for families, luggage and groups; seats and vehicle classes vary.",
    image: "/images/cities/goa.jpg",
    imageAlt: "Goa destination view illustrating group holiday travel",
    check: "Confirm seats, child seats, luggage and vehicle capacity.",
  },
  {
    slug: "hotel-pickup",
    title: "Airport to hotel",
    tag: "Arrival made easier",
    description: "Find an onward journey to your accommodation after checking the correct arrival airport.",
    image: "/images/mega/hotels.jpg",
    imageAlt: "Hotel and accommodation illustration",
    check: "Confirm hotel address, arrival terminal and drop-off instructions.",
  },
  {
    slug: "outbound-ride",
    title: "Hotel to airport",
    tag: "Your return trip",
    description: "Research departures and return pickups with enough time for check-in and security.",
    image: "/images/cities/singapore.jpg",
    imageAlt: "Singapore city view illustrating city-to-airport journey planning",
    check: "Check exact departure airport, pickup time and traffic allowance.",
  },
] as const;

export const transferAirportSpotlights: readonly TransferAirportSpotlight[] = [
  { code: "BOM", city: "Mumbai", airport: "Chhatrapati Shivaji Maharaj International Airport", image: "https://upload.wikimedia.org/wikipedia/commons/d/d8/MumbaiAirportT2.JPG", imageAlt: "Exterior of Mumbai Chhatrapati Shivaji Maharaj International Airport Terminal 2", imageKind: "airport", photoCredit: "Bombaywallas / Wikimedia Commons · CC BY-SA 3.0", photoCreditUrl: "https://commons.wikimedia.org/wiki/File:MumbaiAirportT2.JPG", note: "BOM · Mumbai airport transfers", guideHref: "/travel/airports/bom" },
  { code: "CCU", city: "Kolkata", airport: "Kolkata Airport", image: "/images/cities/kolkata.jpg", imageAlt: "Kolkata city landmarks", note: "Kolkata city connections", guideHref: "/travel/airports/ccu" },
  { code: "DEL", city: "Delhi", airport: "Delhi Airport", image: "/images/cities/delhi.jpg", imageAlt: "Delhi destination scene", note: "National Capital Region", guideHref: "/travel/airports/del" },
  { code: "GOI", city: "Goa", airport: "Goa Dabolim Airport", image: "/images/cities/goa.jpg", imageAlt: "Goa coastal landscape", note: "Check GOI vs GOX", guideHref: "/travel/airports/goi" },
  { code: "BLR", city: "Bengaluru", airport: "Bengaluru Airport", image: "/images/cities/bengaluru.jpg", imageAlt: "Bengaluru city view", note: "Plan the onward city ride", guideHref: "/travel/airports/blr" },
  { code: "DXB", city: "Dubai", airport: "Dubai International Airport", image: "/images/cities/dubai.jpg", imageAlt: "Dubai skyline", note: "Verify DXB vs DWC", guideHref: "/travel/airports/dxb" },
  { code: "SIN", city: "Singapore", airport: "Singapore Changi", image: "/images/cities/singapore.jpg", imageAlt: "Singapore city skyline", note: "City and hotel transfers", guideHref: "/travel/airports/sin" },
  { code: "BKK", city: "Bangkok", airport: "Bangkok Suvarnabhumi", image: "/images/cities/bangkok.jpg", imageAlt: "Bangkok city scene", note: "Check BKK vs DMK", guideHref: "/travel/airports/bkk" },
  { code: "LHR", city: "London", airport: "London Heathrow", image: "/images/cities/london.jpg", imageAlt: "London city skyline", note: "London airport connections", guideHref: "/travel/airports/lhr" },
  { code: "CDG", city: "Paris", airport: "Paris Charles de Gaulle", image: "/images/cities/paris.jpg", imageAlt: "Paris city landmarks", note: "Check CDG vs ORY", guideHref: "/travel/airports/cdg" },
  { code: "JFK", city: "New York", airport: "New York JFK", image: "/images/cities/new-york.jpg", imageAlt: "New York City skyline", note: "Check JFK vs LGA / EWR", guideHref: "/travel/airports/jfk" },
  { code: "DPS", city: "Bali", airport: "Bali Ngurah Rai", image: "/images/cities/bali.jpg", imageAlt: "Bali destination landscape", note: "Airport-to-resort planning" },
] as const;

/**
 * The links below are already present in the production GTH PRO transfer
 * module. "Internal widget" is not a guaranteed deep link or live offer.
 * Don't turn brand homepages into untracked affiliate destinations.
 */
export const transferSuppliers: readonly TransferSupplier[] = [
  {
    name: "Kiwitaxi",
    description: "Supplier-powered airport transfer search and vehicle options.",
    action: "Explore transfer options",
    href: "#transfer-widget-options",
    external: false,
    disclosure: "Supplier-powered booking widget",
    image: "/images/mega/transfers.jpg",
    imageAlt: "Vehicles at an airport pickup area, illustrative photo",
  },
  {
    name: "intui.travel",
    description: "Airport transfer and shuttle search with destination options.",
    action: "Explore shuttle options",
    href: "#transfer-widget-airport",
    external: false,
    disclosure: "Supplier-powered booking widget",
    image: "/images/mega/transfers.jpg",
    imageAlt: "Vehicles at an airport pickup area, illustrative photo",
  },
  {
    name: "Welcome Pickups",
    description: "Explore airport pickup services through the existing tracked partner link.",
    action: "Explore pickup choices",
    href: "https://tpo.lv/GFuzmgYk",
    external: true,
    disclosure: "External booking · affiliate link",
    image: "/images/mega/welcome.jpg",
    imageAlt: "Illustration of a welcome pickup service",
  },
  {
    name: "GetTransfer",
    description: "Compare eligible transfer services on the supplier's own booking page.",
    action: "Compare ride options",
    href: "https://gettransfer.tpo.lv/jpv6nsqO",
    external: true,
    disclosure: "External booking · affiliate link",
    image: "/images/mega/transfers.jpg",
    imageAlt: "Airport transfer vehicle scene, illustrative photo",
  },
] as const;
