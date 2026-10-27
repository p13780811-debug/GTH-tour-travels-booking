/** Match exact account-owned storage objects. Never fetch a submitter-controlled host. */
export function submissionMediaObject(raw: unknown, ownerId: string, projectUrl: string): string | null {
  if (typeof raw !== "string" || raw.length > 800 || !/^[0-9a-f-]{36}$/i.test(ownerId)) return null
  try {
    const url = new URL(raw), project = new URL(projectUrl)
    const prefix = `/storage/v1/object/public/property-images/properties/${ownerId}/`
    if (url.protocol !== "https:" || url.origin !== project.origin || url.username || url.password || url.port || url.search || url.hash || !url.pathname.startsWith(prefix)) return null
    const file = url.pathname.slice(prefix.length)
    if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\.webp$/i.test(file)) return null
    return `properties/${ownerId}/${file}`
  } catch { return null }
}
