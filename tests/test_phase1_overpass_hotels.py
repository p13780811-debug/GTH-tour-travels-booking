"""Contract tests for read-only Phase 1 targeted OSM hotel extractor."""
import importlib.util
import pathlib
import unittest

P = pathlib.Path(__file__).resolve().parents[1] / "scripts/hotels/phase1_overpass_hotels.py"
spec = importlib.util.spec_from_file_location("phase1", P)
mod = importlib.util.module_from_spec(spec)
spec.loader.exec_module(mod)

class TestPhase1(unittest.TestCase):
    def test_only_allowed_destinations(self):
        self.assertEqual({x[0] for x in mod.ZONES.values()}, {"Digha","Puri","Mumbai"})
        self.assertEqual(len(mod.ZONES),18)
        for _,_,(s,w,n,e) in mod.ZONES.values():
            self.assertLess(s,n)
            self.assertLess(w,e)
    def test_missing_metadata_is_not_faked(self):
        e={"type":"node","id":123,"lat":21.62,"lon":87.52,
           "tags":{"tourism":"hotel","name":"Source-provided exact name"}}
        row=mod.normalize(e,"Digha","New Digha Sea Beach",False)
        self.assertEqual(row["id"],"osm-node-123")
        self.assertIsNone(row["stars"])
        self.assertIsNone(row["address"])
        self.assertIsNone(row["affiliate_url"])
        self.assertIsNone(row["thumbnail"])
        self.assertEqual(row["gallery"],[])
        self.assertEqual(row["facilities"],[])
    def test_valid_star_is_only_direct_source_tag(self):
        e={"type":"way","id":9,"center":{"lat":19.8,"lon":85.82},
           "tags":{"tourism":"hotel","name":"Mapped test feature",
                   "stars":"4","internet_access:wlan":"yes","parking":"yes"}}
        row=mod.normalize(e,"Puri","Golden Beach",False)
        self.assertEqual(row["stars"],4)
        self.assertEqual(set(row["facilities"]),{"Free Wi-Fi","Parking"})
        e["tags"]["stars"]="6"
        self.assertIsNone(mod.normalize(e,"Puri","Golden Beach",False)["stars"])
    def test_invalid_data_rejected(self):
        self.assertIsNone(mod.normalize({"type":"node","id":1,"lat":19,"lon":72,
                                          "tags":{"tourism":"hotel"}},"Mumbai","Fort"))
        self.assertIsNone(mod.normalize({"type":"node","id":1,"lat":19,"lon":72,
                                          "tags":{"tourism":"apartment","name":"X"}},"Mumbai","Fort"))
    def test_bounds_are_strict(self):
        self.assertFalse(mod.within_bounds({"lat":19.1,"lon":72.9},mod.ZONES["mumbai_colaba"][2]))
    def test_no_unapproved_image_link(self):
        self.assertIsNone(mod.safe_url("http://example.com/a.jpg"))
        self.assertIsNone(mod.safe_url("https://user:pass@example.com/a.jpg"))
        self.assertIsNone(mod.normalize({"type":"node","id":2,"lat":19,"lon":72,
          "tags":{"tourism":"hotel","name":"X","image":"https://example.com/x.jpg"}},
          "Mumbai","Fort",False)["thumbnail"])

if __name__=="__main__":unittest.main()
