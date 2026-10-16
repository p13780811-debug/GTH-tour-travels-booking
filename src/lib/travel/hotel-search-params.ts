/** Pure query builder shared by initial hotel search and next-page loading.
 * Every navigation retains its country, destination, category and hotel-name scope.
 */
export type HotelSearchScope = {
  destination: string;
  city: string;
  name: string;
  country: string;
  category: string;
  sort?: "name_asc" | "name_desc";
  source?: "all" | "partner" | "directory";
};
export function hotelSearchParams(scope: HotelSearchScope, page: number): URLSearchParams {
  if(!Number.isSafeInteger(page) || page < 1 || page > 100) {
    throw new RangeError("Invalid hotel page");
  }
  const params = new URLSearchParams({page:String(page)});
  if(scope.destination)params.set("destination",scope.destination);
  else if(scope.city)params.set("city",scope.city);
  if(scope.name)params.set("name",scope.name);
  if(scope.country)params.set("country",scope.country);
  if(scope.category)params.set("category",scope.category);
  if(scope.sort && scope.sort !== "name_asc")params.set("sort",scope.sort);
  if(scope.source && scope.source !== "all")params.set("source",scope.source);
  return params;
}
