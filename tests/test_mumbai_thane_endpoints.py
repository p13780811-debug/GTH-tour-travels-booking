"""Synthetic endpoint/checkpoint fixtures. No live provider or database operations."""
import contextlib
import io
import json
import sys
import tempfile
import unittest
from pathlib import Path
from types import SimpleNamespace
from unittest.mock import patch

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / "scripts"))
from ingest_rera_endpoints import main, arguments, candidates
from rera_ingestion.checkpoint import Checkpoint
from rera_ingestion.endpoint import ENDPOINT, EndpointCollector, parse_detail
from rera_ingestion.models import IngestionError, normalize, public_payload
from rera_ingestion.http import RateLimiter
from test_mumbai_thane_ingestion import FakeClient, Clock


def fixture(project_id=4, **values):
    return {"data": {"projectDetails": {"projectId": project_id,
        "projectRegistartionNo": "P51700099994", "projectName": "Synthetic endpoint project",
        "legalAddress": {"districtName": "Thane", "villageName": "Dombivli East"}, **values},
        "promoterDetails": {"promoterName": "Synthetic entity", "email": "PRIVATE_SENTINEL"},
        "bankDetails": {"account": "PRIVATE_SENTINEL"}, "token": "PRIVATE_SENTINEL"}}


def project(n=4):
    payload = fixture(n, projectRegistartionNo=f"P517{n:08d}")
    return parse_detail(payload, n, json.dumps(payload).encode())[0]


class EndpointTests(unittest.TestCase):
    def test_exact_requested_project_and_public_fields_only(self):
        p = project()
        self.assertEqual(p.locality, "Dombivli East")
        self.assertEqual(p.registry_evidence["project_id"], 4)
        self.assertNotIn("PRIVATE_SENTINEL", json.dumps(public_payload(p)))
        self.assertFalse(p.verified_status)
        self.assertEqual(p.unit_types, [])
        self.assertIsNone(p.min_carpet_sqft)
        with self.assertRaises(IngestionError): parse_detail(fixture(5), 4, b"fixture")

    def test_district_is_required_and_other_regions_are_excluded(self):
        self.assertEqual(parse_detail(fixture(districtName="Pune", legalAddress={}),4,b"fixture"),(None,"outside_districts"))
        with self.assertRaises(IngestionError): parse_detail(fixture(legalAddress={}),4,b"fixture")
        with self.assertRaises(IngestionError): parse_detail(fixture(projectRegistartionNo="P51800099994"),4,b"fixture")
        p = normalize({"project_name":"Synthetic city project","rera_id":"P51900099994","district":"Mumbai City"})
        self.assertIsNone(p.cluster)
        self.assertEqual(public_payload(p)["city"], "Mumbai")

    def test_authorization_and_changed_envelopes_stop(self):
        for payload in ({"statusCode":401},{"data":"unexpected"},{"data":{}},{"data":[fixture()]}):
            with self.assertRaises(IngestionError): parse_detail(payload,4,b"fixture")
        self.assertEqual(parse_detail({"success":True,"data":None},4,b"fixture"),(None,"missing"))

    def test_collector_posts_json_to_the_supplied_endpoint_without_credentials(self):
        calls=[]
        body=json.dumps(fixture()).encode()
        http=SimpleNamespace(check_robots=lambda *a: calls.append(("robots",a)),
            request=lambda *a,**kw: (calls.append((a,kw)) or (body,"application/json",ENDPOINT)))
        p,status=EndpointCollector(http).fetch(4)
        self.assertEqual(status,"accepted")
        self.assertEqual(calls[-1][1]["json_body"],{"projectId":"4"})
        self.assertEqual(calls[-1][1]["method"],"POST")
        self.assertNotIn("headers",calls[-1][1])

    def test_checkpoint_resumes_and_preserves_unacknowledged_rows(self):
        with tempfile.TemporaryDirectory() as folder:
            path=Path(folder)/"run"
            c=Checkpoint(path,"scope","test-project")
            c.save(4,"accepted",project())
            c.save(5,"outside_districts")
            c.close()
            c=Checkpoint(path,"scope","test-project")
            self.assertTrue(c.attempted(4)); self.assertTrue(c.attempted(5))
            self.assertEqual(len(c.projects(pending_only=True)),1)
            c.acknowledge(c.projects()); c.close()
            c=Checkpoint(path,"scope","test-project")
            self.assertEqual(c.projects(pending_only=True),[])
            self.assertEqual(c.counts()["cached_target_projects"],1)
            c.close()
            with self.assertRaises(IngestionError): Checkpoint(path,"different-scope","test-project")
            with self.assertRaises(IngestionError): Checkpoint(path,"scope","other-project")

    def test_duplicate_rera_is_one_project_and_conflicting_identity_stops(self):
        with tempfile.TemporaryDirectory() as folder:
            c=Checkpoint(Path(folder)/"run","scope","project")
            p=project(); c.save(4,"accepted",p); c.save(5,"accepted",p)
            self.assertEqual(c.counts()["cached_target_projects"],1)
            conflict=p.model_copy(update={"project_name":"Different identity"})
            with self.assertRaises(IngestionError): c.save(6,"accepted",conflict)
            self.assertFalse(c.attempted(6)); c.close()

    def test_concurrent_writer_and_symlink_state_are_rejected(self):
        with tempfile.TemporaryDirectory() as folder:
            path=Path(folder)/"run"; c=Checkpoint(path,"scope","project")
            with self.assertRaises(IngestionError): Checkpoint(path,"scope","project")
            c.close()
            link=Path(folder)/"link"; link.symlink_to(path,target_is_directory=True)
            with self.assertRaises(IngestionError): Checkpoint(link,"scope","project")

    def test_numeric_ids_are_explicit_not_derived_from_rera_numbers(self):
        with tempfile.TemporaryDirectory() as folder:
            p=Path(folder)/"ids.txt"; p.write_text("4\n7\n4\n")
            args=arguments(["--ids-file",str(p)])
            self.assertEqual(candidates(args)[0],[4,7])
            p.write_text("P51700000004\n")
            with self.assertRaises(IngestionError): candidates(args)

    def test_interrupted_collection_keeps_progress_and_resumes_without_refetch(self):
        with tempfile.TemporaryDirectory() as folder:
            run=Path(folder)/"run"; calls=[]
            def fail_second(self,pid):
                calls.append(pid)
                if pid==2: raise IngestionError("Source temporarily unavailable")
                return project(pid),"accepted"
            args=["--id-end","3","--limit","3","--run-dir",str(run)]
            with contextlib.redirect_stdout(io.StringIO()),patch.object(EndpointCollector,"fetch",fail_second):
                self.assertEqual(main(args),2)
            def succeed(self,pid): calls.append(pid); return project(pid),"accepted"
            with contextlib.redirect_stdout(io.StringIO()),patch.object(EndpointCollector,"fetch",succeed):
                self.assertEqual(main(args),0)
            self.assertEqual(calls,[1,2,2,3])
            report=json.loads((run/"last-run.json").read_text())
            self.assertEqual(report["cached_target_projects"],3)
            self.assertEqual(report["written_this_run"],0)

    def test_thousand_unique_projects_without_network_and_second_run_is_cached(self):
        with tempfile.TemporaryDirectory() as folder:
            run=Path(folder)/"run"; calls=[]
            def fetch(self,pid): calls.append(pid); return project(pid),"accepted"
            args=["--id-end","1000","--limit","1000","--run-dir",str(run)]
            with contextlib.redirect_stdout(io.StringIO()),patch.object(EndpointCollector,"fetch",fetch),patch("requests.Session.request",side_effect=AssertionError("Network called")):
                self.assertEqual(main(args),0)
                self.assertEqual(main(args),0)
            self.assertEqual(len(calls),1000)
            report=json.loads((run/"last-run.json").read_text())
            self.assertEqual(report["cached_target_projects"],1000)
            self.assertEqual(report["fetched_this_run"],0)
            self.assertEqual(report["written_this_run"],0)

    def test_thousand_projects_stream_to_twenty_batches_and_resume_writes_nothing(self):
        with tempfile.TemporaryDirectory() as folder:
            run=Path(folder)/"run"; client=FakeClient(); clock=Clock()
            def fetch(self,pid): return project(pid),"accepted"
            args=["--id-end","1000","--limit","1000","--commit","--run-dir",str(run)]
            with contextlib.redirect_stdout(io.StringIO()),patch.object(EndpointCollector,"fetch",fetch),patch("ingest_rera_endpoints.configured_client",return_value=client),patch("ingest_rera_endpoints.RateLimiter",return_value=RateLimiter(5,clock.now,clock.sleep)),patch.dict("os.environ",{"GTH_INGESTION_ENABLED":"true"}):
                self.assertEqual(main(args),0)
                self.assertEqual(main(args),0)
            self.assertEqual(len(client.rows),1000)
            self.assertEqual([len(payload) for payload,_ in client.writes],[50]*20)
            report=json.loads((run/"last-run.json").read_text())
            self.assertEqual(report["acknowledged_projects"],1000)
            self.assertEqual(report["written_this_run"],0)

    def test_summary_cannot_write_through_a_symlink_directory(self):
        from ingest_mumbai_thane_rera import write_json
        with tempfile.TemporaryDirectory() as folder:
            target=Path(folder)/"target"; target.mkdir()
            link=Path(folder)/"link"; link.symlink_to(target,target_is_directory=True)
            with self.assertRaises(IngestionError): write_json(link/"last-run.json",{"safe":True})
            self.assertFalse((target/"last-run.json").exists())


if __name__ == "__main__": unittest.main()
