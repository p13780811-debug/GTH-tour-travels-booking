import importlib.util
import pathlib
import unittest
from datetime import datetime,timezone

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
    def test_utc_windows_select_right_world_groups(self):
        regions=[
          {"region":"europe/france/ile-de-france","country_code":"FR"},
          {"region":"africa/kenya","country_code":"KE"},
          {"region":"north-america/us/new-york","country_code":"US"},
          {"region":"australia-oceania/australia/victoria","country_code":"AU"},
          {"region":"asia/india/western-zone","country_code":"IN"},
        ]
        for hour,expected in ((2,{"FR","KE"}),(8,{"US"}),(14,{"AU"}),(20,{"IN"})):
            chosen,group=module.select_scheduled_region(regions,datetime(2026,10,17,hour,tzinfo=timezone.utc))
            self.assertIn(chosen["country_code"],expected)
            self.assertEqual(group,hour//6)
    def test_global_selection_rotates_across_available_regions(self):
        regions=[{"region":"europe/france","country_code":"FR"},{"region":"europe/germany","country_code":"DE"}]
        a,_=module.select_scheduled_region(regions,datetime(2026,10,17,0,tzinfo=timezone.utc))
        b,_=module.select_scheduled_region(regions,datetime(2026,10,17,1,tzinfo=timezone.utc))
        self.assertNotEqual(a,b)
    def test_no_fabricated_zero_coverage(self):
        with self.assertRaises(ValueError):
            module.resolve({"features":[]})
if __name__=="__main__":
    unittest.main()
