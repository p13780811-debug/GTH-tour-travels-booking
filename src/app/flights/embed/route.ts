/**
 * Dedicated same-origin browser document for Travelpayouts White Label Web.
 *
 * The supplier script executes in a normal HTTPS page (not opaque about:srcdoc),
 * with the official search/results anchors. The iframe keeps ordinary styles
 * and fonts in its own document instead of the persistent Next.js SPA DOM.
 * Only the exact /flights/embed URL may be framed by our own site.
 */
export const dynamic = "force-dynamic";

const html = `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Aviasales flight search and tickets | GTH PRO</title>
</head>
<body style="margin:0;min-height:200px">
  <main aria-label="Aviasales flight booking widget">
    <div id="tpwl-search"></div>
    <div id="tpwl-tickets"></div>
  </main>
  <script>
  (function () {
    var CHANNEL = "gth-tpwl-23459";
    var ready = false;
    function emit(type, height) {
      window.parent.postMessage({ channel: CHANNEL, type: type, height: height }, window.location.origin);
    }
    function size() {
      emit("height", Math.max(360, document.documentElement.scrollHeight || 0, document.body.scrollHeight || 0));
    }
    function hasSearchForm() {
      var search = document.getElementById("tpwl-search");
      var results = document.getElementById("tpwl-tickets");
      return (search && search.childElementCount > 0) || (results && results.childElementCount > 0);
    }
    function checkReady() {
      if (!ready && hasSearchForm()) {
        ready = true;
        emit("ready");
      }
      size();
    }
    if (window.ResizeObserver) {
      var layoutObserver = new ResizeObserver(size);
      layoutObserver.observe(document.body);
      layoutObserver.observe(document.documentElement);
    }
    var contentObserver = new MutationObserver(checkReady);
    contentObserver.observe(document.querySelector("main"), { childList: true, subtree: true });
    window.addEventListener("load", checkReady);
    function loadWidget(src, retry) {
      var script = document.createElement("script");
      script.type = "module";
      script.async = true;
      script.src = src;
      script.setAttribute("data-gth-white-label", "23459");
      script.onload = checkReady;
      script.onerror = function () {
        script.remove();
        if (retry) {
          loadWidget("https://tpwgts.com/wl_web/main.js?wl_id=23459", false);
        } else {
          emit("error");
        }
      };
      document.head.appendChild(script);
    }
    loadWidget("https://tpwidg.com/wl_web/main.js?wl_id=23459", true);
    checkReady();
  })();
  </script>
</body>
</html>`;

export function GET() {
  return new Response(html, {
    status: 200,
    headers: {
      "Content-Type": "text/html; charset=utf-8",
      "Cache-Control": "no-store",
      "X-Content-Type-Options": "nosniff",
      "X-Frame-Options": "SAMEORIGIN",
      "Content-Security-Policy": "frame-ancestors 'self'; base-uri 'none'; object-src 'none'",
      "Referrer-Policy": "strict-origin-when-cross-origin",
    },
  });
}
