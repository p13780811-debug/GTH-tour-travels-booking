/**
 * Bounded zero-paid-API intent routing. This deterministic parser is not an LLM.
 * A future semantic reranker must apply publication/RLS/geography filters first.
 */
export type GthSector = 'property' | 'tender' | 'hotel' | 'ticket' | 'flight' | 'tour';
export type GthIntent = {
  sectors: GthSector[];
  place: string | null;
  propertyType: 'Apartment' | 'Villa' | 'Plot' | 'Commercial' | null;
  budget: { amount: number; unit: string; currency: 'INR' | 'AED' | 'USD' | 'GBP' | 'EUR' | null; upperBound: boolean } | null;
  infrastructure: string | null;
  needsVerifiedCrossSectorMatch: boolean;
};
const patterns: Record<GthSector, RegExp> = {
  property: /\b(?:real\s*estate|propert(?:y|ies)|apartments?|flats?|villas?|plots?|penthouses?|homes?|houses?|bhk|commercial\s+space)\b/i,
  tender: /\b(?:tenders?|procurement|government\s+(?:projects?|works?|contracts?)|public\s+works?|rfp|bid\s+notice|infrastructure\s+projects?)\b/i,
  hotel: /\b(?:hotels?|stays?|lodging|accommodation|resorts?)\b/i,
  ticket: /\b(?:stadiums?|tickets?|matches|concerts?|events?)\b/i,
  flight: /\b(?:flights?|airfares?|airlines?)\b/i,
  tour: /\b(?:tours?|activities|excursions?|sightseeing)\b/i,
};
function tokenMatch(input: string, name: string): boolean {
  const escaped = name.replace(/[.*+?^$()|[\]{}\\]/g, '\\$&');
  return new RegExp('(^|[^\\p{L}\\p{N}])'+escaped+'(?=$|[^\\p{L}\\p{N}])', 'iu').test(input);
}
export function parseGthIntent(raw: string, editorialPlaces: readonly string[]): GthIntent {
  const input = raw.normalize('NFKC').replace(/[\u0000-\u001F\u007F]/g, ' ').slice(0, 200).trim();
  const sectors = (Object.keys(patterns) as GthSector[]).filter(sector => patterns[sector].test(input));
  const place = [...editorialPlaces].filter(p => p.length >= 2 && p.length <= 80)
    .sort((a,b) => b.length-a.length).find(p => tokenMatch(input, p)) ?? null;
  const propertyType = /\b(?:apartments?|flats?|bhk)\b/i.test(input) ? 'Apartment'
    : /\bvillas?\b/i.test(input) ? 'Villa'
    : /\bplots?\b/i.test(input) ? 'Plot'
    : /\bcommercial\b/i.test(input) ? 'Commercial' : null;
  const infrastructure = /\bmetro\b/i.test(input) ? 'metro'
    : /\b(?:railway|rail|train)\b/i.test(input) ? 'rail'
    : /\b(?:road|highway|expressway)\b/i.test(input) ? 'road'
    : /\bairport\b/i.test(input) ? 'airport' : null;
  // Human units are not currencies. '5 crore' alone must NEVER become INR.
  const match = input.match(/(?:(INR|AED|USD|GBP|EUR|₹|£|\$)\s*)?(\d{1,10}(?:\.\d{1,2})?)\s*(crores?|cr|lakhs?|lacs?|million|billion|k)\b(?:\s*(INR|AED|USD|GBP|EUR))?/i);
  let budget: GthIntent['budget'] = null;
  if (match) {
    const unit = match[3].toLowerCase();
    const multiplier = /^cr|^crore/.test(unit) ? 10_000_000 : /^la(?:kh|c)/.test(unit) ? 100_000 : /^billion/.test(unit) ? 1_000_000_000 : /^million/.test(unit) ? 1_000_000 : 1_000;
    const amount = Number(match[2]) * multiplier;
    const currencyToken = (match[1] || match[4] || '').toUpperCase();
    const currency = currencyToken === '₹' ? 'INR' : currencyToken === '£' ? 'GBP' : currencyToken === '$' ? 'USD'
      : /^(INR|AED|USD|GBP|EUR)$/.test(currencyToken) ? currencyToken as NonNullable<GthIntent['budget']>['currency'] : null;
    const prefix = input.slice(Math.max(0, (match.index || 0) - 25), match.index || 0);
    const upperBound = /(?:under|below|upto|up\s*to|less\s*than|max(?:imum)?|tak)\s*$/i.test(prefix);
    if (Number.isSafeInteger(amount) && amount > 0 && amount <= 999_999_999_999) budget = { amount, unit, currency, upperBound };
  }
  return { sectors, place, propertyType, budget, infrastructure,
    needsVerifiedCrossSectorMatch: sectors.includes('property') && sectors.includes('tender') };
}
/** Return only existing first-party source-aware search URLs. No invented matches. */
export function connectedIntentLinks(intent: GthIntent): { sector: 'property' | 'tender'; href: string; label: string }[] {
  const links: { sector:'property'|'tender'; href:string; label:string }[] = [];
  if (intent.sectors.includes('property')) {
    const params = new URLSearchParams();
    if (intent.place) params.set('city', intent.place);
    if (intent.propertyType) params.set('type', intent.propertyType);
    if (intent.budget?.currency && intent.budget.upperBound) {
      params.set('currency', intent.budget.currency);
      params.set('maxPrice', String(intent.budget.amount));
    }
    links.push({sector:'property', label:'Search real property records',href:'/real-estate'+(params.size?'?'+params.toString():'')+'#listing-results'});
  }
  if (intent.sectors.includes('tender')) {
    const params = new URLSearchParams();
    const terms = [intent.place, intent.infrastructure].filter(Boolean).join(' ');
    if (terms) params.set('q', terms.slice(0, 100));
    params.set('scope','world');
    links.push({sector:'tender',label:'Check published tender notices',href:'/tender?'+params.toString()+'#tender-find'});
  }
  return links;
}
