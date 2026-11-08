/**
 * Daily, read-only SEO protection of published sitemap pages.
 * A successful run is NOT proof of Google indexing, ranking, or traffic.
 * Do not fetch private dashboards, session links, credentials or search queries.
 */
const origin = "https://www.gthproglobal.com";
const seedPaths = ["/", "/travel", "/flights", "/hotels", "/tours", "/tender", "/real-estate", "/destinations/mumbai", "/blog/how-to-compare-flight-fares"];
const errors = [];
const warnings = [];
const decode = (s) => s.replace(/&amp;/g, "&").replace(/&#39;|&#x27;/g, "'").replace(/&quot;/g, '"');
async function get(path) {
  const response = await fetch(origin + path, { redirect: "manual", cache: "no-store", signal: AbortSignal.timeout(20000) });
  if (response.status !== 200) throw new Error("HTTP " + response.status);
  return response.text();
}
function tag(html, regex) { return decode(html.match(regex)?.[1] || ""); }
let sitemapPaths = [];
try {
  const robots = await get("/robots.txt");
  if (!robots.includes("Sitemap: " + origin + "/sitemap.xml")) errors.push("robots.txt: missing correct Sitemap");
  if (!robots.includes("Sitemap: " + origin + "/sitemap-index.xml")) errors.push("robots.txt: missing property sitemap index");
  const xml = await get("/sitemap.xml");
  const urls = [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map(m => decode(m[1]));
  if (!urls.length) errors.push("sitemap.xml: empty");
  if (urls.length !== new Set(urls).size) errors.push("sitemap.xml: duplicate URL entries");
  for (const u of urls) {
    try {
      const parsed = new URL(u);
      if (parsed.origin !== origin || parsed.search || parsed.hash || parsed.username || parsed.password) {
        errors.push("sitemap.xml: invalid canonical origin/URL");
        continue;
      }
      sitemapPaths.push(parsed.pathname);
    } catch { errors.push("sitemap.xml: invalid URL"); }
  }
  console.log("Sitemap URLs discovered: " + urls.length);
  const rootPaths = new Set(sitemapPaths);
  // Inspect the published sitemap index and sample every content category.
  // Never fetch all 30,000 detail URLs in one daily monitor (cost/traffic-safe).
  const indexXml = await get("/sitemap-index.xml");
  if (!/<sitemapindex\b/.test(indexXml)) errors.push("sitemap-index.xml: invalid XML root");
  const shardUrls = [...indexXml.matchAll(/<loc>([^<]+)<\/loc>/g)]
    .map(m => decode(m[1]))
    .filter(v => v !== origin + "/sitemap.xml");
  if (shardUrls.length !== new Set(shardUrls).size) errors.push("sitemap-index.xml: duplicate sitemaps");
  const groups = new Map();
  for (const u of shardUrls) {
    let path;
    try {
      const parsed = new URL(u);
      if (parsed.origin !== origin || parsed.search || parsed.hash ||
        !/^\/seo-sitemaps\/(hotels|tours|destinations|attractions|tenders|properties)\/[0-9]+\.xml$/.test(parsed.pathname)) {
        errors.push("sitemap-index.xml: invalid shard URL");
        continue;
      }
      path = parsed.pathname;
    } catch { errors.push("sitemap-index.xml: invalid shard URL"); continue; }
    const kind = path.split("/")[2];
    const current = groups.get(kind) || [];
    current.push(path);
    groups.set(kind, current);
  }
  const sampled = [...groups.values()].flatMap(v => v.length > 1 ? [v[0], v[v.length - 1]] : v).slice(0, 12);
  for (const shard of sampled) {
    const xml = await get(shard);
    if (!/<urlset\b/.test(xml)) { errors.push(shard + ": invalid sitemap root"); continue; }
    const found = [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map(m => decode(m[1]));
    if (!found.length || found.length > 1000) { errors.push(shard + ": empty/oversized shard"); continue; }
    if (found.length !== new Set(found).size) errors.push(shard + ": duplicate canonical URLs");
    for (const u of [found[0],found[Math.floor(found.length/2)],found[found.length-1]]) {
      try {
        const parsed = new URL(u);
        if (parsed.origin !== origin || parsed.search || parsed.hash) errors.push(shard + ": invalid destination URL");
        else {
          if (shard.startsWith("/seo-sitemaps/properties/") && rootPaths.has(parsed.pathname)) errors.push(shard + ": duplicated root property sitemap canonical URL");
          sitemapPaths.push(parsed.pathname);
        }
      } catch { errors.push(shard + ": invalid listed URL"); }
    }
  }
  // Independent OSM index preserves every existing category shard. Sample at
  // most two OSM shards + two detail pages, never crawl the imported directory.
  if (robots.includes("Sitemap: " + origin + "/attractions/sitemap.xml")) {
    const osmIndex = await get("/attractions/sitemap.xml");
    if (!/<sitemapindex\b/.test(osmIndex)) errors.push("OSM sitemap: invalid index");
    const osmShards = [...osmIndex.matchAll(/<loc>([^<]+)<\/loc>/g)].map(m => decode(m[1]));
    if (osmShards.length !== new Set(osmShards).size) errors.push("OSM sitemap: duplicate shards");
    const validOsmShards = osmShards.filter(value => {
      try {
        const u = new URL(value);
        return u.origin === origin && !u.search && !u.hash && /^\/attractions\/sitemaps\/[A-Z]{2}\/[0-9]+\.xml$/.test(u.pathname);
      } catch { return false; }
    });
    if (validOsmShards.length !== osmShards.length) errors.push("OSM sitemap: invalid shard URL");
    for (const value of validOsmShards.slice(0, 2)) {
      const xml = await get(new URL(value).pathname);
      const urls = [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map(m => decode(m[1]));
      if (!/<urlset\b/.test(xml) || urls.length > 1000 || urls.length !== new Set(urls).size) errors.push("OSM sitemap: invalid or duplicate URL set");
      if (!urls.length) warnings.push("OSM sitemap: source shard has no SEO-eligible records");
      for (const candidate of urls) {
        try {
          const u = new URL(candidate);
          if (u.origin !== origin || u.search || u.hash || !/^\/attractions\/osm\/(node|way|relation)-[1-9][0-9]{0,18}$/.test(u.pathname)) errors.push("OSM sitemap: invalid canonical URL");
        } catch { errors.push("OSM sitemap: invalid canonical URL"); }
      }
      if (urls[0] && urls[0].startsWith(origin + "/attractions/osm/")) sitemapPaths.push(new URL(urls[0]).pathname);
    }
    console.log("OSM sitemap: " + validOsmShards.length + " shards; at most two sampled");
  }
  console.log("SEO index: " + shardUrls.length + " category shards; " + sampled.length + " sampled (not Google indexing proof)");

} catch (error) {
  errors.push("robots/sitemap fetch failed: " + (error instanceof Error ? error.message : "unknown"));
}
const paths = [...new Set([...seedPaths, ...sitemapPaths])];
let passed = 0;
for (let i = 0; i < paths.length; i += 4) {
  await Promise.all(paths.slice(i, i + 4).map(async path => {
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
      // A client-side heading may still appear; surface server markup concerns
      // without falsely treating an intentional loading boundary as a 404.
      if (!/<h1\b/i.test(html)) warnings.push(path + ": H1 absent in initial server HTML");
      if (problems.length) errors.push(path + ": " + problems.join(", "));
      else passed++;
      console.log((problems.length ? "FAIL" : "PASS") + " SEO " + path + (problems.length ? " (" + problems.join(", ") + ")" : ""));
    } catch (error) {
      errors.push(path + ": request failed (" + (error instanceof Error ? error.message : "unknown") + ")");
    }
  }));
}
console.log("PUBLIC_SEO_HEALTH · " + paths.length + " unique pages checked · " + passed + " passed · " + errors.length + " errors · " + warnings.length + " heading warnings");
for (const warning of warnings) console.warn("SEO NOTE: " + warning);
if (errors.length) {
  for (const error of errors) console.error("SEO FAIL: " + error);
  process.exitCode = 1;
} else console.log("Sitemap SEO health passed (not a guarantee of indexing or ranking).");
