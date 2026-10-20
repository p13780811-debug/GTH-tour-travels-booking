"""Offline, zero-billing Commons discovery tests. All source responses synthetic fixtures."""
import importlib.util
import json
import unittest
from pathlib import Path

ROOT=Path(__file__).resolve().parents[1]
P=ROOT/"scripts/hotels/phase1_commons_candidate_review.py"
spec=importlib.util.spec_from_file_location("phase1_commons",P)
m=importlib.util.module_from_spec(spec)
spec.loader.exec_module(m)

class WikimediaPhotoReviewTests(unittest.TestCase):
    def setUp(self):
        self.snapshot=json.loads((ROOT/"docs/hotels/phase1-existing-osm-catalog-snapshot.json").read_text())
        self.puri=next(r for r in self.snapshot["records"] if r["name"]=="Mayfair Heritage")
    def test_unique_source_scope(self):
        a=self.snapshot["records"]
        self.assertEqual(len(a),166)
        self.assertEqual(len(set(x["id"] for x in a)),166)
        self.assertEqual({x["city"] for x in a},{"Mumbai","Puri","Digha"})
    def test_hotel_name_identity_filter(self):
        self.assertTrue(m.strong_name_match("Mayfair Heritage","File:Mayfair Heritage Puri entrance.jpg"))
        self.assertFalse(m.strong_name_match("Mayfair Heritage","File:Heritage Hotel Puri.jpg"))
        self.assertFalse(m.strong_name_match("Sea View","File:Beach View Puri.jpg"))
        self.assertFalse(m.strong_name_match("Sharada","File:Dr. Sharada Kabir in Bombay.jpg","Mumbai"))
        self.assertFalse(m.strong_name_match("seaview","File:SeaView.JPG","Mumbai"))
        self.assertTrue(m.strong_name_match("Sea Green Hotel","File:Hotel Sea Green Marine Drive Mumbai.jpg","Mumbai"))
    def test_nonderivative_osm_coords(self):
        self.assertLess(m.geo_distance_m((19.8,85.8),(19.8001,85.8001)),20)
        self.assertGreater(m.geo_distance_m((19.8,85.8),(19.9,85.9)),1000)
    def test_valid_licensed_property_candidate_is_pending_review(self):
        class Fake:
            def request(self,params):
                return {"query":{"pages":[{"imageinfo":[{
                    "mime":"image/jpeg","thumburl":"https://upload.wikimedia.org/wikipedia/commons/thumb/a/test.jpg",
                    "extmetadata":{"LicenseShortName":{"value":"CC BY-SA 4.0"},
                       "Artist":{"value":"Licensed photographer"},
                       "LicenseUrl":{"value":"https://creativecommons.org/licenses/by-sa/4.0/"}}}]}]}}
        out=m.file_evidence("File:Mayfair Heritage Puri entrance.jpg",self.puri,Fake(),check_image=False)
        self.assertIsNotNone(out)
        self.assertIn("PENDING",out["review_status"])
        self.assertEqual(out["license"],"CC BY-SA 4.0")
    def test_reject_unlicensed_or_other_hotel_photos(self):
        class Fake:
            def request(self,params):
                return {"query":{"pages":[{"imageinfo":[{
                    "mime":"image/jpeg","thumburl":"https://upload.wikimedia.org/x.jpg",
                    "extmetadata":{"LicenseShortName":{"value":"All Rights Reserved"},
                       "Artist":{"value":"User"}}}]}]}}
        self.assertIsNone(m.file_evidence("File:Mayfair Heritage Puri entrance.jpg",self.puri,Fake(),check_image=False))
        self.assertIsNone(m.file_evidence("File:Unrelated Resort Puri.jpg",self.puri,Fake(),check_image=False))
    def test_fail_closed_without_licensed_photos(self):
        class Fake:
            def request(self,params):
                return {"query":{"search":[]}}
        result=m.review_all(self.snapshot,Fake(),limit=2,check_images=False,sleeper=lambda _:None)
        self.assertEqual(result["approved_hotels"],0)
        self.assertEqual(result["candidate_hotels"],0)
        self.assertEqual(len(result["records"]),2)
        self.assertEqual(result["errors"],[])
        self.assertTrue(all(not r["approved_photos"] for r in result["records"]))

if __name__=="__main__":unittest.main()
