"""Conservative OSM matching and reviewed media; no stock photo becomes project evidence."""
from __future__ import annotations

import hashlib
import io
import json
from datetime import datetime, timezone
from decimal import Decimal
from pathlib import Path
from urllib.parse import parse_qsl, urlparse

from PIL import Image, UnidentifiedImageError

from .models import IngestionError, Project, canonical_name, key
from .sources import read_file

OSM_ATTRIBUTION = "© OpenStreetMap contributors; ODbL 1.0; https://www.openstreetmap.org/copyright"
# Search envelopes only, never fallback property coordinates.
BOUNDS = {"Mumbai Suburban": (19.00, 72.75, 19.32, 73.02), "Thane": (19.00, 72.90, 19.38, 73.32),
          "Mumbai City": (18.88, 72.75, 19.06, 72.94)}
SAFE_TAGS = {"name", "official_name", "alt_name", "addr:suburb", "addr:city", "addr:postcode", "building", "ref:rera", "ref:IN:RERA"}
COMMERCIAL_LICENSES = {"CC0-1.0", "CC-BY-4.0", "CC-BY-SA-4.0", "owner-authorized", "Pexels License"}


class OsmEnricher:
    def __init__(self, http, endpoint: str, cache_dir: Path):
        p = urlparse(endpoint)
        if p.scheme != "https" or not p.hostname or p.username or p.password or p.query or p.fragment:
            raise IngestionError("Overpass endpoint must be a clean configured HTTPS URL")
        self.http, self.endpoint, self.hosts, self.cache_dir = http, endpoint, {p.hostname}, cache_dir
        self.cache_dir.mkdir(parents=True, exist_ok=True, mode=0o700)

    def elements(self, projects: list[Project], district: str) -> list[dict]:
        names = sorted({p.project_name for p in projects if p.district == district})
        if not names:
            return []
        # Query literal exact names; JSON quotes prevent QL string injection.
        bbox = ",".join(str(x) for x in BOUNDS[district])
        statements = []
        for p in projects:
            if p.district != district:
                continue
            for tag in ("name", "official_name", "ref:rera", "ref:IN:RERA"):
                value = p.rera_id if tag.startswith("ref:") else p.project_name
                statements.append(f"nwr[{json.dumps(tag)}={json.dumps(value)}]({bbox});")
        query = "[out:json][timeout:25][maxsize:8388608];(" + "".join(statements) + ");out center geom;"
        digest = hashlib.sha256((self.endpoint + query).encode()).hexdigest()
        cached = self.cache_dir / (digest + ".json")
        if cached.is_file() and not cached.is_symlink() and datetime.now().timestamp() - cached.stat().st_mtime < 7 * 86400:
            try:
                return json.loads(read_file(cached))["elements"]
            except (ValueError, KeyError, IngestionError):
                pass
        raw, _, _ = self.http.request(self.endpoint, hosts=self.hosts, method="POST", data={"data": query}, max_bytes=8_000_000)
        try:
            data = json.loads(raw)
            if data.get("remark") or not isinstance(data.get("elements"), list):
                raise ValueError
            elements = []
            for el in data["elements"]:
                if el.get("type") not in ("node", "way", "relation"):
                    continue
                safe = {k: el[k] for k in ("type", "id", "lat", "lon", "center", "geometry") if k in el}
                safe["tags"] = {k: v for k, v in el.get("tags", {}).items() if k in SAFE_TAGS}
                elements.append(safe)
        except (ValueError, TypeError, KeyError):
            raise IngestionError("Overpass returned an incomplete or unsupported result") from None
        temp = cached.with_suffix(".tmp")
        temp.write_text(json.dumps({"elements": elements}), encoding="utf-8")
        temp.replace(cached)
        return elements

    @staticmethod
    def match(project: Project, elements: list[dict]) -> dict | None:
        candidates = []
        for el in elements:
            tags = el.get("tags", {})
            reference = tags.get("ref:rera") or tags.get("ref:IN:RERA")
            if reference and reference != project.rera_id:
                continue
            exact_name = canonical_name(tags.get("name") or tags.get("official_name")) == canonical_name(project.project_name)
            # No fuzzy match or name-only join; locality must be independently tagged.
            localities = {key(tags.get("addr:suburb", "")), key(tags.get("addr:city", ""))}
            exact_locality = bool(project.locality and key(project.locality) in localities)
            if reference == project.rera_id or (exact_name and exact_locality):
                candidates.append((el, "rera_reference" if reference == project.rera_id else "exact_name_and_locality"))
        if len(candidates) != 1:
            return None
        el, method = candidates[0]
        center = el if el.get("type") == "node" else el.get("center", {})
        try:
            lat, lon = Decimal(str(center["lat"])), Decimal(str(center["lon"]))
            if not lat.is_finite() or not lon.is_finite():
                return None
            south, west, north, east = BOUNDS[project.district]
            if not (south <= lat <= north and west <= lon <= east):
                return None
        except (KeyError, ValueError, ArithmeticError):
            return None
        geometry = None
        points = el.get("geometry", [])
        if el.get("type") == "way" and el.get("tags", {}).get("building") and 4 <= len(points) <= 10_000:
            try:
                ring = [[float(p["lon"]), float(p["lat"])] for p in points]
                if ring[0] == ring[-1] and all(west <= x <= east and south <= y <= north for x, y in ring):
                    geometry = {"type": "Polygon", "coordinates": [ring]}
            except (KeyError, ValueError, TypeError):
                pass
        return {"latitude": lat, "longitude": lon, "geometry": geometry,
            "evidence": {"osm_type": el["type"], "osm_id": el["id"], "source_url": f"https://www.openstreetmap.org/{el['type']}/{el['id']}",
                "match_method": method, "coordinate_kind": "mapped_node" if el["type"] == "node" else "bounding_box_center",
                "accuracy": "community_mapped_not_survey_verified", "attribution": OSM_ATTRIBUTION,
                "matched_at": datetime.now(timezone.utc).isoformat()}}

    def enrich(self, projects: list[Project]) -> int:
        count = 0
        for district in BOUNDS:
            elements = self.elements(projects, district)
            for index, p in enumerate(projects):
                if p.district != district:
                    continue
                found = self.match(p, elements)
                if not found:
                    continue
                p.osm_geometry, p.osm_evidence = found["geometry"], found["evidence"]
                # An official recorded coordinate takes precedence over the OSM overlay.
                if p.latitude is None:
                    updated = p.model_dump()
                    updated.update(latitude=found["latitude"], longitude=found["longitude"])
                    checked = Project.model_validate(updated)
                    projects[index] = checked
                count += 1
        return count


def attach_reviewed_media(projects: list[Project], path: Path, http, allowed_hosts: set[str]) -> dict:
    try:
        manifest = json.loads(read_file(path))
    except (ValueError, UnicodeError):
        raise IngestionError("Media manifest must be valid UTF-8 JSON") from None
    if not isinstance(manifest, list) or len(manifest) > 500:
        raise IngestionError("Media manifest must contain at most 500 approved asset objects")
    totals = {"exact_media_assets": 0, "illustrative_media_assets": 0}
    by_id = {p.rera_id: p for p in projects}
    fetched = {}
    Image.MAX_IMAGE_PIXELS = 50_000_000
    for item in manifest:
        if not isinstance(item, dict) or item.get("license") not in COMMERCIAL_LICENSES:
            raise IngestionError("Media asset has no supported commercial-use license evidence")
        required = ("url", "source_url", "permission_reference", "attribution", "reviewed_at", "match_kind")
        if not all(isinstance(item.get(k), str) and 0 < len(item[k]) <= 2000 for k in required):
            raise IngestionError("Media asset is missing license, attribution or review evidence")
        try:
            reviewed = datetime.fromisoformat(item["reviewed_at"].replace("Z", "+00:00"))
            if reviewed.tzinfo is None or reviewed > datetime.now(timezone.utc):
                raise ValueError
        except ValueError:
            raise IngestionError("Media review timestamp is invalid") from None
        if item["match_kind"] not in ("exact_project", "illustrative_category"):
            raise IngestionError("Media match kind is unsupported")
        source = urlparse(item["source_url"])
        if source.scheme != "https" or source.username or source.password or not source.hostname:
            raise IngestionError("Media source attribution URL must use HTTPS")
        for url in (item["url"], item["source_url"]):
            if any(any(word in name.casefold() for word in ("token", "secret", "signature", "credential", "authorization", "key")) for name, _ in parse_qsl(urlparse(url).query)):
                raise IngestionError("Signed or credential-bearing media URLs must not be stored as public assets")
        if item["url"] not in fetched:
            raw, content_type, final = http.request(item["url"], hosts=allowed_hosts, max_bytes=12_000_000)
            if not content_type.casefold().startswith("image/"):
                raise IngestionError("Media URL did not return an image")
            try:
                with Image.open(io.BytesIO(raw)) as image:
                    image.verify()
                with Image.open(io.BytesIO(raw)) as image:
                    width, height = image.size
                    if image.format not in ("JPEG", "PNG", "WEBP") or min(width, height) < 720 or max(width, height) < 1280:
                        raise IngestionError("Media image is not an accepted high-resolution raster asset")
            except (UnidentifiedImageError, OSError, Image.DecompressionBombError):
                raise IngestionError("Media image failed decoding validation") from None
            fetched[item["url"]] = (final, width, height, hashlib.sha256(raw).hexdigest())
        final, width, height, digest = fetched[item["url"]]
        evidence = {k: item[k] for k in required + ("license",)}
        evidence.update(url=final, width=width, height=height, sha256=digest)
        if item["match_kind"] == "exact_project":
            p = by_id.get(item.get("rera_id"))
            if not p or item.get("project_match_reviewed") is not True:
                raise IngestionError("Exact-project media requires a matching RERA ID and explicit match review")
            if len(p.gallery_images) >= 12:
                raise IngestionError("Project gallery exceeds 12 reviewed assets")
            if final not in p.gallery_images:
                p.gallery_images.append(final)
                p.registry_media_evidence.append(evidence)
                p.hero_image = p.hero_image or final
                totals["exact_media_assets"] += 1
        else:
            category = item.get("property_type")
            configurations = item.get("unit_types", [])
            if category not in ("Residential", "Commercial", "Mixed") or not isinstance(configurations, list):
                raise IngestionError("Illustrative media requires a supported project category")
            evidence["disclosure"] = "Illustrative category image; not a photograph of this project or unit"
            for p in projects:
                if p.property_type == category and (not configurations or set(configurations).intersection(p.unit_types)):
                    p.illustrative_media.append(evidence)
                    totals["illustrative_media_assets"] += 1
    return totals
