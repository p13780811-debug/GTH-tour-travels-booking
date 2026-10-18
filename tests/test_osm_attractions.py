import importlib.util,json,pathlib,unittest,io,tempfile
from contextlib import redirect_stdout
from unittest.mock import patch
ROOT=pathlib.Path(__file__).resolve().parents[1]
SPEC=importlib.util.spec_from_file_location("osm_attractions",ROOT/"scripts/attractions/import_osm_attractions.py")
m=importlib.util.module_from_spec(SPEC);SPEC.loader.exec_module(m)
REGION="asia/india/western-zone"
def feature(item,category="beach",coordinates=None):
 return {"type":"Feature","id":item,"geometry":{"type":"Point","coordinates":coordinates or [73.75,15.15]},
         "properties":{"natural":category,"name":"Named Public Beach"}}
class BulkAttractionTests(unittest.TestCase):
 def test_source_mapped_beach(self):
  a=m.convert(feature("n57390"),REGION)
  self.assertEqual(a["source_id"],"node/57390")
  self.assertEqual(a["category"],"beach")
  self.assertEqual(a["source_license"],"ODbL-1.0")
  self.assertEqual(a["region_scope"],"goa")
  self.assertNotIn("price",a)
  self.assertNotIn("image_url",a)
 def test_source_ids_survive_osmium_area_conversion(self):
  f=feature("a2400")
  self.assertEqual(m.normalized_id(f),"way/1200")
  f["id"]="a2401"
  self.assertEqual(m.normalized_id(f),"relation/1200")
  self.assertIsNone(m.normalized_id(feature("random-counter")))
 def test_unknown_or_missing_labels_skipped(self):
  self.assertIsNone(m.convert(feature("n1","sea"),REGION))
  f=feature("n1");f["properties"]["name"]="X"
  self.assertIsNone(m.convert(f,REGION))
 def test_discard_foreign_coordinates(self):
  self.assertIsNone(m.convert(feature("n1",coordinates=[-122,37]),REGION))
 def test_no_private_booking_or_fake_images(self):
  f=feature("n12")
  f["properties"].update({"image":"https://unsafe.example/placeholder.jpg","phone":"+12345","fee":"5"})
  v=m.convert(f,REGION)
  self.assertIsNotNone(v)
  self.assertEqual(set(v),{"source_id","name","category","region_scope","city","latitude","longitude","source_url","source_region","source_license","wikidata_qid","country_code","country_name"})
 def test_area_geometry_source_only(self):
  f={"type":"Feature","id":"a2440","geometry":{"type":"Polygon","coordinates":[[[73.80,15.15],[73.81,15.15],[73.81,15.16],[73.80,15.16],[73.80,15.15]]]},
     "properties":{"historic":"fort","name":"Old Public Fort"}}
  row=m.convert(f,REGION)
  self.assertIsNotNone(row)
  self.assertEqual(row["source_id"],"way/1220")
  self.assertEqual(row["category"],"fort")
 def test_worldwide_source_geography_no_false_india(self):
  f=feature("n2043",coordinates=[2.31,48.86])
  self.assertIsNone(m.convert(f,REGION))
  item=m.convert(f,"europe/france/ile-de-france","FR","France")
  self.assertEqual(item["country_code"],"FR")
  self.assertEqual(item["country_name"],"France")
  self.assertEqual(item["region_scope"],"world")
  self.assertEqual(item["source_id"],"node/2043")
 def test_invalid_source_metadata_rejected(self):
  self.assertIsNone(m.convert(feature("n99"),"https://evil.com/x","IN","India"))
  self.assertIsNone(m.convert(feature("n99"),"europe/france","INVALID","France"))
 def test_paced_upload_sleeps_between_batches_only(self):
  with patch.object(m,"ingest") as request,patch.object(m.time,"monotonic",side_effect=[100.0,100.0,100.1]),patch.object(m.time,"sleep") as nap:
   first=m.paced_ingest([{"source_id":"node/1"}],"https://example.invalid","jwt",None)
   second=m.paced_ingest([{"source_id":"node/2"}],"https://example.invalid","jwt",first)
   self.assertEqual(first,100.0)
   self.assertEqual(second,100.1)
   self.assertEqual(request.call_count,2)
   nap.assert_called_once_with(5.5)
 def test_import_limit_is_bounded_by_cloud_runtime(self):
  self.assertEqual(m.BATCH_GAP_SECONDS,5.5)
  self.assertLessEqual(m.MAX_PER_RUN,18000)
 def test_protected_import_requires_signed_identity(self):
  with patch.dict("os.environ",{},clear=True):
   with self.assertRaises(SystemExit):
    m.main(["/does/not/exist","--region",REGION])
 def test_fresh_signed_identity_per_batch_and_summary(self):
  import io
  with patch.dict("os.environ",{"ACTIONS_ID_TOKEN_REQUEST_URL":"https://pipelines.actions.githubusercontent.com/token?api-version=2.0",
      "ACTIONS_ID_TOKEN_REQUEST_TOKEN":"runner-broker"},clear=True):
   with patch.object(m,"urlopen",side_effect=lambda req,timeout: io.BytesIO(b'{"value":"new-identity"}')) as open_url:
    self.assertEqual(m.fresh_github_oidc_token("expired-token"),"new-identity")
    sent=open_url.call_args.args[0]
    self.assertIn("gth-osm-attractions%3Adqprqjmhxjnrllczqyhz",sent.full_url)
    self.assertEqual(sent.get_header("Authorization"),"Bearer runner-broker")
   with patch.object(m,"fresh_github_oidc_token",side_effect=["new-1","new-2","new-3"]) as token:
    with patch.object(m,"urlopen",side_effect=lambda req,timeout: io.BytesIO(b'{"accepted":1}' if b'"rows"' in req.data else b'{"recorded":true}')) as open_url:
     m.ingest([{"source_id":"node/1"}],"https://example.invalid","stale")
     m.ingest([{"source_id":"node/2"}],"https://example.invalid","stale")
     m.ingest_summary({"run_id":"123"},"https://example.invalid","stale")
     self.assertEqual(token.call_count,3)
     self.assertEqual([call.args[0].get_header("Authorization") for call in open_url.call_args_list],
                      ["Bearer new-1","Bearer new-2","Bearer new-3"])
 def test_bounded_resume_completes_large_region_without_dropping_tail(self):
  rows=[feature("n1"),feature("n2"),feature("n3"),feature("n3")]
  with tempfile.TemporaryDirectory() as d:
   source=pathlib.Path(d)/"mapped.geojsonseq"
   source.write_text("\\n".join(json.dumps(r) for r in rows)+"\\n",encoding="utf-8")
   def scan(offset):
    output=io.StringIO()
    with redirect_stdout(output):
     self.assertEqual(m.main([str(source),"--region",REGION,"--limit","2",
                   "--start-offset",str(offset),"--dry-run"]),0)
    return json.loads(output.getvalue())
   first=scan(0)
   self.assertEqual(first["accepted_source_places"],2)
   self.assertFalse(first["region_complete"])
   self.assertEqual(first["next_offset"],2)
   second=scan(first["next_offset"])
   self.assertEqual(second["accepted_source_places"],1)
   self.assertTrue(second["region_complete"])
   self.assertEqual(second["next_offset"],0)
   self.assertEqual(second["resumed_skipped"],2)

 def test_invalid_resume_offsets_rejected(self):
  with tempfile.TemporaryDirectory() as d:
   source=pathlib.Path(d)/"mapped.geojsonseq"
   source.write_text("",encoding="utf-8")
   for value in ("-1","10000001"):
    with redirect_stdout(io.StringIO()):
     with self.assertRaises(SystemExit):
      m.main([str(source),"--region",REGION,"--start-offset",value,"--dry-run"])

 def test_oidc_broker_cannot_steal_runner_credential(self):
  with patch.dict("os.environ",{"ACTIONS_ID_TOKEN_REQUEST_URL":"https://evil.example/broker?x=1",
    "ACTIONS_ID_TOKEN_REQUEST_TOKEN":"runner-broker"},clear=True):
   with self.assertRaisesRegex(RuntimeError,"Invalid GitHub Actions identity broker"):
    m.fresh_github_oidc_token("old")
if __name__=="__main__":unittest.main()
