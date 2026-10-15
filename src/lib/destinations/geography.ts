/**
 * Editorial geography for real, named locations already present in GTH PRO.
 * Not live supplier coverage, hotel availability or a governmental feed.
 * Stored country values may add coverage for newly imported destinations.
 */
const cityGroups: Record<string, string[]> = {
  "India": ["agra","ahmedabad","ajanta-ellora","alleppey","amritsar","andaman","bengaluru","chennai","coorg","dalhousie","darjeeling","delhi","digha","goa","gulmarg","hampi","hyderabad","jaipur","jim-corbett","jodhpur","kanha","kanyakumari","kasol","khajuraho","kochi","kolkata","konark","kovalam","ladakh","lakshadweep","madurai","manali","mumbai","munnar","mussoorie","mysore","nainital","ooty","pondicherry","pune","puri","pushkar","ranthambore","rishikesh","shimla","shirdi","srinagar","tirupati","udaipur","varanasi"],
  "United Arab Emirates": ["dubai"],
  "France": ["paris"],
  "Indonesia": ["bali","jakarta"],
  "Thailand": ["bangkok","phuket"],
  "Singapore": ["singapore"],
  "Japan": ["tokyo"],
  "United Kingdom": ["london","edinburgh"],
  "United States": ["new-york","chicago","las-vegas","los-angeles","miami","orlando","san-francisco"],
  "Maldives": ["maldives"],
  "Sri Lanka": ["colombo"],
  "China": ["beijing","shanghai","hong-kong","macau"],
  "Hungary": ["budapest"],
  "South Africa": ["cape-town"],
  "Denmark": ["copenhagen"],
  "Ireland": ["dublin"],
  "Switzerland": ["geneva","zurich"],
  "Vietnam": ["hanoi","ho-chi-minh"],
  "Finland": ["helsinki"],
  "South Korea": ["seoul"],
  "Taiwan": ["taipei"],
  "Netherlands": ["amsterdam"],
  "Spain": ["barcelona"],
  "Greece": ["athens"],
  "Poland": ["krakow","warsaw"],
  "Canada": ["toronto","vancouver"],
  "Nepal": ["kathmandu"],
  "Malaysia": ["kuala-lumpur"],
  "Philippines": ["manila"],
  "Norway": ["oslo"],
  "Portugal": ["lisbon"],
  "Czechia": ["prague"],
  "Austria": ["vienna"],
  "Sweden": ["stockholm"],
  "Italy": ["rome"],
};
const regionGroups: Record<string, string[]> = {
  "Asia": ["India","United Arab Emirates","Indonesia","Thailand","Singapore","Japan","Maldives","Sri Lanka","China","Vietnam","South Korea","Taiwan","Nepal","Malaysia","Philippines"],
  "Europe": ["France","United Kingdom","Hungary","Denmark","Ireland","Switzerland","Finland","Netherlands","Spain","Greece","Poland","Norway","Portugal","Czechia","Austria","Sweden","Italy"],
  "North America": ["United States","Canada"],
  "Africa": ["South Africa"],
};
const slugs = new Map<string, string>();
for (const [country, cities] of Object.entries(cityGroups)) for (const city of cities) slugs.set(city, country);
const regions = new Map<string, string>();
for (const [region, countries] of Object.entries(regionGroups)) for (const country of countries) regions.set(country, region);
export function destinationGeography(slug: string, recordedCountry?: string | null) {
  const known = slugs.get(slug);
  const confirmed = typeof recordedCountry === "string" && /^[\p{L}][\p{L} .'-]{1,79}$/u.test(recordedCountry.trim())
    ? recordedCountry.trim() : null;
  const country = known ?? confirmed;
  return { country, region: country ? regions.get(country) ?? null : null };
}
