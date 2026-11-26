"""Read-only public HTTPS checks: no credentials, no bookings, no DNS writes."""
import socket,ssl,urllib.request,urllib.error,urllib.parse,subprocess,json
ctx=ssl.create_default_context()
host="transport.gthproglobal.com"
with socket.create_connection((host,443),timeout=15) as sock:
    with ctx.wrap_socket(sock,server_hostname=host) as tls:
        cert=tls.getpeercert()
        print("TRANSPORT_TLS",json.dumps({"hostname":host,"protocol":tls.version(),"notBefore":cert["notBefore"],"notAfter":cert["notAfter"],"subjectAltName":cert.get("subjectAltName"),"issuer":cert.get("issuer")}),flush=True)
print("TRANSPORT_CNAME",subprocess.check_output(["dig","+short","+time=3","+tries=2",host,"CNAME"],text=True).strip(),flush=True)
class Manual(urllib.request.HTTPRedirectHandler):
    def redirect_request(self,*args,**kwargs): return None
opener=urllib.request.build_opener(Manual(),urllib.request.HTTPSHandler(context=ctx))
def probe(url):
    chain=[]
    for _ in range(6):
        parsed=urllib.parse.urlsplit(url)
        assert parsed.scheme=="https" and parsed.hostname in ("gthproglobal.com","www.gthproglobal.com",host) and not parsed.username and not parsed.password and parsed.port in (None,443),"Unexpected redirect host"
        try:
            with opener.open(urllib.request.Request(url,headers={"User-Agent":"GTH-ReadOnly-Transport-QA/1.0"}),timeout=20) as r:
                status=r.status; headers=r.headers; data=r.read(2000000)
        except urllib.error.HTTPError as e:
            status=e.code;headers=e.headers;data=e.read(2000)
        chain.append((parsed.hostname,status))
        if status in (301,302,303,307,308):
            url=urllib.parse.urljoin(url,headers["Location"]);continue
        print("TRANSPORT_HTTP",json.dumps({"chain":chain,"final_host":parsed.hostname,"final_path":parsed.path,"status":status}),flush=True)
        assert status==200 and parsed.hostname==host and b"12go" in data.lower(),"Transport white label was not reached"
        return
    raise AssertionError("Redirect limit exceeded")
probe("https://"+host+"/")
probe("https://www.gthproglobal.com/go/transport")
print("TRANSPORT_TLS_AND_HANDOFF_VERIFIED",flush=True)
