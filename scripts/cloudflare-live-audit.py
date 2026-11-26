"""Bounded read-only production inventory and temporary authenticated preview QA.
No production writes, no credential output, no booking/lead submission.
"""
import json, os, re, subprocess, time, urllib.request, urllib.error, urllib.parse
from statistics import median

account=os.environ["CLOUDFLARE_ACCOUNT_ID"]
token=os.environ["CLOUDFLARE_API_TOKEN"]
worker="gth-pro-preview-20261126"
host=worker+".p13780811.workers.dev"
base="/accounts/"+account
if not re.fullmatch(r"[a-fA-F0-9]{32}",account) or not token:
    raise SystemExit("Missing account credentials")
class NoRedirect(urllib.request.HTTPRedirectHandler):
    def redirect_request(self, req, fp, code, msg, headers, newurl):
        return None
opener=urllib.request.build_opener(NoRedirect())
def api(method,path,body=None):
    req=urllib.request.Request("https://api.cloudflare.com/client/v4"+path,
        headers={"Authorization":"Bearer "+token,"Content-Type":"application/json"},
        data=None if body is None else json.dumps(body).encode(),method=method)
    try:
        with opener.open(req,timeout=25) as response:
            data=json.load(response)
    except urllib.error.HTTPError as e:
        try: codes=[x.get("code") for x in json.load(e).get("errors",[])]
        except Exception: codes=[]
        raise RuntimeError("HTTP "+str(e.code)+" codes="+str(codes)) from None
    if not data.get("success"):
        raise RuntimeError("Cloudflare API rejected request")
    return data.get("result")
def inventory(label,path):
    try: return api("GET",path)
    except Exception as e:
        print(label+" unavailable: "+str(e),flush=True)
        return None
def request(url,headers=None):
    start=time.perf_counter()
    try:
        with opener.open(urllib.request.Request(url,headers={"User-Agent":"GTH-Release-Audit/1.0",**(headers or {})}),timeout=25) as r:
            status=r.status; h=r.headers; data=r.read(2_000_000)
    except urllib.error.HTTPError as e:
        status=e.code; h=e.headers; data=b""
    except Exception:
        return {"status":0,"ms":round((time.perf_counter()-start)*1000),"state":"network_or_timeout"}
    dest=urllib.parse.urlparse(h.get("Location",""))
    result={"status":status,"ms":round((time.perf_counter()-start)*1000),
        "cache":h.get("CF-Cache-Status",""),"content_type":h.get("Content-Type","").split(";")[0],
        "redirect_host":dest.hostname or ("same-origin" if h.get("Location","").startswith("/") else ""),
        "cache_control":h.get("Cache-Control","")}
    if "json" in result["content_type"] and data:
        try:
            obj=json.loads(data)
            if isinstance(obj,dict):
                result["counts"]={k:len(obj[k]) for k in ("items","cities","hotels","reports","zones","data","features") if isinstance(obj.get(k),list)}
                for key in ("state","degraded","countryRequired"):
                    value=obj.get(key)
                    if isinstance(value,bool) or value in ("available","unavailable","unknown","empty","partial"): result[key]=value
                result["has_error"]=bool(obj.get("error"))
        except Exception: result["invalid_json"]=True
    elif "html" in result["content_type"]:
        lower=data.lower()
        result["html_bytes"]=len(data)
        result["runtime_error_marker"]=b"application error: a server-side exception" in lower or b"worker threw exception" in lower
    return result
print("PREVIEW_ANONYMOUS",json.dumps(request("https://"+host+"/")),flush=True)
print("PRODUCTION_CURRENT",json.dumps(request("https://gthproglobal.com/")),flush=True)
for name in ("gthproglobal.com","www.gthproglobal.com","hotel.gthproglobal.com"):
    for kind in ("NS","A","CNAME"):
        p=subprocess.run(["dig","+short","+time=3","+tries=1",name,kind],capture_output=True,text=True)
        values=[v.strip() for v in p.stdout.splitlines() if re.fullmatch(r"[A-Za-z0-9.:-]+",v.strip())]
        print("PUBLIC_DNS",name,kind,json.dumps(values),flush=True)
zones=inventory("Zone inventory","/zones?name=gthproglobal.com")
if isinstance(zones,list):
    for z in zones:
        if z.get("name")!="gthproglobal.com": continue
        print("ZONE_STATUS",z.get("status"),flush=True)
        for name in ("gthproglobal.com","www.gthproglobal.com","hotel.gthproglobal.com"):
            records=inventory("DNS "+name,"/zones/"+z["id"]+"/dns_records?name="+urllib.parse.quote(name))
            if isinstance(records,list):
                for r in records:
                    if r.get("type") in ("A","AAAA","CNAME"):
                        print("DNS_ORIGIN",json.dumps({k:r.get(k) for k in ("name","type","content","proxied","ttl")}),flush=True)
metadata=inventory("Worker identity",base+"/workers/workers/"+worker)
if not isinstance(metadata,dict) or metadata.get("name")!=worker:
    raise SystemExit("Cannot verify preview Worker identity")
apps=inventory("Access inventory",base+"/access/apps?per_page=100")
if not isinstance(apps,list): raise SystemExit("Cannot verify Access policy")
matches=[a for a in apps if a.get("name")=="GTH PRO private preview 20261126" and any(d.get("type")=="worker" and d.get("worker_id")==metadata.get("id") for d in a.get("destinations",[]))]
if len(matches)!=1: raise SystemExit("Expected one isolated preview Access application")
aid=matches[0]["id"]
policies=api("GET",base+"/access/apps/"+aid+"/policies")
if len(policies)!=1 or policies[0].get("decision")!="allow" or len(policies[0].get("include",[]))!=1 or not policies[0]["include"][0].get("email"):
    raise SystemExit("Unexpected existing preview policy; no changes made")
print("PREVIEW_ACCESS owner-only verified",flush=True)
sid=pid=None
failed=False
try:
    try:
        t=api("POST",base+"/access/service_tokens",{"name":"GTH preview QA "+os.environ["GITHUB_RUN_ID"],"duration":"15m"})
    except Exception as e:
        raise RuntimeError("Temporary authenticated audit token creation blocked: "+str(e)) from None
    sid=t["id"]; cid=t["client_id"]; secret=t["client_secret"]
    print("::add-mask::"+cid,flush=True); print("::add-mask::"+secret,flush=True)
    p=api("POST",base+"/access/apps/"+aid+"/policies",{"name":"Temporary isolated QA "+os.environ["GITHUB_RUN_ID"],"decision":"non_identity","include":[{"service_token":{"token_id":sid}}],"precedence":1})
    pid=p["id"]
    if p.get("decision")!="non_identity": raise RuntimeError("Unexpected temporary policy decision")
    headers={"CF-Access-Client-Id":cid,"CF-Access-Client-Secret":secret}
    routes=[
      "/", "/hotels","/flights","/destinations/goa","/destinations/tokyo",
      "/mobility","/mobility/mumbai","/mobility/kolkata","/go/transport","/real-estate",
      "/real-estate/registry","/real-estate/tools","/tender","/tender/assistant",
      "/stadiums","/stadiums/wankhede-stadium","/tickets","/tickets/sports",
      "/api/mobility/cities?q=Mumbai","/api/mobility/map?city=mumbai",
      "/api/mobility/traffic?city=mumbai","/api/real-estate/registry-preview?q=Mumbai",
      "/api/tender?scope=world&country=IN","/api/stadiums/concierge?venue=wankhede-stadium",
      "/api/hotels/booking?city=Tokyo&country=JP","/api/hotels/booking?city=Mumbai&country=IN"
    ]
    for path in routes:
        first=request("https://"+host+path,headers)
        second=request("https://"+host+path,headers) if not path.startswith("/api/") else None
        print("ROUTE",json.dumps({"path":path,"first":first,"repeat":second}),flush=True)
        if (path=="/go/transport" and (first["status"]!=307 or first.get("redirect_host") not in ("transport.gthproglobal.com","12go.asia"))) or first["status"] not in (200,301,302,307,308) or first.get("runtime_error_marker") or first.get("has_error") or first.get("invalid_json") or first.get("redirect_host","").endswith(".cloudflareaccess.com") or first.get("redirect_host")=="gthproglobal.com":
            failed=True
    print("ROUTE_AUDIT", "FAILURES_PRESENT" if failed else "HTTP_CHECKS_PASSED",flush=True)
finally:
    cleanup_failed=False
    for path in ([base+"/access/apps/"+aid+"/policies/"+pid] if pid else [])+([base+"/access/service_tokens/"+sid] if sid else []):
        try: api("DELETE",path)
        except Exception as e:
            print("TEMPORARY_QA_CLEANUP_FAILED",str(e),flush=True); cleanup_failed=True
    if sid or pid: print("TEMPORARY_QA_CLEANUP", "FAILED" if cleanup_failed else "OK",flush=True)
    if cleanup_failed: raise SystemExit("Cleanup needs operator review")
if failed: raise SystemExit("Preview route audit found failures; no cutover")
