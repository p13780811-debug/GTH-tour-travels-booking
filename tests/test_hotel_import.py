import importlib.util
import unittest
from pathlib import Path

spec = importlib.util.spec_from_file_location("hotel_import", Path(__file__).resolve().parents[1] / "scripts/import_osm_hotels.py")
module = importlib.util.module_from_spec(spec)
spec.loader.exec_module(module)

class HotelImportTests(unittest.TestCase):
    def test_named_osm_point(self):
        record = module.convert({
            "type": "Feature", "id": "node/123",
            "geometry": {"type": "Point", "coordinates": [72.8777, 19.076]},
            "properties": {"tourism": "hotel", "name": "Example Stay", "addr:city": "Mumbai"}
        })
        self.assertEqual(record["source_id"], "node/123")
        self.assertEqual(record["city"], "Mumbai")
        self.assertEqual(record["source_license"], "ODbL-1.0")

    def test_rejects_polygon_and_fake_coordinates(self):
        self.assertIsNone(module.convert({"type": "Feature", "id": "way/55",
            "geometry": {"type": "Polygon", "coordinates": []},
            "properties": {"tourism": "hotel", "name": "Example"}}))
        self.assertIsNone(module.convert({"type": "Feature", "id": "node/5",
            "geometry": {"type": "Point", "coordinates": [200, 10]},
            "properties": {"tourism": "hotel", "name": "Example"}}))

    def test_rejects_missing_identity_and_nonlodging(self):
        self.assertIsNone(module.convert({"type": "Feature", "id": "made-up",
            "geometry": {"type": "Point", "coordinates": [72, 19]},
            "properties": {"tourism": "hotel", "name": "Example"}}))
        self.assertIsNone(module.convert({"type": "Feature", "id": "node/4",
            "geometry": {"type": "Point", "coordinates": [72, 19]},
            "properties": {"tourism": "restaurant", "name": "Example"}}))


    def test_osmium_unique_type_ids_are_source_stable(self):
        for raw_id, normalized in [("n123", "node/123"), ("w987", "way/987")]:
            record = module.convert({
                "type": "Feature", "id": raw_id,
                "geometry": {"type": "Point", "coordinates": [7.42, 43.73]},
                "properties": {"tourism": "hotel", "name": "Sample Property", "city": "Monaco"},
            })
            self.assertEqual(record["source_id"], normalized)
            self.assertEqual(record["city"], "Monaco")
        self.assertIsNone(module.convert({
            "type": "Feature", "id": "1",
            "geometry": {"type": "Point", "coordinates": [7.42, 43.73]},
            "properties": {"tourism": "hotel", "name": "Unstable ID"},
        }))

    def test_country_remains_unknown_without_explicit_osm_country(self):
        record=module.convert({
            "type":"Feature","id":"node/112233",
            "geometry":{"type":"Point","coordinates":[7.42,43.73]},
            "properties":{"tourism":"hotel","name":"Border Stay","addr:city":"Beausoleil"},
        })
        self.assertIsNone(record["country_code"])
        self.assertEqual(record["city"],"Beausoleil")

    def test_only_safe_https_websites(self):
        self.assertIsNone(module.https_url("javascript:alert(1)"))
        self.assertIsNone(module.https_url("https://user:pass@example.com"))
        self.assertEqual(module.https_url("https://example.com"), "https://example.com")

if __name__ == "__main__":
    unittest.main()
