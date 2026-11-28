"""Read-only aggregate metrics for the preview and public production Workers."""
import datetime
import json
import os
import re
import urllib.request
import urllib.error

account = os.environ.get("CLOUDFLARE_ACCOUNT_ID", "")
token = os.environ.get("CLOUDFLARE_API_TOKEN", "")
if not re.fullmatch(r"[a-fA-F0-9]{32}", account) or not token:
    print("Preview metrics unavailable: missing connection settings.")
    raise SystemExit(0)

end = datetime.datetime.now(datetime.timezone.utc)
start = end - datetime.timedelta(hours=3)
query = """query PreviewMetrics($accountTag: string, $datetimeStart: string, $datetimeEnd: string, $scriptName: string) {
  viewer { accounts(filter:{accountTag:$accountTag}) {
    workersInvocationsAdaptive(limit:100,filter:{scriptName:$scriptName,datetime_geq:$datetimeStart,datetime_leq:$datetimeEnd}) {
      sum { requests errors subrequests }
      quantiles { cpuTimeP50 cpuTimeP99 }
      dimensions { status }
    }
  } }
}"""
class NoRedirect(urllib.request.HTTPRedirectHandler):
    def redirect_request(self, req, fp, code, msg, headers, newurl):
        return None

def report(script, hours, label):
    since = end - datetime.timedelta(hours=hours)
    body = {"query":query,"variables":{"accountTag":account,"datetimeStart":since.isoformat(),"datetimeEnd":end.isoformat(),"scriptName":script}}
    request = urllib.request.Request("https://api.cloudflare.com/client/v4/graphql",data=json.dumps(body).encode(),headers={"Authorization":"Bearer "+token,"Content-Type":"application/json"},method="POST")
    try:
        with urllib.request.build_opener(NoRedirect()).open(request,timeout=20) as response:
            data=json.load(response)
        if data.get("errors"):
            print(label+" unavailable: analytics API rejected query.")
            return
        rows=data["data"]["viewer"]["accounts"][0]["workersInvocationsAdaptive"]
        for row in rows:
            status=row.get("dimensions",{}).get("status","unknown")
            if not isinstance(status,str) or not re.fullmatch(r"[A-Za-z0-9_-]{1,80}",status):
                status="unknown"
            metrics={k:v for group in ("sum","quantiles") for k,v in row.get(group,{}).items() if k in ("requests","errors","subrequests","cpuTimeP50","cpuTimeP99") and isinstance(v,(int,float))}
            print(label,json.dumps({"window_hours":hours,"status":status,**metrics}))
        if not rows: print(label+" no sampled invocations.")
    except urllib.error.HTTPError as error:
        print(label+" unavailable: HTTP",error.code)
    except (OSError,ValueError,KeyError,IndexError,TypeError):
        print(label+" unavailable: transport or schema error.")

report("gth-pro-preview-20261126",3,"PREVIEW_METRICS")
report("gth-pro-production",24,"PRODUCTION_METRICS")
