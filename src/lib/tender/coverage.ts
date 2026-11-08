/** Explicit source capability, not a promise of complete or currently live inventory. */
export type TenderSourceCoverage={id:string;name:string;countries:readonly string[];mode:"feed"|"free-key"|"official-portal";url:string;note:string};
const EU="AT BE BG HR CY CZ DK EE FI FR DE GR HU IE IT LV LT LU MT NL PL PT RO SK SI ES SE".split(" ");
export const TENDER_COVERAGE:readonly TenderSourceCoverage[]=[
 {id:"worldbank",name:"World Bank procurement",countries:[],mode:"feed",url:"https://projects.worldbank.org/en/projects-operations/procurement",note:"Country-tagged World Bank-financed procurement. This is not every government's tender feed."},
 {id:"ted",name:"TED European Union",countries:EU,mode:"feed",url:"https://ted.europa.eu",note:"Published TED notices. National and low-value procurement may be outside this feed."},
 {id:"uk",name:"UK Find a Tender",countries:["GB"],mode:"feed",url:"https://www.find-tender.service.gov.uk",note:"Official public OCDS connector."},
 {id:"uk_contractsfinder",name:"UK Contracts Finder",countries:["GB"],mode:"feed",url:"https://www.contractsfinder.service.gov.uk",note:"Official public OCDS connector; coverage differs from Find a Tender."},
 {id:"brazil",name:"Brazil PNCP",countries:["BR"],mode:"feed",url:"https://pncp.gov.br",note:"Official procurement proposal-feed connector."},
 {id:"canada",name:"CanadaBuys",countries:["CA"],mode:"feed",url:"https://canadabuys.canada.ca",note:"Government open-notices CSV; source-provided hosting and deadline rules still apply."},
 {id:"ukraine",name:"Ukraine Prozorro",countries:["UA"],mode:"feed",url:"https://prozorro.gov.ua",note:"Official active-tender public API connector."},
 {id:"sam",name:"US SAM.gov",countries:["US"],mode:"free-key",url:"https://sam.gov/opportunities",note:"Requires the operator's free SAM.gov API key. Without that key this connector is skipped."},
 {id:"cppp",name:"India CPPP",countries:["IN"],mode:"official-portal",url:"https://eprocure.gov.in/eprocure/app",note:"Official discovery and submission. Bulk reproduction access has not been verified."},
 {id:"gem",name:"India GeM",countries:["IN"],mode:"official-portal",url:"https://gem.gov.in",note:"Use official registration, search and bid submission; no claimed anonymous bulk feed."},
 {id:"ungm",name:"UN Global Marketplace",countries:[],mode:"official-portal",url:"https://www.ungm.org",note:"International UN procurement; authenticated data access is separate from public browsing."},
 {id:"australia",name:"Australia AusTender",countries:["AU"],mode:"official-portal",url:"https://www.tenders.gov.au",note:"Official national opportunities portal; not an activated GTH PRO ingestion connector."},
 {id:"new-zealand",name:"New Zealand GETS",countries:["NZ"],mode:"official-portal",url:"https://www.gets.govt.nz",note:"Official government electronic tenders service."},
 {id:"singapore",name:"Singapore GeBIZ",countries:["SG"],mode:"official-portal",url:"https://www.gebiz.gov.sg",note:"Official public-sector procurement portal."},
 {id:"south-africa",name:"South Africa eTenders",countries:["ZA"],mode:"official-portal",url:"https://www.etenders.gov.za",note:"Official tender publication portal; feed activation requires separate verification."},
 {id:"kenya",name:"Kenya Public Procurement Information Portal",countries:["KE"],mode:"official-portal",url:"https://tenders.go.ke",note:"Official public procurement notices and information."},
 {id:"bangladesh",name:"Bangladesh e-GP",countries:["BD"],mode:"official-portal",url:"https://www.eprocure.gov.bd",note:"Official electronic government procurement portal."},
 {id:"pakistan",name:"Pakistan PPRA",countries:["PK"],mode:"official-portal",url:"https://www.ppra.org.pk",note:"Official public procurement regulatory authority."},
 {id:"nepal",name:"Nepal e-GP",countries:["NP"],mode:"official-portal",url:"https://bolpatra.gov.np/egp/",note:"Official electronic procurement system."},
 {id:"philippines",name:"Philippines PhilGEPS",countries:["PH"],mode:"official-portal",url:"https://philgeps.gov.ph",note:"Official government electronic procurement system."},
 {id:"malaysia",name:"Malaysia ePerolehan",countries:["MY"],mode:"official-portal",url:"https://www.eperolehan.gov.my",note:"Official government procurement portal."},
];
export function tenderSourcesFor(country:string){return TENDER_COVERAGE.filter(row=>!country||!row.countries.length||row.countries.includes(country));}
export function coverageLabel(mode:TenderSourceCoverage["mode"]){return mode==="feed"?"Feed connector available":mode==="free-key"?"Free-key connector":"Official portal guidance";}
