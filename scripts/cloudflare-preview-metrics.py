"""Read-only aggregate metrics for the owner-protected staging Worker."""
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
body = {"query":query,"variables":{"accountTag":account,"datetimeStart":start.isoformat(),"datetimeEnd":end.isoformat(),"scriptName":"gth-pro-preview-20261126"}}
request = urllib.request.Request("https://api.cloudflare.com/client/v4/graphql",data=json.dumps(body).encode(),headers={"Authorization":"Bearer "+token,"Content-Type":"application/json"},method="POST")
class NoRedirect(urllib.request.HTTPRedirectHandler):
    def redirect_request(self, req, fp, code, msg, headers, newurl):
        return None
try:
    with urllib.request.build_opener(NoRedirect()).open(request,timeout=20) as response:
        data=json.load(response)
    if data.get("errors"):
        print("Preview metrics unavailable: analytics API rejected query (check Account Analytics Read).")
    else:
        rows=data["data"]["viewer"]["accounts"][0]["workersInvocationsAdaptive"]
        for row in rows:
            status=row.get("dimensions",{}).get("status","unknown")
            if not isinstance(status,str) or not re.fullmatch(r"[A-Za-z0-9_-]{1,80}",status):
                status="unknown"
            metrics={k:v for group in ("sum","quantiles") for k,v in row.get(group,{}).items() if k in ("requests","errors","subrequests","cpuTimeP50","cpuTimeP99") and isinstance(v,(int,float))}
            print("PREVIEW_METRICS",json.dumps({"status":status,**metrics}))
        if not rows: print("No sampled preview invocations in selected window.")
except urllib.error.HTTPError as error:
    print("Preview metrics unavailable: HTTP",error.code)
except (OSError,ValueError,KeyError,IndexError,TypeError):
    print("Preview metrics unavailable: transport or schema error.")
