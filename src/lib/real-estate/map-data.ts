export function validMapCoordinates(lat: unknown, lng: unknown): lat is number {
    return typeof lat === "number" && typeof lng === "number" && Number.isFinite(lat) && Number.isFinite(lng) && Math.abs(lat) <= 90 && Math.abs(lng) <= 180
}

export function mapPriceLabel(property: { formatted_price?: unknown; price?: unknown }): string {
    const value = property.formatted_price ?? property.price
    if (typeof value === "string" && value.trim()) return value.trim().slice(0, 100)
    if (typeof value === "number" && Number.isFinite(value) && value > 0) return String(value)
    return "Price on request"
}
