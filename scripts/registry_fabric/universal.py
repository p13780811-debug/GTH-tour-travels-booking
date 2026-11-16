"""Universal offline registry identity adapter; never implies official verification.

Any ISO-3166-1 alpha-2 country; every Indian state/UT; other regions supplied
as bounded geographic labels. No network access, bulk scraping, or DB writes.
"""
from __future__ import annotations

import re
from dataclasses import asdict, dataclass
from .core import RegistryValidationError, clean, field

ISO2 = frozenset(("AD AE AF AG AI AL AM AO AQ AR AS AT AU AW AX AZ BA BB BD BE BF "
"BG BH BI BJ BL BM BN BO BQ BR BS BT BV BW BY BZ CA CC CD CF CG CH CI CK "
"CL CM CN CO CR CU CV CW CX CY CZ DE DJ DK DM DO DZ EC EE EG EH ER ES ET "
"FI FJ FK FM FO FR GA GB GD GE GF GG GH GI GL GM GN GP GQ GR GS GT GU "
"GW GY HK HM HN HR HT HU ID IE IL IM IN IO IQ IR IS IT JE JM JO JP KE "
"KG KH KI KM KN KP KR KW KY KZ LA LB LC LI LK LR LS LT LU LV LY MA MC "
"MD ME MF MG MH MK ML MM MN MO MP MQ MR MS MT MU MV MW MX MY MZ NA NC "
"NE NF NG NI NL NO NP NR NU NZ OM PA PE PF PG PH PK PL PM PN PR PS PT "
"PW PY QA RE RO RS RU RW SA SB SC SD SE SG SH SI SJ SK SL SM SN SO SR "
"SS ST SV SX SY SZ TC TD TF TG TH TJ TK TL TM TN TO TR TT TV TW TZ UA "
"UG UM US UY UZ VA VC VE VG VI VN VU WF WS YE YT ZA ZM ZW").split())

INDIA_REGIONS = {
    "AP": "Andhra Pradesh", "AR": "Arunachal Pradesh", "AS": "Assam",
    "BR": "Bihar", "CG": "Chhattisgarh", "GA": "Goa", "GJ": "Gujarat",
    "HR": "Haryana", "HP": "Himachal Pradesh", "JH": "Jharkhand",
    "KA": "Karnataka", "KL": "Kerala", "MP": "Madhya Pradesh",
    "MH": "Maharashtra", "MN": "Manipur", "ML": "Meghalaya",
    "MZ": "Mizoram", "NL": "Nagaland", "OD": "Odisha", "PB": "Punjab",
    "RJ": "Rajasthan", "SK": "Sikkim", "TN": "Tamil Nadu",
    "TS": "Telangana", "TR": "Tripura", "UP": "Uttar Pradesh",
    "UK": "Uttarakhand", "WB": "West Bengal", "AN": "Andaman and Nicobar Islands",
    "CH": "Chandigarh", "DN": "Dadra and Nagar Haveli and Daman and Diu",
    "DL": "Delhi", "JK": "Jammu and Kashmir", "LA": "Ladakh",
    "LD": "Lakshadweep", "PY": "Puducherry",
}
AUTHORITIES = frozenset({
    "MAHARERA", "WBRERA", "HIRA", "UPRERA", "KRERA",
    "GUJRERA", "TNRERA", "DL-RERA", "DLD/RERA",
    "HM_LAND_REGISTRY", "MLS", "COUNTY_ASSESSOR", "GLOBAL_UNLISTED",
})
COUNTRY_AUTHORITY = {
    "MAHARERA": ("IN", "MH"), "WBRERA": ("IN", "WB"),
    "HIRA": ("IN", "WB"), "UPRERA": ("IN", "UP"),
    "GUJRERA": ("IN", "GJ"), "TNRERA": ("IN", "TN"),
    "DL-RERA": ("IN", "DL"), "KRERA": ("IN", None),
    "DLD/RERA": ("AE", None), "HM_LAND_REGISTRY": ("GB", None),
    "MLS": ("US", None), "COUNTY_ASSESSOR": ("US", None),
}
REF = re.compile(r"^[A-Z0-9][A-Z0-9./_-]{2,79}$")
TEXT = re.compile(r"^[^<>\x00-\x1f\x7f]+$")


@dataclass(frozen=True)
class UniversalRegistryProject:
    country_code: str
    region_state: str
    city: str
    registry_authority: str
    registration_id: str
    project_name: str
    developer_name: str | None
    postal_code: str | None
    lat: float | None
    lng: float | None
    verification_status: str = "pending_global_review"

    @property
    def identity(self) -> str:
        return ":".join((self.country_code, self.registry_authority, self.registration_id))

    def public_dict(self) -> dict:
        return asdict(self)


class UniversalGlobalRegistryAdapter:
    """Normalize user-supplied worldwide references without claiming validity."""

    @staticmethod
    def normalize(row: dict) -> UniversalRegistryProject:
        if not isinstance(row, dict):
            raise RegistryValidationError("Expected flat registry object")
        allowed = {"country_code", "country", "region_state", "state", "city",
                   "registry_authority", "registration_id", "registration",
                   "project_name", "developer_name", "postal_code", "lat", "lng"}
        if not set(row).issubset(allowed):
            raise RegistryValidationError("Unexpected or heavy registry columns")
        code = clean(field(row, "country_code", "country"), 2)
        code = code.upper() if code else ""
        if code not in ISO2:
            raise RegistryValidationError("Unknown ISO-2 country code")
        region = clean(field(row, "region_state", "state"), 64)
        if not region or not TEXT.fullmatch(region):
            raise RegistryValidationError("Invalid region")
        if code == "IN":
            lookup = {key.casefold(): key for key in INDIA_REGIONS}
            lookup.update({v.casefold(): k for k, v in INDIA_REGIONS.items()})
            region_code = lookup.get(region.casefold())
            if not region_code:
                raise RegistryValidationError("Unknown Indian state or union territory")
            region = region_code
        city = clean(field(row, "city"), 64)
        title = clean(field(row, "project_name"), 120)
        if not city or not title or not TEXT.fullmatch(city) or not TEXT.fullmatch(title):
            raise RegistryValidationError("City and project name required")
        authority = clean(field(row, "registry_authority"), 32)
        authority = authority.upper() if authority else ""
        if not re.fullmatch(r"[A-Z0-9][A-Z0-9_/-]{2,31}", authority):
            raise RegistryValidationError("Invalid authority")
        scope = COUNTRY_AUTHORITY.get(authority)
        if scope and (scope[0] != code or scope[1] and scope[1] != region):
            raise RegistryValidationError("Authority conflicts with country or state")
        registration = clean(field(row, "registration_id", "registration"), 80)
        registration = re.sub(r"\s+", "", registration).upper() if registration else ""
        if not REF.fullmatch(registration):
            raise RegistryValidationError("Invalid registration or permit reference")
        if authority == "MAHARERA" and not re.fullmatch(r"P[0-9]{11}", registration):
            raise RegistryValidationError("Invalid MahaRERA reference")
        if authority in ("WBRERA", "HIRA") and not re.fullmatch(
                r"(?:WBRERA|HIRA)/P/[A-Z]{3}/[0-9]{4}/[0-9]{6}", registration):
            raise RegistryValidationError("Invalid West Bengal reference")
        developer = clean(field(row, "developer_name"), 100)
        postal = clean(field(row, "postal_code"), 16)
        if developer and not TEXT.fullmatch(developer) or postal and not re.fullmatch(r"[A-Za-z0-9 -]{2,16}", postal):
            raise RegistryValidationError("Invalid developer or postal code")
        def coordinate(key, boundary):
            value = row.get(key)
            if value is None or value == "":
                return None
            try:
                number = float(value)
            except (ValueError, TypeError) as exc:
                raise RegistryValidationError("Invalid coordinates") from exc
            if not -boundary <= number <= boundary or round(number, 5) != number:
                raise RegistryValidationError("Coordinates out of bounds or too precise")
            return number
        lat, lng = coordinate("lat", 90), coordinate("lng", 180)
        if (lat is None) != (lng is None):
            raise RegistryValidationError("Latitude and longitude must be paired")
        bytes_used = sum(len(part.encode("utf-8")) for part in (
            code, region, city, authority, registration, title, developer or "", postal or ""))
        if bytes_used > 220:
            raise RegistryValidationError("Compact storage text budget exceeded")
        return UniversalRegistryProject(code, region, city, authority, registration, title,
                                        developer, postal, lat, lng)

    @staticmethod
    def validate_rows(rows, *, offset=0, limit=100):
        if not 0 <= offset <= 100000 or not 1 <= limit <= 5000:
            raise RegistryValidationError("Invalid bounded window")
        accepted = {}
        report = {"scanned": 0, "accepted": 0, "duplicates": 0, "rejected": 0, "rejection_reasons": {}}
        for index, row in enumerate(rows):
            if index < offset:
                continue
            if index >= offset + limit:
                break
            report["scanned"] += 1
            try:
                record = UniversalGlobalRegistryAdapter.normalize(row)
                old = accepted.get(record.identity)
                if old and old != record:
                    raise RegistryValidationError("Conflicting duplicate identity")
                if old:
                    report["duplicates"] += 1
                else:
                    accepted[record.identity] = record
            except RegistryValidationError as exc:
                report["rejected"] += 1
                report["rejection_reasons"][str(exc)] = report["rejection_reasons"].get(str(exc), 0) + 1
        report["accepted"] = len(accepted)
        return list(accepted.values()), report
