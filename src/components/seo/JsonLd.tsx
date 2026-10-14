import { safeStructuredData } from "@/lib/seo/site";

// Render only locally constructed, escaped, factual structured data.
export default function JsonLd({ data }: { data: Record<string, unknown> }) {
  return <script type="application/ld+json" dangerouslySetInnerHTML={{
    __html: safeStructuredData(data),
  }} />;
}
