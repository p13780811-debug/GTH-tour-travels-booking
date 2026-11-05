// Curated airport reference records verified using the connected Nuitee Connect
// airport metadata API on 2026-11-05. No live paid API requests are made by pages
// importing this module. These are reference records, NOT bookable flight offers.
export type AirportRecord = {
  code: string;
  name: string;
  city: string;
  country: string;
  countryCode: string;
  timezone: string;
  icao: string;
  description: string;
};

export const airports: readonly AirportRecord[] = [
  { code: "CCU", name: "Netaji Subhash Chandra Bose International Airport", city: "Kolkata", country: "India", countryCode: "IN", timezone: "Asia/Kolkata", icao: "VECC", description: "When flying to Kolkata, check your destination airport code before comparing onward transport and accommodation. Kolkata uses CCU." },
  { code: "BOM", name: "Chhatrapati Shivaji Maharaj International Airport", city: "Mumbai", country: "India", countryCode: "IN", timezone: "Asia/Kolkata", icao: "VABB", description: "Mumbai also has an airport listed under NMI. Confirm the exact airport on your ticket before planning transfers across the metropolitan area." },
  { code: "NMI", name: "Navi Mumbai International Airport", city: "Navi Mumbai", country: "India", countryCode: "IN", timezone: "Asia/Kolkata", icao: "VANM", description: "NMI is a different airport code from BOM. Check which airport your booking provider actually serves; a reference listing does not guarantee flight availability." },
  { code: "DEL", name: "Indira Gandhi International Airport", city: "Delhi", country: "India", countryCode: "IN", timezone: "Asia/Kolkata", icao: "VIDP", description: "Use DEL when researching Delhi flights, and verify the actual terminal, carrier check-in rules and airport transfer before departure." },
  { code: "BLR", name: "Kempegowda International Airport Bengaluru", city: "Bengaluru", country: "India", countryCode: "IN", timezone: "Asia/Kolkata", icao: "VOBL", description: "For Bengaluru journeys, compare your flight schedule with the onward journey to your hotel; airport arrival and city arrival are not the same thing." },
  { code: "HYD", name: "Rajiv Gandhi International Airport", city: "Hyderabad", country: "India", countryCode: "IN", timezone: "Asia/Kolkata", icao: "VOHS", description: "Use HYD for the main international airport in Hyderabad. Double-check the airport on your confirmed ticket rather than selecting by city name alone." },
  { code: "MAA", name: "Chennai International Airport", city: "Chennai", country: "India", countryCode: "IN", timezone: "Asia/Kolkata", icao: "VOMM", description: "For Chennai, keep your arrival date, local time and hotel check-in time together when comparing flight options." },
  { code: "GOI", name: "Goa Dabolim International Airport", city: "Goa", country: "India", countryCode: "IN", timezone: "Asia/Kolkata", icao: "VOGO", description: "Goa has more than one airport: GOI (Dabolim) and GOX (Manohar). Choose based on your actual stay, not just the destination name." },
  { code: "GOX", name: "Manohar International Airport", city: "Mopa", country: "India", countryCode: "IN", timezone: "Asia/Kolkata", icao: "VOGA", description: "GOX is the airport at Mopa in Goa, separate from GOI. Check ground transport and the correct airport before buying a flight." },
  { code: "COK", name: "Cochin International Airport", city: "Cochin", country: "India", countryCode: "IN", timezone: "Asia/Kolkata", icao: "VOCI", description: "COK serves the Kochi/Cochin area. Confirm your arrival details before arranging the onward journey to your destination in Kerala." },
  { code: "DXB", name: "Dubai International Airport", city: "Dubai", country: "United Arab Emirates", countryCode: "AE", timezone: "Asia/Dubai", icao: "OMDB", description: "Dubai has multiple airport codes, including DXB and DWC. Confirm the code on every leg, especially when making a connection." },
  { code: "SIN", name: "Singapore Changi Airport", city: "Singapore", country: "Singapore", countryCode: "SG", timezone: "Asia/Singapore", icao: "WSSS", description: "Compare arrival time in Singapore local time, and check terminal and transit requirements with the airline before travelling." },
  { code: "BKK", name: "Suvarnabhumi Airport", city: "Bangkok", country: "Thailand", countryCode: "TH", timezone: "Asia/Bangkok", icao: "VTBS", description: "Bangkok has BKK and DMK as different airport codes. Do not assume a connection between those airports is an airside transfer." },
  { code: "LHR", name: "London Heathrow Airport", city: "London", country: "United Kingdom", countryCode: "GB", timezone: "Europe/London", icao: "EGLL", description: "London has several major airports. A Heathrow arrival (LHR) is not equivalent to Gatwick, Stansted or Luton on a connecting itinerary." },
  { code: "CDG", name: "Charles de Gaulle International Airport", city: "Paris", country: "France", countryCode: "FR", timezone: "Europe/Paris", icao: "LFPG", description: "Paris has different airports, including CDG and ORY. Check the exact airport code before planning hotel transport or connecting flights." },
  { code: "JFK", name: "John F. Kennedy International Airport", city: "New York", country: "United States", countryCode: "US", timezone: "America/New_York", icao: "KJFK", description: "For New York, check whether your itinerary uses JFK, LGA or EWR; these codes refer to different airports and transfer arrangements." },
];

export const airportCodes = airports.map(airport => airport.code.toLowerCase());

export function airportByCode(value: string): AirportRecord | undefined {
  if (!/^[A-Za-z]{3}$/.test(value)) return undefined;
  return airports.find(airport => airport.code === value.toUpperCase());
}
