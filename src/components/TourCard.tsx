export default function TourCard({ tour }: any) {

  const symbolMap: any = {
    INR: "₹",
    USD: "$",
    EUR: "€"
  };

  function buildAffiliateLink(city: string) {
    return `https://klook.tpo.lv/IKb6eSUe?u=${encodeURIComponent(
      `https://www.klook.com/en-IN/search/result/?query=${city}`
    )}`;
  }

  return (
    <div className="flex border rounded-xl overflow-hidden hover:shadow-md transition gth-glass">

      {/* IMAGE */}
      <img
        src={tour.image_url}
        className="w-64 h-48 object-cover"
      />

      {/* CONTENT */}
      <div className="flex-1 p-4 flex flex-col justify-between">

        <div>
          <h3 className="text-lg font-bold">{tour.title}</h3>

          <p className="text-sm text-gray-500">
            {tour.city || tour.city_slug}
          </p>

          <p className="text-sm mt-1">⭐ 4.5</p>
        </div>

        {/* CTA */}
        <div className="flex justify-between items-center mt-4">

          {/* ✅ NEW PRICE SYSTEM */}
          <span className="text-xl font-bold text-green-600">
            {(symbolMap[tour.currency] || "$")}
            {tour.price_numeric ?? 0}
          </span>

          <a
            href={buildAffiliateLink(tour.city_slug)}
            target="_blank"
            rel="noopener noreferrer"
            className="gth-btn-gold text-black px-4 py-2 rounded"
          >
            Book Now
          </a>

        </div>
      </div>
    </div>
  );
}