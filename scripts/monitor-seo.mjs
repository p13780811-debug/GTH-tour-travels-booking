/** Read-only public SEO monitor. No credentials, tracking IDs or database access. */
const origin = "https://www.gthproglobal.com";
const paths = ["/", "/travel", "/flights", "/hotels", "/tours", "/tender", "/real-estate", "/destinations/mumbai", "/blog/how-to-compare-flight-fares"];
const errors = [];
const decode = (s) => s.replace(/&amp;/g, "&").replace(/&#39;/g, "'").replace(/&quot;/g, '"');
async function get(path) {
  const response = await fetch(origin + path, { redirect: "manual", cache: "no-store", signal: AbortSignal.timeout(15000) });
  if (response.status !== 200) throw new Error("HTTP " + response.status);
  return response.text();
}
function tag(html, regex) { return decode(html.match(regex)?.[1] || ""); }
for (const path of paths) {
  try {
    const html = await get(path);
    const title = tag(html, /<title>([^<]+)<\/title>/i);
    const description = tag(html, /<meta\s+name="description"\s+content="([^"]+)"/i);
    const canonical = tag(html, /<link\s+rel="canonical"\s+href="([^"]+)"/i);
    const robots = tag(html, /<meta\s+name="robots"\s+content="([^"]+)"/i);
    const expected = origin + (path === "/" ? "" : path);
    const problems = [];
    if (title.trim().length < 12 || title.trim().length > 120) problems.push("title");
    if (description.trim().length < 60 || description.trim().length > 300) problems.push("description");
    if (canonical.replace(/\/$/, "") !== expected.replace(/\/$/, "")) problems.push("canonical");
    if (/noindex|nofollow/i.test(robots)) problems.push("noindex");
    if (problems.length) errors.push(path + ": " + problems.join(", "));
    console.log((problems.length ? "FAIL" : "PASS") + " SEO " + path + (problems.length ? " (" + problems.join(", ") + ")" : ""));
  } catch (error) {
    errors.push(path + ": request failed (" + (error instanceof Error ? error.message : "unknown") + ")");
  }
}
try {
  const robots = await get("/robots.txt");
  if (!robots.includes("Sitemap: " + origin + "/sitemap.xml")) errors.push("robots.txt: missing correct Sitemap");
  const xml = await get("/sitemap.xml");
  const urls = [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map(m => decode(m[1]));
  if (!urls.length) errors.push("sitemap.xml: empty");
  for (const u of urls) {
    try {
      const parsed = new URL(u);
      if (parsed.origin !== origin || parsed.search || parsed.hash) errors.push("sitemap.xml: invalid canonical origin/URL");
    } catch { errors.push("sitemap.xml: invalid URL"); }
  }
  console.log("Sitemap URLs discovered: " + urls.length);
} catch (error) { errors.push("robots/sitemap fetch failed: " + (error instanceof Error ? error.message : "unknown")); }
if (errors.length) {
  for (const error of errors) console.error("SEO FAIL: " + error);
  process.exitCode = 1;
} else console.log("SEO health checks passed (not a guarantee of indexing or ranking).");
