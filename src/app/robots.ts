import type { MetadataRoute } from "next";
export default function robots(): MetadataRoute.Robots {
  const publicLaunch = process.env.VERCEL_ENV === "production" &&
    process.env.GTH_PUBLIC_LAUNCH_ENABLED === "true";
  if (!publicLaunch) return { rules: { userAgent: "*", disallow: "/" } };
  return {
    rules: [
      { userAgent: "*", allow: "/", disallow: ["/admin/", "/api/", "/tender/assistant", "/real-estate/admin"] },
    ],
    sitemap: "https://gth-pro.vercel.app/sitemap.xml",
  };
}
