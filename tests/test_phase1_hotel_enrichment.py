"""Offline contract tests: never require Nominatim, Overpass or Commons access."""
import importlib.util
import json
import tempfile
import unittest
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
SCRIPT = ROOT / "scripts/hotels/phase1_enrich_166.py"
spec = importlib.util.spec_from_file_location("phase1_enrich", SCRIPT)
m = importlib.util.module_from_spec(spec)
spec.loader.exec_module(m)

class OfflineTests(unittest.TestCase):
    def setUp(self):
        self.temp = tempfile.TemporaryDirectory()
        self.cache = m.JsonCache(Path(self.temp.name) / "cache.json")
    def tearDown(self):
        self.temp.cleanup()

    def test_zero_fabrication_no_network_for_full_166(self):
        source = json.loads((ROOT / "docs/hotels/phase1-existing-osm-catalog-snapshot.json").read_text())
        def network(*args, **kwargs):
            raise AssertionError("Unexpected network")
        nom = m.PublicNominatim(self.cache, enabled=False, fetch=network)
        result = m.enrich(source, self.cache, nom, commons=False)
        self.assertEqual(result["hotel_count"], 166)
        self.assertTrue(result["readiness"]["structurally_valid"])
        self.assertFalse(result["readiness"]["fully_enriched"])
        original = {x["id"]: x for x in source["records"]}
        for row in result["records"]:
            old = original[row["id"]]
            self.assertEqual((row["name"],row["lat"],row["lon"]), (old["name"],old["lat"],old["lon"]))
            self.assertTrue(row["address"])
            self.assertIsNone(row["stars"])
            self.assertEqual(row["facilities"], [])
            self.assertEqual(row["gallery"], [])
            self.assertIsNone(row["affiliate_url"])
        self.assertEqual(result["readiness"]["counts"]["missing_property_photos"], 166)
        self.assertEqual(result["readiness"]["counts"]["missing_exact_affiliates"], 166)

    def test_positive_tags_only_and_wifi_not_necessarily_free(self):
        self.assertEqual(m.amenities({"internet_access":"wlan"}), ["Wi-Fi"])
        labels = m.amenities({"internet_access":"wlan", "internet_access:fee":"no",
                            "air_conditioning":"yes", "room_service":"yes",
                            "room_service:24_7":"yes", "smart_tv":"no", "wheelchair":"yes"})
        self.assertIn("Free Wi-Fi", labels)
        self.assertIn("24/7 Room Service", labels)
        self.assertIn("Wheelchair accessible", labels)
        self.assertNotIn("Smart TV", labels)
        self.assertEqual(m.amenities({"restaurant":"no","parking":"no","swimming_pool":"no"}), [])

    def test_nearest_feature_not_passed_off_as_hotel_address(self):
        rec = {"id":"osm-node-123","name":"Actual mapped name","locality":"Fort","city":"Mumbai","lat":18.93,"lon":72.83}
        nearby = {"osm_type":"way","osm_id":999,"address":{"road":"Someone else's road"}}
        address, source, street, vicinity = m.address_with_source(rec, {}, nearby)
        self.assertEqual(address, "Actual mapped name, Fort, Mumbai, Maharashtra")
        self.assertIn("fallback", source)
        self.assertIsNone(street)
        self.assertEqual(vicinity, "Someone else's road")

    def test_same_element_reverse_does_not_replace_identity(self):
        rec = {"id":"osm-node-123","name":"Actual mapped name","locality":"Fort","city":"Mumbai"}
        exact = {"osm_type":"node","osm_id":123,"address":{"road":"Real Street","house_number":"7"}}
        a, source, street, _ = m.address_with_source(rec, {}, exact)
        self.assertEqual(a,"7, Real Street")
        self.assertEqual(a,street)
        self.assertEqual(source,"nominatim_same_osm_element")

    def test_license_and_artist_required_for_property_media(self):
        def fake(url,host,**kwargs):
            return {"query":{"pages":{"3":{"imageinfo":[{
              "mime":"image/jpeg", "thumburl":"https://upload.wikimedia.org/wikipedia/commons/thumb/test.jpg",
              "extmetadata":{"LicenseShortName":{"value":"CC BY-SA 4.0"},
                             "Artist":{"value":"A photographer"},
                             "LicenseUrl":{"value":"https://creativecommons.org/licenses/by-sa/4.0/"}}}]}}}}
        item = m.commons_file("Hotel Exterior.jpg",self.cache,fetch=fake,verify_head=False)
        self.assertIsNotNone(item)
        self.assertEqual(item["license"],"CC BY-SA 4.0")
        self.assertEqual(item["artist"],"A photographer")
        def bad(url,host,**kwargs):
            z=fake(url,host)
            z["query"]["pages"]["3"]["imageinfo"][0]["extmetadata"]["LicenseShortName"]["value"]="All rights reserved"
            return z
        self.assertIsNone(m.commons_file("Unauthorized.jpg",self.cache,fetch=bad,verify_head=False))

    def test_no_arbitrary_https_photo_host(self):
        self.assertIsNone(m.https("https://evil.example.com/x.jpg", {"upload.wikimedia.org"}))
        self.assertIsNone(m.https("http://upload.wikimedia.org/x.jpg", {"upload.wikimedia.org"}))

if __name__ == "__main__":
    unittest.main()
