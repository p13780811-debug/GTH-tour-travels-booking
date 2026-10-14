import type { MetadataRoute } from "next";
import { siteOrigin } from "@/lib/seo/site";

export default function robots(): MetadataRoute.Robots {
  const publicLaunch = process.env.VERCEL_ENV === "production" &&
    process.env.GTH_PUBLIC_LAUNCH_ENABLED === "true";

  // Affiliate review bots must be able to see public company, editorial and
  // travel pages even during beta. Indexing still remains DISABLED by the
  // root layout's explicit meta robots tag until public launch is authorised.
  // Keep private app routes out of the crawler discovery surface.
  const privateRoutes = ["/admin", "/api", "/real-estate/admin", "/tender/assistant"];
  if (!publicLaunch) {
    return {
      rules: [{ userAgent: "*", allow: "/", disallow: privateRoutes }],
    };
  }
  return {
    rules: [{ userAgent: "*", allow: "/", disallow: privateRoutes }],
    sitemap: siteOrigin() + "/sitemap.xml",
  };
}
