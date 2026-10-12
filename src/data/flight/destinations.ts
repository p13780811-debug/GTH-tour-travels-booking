export type FlightDestination = {
  name: string;
  destination: string;
  image: string;
  description: string;
};

// Curated destinations, not offers. No simulated fares or availability.
export const flightDestinations: FlightDestination[] = [
  { name: "Dubai", destination: "DXB", image: "/images/cities/dubai.jpg", description: "Architecture & city stays" },
  { name: "Bangkok", destination: "BKK", image: "/images/cities/bangkok.jpg", description: "Food & culture" },
  { name: "Singapore", destination: "SIN", image: "/images/cities/singapore.jpg", description: "City discovery" },
  { name: "Goa", destination: "GOI", image: "/images/cities/goa.jpg", description: "Coast & retreats" },
  { name: "Bali", destination: "DPS", image: "/images/cities/bali.jpg", description: "Island escapes" },
  { name: "London", destination: "LHR", image: "/images/cities/london.jpg", description: "Heritage & culture" },
];
