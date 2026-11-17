import type { PublicTender } from "@/lib/tender/catalog";

export type DecisionProfile = {
  companyName: string;
  companyWebsite: string | null;
  capability: string;
  preferredCity: string | null;
};

/** Safe text-only, precisely two-page A4 PDF; no external AI, network or font calls. */
function pdfText(value: unknown, max = 400): string {
  const text = typeof value === "string" ? value : value == null ? "" : String(value);
  return text.normalize("NFKD").replace(/[\u0300-\u036f]/g, "")
    .replace(/[\u0000-\u001f\u007f]/g, " ")
    .replace(/[^\x20-\x7e]/g, "?").replace(/\s+/g, " ").trim().slice(0, max);
}
function safeLine(value: string): string {
  return value.replace(/\\/g, "\\\\").replace(/\(/g, "\\(").replace(/\)/g, "\\)");
}
function wrap(value: string, max = 87): string[] {
  const words = pdfText(value, 1800).split(/\s+/);
  const lines: string[] = [];
  let line = "";
  for (const word of words) {
    if (!word) continue;
    for (let i = 0; i < word.length; i += max) {
      const fragment = word.slice(i, i + max);
      if (line && (line.length + fragment.length + 1) > max) { lines.push(line); line = ""; }
      line = line ? line + " " + fragment : fragment;
    }
  }
  if (line) lines.push(line);
  return lines.length ? lines : ["Not provided"];
}
type Item = { text: string; bold?: boolean; size?: number; gap?: number };
function renderPage(items: Item[], number: number): string {
  let y = 790;
  const commands = ["0.04 0.09 0.14 rg", "0.8 w", "50 765 m 545 765 l S"];
  for (const item of items) {
    const size = item.size ?? 10;
    const gap = item.gap ?? 4;
    for (const line of wrap(item.text, size >= 14 ? 48 : 92)) {
      if (y < 75) break;
      commands.push("BT", "/" + (item.bold ? "F2" : "F1") + " " + size + " Tf",
        "1 0 0 1 50 " + y.toFixed(1) + " Tm", "(" + safeLine(line) + ") Tj", "ET");
      y -= size + 4;
    }
    y -= gap;
    if (y < 75) break;
  }
  const footer = "GTH PRO GLOBAL | DRAFT ONLY - Verify official notice | Page " + number + " of 2";
  commands.push("BT /F1 9 Tf 1 0 0 1 50 45 Tm (" + safeLine(footer) + ") Tj ET");
  return commands.join("\n") + "\n";
}
function section(title: string): Item { return { text: title.toUpperCase(), bold: true, size: 11, gap: 5 }; }
function para(text: string): Item { return { text, size: 10, gap: 6 }; }
function makePdf(pages: readonly string[]): Uint8Array {
  if (pages.length !== 2) throw Error("PDF requires exactly two pages");
  const objects: string[] = [
    "<< /Type /Catalog /Pages 2 0 R >>",
    "<< /Type /Pages /Kids [3 0 R 4 0 R] /Count 2 >>",
    "<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Resources << /Font << /F1 5 0 R /F2 6 0 R >> >> /Contents 7 0 R >>",
    "<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Resources << /Font << /F1 5 0 R /F2 6 0 R >> >> /Contents 8 0 R >>",
    "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>",
    "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold >>",
    "<< /Length " + Buffer.byteLength(pages[0], "ascii") + " >>\nstream\n" + pages[0] + "endstream",
    "<< /Length " + Buffer.byteLength(pages[1], "ascii") + " >>\nstream\n" + pages[1] + "endstream",
  ];
  let result = "%PDF-1.4\n";
  const offsets = [0];
  for (let i = 0; i < objects.length; i++) {
    offsets.push(Buffer.byteLength(result, "ascii"));
    result += (i + 1) + " 0 obj\n" + objects[i] + "\nendobj\n";
  }
  const xrefAt = Buffer.byteLength(result, "ascii");
  result += "xref\n0 " + (objects.length + 1) + "\n0000000000 65535 f \n";
  for (const offset of offsets.slice(1)) result += String(offset).padStart(10, "0") + " 00000 n \n";
  result += "trailer\n<< /Size " + (objects.length + 1) + " /Root 1 0 R >>\nstartxref\n" + xrefAt + "\n%%EOF";
  return new Uint8Array(Buffer.from(result, "ascii"));
}
export function buildTenderDecisionPdf(tender: PublicTender, profile: DecisionProfile): Uint8Array {
  const date = new Date().toISOString().slice(0, 16).replace("T", " ") + " UTC";
  const company = pdfText(profile.companyName, 100);
  const reference = pdfText(tender.source_reference || tender.id, 100);
  const city = pdfText(profile.preferredCity || tender.region || "", 100);
  const safeWeb = pdfText(profile.companyWebsite || "Not supplied", 140);
  const deadline = Number.isFinite(Date.parse(tender.deadline_at))
    ? new Date(tender.deadline_at).toISOString().slice(0, 16).replace("T", " ") + " UTC"
    : "Recheck official documents";
  const page1: Item[] = [
    {text:"GTH PRO | PROCUREMENT DECISION BRIEF",bold:true,size:17,gap:10},
    para("TWO-PAGE PERSONALIZED RESEARCH DRAFT - NOT A SUBMITTED BID. Generated " + date),
    section("Contractor and opportunity"), para("Company: " + company + " | Website (supplied, not verified): " + safeWeb),
    para("Notice: " + pdfText(tender.title, 220)),
    para("Tender reference: " + reference + " | Buyer: " + pdfText(tender.buyer, 120)),
    para("Location: " + pdfText(tender.region || tender.country_code, 100) + " | Closing: " + deadline),
    section("What the notice actually says"), para(pdfText(tender.summary || "No source-reviewed summary is supplied. Read the original notice.", 520)),
    section("Preliminary readiness assessment"),
    para("Company capability (self-declared and unverified): " + pdfText(profile.capability || "Not provided", 240)),
    para(tender.requirements_verified
      ? "Some notice requirements were reviewed, but the company's eligibility was NOT checked. Match every requirement against authoritative tender documents."
      : "Source requirements have NOT been fully reviewed. Eligibility cannot be determined from this summary."),
    para("Decision status: RESEARCH ONLY. No tender award, company qualification, price competitiveness or project approval is guaranteed."),
    section("Evidence boundaries"),
    para("GTH PRO displays a source-attributed notice; only the issuing authority's current tender documents, corrigenda, and official portal are authoritative."),
  ];
  const booking = "https://www.gthproglobal.com/hotels?view=booking" +
    (city ? "&city=" + encodeURIComponent(city) : "");
  const page2: Item[] = [
    {text:"GTH PRO | ACTION PLAN & TEAM LOGISTICS",bold:true,size:16,gap:11},
    para("Company: " + company + " | Reference: " + reference),
    section("Six-step tender decision checklist"),
    para("1. Read the source notice and all amendments. Confirm closing date and tender status."),
    para("2. Confirm licensing, entity eligibility, financial turnover, technical experience and local rules."),
    para("3. Build a requirement-to-evidence table. Flag missing certificates instead of claiming compliance."),
    para("4. Verify BOQ, units, taxes, securities, retention and payment milestone risks."),
    para("5. Assign bid owner and a submission timeline; independently review the complete application."),
    para("6. Submit ONLY on the issuing authority's official channel and retain its acknowledgement."),
    section("Cross-sector team accommodation"),
    para("Regional planning city (user supplied or sourced from tender region): " + (city || "Not established")),
    para("GTH Worldwide Stays search: " + booking),
    para("This link opens independent booking discovery. No exact hotel, walking distance, availability, rate or supplier confirmation is implied."),
    section("What to do before sharing"),
    para("Use the device's Share PDF action or attach the downloaded file yourself. No automatic WhatsApp send, contact discovery, company scraping or supplier payment occurs."),
    section("Mandatory source check"),
    para("Official tender source (as listed): " + pdfText(tender.source_url, 160)),
    para("This document is an editorial preparation aid, not legal advice, a bid submission, a qualification certificate or a prediction of a winning bid."),
  ];
  return makePdf([renderPage(page1,1), renderPage(page2,2)]);
}