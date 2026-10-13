export type DestinationOverview = {
  slug: string;
  name: string;
  image_url: string;
  description: string;
};

/**
 * Editorial discovery locations, NOT live inventory or verified provider listings.
 * Imagery is bundled in the repository. Destinations are inspiration only.
 */
export const destinations: DestinationOverview[] = [
  { slug: "mumbai", name: "Mumbai", image_url: "/images/cities/mumbai.jpg", description: "Explore Mumbai's neighborhoods, coastal scenery and culture. Verify current attraction details and transport options before visiting." },
  { slug: "goa", name: "Goa", image_url: "/images/cities/goa.jpg", description: "Research beach destinations, travel seasons and local transport in Goa before planning accommodation and activities." },
  { slug: "dubai", name: "Dubai", image_url: "/images/cities/dubai.jpg", description: "Plan a Dubai city visit with time for architecture, dining and cultural experiences. Check attraction schedules and local requirements." },
  { slug: "paris", name: "Paris", image_url: "/images/cities/paris.jpg", description: "Research museums, neighborhoods and urban transport in Paris. Check operating hours and timed-entry requirements with official providers." },
  { slug: "bali", name: "Bali", image_url: "/images/cities/bali.jpg", description: "Explore Bali's landscapes and cultural attractions while confirming transport arrangements and weather-sensitive activities." },
  { slug: "bangkok", name: "Bangkok", image_url: "/images/cities/bangkok.jpg", description: "Consider Bangkok's markets, heritage sites and local mobility options when building a realistic itinerary." },
  { slug: "singapore", name: "Singapore", image_url: "/images/cities/singapore.jpg", description: "Research Singapore's urban attractions, public transport and neighborhood choices before confirming bookings." },
  { slug: "tokyo", name: "Tokyo", image_url: "/images/cities/tokyo.jpg", description: "Prepare for Tokyo's varied districts, transit networks and seasonal events. Verify details with current local sources." },
  { slug: "london", name: "London", image_url: "/images/cities/london.jpg", description: "Compare London's neighborhoods, attractions and transit connections to match your trip's dates and interests." },
  { slug: "new-york", name: "New York", image_url: "/images/cities/new-york.jpg", description: "Plan a New York visit by neighborhood, transport and reservation requirements without assuming specific attractions are available." },
  { slug: "maldives", name: "Maldives", image_url: "/images/cities/maldives.jpg", description: "Research island transfers, accommodation terms and weather considerations before booking a Maldives stay." },
  { slug: "kolkata", name: "Kolkata", image_url: "/images/cities/kolkata.jpg", description: "Explore Kolkata's cultural landmarks, heritage and local transport choices while confirming current visitor arrangements." },
  { slug: "jaipur", name: "Jaipur", image_url: "/images/cities/jaipur.jpg", description: "Prepare a Jaipur itinerary around heritage attractions, local travel times and independently verified opening hours." },
  { slug: "digha", name: "Digha", image_url: "/images/cities/digha.jpg", description: "Research coastal stays and short trips around Digha with attention to local transport and seasonal conditions." },
];
