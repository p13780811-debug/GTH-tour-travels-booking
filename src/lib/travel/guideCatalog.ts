/**
 * Editorial candidate guides for existing GTH PRO worldwide attractions.
 * Copy is destination planning information, NOT verified venue operations,
 * provider stock or government advice. Publishing requires independent
 * media-rights AND editorial review in Supabase.
 */
export type DestinationGuide = {
 slug:string; name:string; kind:"country"|"city"; country:string; countryCode:string; city:string|null;
 title:string; summary:string; intro:string; bestTime:string;
 highlights:ReadonlyArray<{name:string;why:string}>;
 dayPlan:ReadonlyArray<string>; threeDayPlan:ReadonlyArray<{day:string;plan:string}>;
 tips:ReadonlyArray<string>; faq:ReadonlyArray<{question:string;answer:string}>;
};
export const GUIDE_CONTENT_VERSION=1;
export const guideCatalog:readonly DestinationGuide[]=[
 {slug:"india",name:"India",kind:"country",country:"India",countryCode:"IN",city:null,
 title:"India travel guide: culture, coast and heritage",summary:"Choose a practical India route by region, season and travel time, then explore source-mapped places.",
 intro:"India rewards regional planning: Rajasthan's historic cities, the monuments around Agra, the Western Ghats, Himalayan gateways and the coast have different climates and travel rhythms. Pick a small geographic cluster instead of trying to cross the country in a weekend. Train, flight and road options vary widely by route.",
 bestTime:"October to March is often more comfortable for many plains and heritage-city routes, but Himalayan and coastal conditions differ. Check the specific region and current forecast before confirming travel.",
 highlights:[{name:"Agra and the Taj Mahal",why:"A heritage-focused day that pairs a major monument with nearby Mughal-era sights."},{name:"Jaipur and Rajasthan",why:"Forts, craft markets and architectural heritage reward a multi-day trip."},{name:"Goa's coast and old quarters",why:"Combine shoreline time with neighbourhood walks and Portuguese-era architecture."},{name:"Mumbai's waterfront",why:"Urban history, museums and a dense public-transport network."}],
 dayPlan:["Pick one city and stay within a realistic transfer radius.","Reserve a morning for an important monument or museum, checking official visitor rules.","Spend the afternoon exploring a public neighbourhood or waterfront; keep time for local transport."],
 threeDayPlan:[{day:"Day 1",plan:"Arrive, settle in and explore a compact heritage district near your stay."},{day:"Day 2",plan:"Visit one primary landmark plus a nearby museum or cultural site; leave room for queues."},{day:"Day 3",plan:"Choose a local nature or food experience, then return with a buffer for transport."}],
 tips:["Different states and elevations have different weather and travel times.","Use official operator information for intercity rail, domestic flights and attraction entry.","Carry a flexible itinerary when moving through large cities or mountainous roads."],
 faq:[{question:"Can I cover all major sights in three days?",answer:"No. Choose a single city or short region; long-distance travel can consume much of the trip."},{question:"Are mapped attraction entries proof of opening hours?",answer:"No. OpenStreetMap entries are community contributed. Confirm current access directly with venues."}]},
 {slug:"france",name:"France",kind:"country",country:"France",countryCode:"FR",city:null,
 title:"France travel guide: cities, villages and landscapes",summary:"Plan a region-focused France trip with heritage, transport and seasonal choices.",
 intro:"France offers very different experiences between Paris, the Loire Valley, Provence, Atlantic beaches and Alpine towns. Train travel can link major cities, but local villages and countryside may require more planning. A first visit is easier when you choose Paris plus one other region rather than racing through many stops.",
 bestTime:"Spring and early autumn can suit many city visits and countryside walks, while beaches and mountain routes have their own seasons. Check opening periods for rural sites.",
 highlights:[{name:"Paris museums and riverfront",why:"Well-connected cultural districts are practical for a first visit."},{name:"Loire Valley heritage",why:"Historic towns and châteaux make a slower regional route."},{name:"Provence",why:"Markets, villages and varied scenery are best explored with a flexible pace."},{name:"Mediterranean coast",why:"Coastal towns and promenades suit a different kind of itinerary from Paris."}],
 dayPlan:["Choose a single district around your accommodation.","Book one timed museum or monument if necessary.","Spend the afternoon outdoors and keep your evening plan close to a transport link."],
 threeDayPlan:[{day:"Day 1",plan:"Explore a historic city centre on foot and orient yourself with public transport."},{day:"Day 2",plan:"Combine a museum with a nearby neighbourhood, limiting cross-city transfers."},{day:"Day 3",plan:"Take a short regional day trip where transport schedules make it practical."}],
 tips:["Confirm strikes or service changes with your train and public-transport provider.","Many popular museums require or strongly favour advance reservations.","Respect local closures and seasonal opening hours."],
 faq:[{question:"Can France be explored without a car?",answer:"Many cities and intercity routes are accessible by rail, but rural visits may require local buses or prearranged transport."},{question:"Does this guide sell museum tickets?",answer:"No. Ticket purchases, inventory and prices are confirmed by independent providers."}]},
 {slug:"australia",name:"Australia",kind:"country",country:"Australia",countryCode:"AU",city:null,
 title:"Australia travel guide: cities, reefs and national parks",summary:"Choose a realistic Australian region for a nature-and-city itinerary.",
 intro:"Australia spans major time zones and climate regions. Sydney, Melbourne, tropical Queensland and the Red Centre should not be treated as one short road trip. Choose the region that matches your season, interests and time budget, then research travel distances and site access.",
 bestTime:"Season varies strongly by latitude. Southern city breaks can suit spring or autumn; tropical northern regions experience wet and dry seasons. Follow official weather and park safety updates.",
 highlights:[{name:"Sydney Harbour",why:"Public foreshore walks and city landmarks offer a compact urban route."},{name:"Melbourne cultural districts",why:"Laneways, markets, galleries and neighbourhoods reward time on foot."},{name:"Great Barrier Reef region",why:"Marine trips require qualified operators and checks of current conditions."},{name:"Uluru-Kata Tjuta region",why:"Protected landscapes require culturally respectful and safety-aware planning."}],
 dayPlan:["Choose one city or national-park gateway rather than multiple distant regions.","Check the official route, weather, closures and local transport availability.","Allow enough time for a relaxed main visit rather than back-to-back long drives."],
 threeDayPlan:[{day:"Day 1",plan:"Arrive and explore local highlights within easy transit range."},{day:"Day 2",plan:"Choose a preplanned nature or museum visit with appropriate safety guidance."},{day:"Day 3",plan:"Enjoy a second local district or coast visit and maintain travel buffers."}],
 tips:["Look up state-specific park access, swimming advice and seasonal safety.","Intercity distances are often much larger than they appear on a map.","Respect protected places and First Nations cultural guidance."],
 faq:[{question:"Is a three-day Australia trip enough for several regions?",answer:"No. Choose one metropolitan area or local region for a short visit."},{question:"Are nature excursions always available?",answer:"No. Operators and park authorities determine current safety, seasons and access."}]},
 {slug:"dubai",name:"Dubai",kind:"city",country:"United Arab Emirates",countryCode:"AE",city:"Dubai",
 title:"Dubai city guide: architecture, creek and desert",summary:"Mix the older creek districts with newer architecture and carefully booked experiences.",
 intro:"Dubai is easier to understand as a set of distinct districts. The Creek and historic neighbourhoods contrast with Downtown towers, beaches and modern cultural venues. Travel time between attractions can be longer than expected, so group visits by area.",
 bestTime:"The cooler months, often November to March, are usually more comfortable for extended outdoor sightseeing. Heat remains a consideration for desert plans and summer journeys.",
 highlights:[{name:"Dubai Creek",why:"Waterfront crossings and historic market areas connect the city's trading history."},{name:"Downtown Dubai",why:"Architectural landmarks and public spaces are concentrated in a prominent district."},{name:"Al Fahidi neighbourhood",why:"Historic lanes and cultural venues provide a different pace from malls."},{name:"Desert experiences",why:"Operator-led tours require checking transport, safety and exact inclusions."}],
 dayPlan:["Start near the Creek with heritage lanes and public transport.","Choose one afternoon visit in Downtown rather than crossing multiple districts.","Book any ticketed experience through a provider that lists actual availability."],
 threeDayPlan:[{day:"Day 1",plan:"Explore Creek and older neighbourhoods at a comfortable pace."},{day:"Day 2",plan:"Spend time in Downtown and nearby museums or public attractions."},{day:"Day 3",plan:"Choose the coast or a professionally operated desert outing, depending on weather."}],
 tips:["Check Metro and taxi routing for the specific venues you plan to visit.","Avoid scheduling outdoor desert activities in excessive heat.","Confirm ticket conditions and provider pickup points before paying."],
 faq:[{question:"Is the Creek the same area as Downtown?",answer:"No. They are different districts and require transport planning."},{question:"Can I book directly with GTH PRO?",answer:"GTH PRO provides discovery and optional partner handoff; the provider confirms checkout and inventory."}]},
 {slug:"paris",name:"Paris",kind:"city",country:"France",countryCode:"FR",city:"Paris",
 title:"Paris guide: museums, neighbourhoods and the Seine",summary:"Plan Paris by neighbourhood rather than trying to see every landmark in one day.",
 intro:"Paris makes an excellent walking-and-transit city break when you group sights thoughtfully. Museums, parks and riverfront areas are spread across connected neighbourhoods. Mixing one major paid attraction with nearby free-to-walk streets or gardens reduces rushed travel.",
 bestTime:"Spring and early autumn are popular for walking, but Paris has year-round indoor sights. Expect queues during holidays and popular event periods, and verify opening hours.",
 highlights:[{name:"Eiffel Tower surroundings",why:"Trocadéro and nearby riverfront paths offer different viewpoints."},{name:"Louvre district",why:"Museum collections and the surrounding gardens can fill much of a day."},{name:"Île de la Cité",why:"Historic central streets connect to riverside walking routes."},{name:"Montmartre",why:"Stepped streets and hillside outlooks call for comfortable footwear."}],
 dayPlan:["Explore the Eiffel Tower area and the Seine in the morning.","Choose one museum or gallery after lunch; check whether timed entry is required.","Finish in a nearby neighbourhood rather than adding distant last-minute stops."],
 threeDayPlan:[{day:"Day 1",plan:"Walk the Eiffel Tower and Seine area with an optional museum."},{day:"Day 2",plan:"Explore the Louvre district and central neighbourhoods."},{day:"Day 3",plan:"Visit Montmartre or choose a slower food and museum day."}],
 tips:["Official venue calendars matter more than general opening-hour claims.","Use public transport for longer cross-city journeys.","Keep accommodation and late-night transfer logistics in mind."],
 faq:[{question:"Are Eiffel Tower tickets included in this guide?",answer:"No. Check a licensed ticket provider or official venue for times and booking rules."},{question:"What if museum tickets are unavailable?",answer:"Plan a riverfront or neighbourhood walk and try a different cultural venue."}]},
 {slug:"mumbai",name:"Mumbai",kind:"city",country:"India",countryCode:"IN",city:"Mumbai",
 title:"Mumbai guide: waterfront, heritage and urban culture",summary:"Explore Mumbai through compact neighbourhood plans and local transport realities.",
 intro:"Mumbai combines seafront promenades, museums, architectural heritage and fast-moving commercial districts. The city is extensive and traffic can be heavy. A comfortable plan focuses on one or two connected areas each day rather than assuming short road transfers.",
 bestTime:"Many travellers prefer the cooler, drier months from roughly November to February for outdoor visits. Monsoon rainfall often changes waterfront and ferry plans; confirm weather before travelling.",
 highlights:[{name:"Gateway of India",why:"A waterfront landmark beside historic central-city buildings."},{name:"Colaba district",why:"Galleries, markets and heritage streets reward a slow walk."},{name:"Marine Drive",why:"A popular urban seafront promenade subject to weather conditions."},{name:"Chhatrapati Shivaji Maharaj Terminus area",why:"Architectural history and dense transit connections."}],
 dayPlan:["Start with Gateway of India and the nearby heritage district.","Visit a museum or gallery in the same broad area.","If weather permits, spend late afternoon on a public seafront promenade."],
 threeDayPlan:[{day:"Day 1",plan:"Explore South Mumbai heritage and the waterfront."},{day:"Day 2",plan:"Choose a museum district or a guided neighbourhood experience."},{day:"Day 3",plan:"Use a ferry or nature plan only when official services and conditions permit."}],
 tips:["Check commuter rail and local taxi routes for real travel times.","Monsoon sea conditions can affect coastal excursions.","Avoid treating a source-mapped place as a verified visitor business."],
 faq:[{question:"Can I see Mumbai in one day?",answer:"You can visit a small cluster of South Mumbai highlights but not the whole metropolitan area."},{question:"Are ferries guaranteed to operate?",answer:"No. Weather, seasonal schedules and operator rules apply."}]},
 {slug:"goa",name:"Goa",kind:"city",country:"India",countryCode:"IN",city:"Goa",
 title:"Goa travel guide: beaches, heritage and relaxed routes",summary:"Balance Goa's shorelines with Panaji's historic quarters and sensible transport planning.",
 intro:"Goa offers coastlines, old neighbourhoods, churches, markets and forested inland areas. North and South Goa have different travel patterns; pick accommodation based on what you actually plan to visit. Keep road times realistic instead of assuming nearby beaches are connected by quick public transit.",
 bestTime:"Many visitors choose the relatively drier months from November to February. Monsoon months bring heavier rain and may restrict sea activities; always follow local safety rules.",
 highlights:[{name:"Panaji and Fontainhas",why:"Walkable historic streets offer architecture and local culture."},{name:"Old Goa heritage",why:"Historic religious architecture is an alternative to beach-only itineraries."},{name:"Northern coast",why:"A mix of busy beach districts, markets and varied accommodation."},{name:"Southern coast",why:"Longer travel distances and quieter shoreline options in many areas."}],
 dayPlan:["Begin with Panaji's heritage lanes in cooler hours.","Choose one coastal district and verify access conditions.","Avoid unnecessary long north-to-south road transfers within the same day."],
 threeDayPlan:[{day:"Day 1",plan:"Explore Panaji and nearby heritage sights."},{day:"Day 2",plan:"Spend a relaxed day in a chosen northern coastal area."},{day:"Day 3",plan:"Choose a southern beach or inland cultural outing, accounting for transit."}],
 tips:["Swimming safety notices override any travel-page descriptions.","Check seasonal rules and permissions for water activities.","Verify actual local transport availability when comparing accommodation."],
 faq:[{question:"Is North Goa or South Goa better for a short trip?",answer:"Choose according to your preferred atmosphere and the specific places you want to visit; they are not interchangeable for travel time."},{question:"Are water sports available year-round?",answer:"No. Weather, monsoon restrictions and licensed operator availability vary."}]},
];
export type TopicGuide={slug:string;parentSlug:string;title:string;summary:string;intro:string;bestTime:string;
 highlights:ReadonlyArray<{name:string;why:string}>;faq:ReadonlyArray<{question:string;answer:string}>};
export const topicGuides:readonly TopicGuide[]=[{
 slug:"paris/eiffel-tower-nearby-things-to-do",parentSlug:"paris",
 title:"Near the Eiffel Tower: things to do without rushing",summary:"A practical neighbourhood route linking viewpoints, gardens, museums and the Seine.",
 intro:"The Eiffel Tower area works best as a walkable cluster. Begin with a river crossing or a viewpoint, choose one indoor attraction and leave flexibility for queues. Some riverside areas have uneven steps and busy crossings; review accessibility information for the route you actually choose.",
 bestTime:"Early morning may make outdoor photography calmer, while museum and tower entry depend on the venue's schedule. Keep a rainy-day alternative.",
 highlights:[{name:"Trocadéro viewpoint",why:"An open-air perspective across the Seine toward the tower."},{name:"Champ de Mars",why:"Public green space beside the monument where access can change during events."},{name:"Seine riverside",why:"Walks beside the river connect bridges and different monument views."},{name:"Musée du quai Branly area",why:"A museum option nearby, with admission and opening times managed by the venue."},{name:"Rue Cler",why:"A neighbourhood street to explore when you prefer a slower food stop."}],
 faq:[{question:"Can I visit the Eiffel Tower without advance booking?",answer:"Entry arrangements vary by ticket type and date. Check official venue rules rather than assuming walk-up tickets."},{question:"Are all these activities free?",answer:"Open public streets may be free, while museums and tower visits may require tickets. Conditions can change."}]
}];
export const guideBySlug=(slug:string)=>guideCatalog.find(item=>item.slug===slug)||null;
export const topicBySlugs=(slug:string,topic:string)=>topicGuides.find(item=>item.parentSlug===slug&&item.slug===slug+"/"+topic)||null;
export const discoveryRows=[
 {title:"Popular in India",slugs:["india","goa","mumbai"],description:"Heritage cities and coast"},
 {title:"Europe hot picks",slugs:["paris","france"],description:"Art, streets and landmarks"},
 {title:"Beach & island escapes",slugs:["goa","australia"],description:"Coasts and outdoor planning"},
 {title:"Luxury & iconic cities",slugs:["dubai","paris","mumbai"],description:"Distinctive city experiences"},
] as const;
export function contentReady(guide:DestinationGuide|TopicGuide):boolean{
 return guide.intro.length>=170&&guide.bestTime.length>=55&&guide.highlights.length>=3&&guide.faq.length>=2;
}
