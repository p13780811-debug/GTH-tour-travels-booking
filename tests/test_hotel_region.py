import importlib.util
import unittest
from pathlib import Path
from unittest.mock import patch
spec=importlib.util.spec_from_file_location("region",Path(__file__).resolve().parents[1]/"scripts/hotels/resolve_region.py")
module=importlib.util.module_from_spec(spec)
spec.loader.exec_module(module)

class RegionTests(unittest.TestCase):
 def test_index_uses_only_safe_single_country_download_urls(self):
  doc={"features":[
   {"properties":{"iso3166-1:alpha2":["NP"],"urls":{"pbf":"https://download.geofabrik.de/asia/nepal-latest.osm.pbf"}}},
   {"properties":{"iso3166-1:alpha2":["IN","NP"],"urls":{"pbf":"https://download.geofabrik.de/asia/border-latest.osm.pbf"}}},
   {"properties":{"iso3166-1:alpha2":["GB"],"urls":{"pbf":"https://evil.example/gb-latest.osm.pbf"}}},
   {"properties":{"iso3166-1:alpha2":["IN"],"urls":{"pbf":"http://download.geofabrik.de/asia/india-latest.osm.pbf"}}},
  ]}
  self.assertEqual(module.candidates(doc),[("asia/nepal","NP","https://download.geofabrik.de/asia/nepal-latest.osm.pbf")])
 def test_wrong_host_subdomain_and_query_are_not_allowed(self):
  self.assertFalse(module.geofabrik_url("https://download.geofabrik.de.evil.example/asia/nepal-latest.osm.pbf"))
  self.assertFalse(module.geofabrik_url("https://download.geofabrik.de/asia/nepal-latest.osm.pbf?redirect=1"))
  self.assertFalse(module.geofabrik_url("https://download.geofabrik.de/asia/nepal.osm.pbf"))
 def test_selector_falls_back_without_mislabeling(self):
  with patch.object(module,"fetch_index",side_effect=OSError("No network")):
   self.assertEqual(module.resolve(0),("europe/monaco","MC"))
   self.assertEqual(module.resolve(4),("asia/nepal","NP"))
 def test_bounded_selection_checks_extract_size(self):
  doc={"features":[
   {"properties":{"iso3166-1:alpha2":["BD"],"urls":{"pbf":"https://download.geofabrik.de/asia/bangladesh-latest.osm.pbf"}}}
  ]}
  with patch.object(module,"fetch_index",return_value=doc),patch.object(module,"acceptable_size",return_value=True):
   self.assertEqual(module.resolve(0),("asia/bangladesh","BD"))
if __name__=="__main__":unittest.main()
