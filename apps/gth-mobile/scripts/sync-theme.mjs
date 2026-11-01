import { readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";

const dir = resolve(fileURLToPath(new URL(".", import.meta.url)));
const siteCss = readFileSync(resolve(dir, "../../../src/app/globals.css"), "utf8");
const dayStart = siteCss.indexOf(":root {");
const nightStart = siteCss.indexOf("html.dark {");
if (dayStart < 0 || nightStart < 0) throw Error("Central GTH theme sections missing");
const day = siteCss.slice(dayStart, nightStart);
const night = siteCss.slice(nightStart, siteCss.indexOf("/* ========================= */", nightStart));
function get(part, variable) {
  const m = part.match(new RegExp("(?:^|\\n)\\s*--" + variable + "\\s*:\\s*([^;]+);", "m"));
  if (!m) throw Error("Missing central CSS token --" + variable);
  return m[1].trim().replace(/\s+/g," ");
}
if (get(day,"card") !== "oklch(1 0 0)") {
  throw Error("Light card token changed: update native renderer for new CSS color");
}
// Native React Native style values do not accept oklch in all versions; CSS
// pure-white --card is represented as its equivalent #ffffff.
const bgSoft = get(day,"bg-soft");
const result = {
  light: { bg:get(day,"bg"),surface:"#ffffff",surfaceSoft:bgSoft,text:get(day,"text"),
    muted:get(day,"text-soft"),border:bgSoft,accent:get(day,"gold"),onAccent:get(day,"text") },
  dark: { bg:get(night,"bg"),surface:get(night,"card"),surfaceSoft:get(night,"bg-soft"),
    text:get(night,"text"),muted:get(night,"text-soft"),border:get(night,"border"),accent:get(day,"gold"),onAccent:get(night,"bg") },
};
const destination = resolve(dir, "../src/theme/generated.json");
const contents = JSON.stringify(result,null,2)+"\n";
if (process.argv.includes("--write")) {
  writeFileSync(destination,contents,"utf8");
} else if (process.argv.includes("--check")) {
  if (readFileSync(destination,"utf8") !== contents) throw Error("Native tokens are out of sync with website global CSS; run npm run theme:sync in the mobile project");
  console.log("Native theme reflects existing GTH PRO global CSS; website unchanged.");
} else {
  throw Error("Use --check or --write");
}
