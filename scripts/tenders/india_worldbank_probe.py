#!/usr/bin/env python3
"""Read-only probe: licensed World Bank procurement notices relevant to India.

Do not scrape CPPP/GeM, pass CAPTCHAs or mirror third-party Indian tenders.
"""
import json
import sys
from pathlib import Path
from urllib.parse import urlencode
sys.path.insert(0,str(Path(__file__).resolve().parent))
import open_ingestion as core

BASE="https://search.worldbank.org/api/v2/procnotices"
def run():
    for strategy,extra in [
      ("qterm_india",{"qterm":"India","rows":100,"os":0}),
      ("country_name",{"project_ctry_name":"India","rows":100,"os":0}),
      ("recent_page_2",{"rows":100,"os":100}),
      ("recent_page_3",{"rows":100,"os":200}),
    ]:
      try:
        response=core._http_json(BASE+"?"+urlencode({"format":"json","srt":"noticedate desc,id asc",**extra}),allowed_host="search.worldbank.org")
        raw=response.get("procnotices",{})
        data=list(raw.values()) if isinstance(raw,dict) else raw if isinstance(raw,list) else []
        indian=[r for r in data if isinstance(r,dict) and core._text(r.get("project_ctry_name")).casefold()=="india"]
        valid=0
        for row in indian:
          try:core._worldbank_notice(row);valid+=1
          except (ValueError,TypeError):pass
        print(json.dumps({"strategy":strategy,"received":len(data),"country_IN":len(indian),"current_valid_india":valid,"result_metadata":{k:str(v)[:120] for k,v in response.items() if k not in ("procnotices",)}}))
      except (ValueError,OSError) as exc:
        print(json.dumps({"strategy":strategy,"error":str(exc)[:120]}))
if __name__=="__main__":run()
