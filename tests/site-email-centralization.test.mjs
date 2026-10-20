import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {spawnSync} from "node:child_process";

const read = path => readFileSync(new URL("../" + path, import.meta.url),"utf8");
const site = read("src/lib/site-config.ts");

test("official GTH PRO contact address has one central custom-domain default",()=>{
  assert.match(site,/DEFAULT_OFFICIAL_EMAIL = "official@gthproglobal\.com"/);
  assert.match(site,/NEXT_PUBLIC_SUPPORT_EMAIL/);
  assert.match(site,/@gthproglobal\\\.com/);
  assert.match(site,/Object\.freeze\(\{/);
  assert.match(site,/supportEmail: contactEmail/);
  assert.match(site,/legalEmail: contactEmail/);
  assert.match(site,/domain: PRIMARY_ORIGIN/);
});

test("all visible footer, business contact and organization JSON-LD use official config",()=>{
  for(const path of [
    "src/app/contact/page.tsx",
    "src/app/about/page.tsx",
    "src/app/partners/page.tsx",
    "src/components/sections/EcosystemFooter.tsx",
    "src/components/seo/SiteIdentitySchema.tsx",
    "src/app/privacy-policy/page.tsx",
    "src/app/terms-and-conditions/page.tsx",
    "src/app/refund-policy/page.tsx",
    "src/app/affiliate-disclosure/page.tsx"
  ]){
    const content=read(path);
    assert.match(content,/import \{ SITE_CONFIG \} from "@\/lib\/site-config";/,path);
    assert.match(content,/SITE_CONFIG\.(supportEmail|contactEmail|legalEmail)/,path);
  }
  assert.match(read("src/components/seo/SiteIdentitySchema.tsx"),/email: SITE_CONFIG\.contactEmail/);
  assert.match(read("src/app/contact/page.tsx"),/href=\{\x60mailto:\$\{SITE_CONFIG\.supportEmail\}\x60\}/);
});

test("the entire tracked repository is free of legacy personal Gmail addresses",()=>{
  const banned="gmail" + ".com";
  const result=spawnSync("git",["grep","-n","-i","-F",banned],{encoding:"utf8"});
  assert.ok(result.status===1,"Legacy mail addresses remain in tracked files:\n"+(result.stdout || result.stderr));
});

test("email is public contact only; never invent a Zoho mailer",()=>{
  assert.match(read(".env.example"),/NEXT_PUBLIC_SUPPORT_EMAIL=official@gthproglobal\.com/);
  assert.doesNotMatch(site,/SMTP_PASSWORD|ZOHO_API_KEY|sendMail\(/);
});
