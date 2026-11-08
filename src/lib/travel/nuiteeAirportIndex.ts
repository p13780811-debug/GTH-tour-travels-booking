import { airports } from "./nuiteeAirportDirectory";
import { indiaAirportReference } from "./airportReferenceIndia";
import { japanAirportReference } from "./airportReferenceJapan";
import { usaAirportReference } from "./airportReferenceUnitedStates";
import { germanyAirportReference } from "./airportReferenceGermany";
import { ukAirportReference } from "./airportReferenceUK";
import { franceAirportReference } from "./airportReferenceFrance";
import { australiaAirportReference } from "./airportReferenceAustralia";
import { chinaAirportReference } from "./airportReferenceChina";
import { canadaAirportReference } from "./airportReferenceCanada";
import { brazilAirportReference } from "./airportReferenceBrazil";
import { thailandAirportReference } from "./airportReferenceThailand";
import { uaeAirportReference } from "./airportReferenceUAE";
import { indonesiaAirportReference } from "./airportReferenceIndonesia";
import { malaysiaAirportReference } from "./airportReferenceMalaysia";
import { spainAirportReference } from "./airportReferenceSpain";

// Verified public airport reference records from read-only Nuitee Connect metadata calls.
// No runtime API request, authentication key or paid lookup is needed to use this catalog.
// Airport existence is NOT proof of current commercial flight service or a bookable route.
export type AirportIndexRecord = {
  code: string;
  name: string;
  city: string;
  countryCode: string;
  timezone: string;
  icao: string;
};

export const airportCountryNames: Readonly<Record<string, string>> = {
  AE: "United Arab Emirates",
  AU: "Australia",
  BR: "Brazil",
  CA: "Canada",
  CN: "China",
  DE: "Germany",
  ES: "Spain",
  FR: "France",
  GB: "United Kingdom",
  ID: "Indonesia",
  IN: "India",
  JP: "Japan",
  MY: "Malaysia",
  SG: "Singapore",
  TH: "Thailand",
  US: "United States",
};

const sources: AirportIndexRecord[] = [
  ...airports.map(({ code, name, city, countryCode, timezone, icao }) => ({
    code, name, city, countryCode, timezone, icao,
  })),
  ...indiaAirportReference,
  ...japanAirportReference,
  ...usaAirportReference,
  ...germanyAirportReference,
  ...ukAirportReference,
  ...franceAirportReference,
  ...australiaAirportReference,
  ...chinaAirportReference,
  ...canadaAirportReference,
  ...brazilAirportReference,
  ...thailandAirportReference,
  ...uaeAirportReference,
  ...indonesiaAirportReference,
  ...malaysiaAirportReference,
  ...spainAirportReference,
];

const seen = new Set<string>();
export const airportIndex: readonly AirportIndexRecord[] = sources
  .filter((item) => {
    if (!/^[A-Z]{3}$/.test(item.code) ||
        !/^[A-Z]{2}$/.test(item.countryCode) ||
        !item.name.trim() || !item.city.trim() ||
        /all airports/i.test(item.name) || seen.has(item.code)) {
      return false;
    }
    seen.add(item.code);
    return true;
  })
  .sort((a, b) => a.city.localeCompare(b.city) || a.name.localeCompare(b.name));

export const airportCountries: readonly string[] = [...new Set(airportIndex.map(item => item.countryCode))]
  .sort((a, b) => (airportCountryNames[a] ?? a).localeCompare(airportCountryNames[b] ?? b));
