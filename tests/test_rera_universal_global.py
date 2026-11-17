"""Universal global registry adapter is offline, compact and fail-closed."""
import unittest
from scripts.registry_fabric.universal import UniversalGlobalRegistryAdapter as Global, INDIA_REGIONS

def entry(**changes):
    result = dict(country_code="IN", region_state="Maharashtra", city="Mumbai",
                  registry_authority="MAHARERA", registration_id="P51800012345",
                  project_name="Example Project", lat=19.076, lng=72.8777)
    result.update(changes)
    return result

class UniversalRegistryTests(unittest.TestCase):
    def test_india_and_worldwide(self):
        self.assertEqual(len(INDIA_REGIONS),36)
        self.assertEqual(Global.normalize(entry()).region_state,"MH")
        for country,region,authority,ref in [
            ("AE","Dubai","DLD/RERA","2026-12345"),
            ("US","California","COUNTY_ASSESSOR","123-A-59"),
            ("GB","England","HM_LAND_REGISTRY","AB-12345"),
            ("SG","Central","GLOBAL_UNLISTED","PERMIT.5678"),
            ("AU","Victoria","GLOBAL_UNLISTED","VIC/12345")]:
            value=Global.normalize(entry(country_code=country, region_state=region,
                registry_authority=authority,registration_id=ref))
            self.assertEqual(value.verification_status,"pending_global_review")
    def test_rejects_unsafe_and_mismatched_records(self):
        from scripts.registry_fabric.core import RegistryValidationError
        for bad in [
            {"country_code":"ZZ"}, {"region_state":"Fake State"},
            {"registry_authority":"DLD/RERA"}, {"registration_id":"P518_BAD"},
            {"project_name":"<script>"}, {"city":"<b>"}, {"lat":91},
            {"lng":None}, {"raw_html":"<html>"},
        ]:
            with self.subTest(bad=bad), self.assertRaises(RegistryValidationError):
                Global.normalize(entry(**bad))
    def test_composite_identity_and_duplicate_guard(self):
        a=entry()
        b=entry(project_name="Changed project")
        items,report=Global.validate_rows([a,a,b],limit=3)
        self.assertEqual((len(items),report["duplicates"],report["rejected"]),(1,1,1))
        self.assertEqual(items[0].identity,"IN:MAHARERA:P51800012345")
        self.assertNotIn("raw_html",items[0].public_dict())

if __name__=="__main__":
    unittest.main()
