// Add entries only after reviewing listing match and permission evidence.
// Never infer approval from a database URL, verified flag, or image provider.
export type ApprovedMedia = { url: string; kind: "photo" | "render"; source: string; permissionReference: string }
export const APPROVED_PROPERTY_MEDIA: Record<string, ApprovedMedia[]> = {}
export function approvedMedia(slug: string, url: unknown): ApprovedMedia | undefined {
  return APPROVED_PROPERTY_MEDIA[slug]?.find(item => item.url === url && item.source && item.permissionReference)
}
