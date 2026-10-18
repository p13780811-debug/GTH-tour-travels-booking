"""Public-field normalization. Missing facts stay missing; source claims are not trust flags."""
from __future__ import annotations

import hashlib
import json
import re
import unicodedata
from datetime import date, datetime, timezone
from decimal import Decimal, InvalidOperation
from urllib.parse import parse_qsl, urlparse

from pydantic import BaseModel, ConfigDict, Field, model_validator

OFFICIAL_HOSTS = frozenset({"maharera.maharashtra.gov.in", "www.maharera.maharashtra.gov.in", "maharerait.maharashtra.gov.in"})
SEARCH_URL = "https://www.maharera.maharashtra.gov.in/projects-search-result"
CLUSTERS = ("Andheri", "Borivali", "Kurla", "Dombivli", "Thane West", "Palava")
DISTRICTS = ("Mumbai Suburban", "Thane", "Mumbai City")
ALIASES = {
    "rera_id": {"rera id", "rera number", "rera no", "maharera registration number", "maharera registration no", "registration number", "registration no"},
    "project_name": {"project name", "name of project", "title"},
    "developer_name": {"developer name", "developer", "promoter name", "name of promoter", "promoter", "builder name"},
    "district": {"district", "project district"},
    "locality": {"locality", "project locality", "village", "taluka"},
    "address": {"location", "project location", "project address", "address"},
    "property_type": {"property type", "project type"},
    "unit_types": {"unit types", "unit configurations", "apartment types"},
    "min_carpet_sqft": {"min carpet sqft", "minimum carpet area sq ft", "min carpet area sqft"},
    "max_carpet_sqft": {"max carpet sqft", "maximum carpet area sq ft", "max carpet area sqft"},
    "min_carpet_sqm": {"min carpet sqm", "minimum carpet area sqm", "min carpet area sqm"},
    "max_carpet_sqm": {"max carpet sqm", "maximum carpet area sqm", "max carpet area sqm"},
    "possession_date": {"possession date", "proposed completion date", "proposed date of completion", "completion date"},
    "latitude": {"latitude", "lat"}, "longitude": {"longitude", "lng", "lon"},
    "source_url": {"source url", "official source url", "project detail url"},
}
SENSITIVE_WORDS = {"pan", "aadhaar", "aadhar", "email", "phone", "mobile", "bank", "account", "ifsc", "password", "secret", "token"}


class IngestionError(Exception):
    """A controlled message safe to emit without provider response bodies or secrets."""


def text(value: object, maximum: int = 250) -> str:
    return re.sub(r"[\x00-\x1f\x7f]", "", str(value or "")).strip()[:maximum]


def key(value: object) -> str:
    return re.sub(r"[^a-z0-9]+", " ", text(value).casefold()).strip()


def canonical_name(value: object) -> str:
    return " ".join(re.findall(r"[\w]+", text(value).casefold(), flags=re.UNICODE))


def official_url(value: str) -> str:
    p = urlparse(value)
    if p.scheme != "https" or p.hostname not in OFFICIAL_HOSTS or p.username or p.password or p.port not in (None, 443):
        raise IngestionError("Source URL is not an allowed official HTTPS registry URL")
    if re.search(r"/(?:login|signin|auth|logout)(?:/|$)", p.path, re.I):
        raise IngestionError("Authenticated portal routes are not ingestion sources")
    if any(any(word in name.casefold() for word in ("token", "secret", "password", "session", "credential", "signature", "authorization")) for name, _ in parse_qsl(p.query)):
        raise IngestionError("Session or credential-bearing URLs are not public source evidence")
    return value


def number(value: object) -> Decimal | None:
    if value in (None, "", "-", "NA", "N/A"):
        return None
    try:
        result = Decimal(str(value).replace(",", "").strip())
        if not result.is_finite():
            raise InvalidOperation
        return result
    except (InvalidOperation, ValueError):
        raise IngestionError("Invalid numeric public field") from None


def source_date(value: object) -> date | None:
    if not value:
        return None
    for fmt in ("%Y-%m-%d", "%d/%m/%Y", "%d-%m-%Y", "%d %b %Y", "%d %B %Y"):
        try:
            return datetime.strptime(str(value).strip(), fmt).date()
        except ValueError:
            continue
    raise IngestionError("Unsupported source date format; supply ISO or day/month/year")


def unit_types(value: object) -> list[str]:
    if not value:
        return []
    if isinstance(value, str) and value.strip().startswith("["):
        try:
            value = json.loads(value)
        except json.JSONDecodeError:
            raise IngestionError("Invalid unit configuration array") from None
    if isinstance(value, str):
        value = re.split(r"[,;|]", value)
    if not isinstance(value, list) or len(value) > 20:
        raise IngestionError("Invalid unit configuration list")
    result = []
    for item in value:
        item = text(item, 30).upper()
        if not re.fullmatch(r"(?:STUDIO|[1-9](?:\.5)?\s*BHK|[1-9]\s*RK)", item):
            raise IngestionError("Unsupported source unit configuration")
        result.append(re.sub(r"\s*(BHK|RK)$", r" \1", item))
    return sorted(set(result))


def cluster_for(locality: str, address: str, district: str) -> str | None:
    haystack = key(locality + " " + address)
    haystack = re.sub(r"\b(?:dombivali|dombiwali)\b", "dombivli", haystack)
    candidates = CLUSTERS[:3] if district == "Mumbai Suburban" else CLUSTERS[3:] if district == "Thane" else ()
    # Palava is more specific than its wider Dombivli belt.
    for cluster in sorted(candidates, key=lambda x: (x != "Palava", -len(x))):
        if re.search(r"\b" + re.escape(key(cluster)) + r"\b", haystack):
            return cluster
    return None


def slug_for(name: str, rera_id: str) -> str:
    ascii_name = unicodedata.normalize("NFKD", name).encode("ascii", "ignore").decode()
    base = re.sub(r"[^a-z0-9]+", "-", ascii_name.casefold()).strip("-")[:105] or "project"
    return f"{base}-{rera_id.lower()}"


class Project(BaseModel):
    model_config = ConfigDict(extra="forbid", validate_assignment=True)
    rera_id: str = Field(pattern=r"^P\d{11}$")
    project_name: str = Field(min_length=2, max_length=250)
    developer_name: str | None = Field(default=None, max_length=250)
    district: str
    locality: str | None = Field(default=None, max_length=150)
    cluster: str | None = None
    property_type: str | None = None
    unit_types: list[str] = Field(default_factory=list)
    min_carpet_sqft: Decimal | None = Field(default=None, gt=0, le=1_000_000)
    max_carpet_sqft: Decimal | None = Field(default=None, gt=0, le=1_000_000)
    possession_date: date | None = None
    latitude: Decimal | None = Field(default=None, ge=18.8, le=19.6)
    longitude: Decimal | None = Field(default=None, ge=72.6, le=73.5)
    source_url: str = SEARCH_URL
    verified_status: bool = False
    registry_evidence: dict = Field(default_factory=dict)
    osm_geometry: dict | None = None
    osm_evidence: dict | None = None
    hero_image: str | None = None
    gallery_images: list[str] = Field(default_factory=list)
    registry_media_evidence: list[dict] = Field(default_factory=list)
    illustrative_media: list[dict] = Field(default_factory=list)

    @model_validator(mode="after")
    def validate_record(self):
        if self.district not in DISTRICTS:
            raise ValueError("Outside target districts")
        expected = {"Mumbai Suburban": "P518", "Thane": "P517", "Mumbai City": "P519"}[self.district]
        if not self.rera_id.startswith(expected):
            raise ValueError("Registration prefix and district disagree")
        if self.min_carpet_sqft and self.max_carpet_sqft and self.min_carpet_sqft > self.max_carpet_sqft:
            raise ValueError("Carpet area range is reversed")
        if (self.latitude is None) != (self.longitude is None):
            raise ValueError("Both coordinate values are required")
        if self.verified_status and not self.registry_evidence.get("exact_detail_match"):
            raise ValueError("Registry verification requires an exact official detail match")
        official_url(self.source_url)
        return self


def mapped_row(headers: list[str], values: list[str]) -> tuple[dict, int]:
    if len(headers) != len(values) or len(headers) > 100:
        raise IngestionError("Source row does not match its headers")
    mapped, sensitive = {}, 0
    for header, value in zip(headers, values):
        normalized = key(header)
        if any(word in normalized.split() for word in SENSITIVE_WORDS):
            sensitive += 1
            continue
        for field, aliases in ALIASES.items():
            if normalized in aliases or normalized == key(field):
                if field in mapped and text(value) and text(mapped[field]) != text(value):
                    raise IngestionError("Ambiguous duplicate source columns")
                if text(value):
                    mapped[field] = text(value, 1500)
                break
    return mapped, sensitive


def normalize(raw: dict, source_url: str = SEARCH_URL) -> Project:
    district = {"mumbai suburban": "Mumbai Suburban", "mumbai suburb": "Mumbai Suburban", "mumbai city": "Mumbai City", "thane": "Thane"}.get(key(raw.get("district")))
    if not district:
        raise IngestionError("Target district must be explicitly recorded")
    name = text(raw.get("project_name"))
    if not name or any(x in key(name) for x in ("skip to main", "sitemap", "feedback")):
        raise IngestionError("Source row is not a project identity")
    locality, address = text(raw.get("locality"), 150), text(raw.get("address"), 500)
    cluster = cluster_for(locality, address, district)
    # Never turn a district label into an exact locality, or infer east/west.
    if not locality and cluster:
        locality = next((match.group(0) for match in re.finditer(r"\b(?:Andheri|Borivali|Kurla|Dombivli|Dombivali|Thane\s+West|Palava)(?:\s+(?:East|West))?\b", address, re.I)), "")
    kind = {"residential": "Residential", "residential group housing": "Residential", "residential commercial": "Mixed", "commercial": "Commercial", "mixed": "Mixed", "mixed use": "Mixed"}.get(key(raw.get("property_type")))
    minimum = number(raw.get("min_carpet_sqft"))
    maximum = number(raw.get("max_carpet_sqft"))
    if minimum is None and raw.get("min_carpet_sqm"):
        minimum = (number(raw["min_carpet_sqm"]) * Decimal("10.7639104167")).quantize(Decimal("0.01"))
    if maximum is None and raw.get("max_carpet_sqm"):
        maximum = (number(raw["max_carpet_sqm"]) * Decimal("10.7639104167")).quantize(Decimal("0.01"))
    return Project(rera_id=text(raw.get("rera_id"), 20).upper(), project_name=name,
        developer_name=text(raw.get("developer_name")) or None, district=district, locality=locality or None, cluster=cluster,
        property_type=kind, unit_types=unit_types(raw.get("unit_types")), min_carpet_sqft=minimum, max_carpet_sqft=maximum,
        possession_date=source_date(raw.get("possession_date")), latitude=number(raw.get("latitude")), longitude=number(raw.get("longitude")),
        source_url=official_url(text(raw.get("source_url"), 2000) or source_url),
        registry_evidence={"kind": "source_record", "exact_detail_match": False, "captured_at": datetime.now(timezone.utc).isoformat()})


def public_payload(p: Project) -> dict:
    data = p.model_dump(mode="json", exclude={"cluster", "source_url"})
    # Zero/null placeholders never become source facts or AI verification.
    data.update(title=p.project_name, developer=p.developer_name, builder_name=p.developer_name,
        slug=slug_for(p.project_name, p.rera_id), country="India", state="Maharashtra",
        city="Thane" if p.district == "Thane" else "Mumbai", location=p.locality or p.district,
        source_type="registry", ingestion_source="MahaRERA Mumbai-Thane importer v1", verified=False, ai_score=0,
        official_source_url=p.source_url, official_source_reference=p.rera_id)
    if p.latitude is not None:
        data.update(lat=float(p.latitude), lng=float(p.longitude))
    return data
