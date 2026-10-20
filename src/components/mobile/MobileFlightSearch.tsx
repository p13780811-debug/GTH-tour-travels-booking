"use client";

import AviasalesWhiteLabel from "@/components/flights/AviasalesWhiteLabel";

/**
 * Keep one supplier-owned flight search experience on website AND installable app.
 * No duplicate cached-observation API results or synthetic fare quotes.
 */
export default function MobileFlightSearch() {
  return <div data-gth-flight-page="true" className="mx-4 mt-3 min-w-0 pb-4 sm:mx-6">
    <AviasalesWhiteLabel />
  </div>;
}
