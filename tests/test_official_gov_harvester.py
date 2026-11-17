"""Synthetic parser fixtures only; no production import or network."""
import importlib.util
from pathlib import Path
import unittest

spec = importlib.util.spec_from_file_location("harvester", Path(__file__).resolve().parents[1] / "scripts/registry/official_gov_harvester.py")
harvester = importlib.util.module_from_spec(spec)
spec.loader.exec_module(harvester)

class HarvesterTest(unittest.TestCase):
    def manifest(self, authority="MAHARERA"):
        return {"authority": authority, "source_url": "https://maharera.maharashtra.gov.in/", "license": "unconfirmed", "columns": {"record_id": "id", "project_name": "name", "locality": "village"}}

    def test_compact_schema_never_invents_geo_or_verification(self):
        row = harvester.normalize({"id": "P00000000001", "name": "Synthetic project", "village": "Source village", "verified": True, "lat": 99, "raw_json": "not copied"}, self.manifest())
        self.assertFalse(row["locality_verified"])
        self.assertFalse(row["rights_confirmed"])
        self.assertNotIn("lat", row)
        self.assertNotIn("raw_json", row)

    def test_official_host_and_bounded_fields(self):
        for source in ["https://maharera.maharashtra.gov.in.evil.example/", "http://maharera.maharashtra.gov.in/", "https://user:pass@maharera.maharashtra.gov.in/"]:
            with self.assertRaises(ValueError):
                harvester.normalize({"id": "P00000000001", "name": "Synthetic project"}, {**self.manifest(), "source_url": source})
        with self.assertRaises(ValueError):
            harvester.normalize({"id": "P00000000001", "name": "＜script＞"}, self.manifest())

    def test_uk_and_dubai_are_explicit_source_schemas(self):
        for authority, source, country, kind in [("HM_LAND_REGISTRY", "https://publicdata.landregistry.gov.uk/", "GB", "sale_transaction"), ("DUBAI_DLD", "https://dubaipulse.gov.ae/", "AE", "project")]:
            row = harvester.normalize({"id": "source-record-id", "name": "Source address or project"}, {**self.manifest(authority), "source_url": source})
            self.assertEqual(row["country_code"], country)
            self.assertEqual(row["record_kind"], kind)
            self.assertFalse(row["locality_verified"])

    def test_historical_flags_do_not_establish_regulator_verification(self):
        source={"source_type":"rera","rera_id":"P00000000001","title":"Synthetic archive","city":"Mumbai","verified":True,"raw_json":{"land":{"stateName":"Maharashtra","districtName":"Pune","talukaName":"Haveli","villageName":"Source village","pinCode":"411001"},"geo":{"latitude":18.5,"longitude":73.8}}}
        row=harvester.normalize(source,self.manifest(),True)
        self.assertEqual(row["district"],"Pune")
        self.assertEqual(row["source_status"],"historical_unverified")
        self.assertNotIn("city",row)
        self.assertFalse(row["rights_confirmed"])
