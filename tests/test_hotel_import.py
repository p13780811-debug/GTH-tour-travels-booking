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

    def test_only_safe_https_websites(self):
        self.assertIsNone(module.https_url("javascript:alert(1)"))
        self.assertIsNone(module.https_url("https://user:pass@example.com"))
        self.assertEqual(module.https_url("https://example.com"), "https://example.com")

if __name__ == "__main__":
    unittest.main()
