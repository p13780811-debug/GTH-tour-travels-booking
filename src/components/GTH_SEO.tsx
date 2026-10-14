import Head from "next/head";
import { siteOrigin, siteUrl } from "@/lib/seo/site";

// Compatibility component for any legacy page importing GTH_SEO.
// New App Router pages should use the native metadata API instead.
// Never claim invented founders, reviews, live fares or company registration.
interface SEOProps {
  title?: string;
  description?: string;
  keywords?: string;
  image?: string;
  url?: string;
}
export default function GTH_SEO({
  title = "GTH PRO | Global Technical Hub",
  description = "Independent travel, real estate and tender discovery on GTH PRO.",
  keywords,
  image = "/images/global-earth.jpg",
  url = "/",
}: SEOProps) {
  const origin = siteOrigin();
  const canonical = url.startsWith("/") && !url.startsWith("//")
    ? siteUrl(url)
    : url.startsWith(origin + "/") || url === origin
      ? url
      : siteUrl("/");
  const photo = image.startsWith("/") && !image.startsWith("//")
    ? siteUrl(image) : siteUrl("/images/global-earth.jpg");
  return <Head>
    <title>{title}</title>
    <meta name="description" content={description} />
    {keywords && <meta name="keywords" content={keywords} />}
    <link rel="canonical" href={canonical} />
    <meta property="og:type" content="website" />
    <meta property="og:url" content={canonical} />
    <meta property="og:title" content={title} />
    <meta property="og:description" content={description} />
    <meta property="og:image" content={photo} />
    <meta property="og:site_name" content="GTH PRO" />
    <meta name="twitter:card" content="summary_large_image" />
    <meta name="twitter:title" content={title} />
    <meta name="twitter:description" content={description} />
    <meta name="twitter:image" content={photo} />
  </Head>;
}
