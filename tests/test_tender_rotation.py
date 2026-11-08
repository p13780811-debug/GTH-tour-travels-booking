"""Bounded worldwide pagination and fresh workload identity; no network/DB writes."""
import json,os,sys,unittest
from pathlib import Path
from unittest.mock import patch
sys.path.insert(0,str(Path(__file__).resolve().parents[1]/'scripts'/'tenders'))
import open_ingestion as source
import global_ingestion as global_source
import official_publication as transport
from urllib.parse import parse_qs,urlsplit
class TenderRotationTests(unittest.TestCase):
 def test_worldbank_keeps_newest_and_rotates_deeper_pages_without_more_than_three_requests(self):
  payloads=[{'procnotices':{'a':{'id':'new'}}},{'procnotices':{'b':{'id':'deeper1'}}},{'procnotices':{'c':{'id':'deeper2'}}}]
  with patch.object(source,'_http_json',side_effect=payloads) as read:
   rows=source.fetch_worldbank(100,pages=3,window=4)
  self.assertEqual([x['id'] for x in rows],['new','deeper1','deeper2'])
  self.assertEqual([parse_qs(urlsplit(call.args[0]).query)['os'][0] for call in read.call_args_list],['0','900','1000'])
  self.assertEqual(read.call_count,3)
 def test_ted_uses_active_official_scope_and_bounded_page_numbers(self):
  with patch.object(source,'_http_json',return_value={'notices':[{'id':'a'}]}) as read:
   source.fetch_ted(20,pages=3,window=2)
  self.assertEqual([call.kwargs['payload']['page'] for call in read.call_args_list],[1,6,7])
  self.assertTrue(all(call.kwargs['payload']['scope']=='ACTIVE' for call in read.call_args_list))
  self.assertTrue(all(call.kwargs['payload']['limit']<=100 for call in read.call_args_list))
 def test_defaults_keep_existing_first_page_behavior_and_invalid_budgets_fail(self):
  with patch.object(source,'_http_json',return_value={'notices':[]}) as read:source.fetch_ted(10)
  self.assertEqual(read.call_count,1)
  for pages,window in [(0,0),(4,0),(3,-1),(3,31)]:
   with self.assertRaises(ValueError):source._source_pages(pages,window)
 def test_default_cli_never_writes_and_rotating_cli_reports_explicit_budget(self):
  with patch.object(global_source,'collect',return_value=([],[])) as collect,patch.object(global_source,'submit') as write,patch.object(global_source,'submit_official') as publish,patch('sys.stdout') as output:
   self.assertEqual(global_source.main(['--source','worldbank','--pages','3','--rotation','auto','--limit','10']),0)
  self.assertEqual(collect.call_args.kwargs['pages'],3)
  self.assertTrue(0<=collect.call_args.kwargs['window']<=30)
  write.assert_not_called();publish.assert_not_called()
 def test_oidc_broker_credentials_never_follow_redirects_or_reach_unknown_hosts(self):
  with patch.dict(os.environ,{'ACTIONS_ID_TOKEN_REQUEST_URL':'https://evil.example/token','ACTIONS_ID_TOKEN_REQUEST_TOKEN':'fixture-private-token'},clear=True),patch('urllib.request.build_opener') as opener:
   with self.assertRaises(ValueError):transport.fresh_oidc_token('old')
   opener.assert_not_called()
  with patch.dict(os.environ,{},clear=True):self.assertEqual(transport.fresh_oidc_token('manual-fallback'),'manual-fallback')
 def test_oidc_fresh_identity_is_requested_and_errors_do_not_fall_back_to_expired_jwt(self):
  class Reply:
   def __enter__(self):return self
   def __exit__(self,*args):pass
   def read(self,*args):return json.dumps({'value':'fresh-signed-fixture'}).encode()
  with patch.dict(os.environ,{'ACTIONS_ID_TOKEN_REQUEST_URL':'https://broker.actions.githubusercontent.com/token?x=1','ACTIONS_ID_TOKEN_REQUEST_TOKEN':'fixture-private-token'},clear=True),patch('urllib.request.build_opener') as opener:
   opener.return_value.open.return_value=Reply()
   self.assertEqual(transport.fresh_oidc_token('expired'),'fresh-signed-fixture')
   request=opener.return_value.open.call_args.args[0]
   self.assertIn('audience=gth-pro-tender-ingest',request.full_url)
   self.assertEqual(request.get_header('Authorization'),'Bearer fixture-private-token')
   opener.return_value.open.side_effect=RuntimeError('private token diagnostic')
   with self.assertRaisesRegex(ValueError,'Fresh GitHub identity unavailable'):transport.fresh_oidc_token('expired')
if __name__=='__main__':unittest.main()
