import { chromium } from "playwright";

const browser = await chromium.launch({ headless: true, args: ["--no-sandbox"] });
const widths = [390, 1024, 1280, 1366, 1536, 1920];
const failures = [];

function assertMeasure(ok, description, data) {
  if (!ok) failures.push({ description, data });
}

try {
  for (const width of widths) {
    const context = await browser.newContext({ viewport: { width, height: 840 }, deviceScaleFactor: 1 });
    const page = await context.newPage();
    await page.route(/https:\/\/(?:.*\.)?(?:tpwidg|tpwgts|emrldtp)\.com\//, route => route.abort());
    await page.goto("http://127.0.0.1:3000/flights", { waitUntil: "domcontentloaded", timeout: 60000 });
    await page.locator("[data-gth-shared-nav]").waitFor({ timeout: 30000 });
    await page.evaluate(() => document.fonts.ready);
    const result = await page.evaluate(() => {
      const pick = selector => document.querySelector(selector);
      const bounds = el => {
        if (!el) return null;
        const r = el.getBoundingClientRect();
        return { left: Math.round(r.left), right: Math.round(r.right), width: Math.round(r.width), height: Math.round(r.height) };
      };
      const nav = pick("[data-gth-shared-nav]");
      const shell = pick("[data-gth-navbar-container]");
      const links = pick("[data-gth-desktop-links]");
      const actions = pick("[data-gth-navbar-actions]");
      const visible = el => !!el && getComputedStyle(el).display !== "none" && el.getBoundingClientRect().width > 0;
      const pills = [...(links?.querySelectorAll(":scope > div > a") || [])].filter(visible);
      const estate = pills.find(link => link.textContent?.includes("Real Estate"));
      const searchButton = pick('button[aria-label="Open ecosystem search"]');
      const premium = [...(actions?.querySelectorAll("a") || [])].find(a=>a.textContent?.includes("Premium"));
      return {
        viewport: window.innerWidth,
        nav: bounds(nav), shell: bounds(shell), links: bounds(links), actions: bounds(actions),
        pills: pills.map(a => ({ name: a.textContent?.trim(), bounds: bounds(a), whiteSpace: getComputedStyle(a).whiteSpace })),
        estate: bounds(estate),
        searchButton: visible(searchButton),
        premium: visible(premium) ? bounds(premium) : null,
        pageScrollWidth: document.documentElement.scrollWidth,
        navScrollWidth: nav?.scrollWidth,
        navClientWidth: nav?.clientWidth
      };
    });
    console.log("NAV_BREAKPOINT", JSON.stringify(result));
    assertMeasure(result.nav && result.nav.left >= -1 && result.nav.right <= width+1, "navigation must stay in viewport", result);
    assertMeasure(result.shell && result.shell.right <= width+1, "shell right edge", result);
    if (width >= 1024) {
      assertMeasure(result.pills.length >= (width < 1280 ? 5 : 7), "desktop links count", result);
      assertMeasure(result.pills.every(p => p.bounds.left >= -1 && p.bounds.right <= width+1), "each desktop nav link fits", result);
      assertMeasure(result.pills.every(p => p.whiteSpace === "nowrap"), "desktop pill label never wraps", result);
      assertMeasure(result.actions && result.actions.right <= width+1, "right-hand buttons fit", result);
      assertMeasure(result.estate && result.estate.height <= 50, "Real Estate pill is compact", result);
      assertMeasure(width>=1536 || result.searchButton, "search popover toggle available on medium desktop", result);
      if (width>=1280) assertMeasure(result.premium && result.premium.right <= width+1, "premium CTA fully visible", result);
    } else {
      assertMeasure(result.pills.length === 0, "mobile hides desktop tabs", result);
    }
    if (width === 1366) {
      const trigger = page.getByRole("button", {name:"Open ecosystem search"});
      await trigger.click();
      const input = page.getByRole("textbox", {name:"Search GTH PRO cities and services"});
      assertMeasure(await input.isVisible(), "search popover opens with working input", result);
      const field = await input.boundingBox();
      assertMeasure(field && field.width >= 240, "search input has usable width", { result, field });
    }
    await page.screenshot({ path: "navbar-" + width + ".png", fullPage: false });
    await context.close();
  }
} finally {
  await browser.close();
}
if (failures.length) {
  console.error("NAVBAR_LAYOUT_FAILURES", JSON.stringify(failures, null, 2));
  process.exitCode = 1;
} else {
  console.log("NAVBAR_LAYOUT_PASS", "all widths fit; functional search, no wrapping or clipping");
}
