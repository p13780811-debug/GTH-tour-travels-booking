/**
 * Keep a city's exact country when moving from a worldwide or country list
 * into its detail page. Duplicate slugs across distinct countries are legal
 * in public.destinations and must never silently resolve to another territory.
 */
export type DestinationLinkTarget=Readonly<{slug:string;country:string|null}>;
const SLUG=/^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const COUNTRY=/^[\p{L}][\p{L} .'-]{1,79}$/u;

export function destinationDetailHref({slug,country}:DestinationLinkTarget):string {
  if(typeof slug!=="string"||slug.length>140||!SLUG.test(slug)){
    return "/destinations#discover";
  }
  const base="/destinations/"+encodeURIComponent(slug);
  return typeof country==="string"&&country.length<=80&&COUNTRY.test(country.trim())
    ? base+"?country="+encodeURIComponent(country.trim()) : base;
}
