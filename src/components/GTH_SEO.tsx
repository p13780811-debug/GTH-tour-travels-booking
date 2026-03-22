import Head from 'next/head';

interface SEOProps {
  title?: string;
  description?: string;
  keywords?: string;
  image?: string;
  url?: string; // Naya: Traffic tracking ke liye zaroori hai
}

const GTH_SEO = ({
  title = "GTH PRO | Global Luxury Travel Hub",
  description = "Experience the Gold Standard of Travel with GTH PRO. 200 OK verified live flight prices and luxury hotels.",
  keywords = "GTH PRO, Luxury Travel, B2B Travel Portal, Flight Booking GST, 5 Star Hotels, Sanjay Basak Travel",
  image = "/gth-logo.jpg",
  url = "https://gthpro.com" // Aapka domain yahan aayega
}: SEOProps) => {

  // JSON-LD Schema: Isse Google Search mein "Stars" aur "Price" dikhne ke chances badhte hain
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "TravelAgency",
    "name": "GTH PRO",
    "alternateName": "Global Travel Hub Pro",
    "url": url,
    "logo": `https://gthpro.com${image}`,
    "image": `https://gthpro.com${image}`,
    "description": description,
    "founder": {
      "@type": "Person",
      "name": "Sanjay Basak"
    },
    "address": {
      "@type": "PostalAddress",
      "addressLocality": "Mumbai",
      "addressCountry": "IN"
    },
    "priceRange": "$$$",
    "sameAs": [
      "https://www.linkedin.com/in/sanjay-basak-gthpro" // Aapka LinkedIn ya Social link
    ]
  };

  return (
    <Head>
      {/* Primary Meta Tags */}
      <title>{title}</title>
      <meta name="description" content={description} />
      <meta name="keywords" content={keywords} />
      <meta name="author" content="Sanjay Basak - GTH PRO" />
      <link rel="canonical" href={url} />

      {/* Luxury Branding - Open Graph (Facebook/WhatsApp Traffic Booster) */}
      <meta property="og:type" content="website" />
      <meta property="og:url" content={url} />
      <meta property="og:title" content={title} />
      <meta property="og:description" content={description} />
      <meta property="og:image" content={image} />
      <meta property="og:site_name" content="GTH PRO" />

      {/* Twitter Branding */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={title} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={image} />

      {/* Security, Performance & Mobile Optimization */}
      <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=5" />
      <meta name="theme-color" content="#FFD700" /> {/* Gold Theme Color for Mobile Browsers */}
      <link rel="icon" href="/favicon.ico" />

      {/* Google "Rich Snippets" Script - Isse Google ko "Trust" hota hai */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
      />
    </Head>
  );
};

export default GTH_SEO;