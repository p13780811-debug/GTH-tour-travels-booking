import importlib.util
from pathlib import Path
import unittest
from datetime import datetime, timezone
P=Path(__file__).resolve().parents[1]/"scripts"/"tours"/"reviewed_partner_feed.py"
import sys
sys.path.insert(0,str(P.parent))
spec=importlib.util.spec_from_file_location("reviewed_partner_feed",P)
mod=importlib.util.module_from_spec(spec);spec.loader.exec_module(mod)
class Cases(unittest.TestCase):
 def setUp(self):
  self.now=datetime(2026,10,26,tzinfo=timezone.utc)
  self.row={"provider":"tiqets","provider_product_id":"456","title":"Verified museum admission product",
   "city":"Paris","country":"France","experience_category":"attraction-ticket",
   "source_url":"https://www.tiqets.com/en/paris-c66746/museum-admission-p456/",
   "image_url":"https://images.tiqets.com/allowed-media/photo.jpg","image_width":1200,"image_height":700,
   "media_rights_verified":True,"source_type":"approved_partner_feed","source_checked_at":"2026-10-25T00:00:00Z","price_numeric":None,"currency":None}
 def test_exact_ids_and_review(self):
  self.assertEqual(mod.product(self.row,self.now)["provider_product_id"],"456")
  self.assertEqual(len(mod.review([self.row],self.now)),1)
 def test_never_publish_unreviewed_images_or_homepages(self):
  for field,value in [("media_rights_verified",False),("source_url","https://www.tiqets.com/"),("source_url","https://www.tiqets.com/en/paris-c66746/museum-p457/"),("image_width",50),("source_checked_at","2024-01-01T00:00:00Z")]:
   with self.subTest(field=field,value=value),self.assertRaises(ValueError):mod.product({**self.row,field:value},self.now)
 def test_duplicate_identity_refused(self):
  with self.assertRaises(ValueError):mod.review([self.row,self.row],self.now)
if __name__=="__main__":unittest.main()
