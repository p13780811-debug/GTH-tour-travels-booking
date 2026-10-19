/** Source directory can include unnamed dormitory blocks and numeric map labels.
 * POSIX case-insensitive filter is applied identically to data and counts by PostgREST.
 * Never delete or change underlying community-contributed OSM records.
 */
export const NON_PROPERTY_NAME_PATTERN = String.raw`^[[:space:]]*(#?[0-9]+([[:space:][:punct:]]*[0-9]+)*|[0-9]+(st|nd|rd|th)?[[:space:]-]*blocks?|blocks?[[:space:]-]*(no[.]?[[:space:]-]*)?([0-9]+|[a-z]{1,2})|[a-z]{1,2}[[:space:]-]*blocks?)[[:space:]]*$`;

export function isDescriptiveHotelName(value: unknown): value is string {
 if(typeof value!=="string")return false;
 const name=value.trim();
 if(name.length<3||name.length>180||!/\p{L}/u.test(name))return false;
 if(/^#?[0-9]+(?:[\s\p{P}]*[0-9]+)*$/u.test(name))return false;
 if(/^(?:[0-9]+(?:st|nd|rd|th)?[\s-]*blocks?|blocks?[\s-]*(?:no\.?[\s-]*)?(?:[0-9]+|[a-z]{1,2})|[a-z]{1,2}[\s-]*blocks?)$/iu.test(name))return false;
 return true;
}
