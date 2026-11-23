/**
 * A shared, source-preserving country identifier for worldwide destination URLs.
 * Accepts ISO/UN long-form names (commas, parentheses) without relaxing the
 * URL/query guard to markup, control characters or arbitrary punctuation.
 * Keep the stored spelling unchanged so Supabase equality filters remain exact.
 */
const COUNTRY=/^[\p{L}][\p{L}\p{M} .,'’‘()&-]{1,79}$/u;

export function validatedCountry(value:unknown):string {
  if(typeof value!=="string" || value.length>80)return "";
  const country=value.trim();
  return COUNTRY.test(country)?country:"";
}
