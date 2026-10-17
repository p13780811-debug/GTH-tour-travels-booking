import importlib.util
import pathlib
import unittest

ROOT = pathlib.Path(__file__).resolve().parents[1]
SPEC = importlib.util.spec_from_file_location("geofabrik_registry", ROOT/"scripts/attractions/geofabrik_registry.py")
module = importlib.util.module_from_spec(SPEC)
SPEC.loader.exec_module(module)

def entry(id, parent, country=None, name=None, url=None):
    props={"id":id,"name":name or id,"urls":{"pbf":url or "https://download.geofabrik.de/"+(parent+"/" if parent else "")+id+"-latest.osm.pbf"}}
    if parent:props["parent"]=parent
    if country is not None:props["iso3166-1:alpha2"]=country
    return {"type":"Feature","properties":props}

class GeofabrikRegistryTests(unittest.TestCase):
    def setUp(self):
        self.index={"features":[
          entry("europe",None,name="Europe"),
          entry("france","europe",["FR"],"France"),
          entry("paris","france",name="Paris",url="https://download.geofabrik.de/europe/france/paris-latest.osm.pbf"),
          entry("germany","europe",["DE"],"Germany"),
          entry("germany-bavaria","germany",name="Bavaria",url="https://download.geofabrik.de/europe/germany/germany-bavaria-latest.osm.pbf"),
          entry("bad", "europe",["DE","FR"],"Bad source"),
          entry("fake", "europe",["FI"],"Faked",url="https://evil.example/fake-latest.osm.pbf")
        ]}
    def test_only_reviewed_leaf_single_country_sources(self):
        found=module.eligible_regions(self.index)
        self.assertEqual(len(found),2)
        self.assertEqual({v["country_code"] for v in found},{"FR","DE"})
        self.assertTrue(all(v["url"].startswith(module.BASE) for v in found))
        self.assertTrue(all(v["region"].count("/")>=2 for v in found))
    def test_inherits_iso_country_from_ancestor(self):
        result=module.eligible_regions(self.index)
        paris=next(p for p in result if p["country_code"]=="FR")
        self.assertEqual(paris["country_name"],"France")
    def test_validates_selected_region(self):
        self.assertEqual(module.resolve(self.index,requested="europe/france/paris")["country_code"],"FR")
        with self.assertRaises(ValueError):
            module.resolve(self.index,requested="https://evil.example/")
    def test_no_fabricated_zero_coverage(self):
        with self.assertRaises(ValueError):
            module.resolve({"features":[]})
if __name__=="__main__":
    unittest.main()
