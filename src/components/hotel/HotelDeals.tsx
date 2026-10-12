import HotelResults from "@/app/hotels/results/HotelResults";

// Legacy export preserved; live inventory or prices are never fabricated.
export default function HotelDeals({ city }: { city: string }) {
  const safeCity = typeof city === "string" ? city.trim().slice(0, 80) : "";
  return safeCity ? <HotelResults city={safeCity} /> : null;
}
