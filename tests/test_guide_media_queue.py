import importlib.util,io,json,pathlib,unittest
from unittest.mock import patch
ROOT=pathlib.Path(__file__).resolve().parents[1]
SPEC=importlib.util.spec_from_file_location("guide_media_queue",ROOT/"scripts/attractions/guide_media_candidates.py")
mod=importlib.util.module_from_spec(SPEC);SPEC.loader.exec_module(mod)
def page(license="CC BY-SA 4.0",host="upload.wikimedia.org"):
 return {"title":"File:Paris example.jpg","imageinfo":[{
  "url":f"https://{host}/wikipedia/commons/1/11/Paris_example.jpg",
  "descriptionurl":"https://commons.wikimedia.org/wiki/File:Paris_example.jpg",
  "width":1600,"height":900,
  "extmetadata":{"LicenseShortName":{"value":license},
   "LicenseUrl":{"value":"https://creativecommons.org/licenses/by-sa/4.0/"},
   "Artist":{"value":"<b>Named photographer</b>"}}}]}
class GuideMediaCandidatesTests(unittest.TestCase):
 def test_real_commons_metadata_is_only_review_candidate(self):
  v=mod.candidate("paris",page())
  self.assertIsNotNone(v)
  self.assertEqual(v["license_type"],"CC BY-SA 4.0")
  self.assertEqual(v["attribution_text"],"Named photographer")
  self.assertFalse(v["editorial_approved"])
  self.assertFalse(v["is_hero"])
 def test_disallowed_licenses_and_hosts_rejected(self):
  self.assertIsNone(mod.candidate("paris",page("All Rights Reserved")))
  self.assertIsNone(mod.candidate("paris",page(host="evil.example")))
 def test_missing_author_or_small_image_rejected(self):
  p=page();p["imageinfo"][0]["extmetadata"].pop("Artist")
  self.assertIsNone(mod.candidate("paris",p))
  p=page();p["imageinfo"][0]["width"]=80
  self.assertIsNone(mod.candidate("paris",p))
 def test_source_search_never_auto_publishes(self):
  doc={"query":{"pages":[page()]}}
  response=io.BytesIO(json.dumps(doc).encode())
  with patch.object(mod,"urlopen",return_value=response):
   rows=mod.query_commons("paris","Paris")
  self.assertTrue(rows)
  self.assertFalse(rows[0]["editorial_approved"])
if __name__=="__main__":unittest.main()
