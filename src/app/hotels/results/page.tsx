import HotelResults from "./HotelResults";

type PageProps = {
  searchParams: Promise<{ city?: string | string[] }>;
};

export default async function Page({ searchParams }: PageProps) {
  const params = await searchParams;
  const rawCity = Array.isArray(params.city) ? params.city[0] : params.city;
  const city = typeof rawCity === "string" ? rawCity.trim().slice(0, 80) : "";

  return (
    <main className="min-h-screen bg-[var(--bg)] text-[var(--text)] px-4 py-10">
      <div className="mx-auto max-w-7xl">
        <h1 className="text-2xl md:text-4xl font-bold">Hotel listings</h1>
        <p className="mt-2 text-sm text-[var(--muted)]">
          Listings are sourced from our hotel database. Prices and availability must be confirmed with the booking partner.
        </p>
        {city ? (
          <HotelResults city={city} />
        ) : (
          <div className="mt-8 gth-glass rounded-2xl border border-[var(--border)] p-6" role="status">
            Enter a destination to explore available hotel listings.
            <a className="ml-2 gold-text underline" href="/hotels">Search hotels</a>
          </div>
        )}
      </div>
    </main>
  );
}
