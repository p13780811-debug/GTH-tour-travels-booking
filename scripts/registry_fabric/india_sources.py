"""Authority-aware India registry discovery map, NOT a list of scraping APIs.

Public state/UT regulator homepages are attributed to India's MoHUA authority
directory. Operators must confirm legal availability, schema and source licence
before creating a separate provider-specific bounded reader. No network or writes.
https://www.mohua.gov.in/documents/acts-and-policies/rera-YDM4EzMtQWa
"""
from dataclasses import dataclass
from urllib.parse import urlsplit

from .core import RegistryValidationError
from .universal import INDIA_REGIONS


@dataclass(frozen=True)
class IndianRegulator:
    state_code: str
    authority: str
    homepage: str
    publication_mode: str = "source_research_only"


# Only regulator homepages listed by MoHUA, not inferred bulk downloads or APIs.
# Some Union Territories share another state's regulator jurisdiction.
HOMEPAGES = {
    "AN": ("TNRERA", "https://rera.tn.gov.in/"),
    "AP": ("APRERA", "https://www.rera.ap.gov.in/"),
    "AS": ("ASSAMRERA", "https://rera.assam.gov.in/"),
    "BR": ("BIHARRERA", "https://rera.bihar.gov.in/"),
    "CG": ("CGRERA", "https://rera.cgstate.gov.in/"),
    "DN": ("MAHARERA", "https://maharera.maharashtra.gov.in/"),
    "DL": ("DL-RERA", "https://www.rera.delhi.gov.in/"),
    "GA": ("GOARERA", "https://rera.goa.gov.in/reraApp/"),
    "GJ": ("GUJRERA", "https://gujrera.gujarat.gov.in/"),
    "HR": ("HARERA", "https://haryanarera.gov.in/"),
    "HP": ("HPRERA", "http://www.hprera.in/"),
    "JH": ("JHARERA", "https://jharera.jharkhand.gov.in/"),
    "KA": ("KARNATAKARERA", "https://rera.karnataka.gov.in/"),
    "KL": ("KERALARERA", "https://rera.kerala.gov.in/"),
    "MP": ("MPRERA", "https://www.rera.mp.gov.in/"),
    "MH": ("MAHARERA", "https://maharera.maharashtra.gov.in/"),
    "OD": ("ODISHARERA", "https://rera.odisha.gov.in/home"),
    "PY": ("PRERA", "https://prera.py.gov.in/reraApp/"),
    "PB": ("PUNJABRERA", "https://rera.punjab.gov.in/"),
    "RJ": ("RAJRERA", "http://rera.rajasthan.gov.in/"),
    "TN": ("TNRERA", "https://rera.tn.gov.in/"),
    "TS": ("TELANGANARERA", "https://rera.telangana.gov.in/"),
    "TR": ("TRIPURARERA", "https://rera.tripura.gov.in/"),
    "UP": ("UPRERA", "https://www.up-rera.in/index"),
    "WB": ("WBRERA", "https://rera.wb.gov.in/"),
}


def india_regulator(state_code: str) -> IndianRegulator:
    if not isinstance(state_code, str):
        raise RegistryValidationError("Indian region code must be text")
    code = state_code.strip().upper()
    if code not in INDIA_REGIONS:
        raise RegistryValidationError("Unknown Indian state or union territory")
    entry=HOMEPAGES.get(code)
    if not entry:
        raise RegistryValidationError("Regulator homepage not confirmed; never guess an API")
    authority, homepage=entry
    return IndianRegulator(state_code=code,authority=authority,homepage=homepage)


def is_transport_approved(ref: IndianRegulator) -> bool:
    """HTTPS transport alone is not permission to bulk ingest or bypass controls."""
    parsed=urlsplit(ref.homepage)
    return (parsed.scheme=="https" and parsed.hostname is not None and
            parsed.username is None and parsed.password is None and parsed.port is None)
