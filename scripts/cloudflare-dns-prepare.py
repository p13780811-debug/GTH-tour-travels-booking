"""Prepare only a pending Free DNS zone; never change registrar or live DNS."""
import os,json,urllib.request,urllib.error,re,subprocess,shlex
token=os.environ["CLOUDFLARE_API_TOKEN"]
account=os.environ["CLOUDFLARE_ACCOUNT_ID"]
domain="gthproglobal.com"
if not token or not re.fullmatch(r"[0-9a-fA-F]{32}",account): raise SystemExit("Missing account credentials")
expected=json.loads("[{\"type\":\"CNAME\",\"name\":\"hotel.gthproglobal.com\",\"content\":\"d3bkfvti7cff3x.cloudfront.net.\",\"ttl\":60,\"proxied\":false},{\"type\":\"CNAME\",\"name\":\"_ba62da097168f061736ce2e086f167f2.hotel.gthproglobal.com\",\"content\":\"_3a2ddd8e743d1698cf34cb817a59e16b.wzccmgtwzk.acm-validations.aws.\",\"ttl\":60,\"proxied\":false},{\"type\":\"CAA\",\"name\":\"gthproglobal.com\",\"content\":\"0 issue \\\"amazonaws.com\\\"\",\"ttl\":60},{\"type\":\"CAA\",\"name\":\"gthproglobal.com\",\"content\":\"0 issue \\\"awstrust.com\\\"\",\"ttl\":60},{\"type\":\"CAA\",\"name\":\"gthproglobal.com\",\"content\":\"0 issue \\\"amazontrust.com\\\"\",\"ttl\":60},{\"type\":\"CAA\",\"name\":\"gthproglobal.com\",\"content\":\"0 issue \\\"amazon.com\\\"\",\"ttl\":60},{\"type\":\"CNAME\",\"name\":\"hotels.gthproglobal.com\",\"content\":\"d2t5k6cv5h5cmj.cloudfront.net.\",\"ttl\":60,\"proxied\":false},{\"type\":\"CNAME\",\"name\":\"_d4844420ec8fa957bd1f363a85f50871.hotels.gthproglobal.com\",\"content\":\"_21fce2abe8b00385ab492346c019f5fe.wzccmgtwzk.acm-validations.aws.\",\"ttl\":60,\"proxied\":false},{\"type\":\"CNAME\",\"name\":\"transport.gthproglobal.com\",\"content\":\"whitelabel.12go.asia.\",\"ttl\":60,\"proxied\":false},{\"type\":\"TXT\",\"name\":\"zmail._domainkey.gthproglobal.com\",\"content\":\"v=DKIM1; k=rsa; p=MIGfMA0GCSqGSIb3DQEBAQUAA4GNADCBiQKBgQCYXzOE7uhoDhsZ1eaEo8glvOatwzasevIguN8O9ACizfwGbCVaWBT46aq379bCKp3FcqlBf8S/lBVw5ZGs5G9cRokDmS9S1W3ILsriGQJSysHvXc/1QhtvMrHDEqXxAzEy1dqq5JMbc5+FEruyViVKXDuDwbwNbdCAhPI3r4JeRwIDAQAB\",\"ttl\":60},{\"type\":\"TXT\",\"name\":\"gthproglobal.com\",\"content\":\"v=spf1 include:zoho.in ~all\",\"ttl\":60},{\"type\":\"MX\",\"name\":\"gthproglobal.com\",\"content\":\"mx3.zoho.in.\",\"ttl\":60,\"priority\":50},{\"type\":\"MX\",\"name\":\"gthproglobal.com\",\"content\":\"mx2.zoho.in.\",\"ttl\":60,\"priority\":20},{\"type\":\"MX\",\"name\":\"gthproglobal.com\",\"content\":\"mx.zoho.in.\",\"ttl\":60,\"priority\":10},{\"type\":\"TXT\",\"name\":\"gthproglobal.com\",\"content\":\"zoho-verification=zb11266169.zmverify.zoho.in\",\"ttl\":60},{\"type\":\"TXT\",\"name\":\"gthproglobal.com\",\"content\":\"google-site-verification=afvFwTEtR21ZWZaOQ3CbvcxnmpEWIBy4xZTzAPFcIPQ\",\"ttl\":60},{\"type\":\"CAA\",\"name\":\"gthproglobal.com\",\"content\":\"0 issue \\\"pki.goog\\\"\",\"ttl\":60},{\"type\":\"CAA\",\"name\":\"gthproglobal.com\",\"content\":\"0 issue \\\"sectigo.com\\\"\",\"ttl\":60},{\"type\":\"CAA\",\"name\":\"gthproglobal.com\",\"content\":\"0 issue \\\"letsencrypt.org\\\"\",\"ttl\":60}]")
def api(method,path,body=None):
    req=urllib.request.Request("https://api.cloudflare.com/client/v4"+path,method=method,headers={"Authorization":"Bearer "+token,"Content-Type":"application/json"},data=json.dumps(body).encode() if body is not None else None)
    try:
        with urllib.request.urlopen(req,timeout=25) as r: d=json.load(r)
    except urllib.error.HTTPError as e:
        try: codes=[x.get("code") for x in json.load(e).get("errors",[])]
        except Exception: codes=[]
        raise RuntimeError("Cloudflare HTTP "+str(e.code)+" codes="+str(codes)) from None
    if not d.get("success"): raise RuntimeError("Cloudflare rejected request")
    return d
zones=api("GET","/zones?name="+domain+"&account.id="+account)["result"]
if len(zones)>1: raise SystemExit("Ambiguous zone inventory")
if zones: z=zones[0]
else: z=api("POST","/zones",{"name":domain,"account":{"id":account},"type":"full"})["result"]
if z.get("name")!=domain or z.get("account",{}).get("id")!=account or z.get("plan",{}).get("legacy_id")!="free":
    raise SystemExit("Zone identity or Free plan not verified; no DNS record changes")
print("ZONE",z.get("status"),"FREE",flush=True)
print("ASSIGNED_NS",json.dumps(z.get("name_servers",[])),flush=True)
zone=z["id"]
def normalized(r):
    t=r["type"]
    c=r.get("content","")
    if t in ("CNAME","MX"): c=c.rstrip(".").lower()
    if t=="TXT" and c.startswith('"') and c.endswith('"'): c=c[1:-1]
    if t=="CAA" and r.get("data"): 
        d=r["data"]; c=str(d["flags"])+" "+d["tag"]+" "+d["value"].strip('"')
    elif t=="CAA": c=c.replace('"',"")
    return (t,r["name"].rstrip(".").lower(),c,r.get("priority") if t=="MX" else None)
def fetch_records():
    d=api("GET","/zones/"+zone+"/dns_records?per_page=100")
    if d.get("result_info",{}).get("total_pages",1)>1: raise SystemExit("Incomplete DNS inventory")
    return d["result"]
def verify_authoritative():
    # Pending Cloudflare zones answer directly on assigned nameservers.
    # This is an independent read-only check, not a claim of API access.
    nameservers=z.get("name_servers",[])
    if len(nameservers)!=2 or any(not re.fullmatch(r"[a-z0-9-]+\.ns\.cloudflare\.com",n) for n in nameservers):
        raise SystemExit("Unexpected nameservers")
    all_ok=True
    for ns in nameservers:
        matched=0
        for name,kind in sorted(set((e["name"],e["type"]) for e in expected)):
            result=subprocess.run(["dig","@"+ns,name,kind,"+short","+norecurse","+time=3","+tries=1"],capture_output=True,text=True)
            actual=[]
            for line in result.stdout.splitlines():
                try:
                    fields=shlex.split(line)
                    if kind=="MX" and len(fields)==2: actual.append(normalized({"type":kind,"name":name,"priority":int(fields[0]),"content":fields[1]}))
                    elif kind=="CAA" and len(fields)==3: actual.append(normalized({"type":kind,"name":name,"content":" ".join(fields)}))
                    elif kind=="TXT" and fields: actual.append(normalized({"type":kind,"name":name,"content":"".join(fields)}))
                    elif kind=="CNAME" and len(fields)==1: actual.append(normalized({"type":kind,"name":name,"content":fields[0]}))
                except (ValueError,IndexError): pass
            for e in expected:
                if (e["name"],e["type"])!=(name,kind): continue
                if normalized(e) in actual: matched+=1
                else: print("DNS_MISMATCH",ns,kind,name,flush=True)
        print("AUTHORITATIVE_PARITY",ns,matched,"/19",flush=True)
        all_ok=all_ok and matched==19
    for kind in ("NS","DS"):
        r=subprocess.run(["dig",domain,kind,"+short","+time=3","+tries=1"],capture_output=True,text=True)
        print("CURRENT_"+kind,json.dumps(r.stdout.splitlines()),flush=True)
    return all_ok
try:
    current=fetch_records()
except RuntimeError as e:
    print("DNS_API_BLOCKED",str(e),flush=True)
    if verify_authoritative():
        print("All 19 record values verified on assigned nameservers. Proxy setting and live activation still require separate checks.",flush=True)
        raise SystemExit(0)
    raise SystemExit("DNS parity incomplete; no nameserver change")
pending=z.get("status")=="pending"
# Never modify active zones or replace existing mismatched records.
for e in expected:
    same=[r for r in current if normalized(r)==normalized(e)]
    if same:
        if e["type"]=="CNAME" and any(r.get("proxied") for r in same): raise SystemExit("Existing supplier CNAME is proxied; review before changing")
        continue
    if not pending: raise SystemExit("Missing record in non-pending zone; no changes")
    if e["type"]=="CNAME" and any(r.get("name")==e["name"] for r in current): raise SystemExit("Conflicting supplier hostname; no overwrite")
    payload=dict(e)
    if e["type"]=="CAA":
        flags,tag,value=e["content"].split(" ",2)
        payload.pop("content")
        payload["data"]={"flags":int(flags),"tag":tag,"value":value.strip('"')}
    created=api("POST","/zones/"+zone+"/dns_records",payload)["result"]
    current.append(created)
    print("PRESERVED",e["type"],e["name"],flush=True)
current=fetch_records()
matches=sum(any(normalized(r)==normalized(e) and (e["type"]!="CNAME" or r.get("proxied") is False) for r in current) for e in expected)
print("PRESERVED_RECORDS",matches,"/19",flush=True)
if matches!=19: raise SystemExit("DNS parity failed")
print("No nameserver or public Worker routing changes made.",flush=True)
