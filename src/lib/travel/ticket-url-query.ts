/** Preserve the former server search-param contract without making the hub dynamic. */
export function readTicketUrlQuery(params:Pick<URLSearchParams,"getAll">):string{
  const values=params.getAll("q");
  return values.length===1?values[0].slice(0,100):"";
}
