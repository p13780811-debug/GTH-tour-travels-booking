import importlib.util
import io
import json
from datetime import date
from pathlib import Path
from unittest import TestCase, main
from unittest.mock import patch
P=Path(__file__).resolve().parents[1]/"scripts"/"tours"/"india_first_sync.py"
spec=importlib.util.spec_from_file_location("india_first_sync", P)
engine=importlib.util.module_from_spec(spec)
spec.loader.exec_module(engine)
COUNTRY={"code":"IN","id":1269750,"name":"India"}
CITY={"id":1275339,"name":"Mumbai","slug":"mumbai"}
ROW={"id":26568,"city":CITY,"locale":"en","tags":{"available":True},"type":1}
DETAIL={"id":26568,"city":CITY,"slug":"mumbai-audio-walk","title":"Original Mumbai self guided audio walk","type":1,
        "published":True,"available":True,"status":"approved","url":"https://wegotrip.com/mumbai-d1275339/mumbai-audio-walk-p26568/",
        "preview":"https://wgt-prod-storage.s3.amazonaws.com/media/images/photo.jpg","currencyCode":"USD","price":10}
class Tests(TestCase):
 def test_verifies_source_photo_and_identity(self):
  row=engine.normalize(ROW,DETAIL,COUNTRY,"2026-10-26T00:00:00+00:00",lambda url:True)
  self.assertEqual(row["provider_product_id"],"26568")
  self.assertEqual(row["country_code"],"IN")
  self.assertTrue(row["image_verified"])
  for bad in [{"url":"https://wegotrip.com/"},{"url":"https://wegotrip.com/mumbai-d1275339/wrong-p77/"},{"status": "draft"},{ "published":False},{"preview":"https://images.pexels.com/photo.jpg"},{ "city":{"id":23,"slug":"wrong","name":"Wrong"}}]:
   self.assertIsNone(engine.normalize(ROW,{**DETAIL,**bad},COUNTRY,"2026-10-26T00:00:00+00:00",engine.image_check if "preview" in bad else lambda _:True))
 def test_type_two_ticket_supported(self):
  row=engine.normalize({**ROW,"type":2},{**DETAIL,"type":2},COUNTRY,"2026-10-26T00:00:00+00:00",lambda _:True)
  self.assertEqual(row["product_type"],2)
  self.assertIsNone(engine.normalize(ROW,{**DETAIL,"type":5},COUNTRY,"x",lambda _:True))
 def test_pagination_and_source_check(self):
  calls=[]
  def reader(path,params):
   calls.append((path,params))
   if path=="/countries/":return {"results":[{"code":"IN","name":"India","id":1269750},{"code":"GB","name":"United Kingdom","id":1}],"next":None}
   if path=="/search/":return {"results":[],"next":None}
   if path=="/products/popular/":return {"results":[ROW,ROW],"next":None}
   if path=="/products/26568/":return DETAIL
   raise AssertionError(path)
  rows=[]
  result=engine.run("india",reader=reader,photo_validator=lambda _:True,sleeper=lambda _:None,
   writer=lambda xs:rows.extend(xs) or len(xs),write=True)
  self.assertEqual(result["verified_products"],1)
  self.assertEqual(result["upserted"],1)
  self.assertEqual(len(rows),1)
  self.assertEqual(result["countries_checked"],1)
 def test_city_focus_ingests_genuine_supplier_products_and_deduplicates(self):
  calls=[]
  def reader(path, params):
   calls.append((path,params))
   if path=="/countries/":
    return {"results":[COUNTRY],"next":None}
   if path=="/search/":
    name=params["query"]
    if name=="Mumbai":
     return {"results":[{**CITY,"available":True,"type":"city",
                          "country":{"name":"India","id":COUNTRY["id"]}}]}
    return {"results":[]}
   if path=="/products/popular/":
    # Country and Mumbai city can return the same supplier product.
    return {"results":[ROW] if params.get("city")==str(CITY["id"]) else [],"next":None}
   if path=="/products/26568/":return DETAIL
   raise AssertionError(path)
  saved=[]
  result=engine.run("india",reader=reader,photo_validator=lambda _:True,
   sleeper=lambda _:None,writer=lambda rows:saved.extend(rows) or len(rows),write=True)
  self.assertEqual(result["verified_products"],1)
  self.assertEqual(result["upserted"],1)
  self.assertEqual(saved[0]["city_name"],"Mumbai")
  self.assertEqual([entry["city"] for entry in result["india_city_checks"]],["Mumbai","Agra","Jaipur"])
  self.assertTrue(any(path=="/products/popular/" and params.get("city")==str(CITY["id"])
                      for path,params in calls))

 def test_city_lookup_requires_exact_country_and_unique_supplier_city(self):
  for countries in [
    [{"name":"France","id":2}],
    [{"name":"India","id":COUNTRY["id"]},{"name":"India","id":COUNTRY["id"]}]
  ]:
   def reader(path, params):
    if path=="/search/":return {"results":[{**CITY,"type":"city","available":True,"country":other} for other in countries]}
    raise AssertionError("Must not query products for wrong or ambiguous city")
   rows,count=engine.collect_city(COUNTRY,"Mumbai",reader=reader,sleeper=lambda _:None)
   self.assertEqual(rows,[])
   self.assertEqual(count,0)

 def test_no_import_on_missing_supplier(self):
  def reader(path,params):
   if path=="/countries/":return {"results":[{"code":"IN","name":"India","id":1269750},{"code":"GB","name":"UK","id":1}],"next":None}
   raise ValueError("supplier error")
  with self.assertRaisesRegex(ValueError,"All supplier countries failed"):
   engine.run("india",reader=reader,sleeper=lambda _:None)
 def test_world_rotates_and_excludes_india(self):
  seen=[]
  def reader(path,params):
   if path=="/countries/":return {"results":[{"code":"IN","name":"India","id":3},{"code":"FR","name":"France","id":2},{"code":"GB","name":"UK","id":1},{"code":"AU","name":"Australia","id":4}],"next":None}
   if path=="/products/popular/":seen.append(params["country"]);return {"results":[],"next":None}
  a=engine.run("world",reader=reader,sleeper=lambda _:None,world_batch=1,today=date(2026,10,26))
  self.assertEqual(a["countries_checked"],1)
  self.assertNotIn("3",seen)
  self.assertEqual(a["verified_products"],0)
 def test_rejects_unverified_db_writes_before_network(self):
  with self.assertRaises(ValueError):
   engine.upsert([{"source_verified":False,"image_verified":True}],env={"SUPABASE_URL":"https://demo.supabase.co","SUPABASE_SERVICE_ROLE_KEY":"test"})
 def test_safe_url_and_photo_hosts(self):
  self.assertFalse(engine.image_check("https://images.pexels.com/photo.jpg"))
  self.assertIsNone(engine.safe_url("https://evil.test/path",{"wegotrip.com"}))
 def test_oidc_edge_requires_exact_fixed_endpoint(self):
  valid={"provider":"wegotrip","provider_product_id":"1","source_verified":True,"image_verified":True}
  with self.assertRaises(ValueError):
   engine.upsert([valid],env={"GTH_TOURS_EDGE_URL":"https://evil.example/steal","GTH_TOURS_OIDC_TOKEN":"test"})
if __name__=="__main__":main()
