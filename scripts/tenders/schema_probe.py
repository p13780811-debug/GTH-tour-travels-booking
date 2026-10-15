#!/usr/bin/env python3
"""Schema-only operational diagnostics for public procurement APIs (no credentials, no writes).

Prints only FIELD NAMES and non-personal country/deadline values. Safe for CI logs.
"""
import json
import sys
from pathlib import Path
from urllib.error import HTTPError
from urllib.request import Request, urlopen
from urllib.parse import urlencode
from datetime import date, timedelta

sys.path.insert(0, str(Path(__file__).resolve().parent))
import open_ingestion as core

def inspect(label, fetch):
    try:
        records = fetch(1)
        if not records:
            print(label + ": no records")
            return
        item = records[0]
        print(label + " keys " + json.dumps(sorted(item.keys())))
        fields = {
            k: v for k, v in item.items()
            if ("country" in k.lower() or "deadline" in k.lower() or "closing" in k.lower()
                or "submission" in k.lower() or "date" in k.lower())
            and isinstance(v, (str, int, float, dict, list, type(None)))
        }
        print(label + " date/country field shapes " + json.dumps(fields, ensure_ascii=True)[:2800])
    except (ValueError, OSError) as exc:
        print(label + " probe error " + str(exc)[:200])

def brazil_probe():
    params = {"dataFinal": (date.today() + timedelta(days=60)).strftime("%Y%m%d"),
              "pagina": 1, "tamanhoPagina": 1}
    url = "https://pncp.gov.br/api/consulta/v1/contratacoes/proposta?" + urlencode(params)
    try:
        with urlopen(Request(url, headers={"Accept": "application/json"}), timeout=12) as r:
            print("brazil response " + r.read(600).decode("utf-8", "replace"))
    except HTTPError as exc:
        print("brazil status " + str(exc.code) + " body " + exc.read(600).decode("utf-8", "replace"))
    except OSError as exc:
        print("brazil probe unreachable " + type(exc).__name__)

if __name__ == "__main__":
    inspect("worldbank", core.fetch_worldbank)
    inspect("ted", core.fetch_ted)
    brazil_probe()
