// Add entries only after reviewing listing match and permission evidence.
// Never infer approval from a database URL, verified flag, or image provider.
export type ApprovedMedia = { url: string; kind: "photo" | "render"; source: string; permissionReference: string }
export const APPROVED_PROPERTY_MEDIA: Record<string, ApprovedMedia[]> = {}
export function approvedMedia(slug: string, url: unknown): ApprovedMedia | undefined {
  return APPROVED_PROPERTY_MEDIA[slug]?.find(item => item.url === url && item.source && item.permissionReference)
}


export function reviewedInventoryMedia(url: unknown): boolean {
  if (typeof url !== "string" || !url) return false
  try {
    const projectUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    if (!projectUrl) return false
    const source = new URL(url)
    const expected = new URL(projectUrl)
    return source.protocol === "https:" &&
      source.hostname === expected.hostname &&
      source.pathname.startsWith("/storage/v1/object/public/property-images/properties/") &&
      source.pathname.endsWith(".webp")
  } catch {
    return false
  }
}
