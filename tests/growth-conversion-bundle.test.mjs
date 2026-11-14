import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
const read=path=>readFileSync(new URL("../"+path,import.meta.url),"utf8");
test("licensed offline QR encoder, public consent and bounded catalog links",()=>{
 const vendor=read("src/lib/client/vendor/qrcodegen.ts");
 assert.match(vendor,/Copyright \(c\) Project Nayuki\. \(MIT License\)/);
 assert.match(vendor,/export namespace qrcodegen/);
 assert.match(vendor,/static encodeText\(text: string, ecl: QrCode\.Ecc\)/);
 const helper=read("src/lib/real-estate/broker-catalog.ts");
 assert.match(helper,/MAX_CATALOG_PROJECTS=5/);
 assert.match(helper,/catalogSlugs/);
 assert.match(helper,/catalogContact/);
 assert.match(helper,/catalogHref/);
 const client=read("src/components/real-estate/BrokerCatalogGenerator.tsx");
 assert.match(client,/qrcodegen\.QrCode\.encodeText/);
 assert.match(client,/onClick=\{generate\}/);
 assert.match(client,/if\(!consent\)/);
 assert.match(client,/new Blob\(\[svg\]/);
 assert.match(client,/URL\.createObjectURL/);
 assert.match(client,/gth-pro-property-catalog-qr\.svg/);
 assert.doesNotMatch(client,/fetch\(|supabase|qrserver|quickchart|chart\.googleapis/i);
 const catalog=read("src/app/real-estate/mini-catalog/page.tsx");
 assert.match(catalog,/robots:\{index:false,follow:false\}/);
 assert.match(catalog,/catalogSlugs\(raw\.projects\)/);
 assert.match(catalog,/catalogContact\(raw\.broker,raw\.phone\)/);
 assert.match(catalog,/not a verified broker endorsement|not an endorsement/i);
 assert.doesNotMatch(catalog,/from\(["']@\/lib\/supabase|\.from\(|fetch\(/i);
});
test("client-only comparison PDFs are source-aware, bounded and linked",()=>{
 const pdf=read("src/lib/client/comparison-pdf.ts");
 assert.match(pdf,/items\.length<2\|\|items\.length>3/);
 assert.match(pdf,/document\.createElement\("canvas"\)/);
 assert.match(pdf,/toDataURL\("image\/jpeg"/);
 assert.match(pdf,/application\/pdf/);
 assert.match(pdf,/Subtype \/Link/);
 assert.match(pdf,/https:\/\/gthproglobal\.com\//);
 assert.match(pdf,/URL\.createObjectURL/);
 assert.match(pdf,/window\.location\.origin/);
 assert.doesNotMatch(pdf,/fetch\(|supabase|service_role|PDFKit|pdfjs/i);
 for(const path of [
 "src/app/real-estate/saved/page.tsx",
 "src/app/real-estate/registry/compare/page.tsx",
 "src/components/tender/TenderSavedWorkspace.tsx",
 "src/app/hotels/results/HotelResults.tsx"]){
  const source=read(path);
  assert.match(source,/ComparisonPdfButton/,path);
 }
});
test("WhatsApp sharing stays user-triggered and records have real first-party paths",()=>{
 const share=read("src/components/engagement/ShareFeedbackActions.tsx");
 assert.match(share,/onClick=\{share\}/);
 assert.match(share,/encodeURIComponent\(text\)/);
 assert.match(share,/https:\/\/wa\.me/);
 assert.match(share,/Nothing is sent automatically/);
 for(const path of [
  "src/components/real-estate/PropertyCardPro.tsx",
  "src/components/tender/TenderMarketplacePanels.tsx",
  "src/app/stadiums/StadiumEventDiscovery.tsx",
  "src/app/stadiums/StadiumUpcomingEvents.tsx",
  "src/app/hotels/results/HotelResults.tsx",
  "src/app/flights/page.tsx"]){
  assert.match(read(path),/ShareFeedbackActions/,path);
 }
});
test("local watch is consent-gated, zero backend and honest about true Web Push",()=>{
 const source=read("src/components/engagement/LocalWatchButton.tsx");
 assert.match(source,/Notification\.requestPermission\(\)/);
 assert.match(source,/showNotification\(/);
 assert.match(source,/localStorage\.setItem/);
 assert.match(source,/72\*3600_000/);
 assert.match(source,/not background Web Push|no closed-app background push|This is not background Web Push/i);
 assert.doesNotMatch(source,/fetch\(|pushManager\.subscribe|SUPABASE_SERVICE_ROLE_KEY/i);
 for(const path of ["src/components/real-estate/PropertyCardPro.tsx","src/components/real-estate/PropertyDetailClient.tsx","src/components/tender/TenderMarketplacePanels.tsx","src/app/flights/page.tsx"])
 assert.match(read(path),/LocalWatchButton/,path);
});
test("signed Android distribution and global CSS remain out of scope",()=>{
 const main=read("src/app/app/page.tsx");
 assert.match(main,/<AppInstall\/>/);
 assert.match(read("src/components/mobile/AppInstall.tsx"),/Safe install guide/);
 assert.match(read("src/components/home/FlagshipHome.tsx"),/Open Super App/);
 assert.match(read("src/app/app/services/[id]/page.tsx"),/"broker-catalog"/);
 assert.match(read("src/lib/mobile/app-dashboard.ts"),/id:"broker-catalog"/);
});
test("Tender browser QA uses Playwright 1.56 compatible runner and keeps full security gates",()=>{
 const w=read(".github/workflows/gth-tender-portal-upgrade.yml");
 assert.match(w,/protected-portal:\s+#[^\n]+\s+runs-on: ubuntu-24\.04/);
 assert.match(w,/npm run test:security/);
 assert.match(w,/npm run build/);
 assert.match(w,/npx playwright install --with-deps chromium/);
});

test("notification tap is restricted to same-origin research pages and offline cache stays private",()=>{
 const sw=read("public/sw.js");
 assert.match(sw,/notificationclick/);
 assert.match(sw,/event\.notification\.close\(\)/);
 assert.match(sw,/path\.startsWith\("\/"\)/);
 assert.match(sw,/path\.startsWith\("\/\/"\)/);
 assert.match(sw,/url\.origin !== self\.location\.origin/);
 assert.match(sw,/self\.clients\.openWindow\(url\.href\)/);
 assert.doesNotMatch(sw,/addEventListener\("push"|caches\.put\(|\/api\/hotels\/search/i);
});

test("broker picker searches public records only by user action and saves offline shortlist titles",()=>{
 const picker=read("src/components/real-estate/BrokerProjectPicker.tsx");
 const generator=read("src/components/real-estate/BrokerCatalogGenerator.tsx");
 const saved=read("src/lib/real-estate/saved.ts");
 const saveButton=read("src/components/real-estate/SavePropertyButton.tsx");
 assert.match(generator,/BrokerProjectPicker selected=\{slugs\}/);
 assert.match(generator,/Advanced: enter known project slugs manually/);
 assert.match(picker,/onSubmit=\{event=>\{event\.preventDefault\(\);void search\(\);\}\}/);
 assert.match(picker,/Pick from Saved Properties/);
 assert.match(picker,/registry-preview\?/);
 assert.match(picker,/\/api\/real-estate\/search\?/);
 assert.match(picker,/selected\.length>=MAX_CATALOG_PROJECTS/);
 assert.match(picker,/normalizeSaved\(/);
 assert.match(picker,/normalizeSavedTitles\(/);
 assert.match(saved,/SAVED_TITLES_KEY/);
 assert.match(saved,/normalizeSavedTitles/);
 assert.match(saveButton,/SAVED_TITLES_KEY/);
 assert.match(saveButton,/localStorage\.setItem\(SAVED_TITLES_KEY/);
 assert.match(picker,/BrokerVoiceInput onTranscript=/);
 assert.doesNotMatch(picker,/supabase|service_role|\bsetInterval\(/i);
});
test("voice is opt-in, no automatic search, supports Hindi and English and discloses browser processing",()=>{
 const voice=read("src/components/real-estate/BrokerVoiceInput.tsx");
 assert.match(voice,/SpeechRecognition\?\?browser\.webkitSpeechRecognition/);
 assert.match(voice,/onClick=\{toggle\}/);
 assert.match(voice,/recognition\.start\(\)/);
 assert.match(voice,/current\.current\.stop\(\)/);
 assert.match(voice,/current\.current\.abort\(\)/);
 assert.match(voice,/onTranscript\(spoken\)/);
 assert.match(voice,/Hindi \(India\)/);
 assert.match(voice,/English \(India\)/);
 assert.match(voice,/Your browser may use its online speech service/);
 assert.doesNotMatch(voice,/fetch\(|supabase|MediaRecorder|navigator\.mediaDevices\.getUserMedia/i);
});
