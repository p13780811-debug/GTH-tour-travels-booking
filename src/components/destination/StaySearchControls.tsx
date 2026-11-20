import type { CityContext, TravelQuery, HotelCurrency } from "@/lib/router/cityContext";
import { HOTEL_CURRENCIES } from "@/lib/router/cityContext";
import type { UiLocale } from "@/lib/router/edgeGeoAutoDetect";
import { resolveHotelDates } from "@/lib/travel/hotel-routing";

type Props = {
  city: CityContext;
  locale: UiLocale;
  currency: HotelCurrency;
  value: TravelQuery | null;
  invalid: boolean;
};

/** First-party search intent only; third-party booking widgets stay untouched. */
export default function StaySearchControls({city,locale,currency,value,invalid}:Props) {
  const dates = resolveHotelDates(value?.checkin, value?.checkout);
  const control="mt-1 min-h-11 w-full min-w-0 rounded-xl border border-[var(--border)] bg-[var(--bg)] px-3 text-sm text-[var(--text)]";
  return <form id="gth-destination-stay-form" action={"/destinations/"+encodeURIComponent(city.slug)+"/stays"} method="get"
    aria-label="Set hotel search preferences"
    className="mt-5 rounded-2xl border border-[var(--border)] bg-[var(--card)] p-4">
    <input type="hidden" name="lang" value={locale}/>
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
      <label className="text-xs font-medium text-[var(--text-soft)]">
        Check in
        <input type="date" name="checkin" defaultValue={dates.checkin} className={control}/>
      </label>
      <label className="text-xs font-medium text-[var(--text-soft)]">
        Check out
        <input type="date" name="checkout" defaultValue={dates.checkout} className={control}/>
      </label>
      <label className="text-xs font-medium text-[var(--text-soft)]">
        Adults
        <input type="number" name="adults" min={1} max={20}
          defaultValue={value?.adults??2} className={control}/>
      </label>
      <label className="text-xs font-medium text-[var(--text-soft)]">
        Child ages (comma separated)
        <input type="text" name="children" maxLength={23} inputMode="numeric"
          defaultValue={value?.children.join(",")??""} placeholder="e.g. 5,7" className={control}/>
      </label>
      <label className="text-xs font-medium text-[var(--text-soft)]">
        Currency
        <select name="currency" defaultValue={value?.currency??currency} className={control}>
          {HOTEL_CURRENCIES.map(item=><option value={item} key={item}>{item}</option>)}
        </select>
      </label>
    </div>
    {invalid&&<p role="alert" className="mt-3 text-xs text-[var(--text-soft)]">
      Check your date range, guest ages and currency. No invalid booking parameters will be forwarded.
    </p>}
    <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
      <p className="text-xs text-[var(--text-soft)]">
        Dates default to the next valid stay. Direct city listings require a supplier-verified destination; otherwise select the exact city in the existing hotel search.
      </p>
      <button type="submit" className="gth-btn-gold inline-flex min-h-11 items-center rounded-xl px-4 text-sm font-semibold">
        Find stays in {city.name}
      </button>
    </div>
  </form>;
}
