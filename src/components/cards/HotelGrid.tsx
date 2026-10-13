"use client";

// Compatibility component for legacy city-grid imports.
// Display only hotels returned by the validated public listings API.
import HotelResults from "@/app/hotels/results/HotelResults";

export default function HotelGrid({ citySlug }: { citySlug: string }) {
  const city = citySlug.replace(/^hotels-in-/, "").replace(/-/g, " ").trim();
  return city ? <HotelResults city={city} /> : null;
}
