"""Offline regression: signed OSM gateway can reject one row without losing the others."""
import contextlib
import importlib.util
import io
import json
import os
import pathlib
import sys
import tempfile
import unittest
from unittest.mock import patch

ROOT=pathlib.Path(__file__).resolve().parents[1]
spec=importlib.util.spec_from_file_location("hotel_batch",ROOT/"scripts/import_osm_hotels.py")
mod=importlib.util.module_from_spec(spec)
spec.loader.exec_module(mod)

class Reply:
    def __enter__(self): return self
    def __exit__(self,*args): return False
    def read(self,size=-1): return b'{"accepted":2,"rejected":1}'

class ImportBatchTests(unittest.TestCase):
    def test_partial_rejection_does_not_abort_regional_import(self):
        with tempfile.TemporaryDirectory() as temp:
            file=pathlib.Path(temp)/"hotels.geojsonseq"
            hotels=[{"type":"Feature","id":"n"+str(9000+i),
                "geometry":{"type":"Point","coordinates":[72.88,19.08]},
                "properties":{"tourism":"hotel","name":"Source Hotel "+str(i)}} for i in range(3)]
            file.write_text("\n".join(map(json.dumps,hotels))+"\n",encoding="utf-8")
            url="https://dqprqjmhxjnrllczqyhz.supabase.co/functions/v1/gth-hotel-ingest"
            fake_args=["import_osm_hotels.py",str(file),"--region","asia/india/western-zone",
                       "--country-code","IN","--edge-url",url]
            stdout=io.StringIO()
            with patch.object(sys,"argv",fake_args),patch.dict(os.environ,{
                "GTH_INGESTION_ENABLED":"true","GTH_HOTEL_OIDC_TOKEN":"test-only"
            }),patch.object(mod,"urlopen",return_value=Reply()) as remote,contextlib.redirect_stdout(stdout):
                self.assertEqual(mod.main(),0)
            result=json.loads(stdout.getvalue().strip())
            self.assertEqual(result["accepted"],2)
            self.assertEqual(result["gateway_rejected"],1)
            self.assertEqual(result["accepted_source_candidates"],3)
            remote.assert_called_once()
    def test_invalid_gateway_accounting_stops_import(self):
        with tempfile.TemporaryDirectory() as temp:
            file=pathlib.Path(temp)/"hotels.geojsonseq"
            file.write_text(json.dumps({"type":"Feature","id":"n12345",
                 "geometry":{"type":"Point","coordinates":[72.88,19.08]},
                 "properties":{"tourism":"hotel","name":"Source Hotel"}})+"\n")
            class BadReply(Reply):
                def read(self,size=-1):return b'{"accepted":5,"rejected":0}'
            fake_args=["import_osm_hotels.py",str(file),"--edge-url",
               "https://dqprqjmhxjnrllczqyhz.supabase.co/functions/v1/gth-hotel-ingest"]
            with patch.object(sys,"argv",fake_args),patch.dict(os.environ,{
                "GTH_INGESTION_ENABLED":"true","GTH_HOTEL_OIDC_TOKEN":"test-only"
            }),patch.object(mod,"urlopen",return_value=BadReply()):
                with self.assertRaisesRegex(RuntimeError,"invalid batch accounting"):
                    mod.main()
if __name__=="__main__":unittest.main()
