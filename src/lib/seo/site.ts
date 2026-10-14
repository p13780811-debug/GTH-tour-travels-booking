// Pre-launch canonical routing: never advertise an unowned domain until
// production is explicitly released. This helper makes the future switch atomic.
export const PREVIEW_ORIGIN = "https://gth-pro.vercel.app";
export const PRIMARY_ORIGIN = "https://gthproglobal.com";
export function isPublicLaunch(): boolean {
  return process.env.VERCEL_ENV === "production" &&
    process.env.GTH_PUBLIC_LAUNCH_ENABLED === "true";
}
export function siteOrigin(): string {
  return isPublicLaunch() ? PRIMARY_ORIGIN : PREVIEW_ORIGIN;
}
export function siteUrl(path: string = "/"): string {
  if (!path.startsWith("/") || path.startsWith("//")) throw new Error("Site path must be root-relative");
  return new URL(path, siteOrigin()).toString();
}
export function safeStructuredData(data: Record<string, unknown>): string {
  return JSON.stringify(data).replace(/</g, "\\u003c");
}
