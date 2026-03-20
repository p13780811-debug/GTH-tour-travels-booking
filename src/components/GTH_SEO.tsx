import Head from 'next/head';

interface SEOProps {
  title?: string;
  description?: string;
  keywords?: string;
  image?: string;
}

const GTH_SEO = ({
  title = "GTH PRO | Global Luxury Travel Hub",
  description = "Experience the Gold Standard of Travel with GTH PRO. 200 OK verified live flight prices and luxury hotels.",
  keywords = "GTH PRO, Luxury Travel, B2B Travel Portal, Flight Booking GST, 5 Star Hotels",
  image = "/gth-logo.jpg"
}) => {
  return (
    <Head>
      {/* Primary Meta Tags */}
      <title>{title}</title>
      <meta name="description" content={description} />
      <meta name="keywords" content={keywords} />
      <meta name="author" content="Sanjay Basak - GTH PRO" />

      {/* Luxury Branding - Open Graph (Facebook/WhatsApp) */}
      <meta property="og:type" content="website" />
      <meta property="og:title" content={title} />
      <meta property="og:description" content={description} />
      <meta property="og:image" content={image} />

      {/* Twitter Branding */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={title} />
      <meta name="twitter:description" content={description} />

      {/* Security & Mobile Optimization */}
      <meta name="viewport" content="width=device-width, initial-scale=1" />
      <link rel="icon" href="/favicon.ico" />
    </Head>
  );
};

export default GTH_SEO;