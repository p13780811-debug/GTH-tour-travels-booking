/** Legacy RERA imports assigned Mumbai to unrelated districts. Never use that default as city evidence. */
export function propertyMatchesMarket(row: Record<string, unknown>, city: string): boolean {
  const normalized = (value: unknown) => typeof value === "string" ? value.normalize("NFKC").trim().toLowerCase() : "";
  return normalized(row.city) === normalized(city) && normalized(row.source_type) !== "rera" &&
    normalized(row.status) !== "archived";
}
