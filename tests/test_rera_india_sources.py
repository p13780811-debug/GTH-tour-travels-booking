"""The countrywide regulator catalog never invents a shared MahaRERA API."""
import unittest
from scripts.registry_fabric.core import RegistryValidationError
from scripts.registry_fabric.india_sources import HOMEPAGES, india_regulator, is_transport_approved


class RegulatorCatalogTests(unittest.TestCase):
    def test_india_statewise_authorities_are_distinct(self):
        self.assertGreaterEqual(len(HOMEPAGES),25)
        self.assertEqual(india_regulator("mh").authority,"MAHARERA")
        self.assertEqual(india_regulator("wb").authority,"WBRERA")
        self.assertEqual(india_regulator("ka").authority,"KARNATAKARERA")
        self.assertEqual(india_regulator("up").authority,"UPRERA")
        self.assertNotEqual(india_regulator("MH").homepage,india_regulator("WB").homepage)
        self.assertEqual(india_regulator("MH").publication_mode,"source_research_only")

    def test_missing_or_non_https_source_is_not_automatically_bulk_fetchable(self):
        for code in ("ZZ","XX","NI"):
            with self.assertRaises(RegistryValidationError):
                india_regulator(code)
        self.assertTrue(is_transport_approved(india_regulator("MH")))
        self.assertFalse(is_transport_approved(india_regulator("HP")))

    def test_no_inference_that_all_indian_regions_share_maharera(self):
        self.assertFalse(all(src[0]=="MAHARERA" for src in HOMEPAGES.values()))
        self.assertTrue(all(authority and link.startswith(("https://","http://"))
                            for authority,link in HOMEPAGES.values()))


if __name__=="__main__":
    unittest.main()
