import importlib.util
import json
import tempfile
import unittest
from pathlib import Path
from unittest.mock import patch

spec=importlib.util.spec_from_file_location("enrichment",Path(__file__).resolve().parents[1] /
 "scripts/hotels/enrich_wikimedia_photos.py")
module=importlib.util.module_from_spec(spec)
spec.loader.exec_module(module)


class WikimediaHotelTests(unittest.TestCase):
 def test_source_identity_required(self):
  with tempfile.TemporaryDirectory() as temp:
   source=Path(temp)/"hotel.geojsonseq"
   rows=[
    {"type":"Feature","id":"node/501","geometry":{"type":"Point","coordinates":[72.88,19.08]},
     "properties":{"tourism":"hotel","name":"Real Place","wikidata":"Q12345"}},
    {"type":"Feature","id":"node/502","geometry":{"type":"Point","coordinates":[72.88,19.08]},
     "properties":{"tourism":"hotel","name":"Missing Wikidata"}},
    {"type":"Feature","id":"node/503","geometry":{"type":"Point","coordinates":[72.88,19.08]},
     "properties":{"tourism":"hotel","name":"Invalid QID","wikidata":"https://fake.example.com"}},
    {"type":"Feature","id":"node/504","geometry":{"type":"Point","coordinates":[72.88,19.08]},
     "properties":{"tourism":"restaurant","name":"Not a Hotel","wikidata":"Q10233"}}
   ]
   source.write_text("\n".join(json.dumps(x) for x in rows))
   found=module.candidates(source)
   self.assertEqual(len(found),1)
   self.assertEqual(found[0][0],"node/501")
   self.assertEqual(found[0][1][0],"Q12345")

 def test_names_and_coordinates_must_agree(self):
  item={"entities":{"Q123":{"labels":{"en":{"value":"The Taj Hotel"}},"claims":{
    "P625":[{"mainsnak":{"datavalue":{"value":{"latitude":19.08,"longitude":72.88}}}}],
    "P18":[{"mainsnak":{"datavalue":{"value":"Taj Hotel India.jpg"}}}]
   }}}}
  with patch.object(module,"get_json",return_value=item):
   self.assertEqual(module.entity_photo("Q123","The Taj Hotel",19.0801,72.88),"Taj Hotel India.jpg")
   self.assertIsNone(module.entity_photo("Q123","Other Hotel",19.08,72.88))
   self.assertIsNone(module.entity_photo("Q123","The Taj Hotel",19.3,72.88))

 def test_media_needs_explicit_reusable_license_and_author(self):
  image={"query":{"pages":[{"title":"File:Sample Hotel.jpg",
   "imageinfo":[{"thumburl":"https://upload.wikimedia.org/wikipedia/commons/thumb/a/a0/Sample_Hotel.jpg/960px-Sample_Hotel.jpg",
     "extmetadata":{
      "LicenseShortName":{"value":"CC BY-SA 4.0"},
      "LicenseUrl":{"value":"https://creativecommons.org/licenses/by-sa/4.0/"},
      "Artist":{"value":"<a>Example Photographer</a>"}
     }}]}]}}
  with patch.object(module,"get_json",return_value=image):
   result=module.commons_metadata("Sample Hotel.jpg")
   self.assertEqual(result["author"],"Example Photographer")
   self.assertEqual(result["license_name"],"CC BY-SA 4.0")
   self.assertIn("commons.wikimedia.org",result["commons_page"])
  image["query"]["pages"][0]["imageinfo"][0]["extmetadata"]["LicenseShortName"]["value"]="All rights reserved"
  with patch.object(module,"get_json",return_value=image):
   self.assertIsNone(module.commons_metadata("Sample Hotel.jpg"))

 def test_no_mass_api_calls_in_dry_run(self):
  with tempfile.TemporaryDirectory() as temp:
   source=Path(temp)/"hotel.geojsonseq"
   source.write_text(json.dumps({"type":"Feature","id":"n900",
    "geometry":{"type":"Point","coordinates":[73.0,19.0]},
    "properties":{"tourism":"hotel","name":"Test Hotel","wikidata":"Q501"}})+"\n")
   with patch.object(module,"get_json",side_effect=AssertionError("No network in dry-run")):
    with patch("sys.argv",["enrich_wikimedia_photos.py",str(source),"--dry-run"]):
     self.assertEqual(module.main(),0)


if __name__=="__main__":
 unittest.main()
