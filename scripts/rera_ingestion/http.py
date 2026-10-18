"""One HTTP transport: bounded responses, truthful identity, paced retries and robots."""
from __future__ import annotations

import ipaddress
import socket
import time
from urllib.parse import urljoin, urlparse
from urllib.robotparser import RobotFileParser

import requests
from requests.adapters import HTTPAdapter
from urllib3.exceptions import MaxRetryError, ProtocolError
from urllib3.response import HTTPResponse
from urllib3.util.retry import Retry

from .models import IngestionError


class RateLimiter:
    def __init__(self, delay=5.0, clock=time.monotonic, sleep=time.sleep):
        if not 1.5 <= delay <= 60:
            raise IngestionError("Request delay must be between 1.5 and 60 seconds")
        self.delay, self.clock, self.sleep = delay, clock, sleep
        self.next_allowed = 0.0

    def wait(self):
        remaining = self.next_allowed - self.clock()
        if remaining > 0:
            self.sleep(remaining)
        self.next_allowed = self.clock() + self.delay

    def defer(self, seconds):
        self.next_allowed = max(self.next_allowed, self.clock() + seconds)


def validate_url(url: str, hosts: set[str] | frozenset[str], resolve=True):
    p = urlparse(url)
    if p.scheme != "https" or p.hostname not in hosts or p.username or p.password or p.port not in (None, 443):
        raise IngestionError("HTTP destination is outside the configured HTTPS allowlist")
    if resolve:
        try:
            addresses = socket.getaddrinfo(p.hostname, 443, type=socket.SOCK_STREAM)
            if not addresses or any(not ipaddress.ip_address(a[4][0]).is_global for a in addresses):
                raise IngestionError("Private or reserved network destinations are forbidden")
        except socket.gaierror:
            raise IngestionError("Source DNS lookup failed") from None
    return p


class Http:
    def __init__(self, limiter: RateLimiter, user_agent: str, retries=3, session=None):
        self.limiter, self.user_agent = limiter, user_agent
        self.session = session or requests.Session()
        self.session.headers.update({"User-Agent": user_agent, "Accept": "text/html,application/json;q=0.9,*/*;q=0.8"})
        # Automatic adapter retries/redirects would bypass the shared limiter.
        self.session.mount("https://", HTTPAdapter(max_retries=0))
        self.retry = Retry(total=retries, connect=retries, read=retries, status=retries,
            backoff_factor=1.0, allowed_methods={"GET", "POST"}, status_forcelist={429, 500, 502, 503, 504}, respect_retry_after_header=True)
        self.robots = {}
        self.request_count = 0

    def request(self, url, *, hosts, method="GET", data=None, max_bytes=4_000_000, allow_404=False):
        retry, redirects = self.retry, 0
        while True:
            validate_url(url, hosts)
            self.limiter.wait()
            self.request_count += 1
            if self.request_count > 250:
                raise IngestionError("Per-run HTTP request budget exceeded")
            try:
                response = self.session.request(method, url, data=data, timeout=(10, 35), allow_redirects=False, stream=True)
            except requests.RequestException:
                try:
                    retry = retry.increment(method=method, error=ProtocolError("Source connection failure"))
                except MaxRetryError:
                    raise IngestionError("Source connection failed after bounded retries") from None
                self.limiter.defer(retry.get_backoff_time())
                continue
            status = response.status_code
            if status in (301, 302, 307, 308):
                target = urljoin(url, response.headers.get("Location", ""))
                response.close()
                if not target or target == url or redirects >= 3:
                    raise IngestionError("Source redirect is unsupported")
                validate_url(target, hosts)
                if any(word in urlparse(target).path.casefold() for word in ("login", "signin", "/auth")):
                    raise IngestionError("Source requires sign-in; use an authorized export")
                url, redirects = target, redirects + 1
                continue
            if status in (401, 403, 303):
                response.close()
                raise IngestionError("Source denied automated access or requires a session; use an authorized export")
            retry_response = HTTPResponse(status=status, headers=response.headers)
            if retry.is_retry(method, status, has_retry_after="Retry-After" in response.headers):
                try:
                    after = retry.get_retry_after(retry_response) or 0
                    if after > 600:
                        raise IngestionError("Source requested a long pause; stop this run and retry later")
                    retry = retry.increment(method=method, response=retry_response)
                except MaxRetryError:
                    raise IngestionError("Source throttled or failed after bounded retries") from None
                finally:
                    response.close()
                self.limiter.defer(max(after, retry.get_backoff_time(), 30 if status in (429, 406) else 0))
                continue
            if status == 404 and allow_404:
                response.close()
                return b"", "", url
            if not 200 <= status < 300:
                response.close()
                raise IngestionError("Source returned an unsupported HTTP status")
            try:
                body = bytearray()
                for chunk in response.iter_content(64 * 1024):
                    body.extend(chunk)
                    if len(body) > max_bytes:
                        raise IngestionError("Source response exceeded its size budget")
                return bytes(body), response.headers.get("Content-Type", ""), url
            except requests.RequestException:
                raise IngestionError("Source response was interrupted; no partial response accepted") from None
            finally:
                response.close()

    def check_robots(self, url, hosts):
        p = urlparse(url)
        origin = f"{p.scheme}://{p.netloc}"
        if origin not in self.robots:
            raw, content_type, _ = self.request(origin + "/robots.txt", hosts=hosts, max_bytes=200_000, allow_404=True)
            if raw and "html" in content_type.casefold():
                raise IngestionError("Robots policy was not readable; use an authorized export")
            policy = RobotFileParser()
            policy.parse(raw.decode("utf-8", errors="replace").splitlines())
            self.robots[origin] = policy
        policy = self.robots[origin]
        if not policy.can_fetch(self.user_agent, url):
            raise IngestionError("Robots policy disallows this source route")
        crawl_delay = policy.crawl_delay(self.user_agent) or policy.crawl_delay("*")
        if crawl_delay:
            self.limiter.delay = max(self.limiter.delay, crawl_delay)

    def official(self, url, hosts):
        self.check_robots(url, hosts)
        raw, content_type, final_url = self.request(url, hosts=hosts)
        if "html" not in content_type.casefold():
            raise IngestionError("Official source did not return HTML")
        lower = raw.lower()
        if any(marker in lower for marker in (b"g-recaptcha", b"hcaptcha", b"cf-chl-", b"verify you are human")):
            raise IngestionError("Source presents an access challenge; use an authorized export")
        return raw, final_url
