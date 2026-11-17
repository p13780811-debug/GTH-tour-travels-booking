"""Historical 812 legacy RERA recovery must never rewrite or claim verification."""
from dataclasses import replace
import unittest

from scripts.registry_fabric.core import RegistryValidationError
from scripts.registry_fabric.legacy_recovery import (
    recover_legacy_rera, detect_cross_district_geo_reuse,
)


def fixture(**changes):
    row={
        "source_type":"rera","rera_id":"P52100001498","title":"Adora",
        "country":"India","state":"Maharashtra","city":"Mumbai",
        "district":"Pune","taluka":"Mulshi","village":"Wakad",
        "locality":None,"pin_code":"411057",
        "lat":18.60,"lng":73.78,"verified":True,
        "raw_json":{
            "land":{"stateName":"MAHARASHTRA","locality":"Near Main Road",
                    "pinCode":"411057"},
            "geo":{"latitude":"18.60000000000","longitude":"73.7800000000"},
        }
    }
    row.update(changes)
    return row


class LegacyRecoveryTests(unittest.TestCase):
    def test_geo_and_village_preserved_without_legacy_city(self):
        value=recover_legacy_rera(fixture())
        self.assertEqual(value.district,"Pune")
        self.assertEqual(value.taluka,"Mulshi")
        self.assertEqual(value.village,"Wakad")
        self.assertEqual(value.address_locality,"Near Main Road")
        self.assertEqual(value.postal_code,"411057")
        self.assertIsNone(value.city)
        self.assertIsNone(value.official_source_url)
        self.assertEqual(value.source_status,"historical_unverified")
        self.assertTrue(value.coordinate_review_required)
        self.assertEqual(len(value.private_review_dict().keys()),14)
        self.assertNotIn("raw_json",value.private_review_dict())
        self.assertNotIn("verified",value.private_review_dict())

    def test_non_maharashtra_or_non_rera_rejected(self):
        for changes in ({"source_type":"registry"},
                        {"state":"Karnataka"},
                        {"rera_id":"P123"},
                        {"raw_json":{"land":[],"geo":{}}}):
            with self.subTest(changes=changes):
                with self.assertRaises(RegistryValidationError):
                    recover_legacy_rera(fixture(**changes))

    def test_unsafe_coordinates_rejected(self):
        for changes in ({"lat":float("nan")},{"lng":181},
                        {"lat":None,"lng":73.78},
                        {"raw_json":{"land":{},"geo":{"latitude":20,"longitude":74}}}):
            with self.subTest(changes=changes):
                with self.assertRaises(RegistryValidationError):
                    recover_legacy_rera(fixture(**changes))

    def test_duplicate_project_coordinates_across_districts_quarantined(self):
        first=recover_legacy_rera(fixture())
        second=replace(first,registration_id="P51600014684",district="Nashik")
        third=replace(first,registration_id="P51800003057",district="Mumbai Suburban")
        flagged=detect_cross_district_geo_reuse([first,second,third])
        self.assertEqual(flagged,{first.registration_id,second.registration_id,third.registration_id})

    def test_long_or_executable_legacy_text_rejected(self):
        for changes in ({"title":"<script>alert(1)</script>"},{"village":"A"*500}):
            with self.subTest(changes=changes):
                with self.assertRaises(RegistryValidationError):
                    recover_legacy_rera(fixture(**changes))


if __name__=="__main__":
    unittest.main()
