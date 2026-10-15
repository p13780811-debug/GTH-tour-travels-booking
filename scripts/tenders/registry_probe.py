#!/usr/bin/env python3
"""Read-only schema discovery for official tender feeds; no private data or credentials."""
import csv
import io
import json
import sys
from pathlib import Path
from urllib.request import Request, urlopen
from urllib.parse import urlencode
sys.path.insert(0, str(Path(__file__).resolve().parent))
import open_ingestion as core

SOURCES = {
    "canada": ("https://canadabuys.canada.ca/opendata/pub/openTenderNotice-ouvertAvisAppelOffres.csv", "canadabuys.canada.ca"),
    "uk_contractsfinder": ("https://www.contractsfinder.service.gov.uk/Published/Notices/OCDS/Search?" + urlencode({"stages": "tender", "limit": 2}), "www.contractsfinder.service.gov.uk"),
    "ukraine": ("https://public-api.prozorro.gov.ua/api/2.5/tenders?limit=2", "public-api.prozorro.gov.ua"),
}
def probe_one(name, url, host):
    from urllib.parse import urlsplit
    req = Request(url, headers={"User-Agent": core.USER_AGENT, "Accept": "*/*"})
    try:
        with urlopen(req, timeout=18) as response:
            parsed = urlsplit(response.geturl())
            if parsed.scheme != "https" or parsed.hostname != host:
                raise ValueError("Redirected away from official origin")
            body = response.read(300001)
            if len(body) > 300000:
                if name == "canada":
                    header = body.split(b"\n", 1)[0].decode("utf-8-sig", "replace")
                    row = next(csv.DictReader(io.StringIO(body.decode("utf-8-sig", "replace"))), {})
                    public_fields = ("referenceNumber-numeroReference", "solicitationNumber-numeroSollicitation", "tenderClosingDate-appelOffresDateCloture", "publicationDate-datePublication", "tenderStatus-appelOffresStatut-eng", "noticeURL-URLavis-eng", "contractingEntityName-nomEntitContractante-eng")
                    from collections import Counter
                    from urllib.parse import urlsplit
                    sampled = list(csv.DictReader(io.StringIO(body.decode("utf-8-sig", "replace"))))[:100]
                    host_counts = Counter(urlsplit(x.get("noticeURL-URLavis-eng", "")).hostname for x in sampled)
                    print(json.dumps({
                        "source": name, "available": True, "truncated": True,
                        "header": header[:5000],
                        "sample_public_fields": {k: str(row.get(k, ""))[:150] for k in public_fields},
                        "link_hosts_in_sample": host_counts.most_common(12),
                    }))
                else:
                    print(json.dumps({"source": name, "available": True, "truncated": True}))
                return
            if name == "canada":
                rows = csv.DictReader(io.StringIO(body.decode("utf-8-sig")))
                print(json.dumps({"source": name, "available": True, "csv_headers": rows.fieldnames, "sample_link_date_fields": {k: str(v)[:110] for k,v in next(rows, {}).items() if any(z in k.lower() for z in ("link", "url", "date", "id", "notice"))}},ensure_ascii=True))
            else:
                obj = json.loads(body)
                items = obj.get("releases") if name == "uk_contractsfinder" else obj.get("data")
                print(json.dumps({"source":name,"available":True,"top_keys":list(obj.keys()),"sample_keys": list(items[0].keys()) if isinstance(items,list) and items and isinstance(items[0],dict) else [], "sample_tender_keys": list(items[0].get("tender",{}).keys()) if isinstance(items,list) and items and isinstance(items[0],dict) and isinstance(items[0].get("tender"),dict) else [], "sample_ids": [str(x.get("id",""))[:110] for x in items[:2]] if isinstance(items,list) else []}))
    except Exception as exc:
        print(json.dumps({"source":name,"available":False,"error":type(exc).__name__,"detail":str(exc)[:140]}))
if __name__=="__main__":
    for name,(url,host) in SOURCES.items():
        probe_one(name,url,host)
