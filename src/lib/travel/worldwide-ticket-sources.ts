/** Public editorial ticket-source index. Not a live inventory, approval, or pricing feed.
 * Keep direct seller URLs independent from affiliate URLs and never auto-redirect visitors.
 */
export const ticketCategories = [
  {slug:"sports",label:"Sports & stadiums",description:"Cricket, football, basketball, racing and other live sporting events."},
  {slug:"concerts",label:"Concerts & music",description:"Live music, artists, arena tours and musical performances."},
  {slug:"theatre",label:"Theatre & musicals",description:"Plays, musicals, opera, dance and live stage productions."},
  {slug:"comedy",label:"Comedy & shows",description:"Stand-up, comedy clubs and other live entertainment."},
  {slug:"festivals",label:"Festivals & exhibitions",description:"Music festivals, expos, fairs, exhibitions and conferences."},
  {slug:"attractions",label:"Tours & attractions",description:"Sightseeing, cultural experiences and local activities."},
  {slug:"museums",label:"Museums & landmarks",description:"Museum admissions, historic places and timed-entry sights."},
  {slug:"theme-parks",label:"Theme parks & family",description:"Theme parks and family entertainment admission."},
  {slug:"cinema",label:"Cinema & screenings",description:"Movie tickets, film festivals and special screenings."},
] as const;
export type TicketCategory = (typeof ticketCategories)[number]["slug"];
export type WorldwideTicketSource = {
  id:string; name:string; region:string; categories:readonly TicketCategory[];
  url:string; kind:"ticket-platform"|"official-box-office"|"official-calendar"|"discovery-platform";
  keywords:string;
};
export const worldwideTicketSources: readonly WorldwideTicketSource[] = [
  {
    "id": "bookmyshow",
    "name": "BookMyShow — India events",
    "region": "India",
    "categories": [
      "sports",
      "concerts",
      "theatre",
      "comedy",
      "festivals",
      "cinema"
    ],
    "url": "https://in.bookmyshow.com/explore/events",
    "kind": "ticket-platform",
    "keywords": "Mumbai Kolkata Delhi Bengaluru Bangalore Chennai Hyderabad Pune Ahmedabad Kochi Goa cricket IPL Bollywood film movies music show comedy"
  },
  {
    "id": "district",
    "name": "District — India events",
    "region": "India",
    "categories": [
      "sports",
      "concerts",
      "comedy",
      "festivals",
      "attractions"
    ],
    "url": "https://www.district.in/events/",
    "kind": "ticket-platform",
    "keywords": "India Mumbai Delhi NCR Kolkata Bangalore Bengaluru Hyderabad Pune sports concerts standup stand-up music exhibitions"
  },
  {
    "id": "ticketmaster-us",
    "name": "Ticketmaster — United States",
    "region": "United States",
    "categories": [
      "sports",
      "concerts",
      "theatre",
      "comedy",
      "festivals"
    ],
    "url": "https://www.ticketmaster.com/",
    "kind": "ticket-platform",
    "keywords": "New York Los Angeles Chicago Miami Boston Houston San Francisco USA Broadway NBA NFL NHL baseball music concerts"
  },
  {
    "id": "ticketmaster-ca",
    "name": "Ticketmaster — Canada",
    "region": "Canada",
    "categories": [
      "sports",
      "concerts",
      "theatre",
      "comedy",
      "festivals"
    ],
    "url": "https://www.ticketmaster.ca/",
    "kind": "ticket-platform",
    "keywords": "Toronto Vancouver Montreal Ottawa Calgary Edmonton Canadian basketball hockey concerts"
  },
  {
    "id": "ticketmaster-uk",
    "name": "Ticketmaster — United Kingdom",
    "region": "United Kingdom",
    "categories": [
      "sports",
      "concerts",
      "theatre",
      "comedy",
      "festivals"
    ],
    "url": "https://www.ticketmaster.co.uk/",
    "kind": "ticket-platform",
    "keywords": "London Manchester Liverpool Birmingham Glasgow Edinburgh Belfast UK football music arena"
  },
  {
    "id": "ticketek-au",
    "name": "Ticketek — Australia",
    "region": "Australia",
    "categories": [
      "sports",
      "concerts",
      "theatre",
      "comedy",
      "festivals"
    ],
    "url": "https://premier.ticketek.com.au/",
    "kind": "ticket-platform",
    "keywords": "Sydney Melbourne Perth Brisbane Adelaide Canberra AFL cricket rugby music concerts"
  },
  {
    "id": "ticketmaster-sg",
    "name": "Ticketmaster — Singapore",
    "region": "Singapore",
    "categories": [
      "sports",
      "concerts",
      "theatre",
      "comedy"
    ],
    "url": "https://ticketmaster.sg/",
    "kind": "ticket-platform",
    "keywords": "Singapore Kallang National Stadium Marina Bay concerts shows"
  },
  {
    "id": "pia-jp",
    "name": "Ticket PIA — Japan",
    "region": "Japan",
    "categories": [
      "sports",
      "concerts",
      "theatre",
      "comedy",
      "festivals",
      "cinema"
    ],
    "url": "https://t.pia.jp/en/",
    "kind": "ticket-platform",
    "keywords": "Tokyo Osaka Kyoto Yokohama Sapporo Nagoya Fukuoka J-pop K-pop anime baseball"
  },
  {
    "id": "platinumlist-uae",
    "name": "Platinumlist — Dubai",
    "region": "United Arab Emirates",
    "categories": [
      "sports",
      "concerts",
      "theatre",
      "comedy",
      "festivals",
      "attractions"
    ],
    "url": "https://dubai.platinumlist.net/",
    "kind": "ticket-platform",
    "keywords": "Dubai UAE Abu Dhabi Sharjah concerts opera family show"
  },
  {
    "id": "thaiticketmajor",
    "name": "ThaiTicketMajor — Thailand",
    "region": "Thailand",
    "categories": [
      "concerts",
      "theatre",
      "comedy",
      "festivals"
    ],
    "url": "https://www.thaiticketmajor.com/",
    "kind": "ticket-platform",
    "keywords": "Bangkok Pattaya Phuket Chiang Mai Thailand K-pop festivals"
  },
  {
    "id": "eventbrite",
    "name": "Eventbrite — worldwide event discovery",
    "region": "Worldwide",
    "categories": [
      "sports",
      "concerts",
      "theatre",
      "comedy",
      "festivals",
      "attractions"
    ],
    "url": "https://www.eventbrite.com/",
    "kind": "discovery-platform",
    "keywords": "Local events workshops conferences music festivals community live tickets worldwide"
  },
  {
    "id": "official-london-theatre",
    "name": "Official London Theatre — West End",
    "region": "United Kingdom",
    "categories": [
      "theatre",
      "comedy"
    ],
    "url": "https://officiallondontheatre.com/theatre-tickets/",
    "kind": "official-box-office",
    "keywords": "London West End musicals opera drama dance plays TKTS"
  },
  {
    "id": "disneyworld",
    "name": "Walt Disney World — park tickets",
    "region": "United States",
    "categories": [
      "theme-parks",
      "attractions"
    ],
    "url": "https://disneyworld.disney.go.com/admission/tickets/theme-parks/",
    "kind": "official-box-office",
    "keywords": "Orlando Florida Magic Kingdom Epcot Animal Kingdom Hollywood Studios Disney"
  },
  {
    "id": "disneyland-paris",
    "name": "Disneyland Paris — park tickets",
    "region": "France",
    "categories": [
      "theme-parks",
      "attractions"
    ],
    "url": "https://tickets.disneylandparis.com/en-gb/tickets",
    "kind": "official-box-office",
    "keywords": "Paris Marne-la-Vallee France Disney family entertainment"
  },
  {
    "id": "universal-orlando",
    "name": "Universal Orlando — park tickets",
    "region": "United States",
    "categories": [
      "theme-parks",
      "attractions"
    ],
    "url": "https://www.universalorlando.com/web/en/us/tickets-packages/park-tickets",
    "kind": "official-box-office",
    "keywords": "Orlando Florida Epic Universe Islands Adventure Universal Studios Harry Potter"
  },
  {
    "id": "vatican",
    "name": "Vatican Museums — official admission",
    "region": "Italy",
    "categories": [
      "museums",
      "attractions"
    ],
    "url": "https://tickets.museivaticani.va/",
    "kind": "official-box-office",
    "keywords": "Rome Vatican City Sistine Chapel art museum"
  },
  {
    "id": "sagrada",
    "name": "Sagrada Família — official tickets",
    "region": "Spain",
    "categories": [
      "museums",
      "attractions"
    ],
    "url": "https://sagradafamilia.org/en/tickets",
    "kind": "official-box-office",
    "keywords": "Barcelona Gaudi Spain church landmark basilica"
  },
  {
    "id": "ghibli",
    "name": "Ghibli Museum — official ticket information",
    "region": "Japan",
    "categories": [
      "museums",
      "attractions"
    ],
    "url": "https://www.ghibli-museum.jp/en/tickets/",
    "kind": "official-calendar",
    "keywords": "Mitaka Tokyo anime Studio Ghibli Japan reservation Lawson"
  },
  {
    "id": "tiqets",
    "name": "Tiqets — museums and attractions",
    "region": "Worldwide",
    "categories": [
      "museums",
      "attractions",
      "theme-parks"
    ],
    "url": "https://www.tiqets.com/",
    "kind": "discovery-platform",
    "keywords": "Rome Paris London Barcelona Amsterdam museums landmarks skip line attractions"
  },
  {
    "id": "klook",
    "name": "Klook — activities and admission",
    "region": "Worldwide",
    "categories": [
      "attractions",
      "museums",
      "theme-parks"
    ],
    "url": "https://www.klook.com/",
    "kind": "discovery-platform",
    "keywords": "Japan Singapore Hong Kong Korea Thailand Malaysia Tokyo Bangkok Hong Kong tickets attractions"
  },
  {
    "id": "getyourguide",
    "name": "GetYourGuide — tours and entry tickets",
    "region": "Worldwide",
    "categories": [
      "attractions",
      "museums",
      "theme-parks"
    ],
    "url": "https://www.getyourguide.com/",
    "kind": "discovery-platform",
    "keywords": "Paris Rome Barcelona London Dubai Bangkok sightseeing museums tours entry"
  },
  {
    "id": "gocity",
    "name": "Go City — attraction passes",
    "region": "Worldwide",
    "categories": [
      "attractions",
      "museums",
      "theme-parks"
    ],
    "url": "https://gocity.com/en",
    "kind": "discovery-platform",
    "keywords": "London Dubai Singapore New York Paris Sydney attraction city pass"
  },
  {
    "id": "ticketmaster-fr",
    "name": "Ticketmaster — France",
    "region": "France",
    "categories": [
      "sports",
      "concerts",
      "theatre",
      "comedy",
      "festivals"
    ],
    "url": "https://www.ticketmaster.fr/",
    "kind": "ticket-platform",
    "keywords": "Paris Lyon Marseille Nice Lille French music shows concerts"
  },
  {
    "id": "eventim-de",
    "name": "Eventim — Germany",
    "region": "Germany",
    "categories": [
      "sports",
      "concerts",
      "theatre",
      "comedy",
      "festivals"
    ],
    "url": "https://www.eventim.de/",
    "kind": "ticket-platform",
    "keywords": "Berlin Hamburg Munich Frankfurt Cologne Germany Deutschland concert festival"
  },
  {
    "id": "ticketmaster-de",
    "name": "Ticketmaster — Germany",
    "region": "Germany",
    "categories": [
      "sports",
      "concerts",
      "theatre",
      "comedy",
      "festivals"
    ],
    "url": "https://www.ticketmaster.de/",
    "kind": "ticket-platform",
    "keywords": "Berlin Hamburg Munich Frankfurt Germany concerts"
  },
  {
    "id": "ticketmaster-mx",
    "name": "Ticketmaster — Mexico",
    "region": "Mexico",
    "categories": [
      "sports",
      "concerts",
      "theatre",
      "comedy",
      "festivals"
    ],
    "url": "https://www.ticketmaster.com.mx/",
    "kind": "ticket-platform",
    "keywords": "Mexico City CDMX Guadalajara Monterrey Mexico concerts soccer"
  },
  {
    "id": "louvre",
    "name": "Louvre — official museum visitor information",
    "region": "France",
    "categories": [
      "museums",
      "attractions"
    ],
    "url": "https://www.louvre.fr/en/visit/hours-admission",
    "kind": "official-calendar",
    "keywords": "Paris France art museum Mona Lisa Louvre admission"
  },
  {
    "id": "recreation-us",
    "name": "Recreation.gov — US tours and passes",
    "region": "United States",
    "categories": [
      "attractions",
      "museums"
    ],
    "url": "https://www.recreation.gov/",
    "kind": "discovery-platform",
    "keywords": "USA national parks monuments tours public lands entry passes reservations"
  },
  {
    "id": "bms-movies",
    "name": "BookMyShow — India movies",
    "region": "India",
    "categories": [
      "cinema"
    ],
    "url": "https://in.bookmyshow.com/explore/movies",
    "kind": "ticket-platform",
    "keywords": "Mumbai Kolkata Chennai Pune Delhi Hyderabad cinema film movie multiplex Bollywood"
  },
  {
    "id": "webtickets-za",
    "name": "Webtickets — South Africa",
    "region": "South Africa",
    "categories": [
      "sports",
      "concerts",
      "theatre",
      "comedy",
      "festivals",
      "attractions",
      "museums",
      "cinema"
    ],
    "url": "https://www.webtickets.co.za/v2/",
    "kind": "ticket-platform",
    "keywords": "Cape Town Johannesburg Durban Pretoria Gauteng South Africa rugby cricket film movies"
  },
  {
    "id": "sympla-br",
    "name": "Sympla — Brazil",
    "region": "Brazil",
    "categories": [
      "sports",
      "concerts",
      "theatre",
      "comedy",
      "festivals",
      "attractions"
    ],
    "url": "https://www.sympla.com.br/",
    "kind": "ticket-platform",
    "keywords": "Sao Paulo Rio de Janeiro Brasil Brazil Brasilia Belo Horizonte Recife ingressos shows"
  },
  {
    "id": "ticketmaster-nz",
    "name": "Ticketmaster — New Zealand",
    "region": "New Zealand",
    "categories": [
      "sports",
      "concerts",
      "theatre",
      "comedy",
      "festivals",
      "attractions"
    ],
    "url": "https://www.ticketmaster.co.nz/",
    "kind": "ticket-platform",
    "keywords": "Auckland Wellington Christchurch Hamilton Rotorua New Zealand rugby music"
  },
  {
    "id": "ticketmaster-nl",
    "name": "Ticketmaster — Netherlands",
    "region": "Netherlands",
    "categories": [
      "sports",
      "concerts",
      "theatre",
      "comedy",
      "festivals"
    ],
    "url": "https://www.ticketmaster.nl/",
    "kind": "ticket-platform",
    "keywords": "Amsterdam Rotterdam Utrecht Eindhoven Den Haag Holland Netherlands music"
  },
  {
    "id": "loket-id",
    "name": "LOKET — Indonesia",
    "region": "Indonesia",
    "categories": [
      "concerts",
      "comedy",
      "festivals",
      "attractions"
    ],
    "url": "https://www.loket.com/",
    "kind": "ticket-platform",
    "keywords": "Jakarta Bandung Bali Surabaya Yogyakarta Indonesia konser event"
  },
  {
    "id": "sm-tickets-ph",
    "name": "SM Tickets — Philippines",
    "region": "Philippines",
    "categories": [
      "concerts",
      "sports",
      "theatre",
      "festivals"
    ],
    "url": "https://www.smtickets.com/",
    "kind": "ticket-platform",
    "keywords": "Manila Quezon City Cebu Philippines concerts arena"
  },
  {
    "id": "cityline-hk",
    "name": "Cityline — Hong Kong",
    "region": "Hong Kong",
    "categories": [
      "sports",
      "concerts",
      "theatre",
      "comedy",
      "festivals",
      "cinema"
    ],
    "url": "https://www.cityline.com/",
    "kind": "ticket-platform",
    "keywords": "Hong Kong Kowloon HK tickets events live shows"
  },
  {
    "id": "tix-africa",
    "name": "Tix Africa — African events",
    "region": "Multiple markets",
    "categories": [
      "concerts",
      "theatre",
      "comedy",
      "festivals",
      "attractions"
    ],
    "url": "https://tix.africa/",
    "kind": "ticket-platform",
    "keywords": "Nigeria Lagos Abuja Ghana Accra Kenya Nairobi South Africa Rwanda Senegal Cote d'Ivoire Africa"
  },
  {
    "id": "webook-sa",
    "name": "webook — Saudi Arabia events",
    "region": "Saudi Arabia",
    "categories": [
      "sports",
      "concerts",
      "theatre",
      "comedy",
      "festivals",
      "attractions"
    ],
    "url": "https://webook.com/en/explore",
    "kind": "ticket-platform",
    "keywords": "Riyadh Jeddah Dammam Saudi Saudi Arabia football cricket music family events"
  }
];

/** Refuse non-HTTPS URLs, credential-bearing URLs and URL fragments. */
export function isPublicTicketUrl(value:string):boolean {
  try {
    const url=new URL(value);
    return url.protocol==="https:"&&!url.username&&!url.password&&!url.hash;
  } catch { return false; }
}
