/** Stable offset windows for the supplier-first hotel + OSM discovery catalog. */
export function hotelPageWindow(page: number, supplierCount: number, catalogCount: number, pageSize = 24) {
  const offset = (page - 1) * pageSize;
  const supplierTake = Math.min(pageSize, Math.max(0, supplierCount - offset));
  return {
    supplierStart: offset,
    supplierTake,
    catalogStart: Math.max(0, offset - supplierCount),
    catalogTake: pageSize - supplierTake,
    hasMore: offset + pageSize < supplierCount + catalogCount,
  };
}
