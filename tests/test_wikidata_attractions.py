import importlib.util,json,pathlib,unittest
from unittest.mock import patch
ROOT=pathlib.Path(__file__).resolve().parents[1]
SPEC=importlib.util.spec_from_file_location("attractions",ROOT/"scripts/attractions/wikidata_attractions.py")
m=importlib.util.module_from_spec(SPEC);SPEC.loader.exec_module(m)
class AttractionsSecurity(unittest.TestCase):
 def test_query_limits(self):
  self.assertIn("wd:Q1171",m.query("goa","Q40080",20,0))
  with self.assertRaises(ValueError):m.query("goa","Q40080",9999,0)
  with self.assertRaises(ValueError):m.query("unknown","Q40080",20,0)
 def test_source_geometry_and_only_cc0(self):
  raw={"results":{"bindings":[{"place":{"value":"http://www.wikidata.org/entity/Q23456"},"name":{"value":"Example Fort"},
    "geo":{"value":"Point(73.815 14.95)"}}]}}
  rows=m.parse_bindings(raw,"goa","Q1785071")
  self.assertEqual(len(rows),1)
  self.assertEqual(rows[0]["category"],"fort")
  self.assertEqual(rows[0]["source_license"],"CC0-1.0")
  self.assertNotIn("price",rows[0])
  self.assertEqual(m.parse_bindings(raw,"maharashtra","Q1785071"),[])
 def test_reject_unlicensed_photo(self):
  raw={"query":{"pages":[{"title":"File:Photo.jpg","imageinfo":[{"thumburl":"https://upload.wikimedia.org/wikipedia/commons/thumb/a/a1/photo.jpg/960px-photo.jpg",
   "extmetadata":{"LicenseShortName":{"value":"All rights reserved"},"LicenseUrl":{"value":"https://bad.invalid/"},"Artist":{"value":"Photographer"}}}]}]}}
  self.assertIsNone(m.validate_media(raw,"Photo.jpg"))
 def test_exact_endpoint_only(self):
  with self.assertRaises(ValueError):m.fetch_json("https://evil.example.com",{})
  with self.assertRaises(ValueError):m.query("goa","Q40080",20,-1)
 def test_no_synthetic_publication(self):
  with patch.object(m,"fetch_json",side_effect=AssertionError("Should not call live source")):
   self.assertEqual(m.main(["--region","goa","--fixture",str(ROOT/"tests/fixtures/open_attractions_sample.json")]),0)
if __name__=="__main__":unittest.main()
