"""Synthetic fixtures only; these tests never contact or write a live service."""
import contextlib
import io
import json
import sys
import tempfile
import unittest
from collections import Counter
from pathlib import Path
from types import SimpleNamespace
from unittest.mock import patch
from urllib.parse import urlparse

from PIL import Image
from pydantic import ValidationError

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / "scripts"))
from rera_ingestion.models import CLUSTERS, IngestionError, Project, normalize, public_payload, slug_for
from rera_ingestion.http import Http, RateLimiter, validate_url
from rera_ingestion.sources import accepted_projects, detail_fields, load_csv, table_rows, verify_detail, RegistryCollector
from rera_ingestion.enrichment import OsmEnricher, attach_reviewed_media
from rera_ingestion.sink import SupabaseSink
from ingest_mumbai_thane_rera import main


def raw(**extra):
    return {"rera_id": "P51800099991", "project_name": "Synthetic Test Project", "district": "Mumbai Suburban", "locality": "Andheri East", **extra}


class Clock:
    def __init__(self): self.time = 0
    def now(self): return self.time
    def sleep(self, seconds): self.time += seconds


class Response:
    def __init__(self, status=200, body=b"ok", headers=None):
        self.status_code, self.body, self.headers = status, body, headers or {"Content-Type": "text/html"}
    def close(self): pass
    def iter_content(self, size): yield self.body


class Session:
    def __init__(self, responses, clock): self.responses, self.clock, self.calls, self.headers = responses, clock, [], {}
    def mount(self, *args): pass
    def request(self, method, url, **kwargs): self.calls.append((self.clock.now(), url)); return self.responses.pop(0)
    def close(self): pass


class FakeQuery:
    def __init__(self, client): self.client, self.operation, self.payload, self.fields, self.values = client, "", None, "", []
    def select(self, fields):
        if not self.operation: self.operation = "select"
        self.fields = fields
        return self
    def in_(self, field, values): self.filter_field, self.values = field, values; return self
    def upsert(self, payload, **kwargs): self.operation, self.payload, self.kwargs = "upsert", payload, kwargs; return self
    def execute(self):
        if self.operation == "select":
            if self.filter_field == "slug": return SimpleNamespace(data=[])
            return SimpleNamespace(data=[dict(row) for row in self.client.rows.values() if row["rera_id"] in self.values])
        self.client.writes.append((self.payload, self.kwargs))
        if self.client.fail_after is not None and len(self.client.writes) > self.client.fail_after:
            raise RuntimeError("FAKE_SECRET_MUST_NOT_BE_LOGGED")
        for payload in self.payload:
            if "id" in payload: raise AssertionError("GENERATED ALWAYS identity was sent")
            self.client.rows.setdefault(payload["rera_id"], {"id": 100}) .update(payload)
        return SimpleNamespace(data=[{"rera_id": p["rera_id"]} for p in self.payload])


class FakeClient:
    def __init__(self, rows=(), fail_after=None): self.rows, self.writes, self.fail_after = {r["rera_id"]: r for r in rows}, [], fail_after
    def table(self, name): assert name == "properties"; return FakeQuery(self)


class IngestionTests(unittest.TestCase):
    def test_minimum_delay_applies_to_every_transport_retry(self):
        clock = Clock(); session = Session([Response(503), Response(503), Response()], clock)
        http = Http(RateLimiter(5, clock.now, clock.sleep), "GTH-test", session=session)
        with patch("rera_ingestion.http.validate_url", side_effect=lambda u, h: urlparse(u)):
            http.request("https://example.test/", hosts={"example.test"})
        self.assertEqual([c[0] for c in session.calls], [0, 5, 10])

    def test_retry_after_is_respected_without_fast_retry(self):
        clock = Clock(); session = Session([Response(429, headers={"Retry-After": "40"}), Response()], clock)
        http = Http(RateLimiter(1.5, clock.now, clock.sleep), "GTH-test", session=session)
        with patch("rera_ingestion.http.validate_url", side_effect=lambda u, h: urlparse(u)):
            http.request("https://example.test/", hosts={"example.test"})
        self.assertEqual([c[0] for c in session.calls], [0, 40])

    def test_session_redirect_and_denial_stop_without_workaround(self):
        for status in (303, 401, 403):
            clock = Clock(); session = Session([Response(status)], clock)
            http = Http(RateLimiter(5, clock.now, clock.sleep), "GTH-test", session=session)
            with patch("rera_ingestion.http.validate_url", side_effect=lambda u, h: urlparse(u)), self.assertRaises(IngestionError):
                http.request("https://example.test/", hosts={"example.test"})
            self.assertEqual(len(session.calls), 1)

    def test_private_network_and_unlisted_sources_are_rejected(self):
        with self.assertRaises(IngestionError): validate_url("https://evil.test/", {"allowed.test"}, resolve=False)
        with patch("socket.getaddrinfo", return_value=[(2, 1, 6, "", ("127.0.0.1", 443))]), self.assertRaises(IngestionError):
            validate_url("https://allowed.test/", {"allowed.test"})

    def test_row_mapper_discards_contact_financial_and_secret_fields(self):
        with tempfile.TemporaryDirectory() as folder:
            path = Path(folder) / "input.csv"
            path.write_text('Project_Name,RERA_Number,District,Locality,Promoter,Email,PAN,Bank Account\nSynthetic Test Project,P51800099991,Mumbai Suburban,Andheri East,Test Entity,private@example.test,SECRET123,55555\n')
            counters = Counter(); projects = accepted_projects(load_csv(path, counters), CLUSTERS, 100, counters)
            payload = json.dumps(public_payload(projects[0]))
            self.assertEqual(counters["sensitive_cells_discarded"], 3)
            for secret in ("private@example.test", "SECRET123", "55555"): self.assertNotIn(secret, payload)

    def test_district_prefix_and_unsupported_dates_fail_validation(self):
        with self.assertRaises(ValidationError): normalize(raw(district="Thane"))
        with self.assertRaises(IngestionError): normalize(raw(possession_date="spring soon"))
        with self.assertRaises(ValidationError): normalize(raw(latitude="19.1"))

    def test_missing_data_never_becomes_bhk_area_or_verified(self):
        p = normalize(raw())
        payload = public_payload(p)
        self.assertFalse(payload["verified_status"]); self.assertFalse(payload["verified"])
        self.assertIsNone(payload["min_carpet_sqft"]); self.assertEqual(payload["unit_types"], [])
        self.assertNotIn("price", payload); self.assertNotIn("bedrooms", payload)

    def test_carpet_area_converts_only_explicit_sqm_and_dates_are_day_first(self):
        p = normalize(raw(min_carpet_sqm="50", max_carpet_sqm="60", possession_date="30/12/2027", unit_types='["2 BHK", "1 BHK"]'))
        self.assertEqual(str(p.min_carpet_sqft), "538.20"); self.assertEqual(p.possession_date.isoformat(), "2027-12-30")
        self.assertEqual(p.unit_types, ["1 BHK", "2 BHK"])
        with self.assertRaises(ValidationError): normalize(raw(min_carpet_sqft="700", max_carpet_sqft="500"))

    def test_locality_is_not_inferred_from_project_name_or_district(self):
        p = normalize(raw(project_name="Palava Super Homes", locality="", address="Mumbai"))
        self.assertIsNone(p.cluster)
        counters = Counter(); self.assertEqual(accepted_projects([raw(locality="")], CLUSTERS, 100, counters), [])
        self.assertEqual(counters["unresolved_locality"], 1)

    def test_palava_mapping_does_not_claim_exact_coordinates(self):
        p = normalize(raw(rera_id="P51700099991", district="Thane", locality="Dombivli East", address="Palava, Dombivli East"))
        self.assertEqual(p.cluster, "Palava"); self.assertIsNone(p.latitude)

    def test_conflicting_duplicate_registration_is_quarantined(self):
        counters = Counter(); projects = accepted_projects([raw(), raw(project_name="Different Test Identity")], CLUSTERS, 100, counters)
        self.assertEqual(projects, []); self.assertEqual(counters["conflicting_duplicates"], 1)

    def test_scope_order_and_run_limit_are_deterministic(self):
        rows = [raw(rera_id="P51700099991", district="Thane", locality="Thane West"), raw()]
        counters = Counter(); projects = accepted_projects(rows, CLUSTERS, 1, counters)
        self.assertEqual(projects[0].cluster, "Andheri"); self.assertEqual(counters["beyond_run_limit"], 1)
        self.assertNotEqual(slug_for("Same Name", "P51800099991"), slug_for("Same Name", "P51800099992"))

    def test_html_parser_uses_identified_table_not_navigation(self):
        html = b'<table><tr><th>Menu</th></tr><tr><td>Feedback</td></tr></table><table><tr><th>Project Name</th><th>RERA Number</th><th>District</th><th>Locality</th></tr><tr><td>Synthetic Test Project</td><td>P51800099991</td><td>Mumbai Suburban</td><td>Andheri East</td></tr></table>'
        rows = table_rows(html, "https://www.maharera.maharashtra.gov.in/projects-search-result")
        self.assertEqual(len(rows), 1); self.assertEqual(normalize(rows[0]).cluster, "Andheri")

    def test_only_public_get_form_without_transient_state_is_accepted(self):
        html = b'<form method="get" action="/projects-search-result"><select name="project_district"><option value="42">Mumbai Suburban</option></select><input name="project_location"></form>'
        url = RegistryCollector.discover_form(html, "https://www.maharera.maharashtra.gov.in/", "Mumbai Suburban", "Andheri")
        self.assertIn("project_district=42", url); self.assertIn("project_location=Andheri", url)
        with self.assertRaises(IngestionError): RegistryCollector.discover_form(html.replace(b'method="get"', b'method="post"'), "https://www.maharera.maharashtra.gov.in/", "Mumbai Suburban", "Andheri")

    def test_verification_requires_exact_official_detail_match(self):
        p = normalize(raw(source_url="https://www.maharera.maharashtra.gov.in/project/test-fixture"))
        detail = b'<dl><dt>Project Name</dt><dd>Synthetic Test Project</dd><dt>RERA Number</dt><dd>P51800099991</dd><dt>District</dt><dd>Mumbai Suburban</dd><dt>Locality</dt><dd>Andheri East</dd></dl>'
        http = SimpleNamespace(official=lambda *args: (detail, p.source_url))
        matched = verify_detail(p, http); self.assertTrue(matched.verified_status); self.assertFalse(public_payload(matched)["verified"])
        http.official = lambda *args: (detail.replace(b"P51800099991", b"P51800099992"), p.source_url)
        with self.assertRaises(IngestionError): verify_detail(p, http)

    def test_osm_rejects_ambiguous_name_only_and_wrong_registration(self):
        p = normalize(raw())
        node = {"type": "node", "id": 1, "lat": 19.12, "lon": 72.86, "tags": {"name": p.project_name}}
        self.assertIsNone(OsmEnricher.match(p, [node]))
        node["tags"]["addr:suburb"] = "Andheri East"; node["tags"]["addr:city"] = "Mumbai"
        self.assertIsNotNone(OsmEnricher.match(p, [node])); self.assertIsNone(OsmEnricher.match(p, [node, {**node, "id": 2}]))
        node["tags"]["ref:rera"] = "P51800099992"; self.assertIsNone(OsmEnricher.match(p, [node]))

    def test_osm_geometry_is_only_a_closed_building_footprint(self):
        p = normalize(raw())
        way = {"type": "way", "id": 123, "center": {"lat": 19.12, "lon": 72.86}, "tags": {"ref:rera": p.rera_id, "building": "apartments"}, "geometry": [{"lat":19.12,"lon":72.86},{"lat":19.13,"lon":72.86},{"lat":19.13,"lon":72.87},{"lat":19.12,"lon":72.86}]}
        match = OsmEnricher.match(p, [way]); self.assertEqual(match["geometry"]["type"], "Polygon")
        self.assertIn("not_survey", match["evidence"]["accuracy"])
        way["geometry"] = way["geometry"][:-1]; self.assertIsNone(OsmEnricher.match(p, [way])["geometry"])

    def test_category_media_never_becomes_project_hero_and_exact_media_needs_review(self):
        p = normalize(raw(property_type="Residential")); image = io.BytesIO(); Image.new("RGB", (1280,720)).save(image, format="JPEG")
        http = SimpleNamespace(request=lambda url, **kwargs: (image.getvalue(), "image/jpeg", url))
        item = {"url":"https://cdn.example.test/image.jpg","source_url":"https://source.example.test/license","license":"CC0-1.0","permission_reference":"fixture-review","attribution":"Synthetic test image","reviewed_at":"2026-10-01T00:00:00Z","match_kind":"illustrative_category","property_type":"Residential"}
        with tempfile.TemporaryDirectory() as folder:
            path = Path(folder)/"media.json"; path.write_text(json.dumps([item])); attach_reviewed_media([p], path, http, {"cdn.example.test"})
            self.assertIsNone(p.hero_image); self.assertEqual(len(p.illustrative_media),1)
            item.update(match_kind="exact_project",rera_id=p.rera_id); path.write_text(json.dumps([item]))
            with self.assertRaises(IngestionError): attach_reviewed_media([p], path, http, {"cdn.example.test"})
            item["project_match_reviewed"]=True; path.write_text(json.dumps([item])); attach_reviewed_media([p], path, http, {"cdn.example.test"})
            self.assertEqual(p.hero_image,item["url"])

    def test_batch_upsert_is_bounded_and_does_not_send_generated_identity(self):
        projects = [normalize(raw(rera_id=f"P518{n:08d}")) for n in range(1,102)]
        clock=Clock(); client=FakeClient(); stats=SupabaseSink(client,RateLimiter(1.5,clock.now,clock.sleep)).upsert(projects)
        self.assertEqual(stats["inserted"],101); self.assertEqual([len(p) for p,_ in client.writes],[50,50,1])
        for payload, options in client.writes:
            self.assertEqual(options["on_conflict"],"rera_id"); self.assertFalse(options["default_to_null"])
            self.assertTrue(all("id" not in row for row in payload))

    def test_existing_slug_hero_and_reviewed_records_are_preserved(self):
        p = normalize(raw()); prior={"id":123,"rera_id":p.rera_id,"slug":"original-public-url","title":"Reviewed display","source_type":"registry","verified":False,"hero_image":"https://approved.example.test/image.jpg","registry_evidence":{"prior":True}}
        client=FakeClient([prior]); clock=Clock(); SupabaseSink(client,RateLimiter(1.5,clock.now,clock.sleep)).upsert([p])
        row=client.rows[p.rera_id]; self.assertEqual(row["slug"],"original-public-url"); self.assertEqual(row["title"],"Reviewed display"); self.assertEqual(row["hero_image"],prior["hero_image"])
        protected=FakeClient([{**prior,"verified":True}]); stats=SupabaseSink(protected,RateLimiter(1.5,clock.now,clock.sleep)).upsert([p])
        self.assertEqual(stats["protected_existing"],1); self.assertEqual(protected.writes,[])

    def test_uncertain_write_keeps_acknowledged_progress_without_logging_provider_error(self):
        projects=[normalize(raw(rera_id=f"P518{n:08d}")) for n in range(1,52)]
        client=FakeClient(fail_after=1); clock=Clock(); sink=SupabaseSink(client,RateLimiter(1.5,clock.now,clock.sleep))
        with self.assertRaises(IngestionError) as error: sink.upsert(projects)
        self.assertEqual(sink.totals["inserted"],50); self.assertTrue(sink.unacknowledged_write_possible); self.assertNotIn("FAKE_SECRET",str(error.exception))

    def test_offline_cli_validates_inputs_without_network_and_does_not_trust_verified_column(self):
        with tempfile.TemporaryDirectory() as folder:
            path=Path(folder)/"export.csv"; path.write_text('project_name,rera_id,district,locality,verified_status\nSynthetic Test Project,P51800099991,Mumbai Suburban,Andheri East,true\n')
            output=io.StringIO()
            with contextlib.redirect_stdout(output), patch("requests.Session.request",side_effect=AssertionError("Network called")):
                result=main(["--csv",str(path),"--offline","--run-dir",str(Path(folder)/"run")])
            summary=json.loads(output.getvalue()); self.assertEqual(result,0); self.assertEqual(summary["accepted"],1); self.assertEqual(summary["registry_identity_matched"],0); self.assertEqual(summary["written"],0)


if __name__ == "__main__": unittest.main()
