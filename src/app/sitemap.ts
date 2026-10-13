import type { MetadataRoute } from "next";
import { destinations } from "@/data/destinations";
const base = "https://gth-pro.vercel.app";
const publicLaunch = process.env.VERCEL_ENV === "production" &&
  process.env.GTH_PUBLIC_LAUNCH_ENABLED === "true";
const pages = [
  "/", "/mega-aggregator", "/travel", "/flights", "/hotels", "/tours",
  "/destinations", "/guides", "/blog", "/bus", "/train", "/transfers",
  "/insurance", "/real-estate", "/real-estate/tools", "/tender",
  "/partners", "/partners/apply", "/contact",
];
export default function sitemap(): MetadataRoute.Sitemap {
  // Preview builds must not advertise unlaunched or unverified services for indexing.
  if (!publicLaunch) return [];
  return [
    ...pages.map(path => ({ url: base + (path === "/" ? "" : path), changeFrequency: "weekly" as const, priority: path === "/" || path === "/mega-aggregator" ? 1 : 0.6 })),
    ...destinations.map(d => ({ url: base + "/destinations/" + d.slug, changeFrequency: "weekly" as const, priority: 0.5 })),
  ];
}
