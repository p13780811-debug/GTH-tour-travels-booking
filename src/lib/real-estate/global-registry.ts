/** Compact worldwide project registration identity, never a source verification claim. */
const ISO2 = new Set(("AD AE AF AG AI AL AM AO AQ AR AS AT AU AW AX AZ BA BB BD BE BF BG BH BI BJ BL BM BN BO BQ BR BS BT BV BW BY BZ CA CC CD CF CG CH CI CK CL CM CN CO CR CU CV CW CX CY CZ DE DJ DK DM DO DZ EC EE EG EH ER ES ET FI FJ FK FM FO FR GA GB GD GE GF GG GH GI GL GM GN GP GQ GR GS GT GU GW GY HK HM HN HR HT HU ID IE IL IM IN IO IQ IR IS IT JE JM JO JP KE KG KH KI KM KN KP KR KW KY KZ LA LB LC LI LK LR LS LT LU LV LY MA MC MD ME MF MG MH MK ML MM MN MO MP MQ MR MS MT MU MV MW MX MY MZ NA NC NE NF NG NI NL NO NP NR NU NZ OM PA PE PF PG PH PK PL PM PN PR PS PT PW PY QA RE RO RS RU RW SA SB SC SD SE SG SH SI SJ SK SL SM SN SO SR SS ST SV SX SY SZ TC TD TF TG TH TJ TK TL TM TN TO TR TT TV TW TZ UA UG UM US UY UZ VA VC VE VG VI VN VU WF WS YE YT ZA ZM ZW").split(" "));

/** Public, shared ISO-3166 country validation. No country claims are inferred from a slug. */
export function isGlobalCountryCode(code: string): boolean {
  return /^[A-Z]{2}$/.test(code) && ISO2.has(code);
}

/** 28 Indian states and 8 union territories; values are canonical ISO-3166-2 suffixes. */
export const INDIAN_REGIONS: Readonly<Record<string, string>> = {
  AP:"Andhra Pradesh", AR:"Arunachal Pradesh", AS:"Assam", BR:"Bihar",
  CG:"Chhattisgarh", GA:"Goa", GJ:"Gujarat", HR:"Haryana", HP:"Himachal Pradesh",
  JH:"Jharkhand", KA:"Karnataka", KL:"Kerala", MP:"Madhya Pradesh",
  MH:"Maharashtra", MN:"Manipur", ML:"Meghalaya", MZ:"Mizoram", NL:"Nagaland",
  OD:"Odisha", PB:"Punjab", RJ:"Rajasthan", SK:"Sikkim", TN:"Tamil Nadu",
  TS:"Telangana", TR:"Tripura", UP:"Uttar Pradesh", UK:"Uttarakhand",
  WB:"West Bengal", AN:"Andaman and Nicobar Islands", CH:"Chandigarh",
  DN:"Dadra and Nagar Haveli and Daman and Diu", DL:"Delhi",
  JK:"Jammu and Kashmir", LA:"Ladakh", LD:"Lakshadweep", PY:"Puducherry",
};

const AUTHORITY_SCOPE: Readonly<Record<string, readonly [string, string?]>> = {
  MAHARERA:["IN","MH"], WBRERA:["IN","WB"], HIRA:["IN","WB"],
  UPRERA:["IN","UP"], KRERA:["IN"], GUJRERA:["IN","GJ"],
  TNRERA:["IN","TN"], "DL-RERA":["IN","DL"],
  "DLD/RERA":["AE"], HM_LAND_REGISTRY:["GB"],
  MLS:["US"], COUNTY_ASSESSOR:["US"],
};

export class GlobalRegistryValidationError extends Error {}

function fail(message: string): never { throw new GlobalRegistryValidationError(message); }
function text(value: unknown, min: number, maxBytes: number, required = true): string | null {
  if ((value === null || value === undefined || value === "") && !required) return null;
  if (typeof value !== "string") return fail("Invalid project details");
  const valueText = value.normalize("NFKC").trim().replace(/\s+/gu, " ");
  if (valueText.length < min || new TextEncoder().encode(valueText).length > maxBytes ||
      /[\p{Cc}\p{Cf}<>]/u.test(valueText)) return fail("Invalid project details");
  return valueText;
}
function coordinate(value: unknown, maximum: number): number | null {
  if (value === undefined || value === null || value === "") return null;
  if (typeof value !== "number" && typeof value !== "string") return fail("Invalid coordinates");
  const raw = String(value).trim();
  if (!/^-?\d{1,3}(?:\.\d{1,5})?$/.test(raw)) return fail("Invalid coordinates");
  const parsed = Number(raw);
  if (!Number.isFinite(parsed) || Math.abs(parsed) > maximum) return fail("Invalid coordinates");
  return parsed;
}

export type GlobalRegistryStub = {
  country_code: string;
  region_state: string;
  city: string;
  registry_authority: string;
  registration_id: string;
  project_name: string;
  developer_name: string | null;
  postal_code: string | null;
  lat: number | null;
  lng: number | null;
};

const ALLOWED_KEYS = new Set<keyof GlobalRegistryStub>([
  "country_code", "region_state", "city", "registry_authority", "registration_id",
  "project_name", "developer_name", "postal_code", "lat", "lng",
]);

/** Reject unknown fields (particularly HTML/JSON blobs), unrecognized countries and untrusted status. */
export function normalizeGlobalRegistryStub(body: Record<string, unknown>): GlobalRegistryStub {
  if (Object.keys(body).some(key => !ALLOWED_KEYS.has(key as keyof GlobalRegistryStub))) {
    return fail("Unexpected project details");
  }
  const code = (text(body.country_code, 2, 2) || "").toUpperCase();
  if (!ISO2.has(code)) return fail("Invalid ISO-2 country");
  const sourceRegion = text(body.region_state, 2, 64) || "";
  let region = sourceRegion;
  if (code === "IN") {
    const match = Object.entries(INDIAN_REGIONS).find(([abbr, name]) =>
      abbr.toLowerCase() === sourceRegion.toLowerCase() || name.toLowerCase() === sourceRegion.toLowerCase());
    if (!match) return fail("Select a valid Indian state or union territory");
    region = match[0];
  }
  const authority = (text(body.registry_authority, 3, 32) || "").toUpperCase();
  if (!/^[A-Z0-9][A-Z0-9_/-]{2,31}$/.test(authority)) return fail("Invalid registry authority");
  const scope = AUTHORITY_SCOPE[authority];
  if (scope && (scope[0] !== code || (scope[1] && scope[1] !== region))) {
    return fail("Registry authority does not match the selected country or state");
  }
  const registration = (text(body.registration_id, 3, 80) || "").replace(/\s+/g, "").toUpperCase();
  if (!/^[A-Z0-9][A-Z0-9./_-]{2,79}$/.test(registration)) return fail("Invalid permit or registration ID");
  if (authority === "MAHARERA" && !/^P\d{11}$/.test(registration)) return fail("Invalid MahaRERA registration ID");
  if ((authority === "WBRERA" || authority === "HIRA") &&
      !/^(?:WBRERA|HIRA)\/P\/[A-Z]{3}\/\d{4}\/\d{6}$/.test(registration)) {
    return fail("Invalid West Bengal registration ID");
  }
  const city = text(body.city, 2, 64) || "";
  const projectName = text(body.project_name, 3, 120) || "";
  const developer = text(body.developer_name, 2, 100, false);
  const postal = text(body.postal_code, 2, 16, false);
  if (postal && !/^[A-Za-z0-9 -]{2,16}$/.test(postal)) return fail("Invalid postal code");
  const lat = coordinate(body.lat, 90), lng = coordinate(body.lng, 180);
  if ((lat === null) !== (lng === null)) return fail("Latitude and longitude must be provided together");
  const footprint = [code, region, city, authority, registration, projectName, developer || "", postal || ""].join("");
  if (new TextEncoder().encode(footprint).length > 220) return fail("Project reference exceeds compact storage budget");
  return {
    country_code: code, region_state: region, city,
    registry_authority: authority, registration_id: registration,
    project_name: projectName, developer_name: developer, postal_code: postal, lat, lng,
  };
}

export function displayCountry(code: string): string {
  return new Intl.DisplayNames(["en"], { type: "region" }).of(code) || code;
}
