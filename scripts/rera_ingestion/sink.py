"""Batch upsert with stable IDs/slugs and protected owner/moderation fields."""
from __future__ import annotations

import hashlib
import os
from collections import defaultdict
from urllib.parse import urlparse

from supabase import create_client

from .models import IngestionError, Project, public_payload

REGISTRY_SOURCES = {"registry", "rera", "maharera", "MahaRERA", "maharera_registry"}
PROTECTED = {"id", "slug", "title", "developer", "builder_name", "status", "verified", "ai_score", "source_type", "ingestion_source", "location", "city", "country", "state", "lat", "lng"}
MEDIA_FIELDS = {"hero_image", "gallery_images", "registry_media_evidence", "illustrative_media"}
READ_FIELDS = "id,rera_id,slug,title,developer,builder_name,status,verified,ai_score,source_type,ingestion_source,location,city,country,state,lat,lng,project_name,developer_name,district,locality,property_type,unit_types,min_carpet_sqft,max_carpet_sqft,possession_date,latitude,longitude,hero_image,gallery_images,verified_status,registry_evidence,osm_geometry,osm_evidence,registry_media_evidence,illustrative_media,official_source_url,official_source_reference"


def configured_client(expected_project_ref: str):
    url, secret = os.getenv("SUPABASE_URL", ""), os.getenv("SUPABASE_SERVICE_ROLE_KEY", "")
    p = urlparse(url)
    if p.scheme != "https" or p.hostname != expected_project_ref + ".supabase.co" or p.username or p.password or p.path not in ("", "/") or p.query or p.fragment:
        raise IngestionError("SUPABASE_URL does not match the explicitly selected Supabase project")
    if not secret or secret.startswith("sb_publishable_"):
        raise IngestionError("SUPABASE_SERVICE_ROLE_KEY is required for commit mode")
    try:
        return create_client(url, secret)
    except Exception:
        raise IngestionError("Could not initialize the server-only Supabase client") from None


class SupabaseSink:
    def __init__(self, client, limiter, batch_size=50):
        if batch_size != 50:
            raise IngestionError("This importer uses batches of 50")
        self.client, self.limiter, self.batch_size = client, limiter, batch_size
        self.totals = {"inserted": 0, "updated": 0, "unchanged": 0, "protected_existing": 0, "batches": 0}
        self.unacknowledged_write_possible = False

    def execute(self, query):
        self.limiter.wait()
        try:
            return query.execute()
        except Exception:
            # Do not print HTTP exception bodies, auth headers, SQL errors or credentials.
            raise IngestionError("Supabase operation failed; stopped without retrying an uncertain write") from None

    def upsert(self, projects: list[Project]) -> dict:
        totals = self.totals
        for start in range(0, len(projects), self.batch_size):
            batch = projects[start:start + self.batch_size]
            existing_rows = self.execute(self.client.table("properties").select(READ_FIELDS).in_("rera_id", [p.rera_id for p in batch])).data or []
            existing = {r["rera_id"]: r for r in existing_rows}
            candidates = [public_payload(p) for p in batch]
            slugs = [p["slug"] for p in candidates if p["rera_id"] not in existing]
            occupied = {}
            if slugs:
                occupied = {r["slug"]: r["rera_id"] for r in self.execute(self.client.table("properties").select("slug,rera_id").in_("slug", slugs)).data or []}
            pending = []
            kinds = {}
            for payload in candidates:
                prior = existing.get(payload["rera_id"])
                if prior:
                    if prior.get("source_type") not in REGISTRY_SOURCES or prior.get("status") in ("verified", "published", "approved") or prior.get("verified"):
                        totals["protected_existing"] += 1
                        continue
                    # Preserve all existing URLs, display aliases, moderation and approved media.
                    # id is GENERATED ALWAYS in the existing database: do not put it in INSERT/UPSERT.
                    patch = {"rera_id": payload["rera_id"], "slug": prior["slug"]}
                    verified_detail = payload["verified_status"]
                    for field, value in payload.items():
                        if field in PROTECTED or field in ("rera_id", "id") or value in (None, [], ""):
                            continue
                        if field in MEDIA_FIELDS and prior.get(field):
                            continue
                        # A low-evidence export fills missing fields only. Official matched details may refresh registry facts.
                        if verified_detail or not prior.get(field):
                            if prior.get(field) != value:
                                patch[field] = value
                    if len(patch) == 2:
                        totals["unchanged"] += 1
                        continue
                    pending.append(patch)
                    kinds[payload["rera_id"]] = "updated"
                else:
                    if occupied.get(payload["slug"]) not in (None, payload["rera_id"]):
                        payload["slug"] += "-" + hashlib.sha256(payload["rera_id"].encode()).hexdigest()[:12]
                    payload = {k: v for k, v in payload.items() if v is not None}
                    pending.append(payload)
                    kinds[payload["rera_id"]] = "inserted"
            # PostgREST bulk rows must have the same keys. Group sparse updates to avoid NULL erasure.
            groups = defaultdict(list)
            for row in pending:
                groups[tuple(sorted(row))].append(row)
            for rows in groups.values():
                self.unacknowledged_write_possible = True
                response = self.execute(self.client.table("properties").upsert(rows,
                    on_conflict="rera_id", ignore_duplicates=False, default_to_null=False).select("rera_id"))
                returned = [r["rera_id"] for r in response.data or []]
                if set(returned) != {r["rera_id"] for r in rows}:
                    raise IngestionError("Supabase did not acknowledge every upserted registration")
                self.unacknowledged_write_possible = False
                for rera_id in returned:
                    totals[kinds[rera_id]] += 1
                totals["batches"] += 1
        return totals
