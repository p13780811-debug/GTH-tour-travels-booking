import test from "node:test"
import assert from "node:assert/strict"
import { readFileSync } from "node:fs"

const read = path => readFileSync(path, "utf8")

test("search intent remains a tab treatment instead of a global call-to-action", () => {
 const hero = read("src/components/real-estate/ExplorerHero.tsx")
 const css = read("src/components/real-estate/Explorer.module.css")
 assert.match(hero, /<button type="button" key=\{item\.value\} aria-pressed=/)
 assert.doesNotMatch(hero, /<button className="gth-btn" key=\{item\.value\}/)
 assert.match(css, /\.searchIntent button\[aria-pressed=true\]/)
 assert.match(hero, /className=\{\`gth-btn gth-btn-gold \$\{styles\.button\}\`\}/)
})

test("modal tabs and close cross are not styled as conversion actions", () => {
 const enquiry = read("src/components/property/LeadModal.tsx")
 const dialog = read("src/components/property/PropertyDialog.tsx")
 assert.match(enquiry, /aria-pressed=\{intent === mode\.value\}/)
 assert.doesNotMatch(enquiry, /className="gth-btn[^"]*" key=\{mode\.value\}/)
 assert.doesNotMatch(dialog, /<button type="button" className="gth-btn/)
 assert.match(dialog, /aria-label="Close enquiry"/)
 assert.match(enquiry, /className="gth-btn gth-btn-gold/)
})

test("discovery state buttons and category chips avoid global CTA styling", () => {
 const page = read("src/app/real-estate/page.tsx")
 const card = read("src/components/real-estate/ExplorerCard.tsx")
 const filter = read("src/components/real-estate/DiscoveryFilters.tsx")
 const save = read("src/components/real-estate/SavePropertyButton.tsx")
 assert.doesNotMatch(page, /<button className="gth-btn" onClick=\{\(\) => showInfo\("ranking"\)\}/)
 assert.doesNotMatch(card, /<button className="gth-btn" onClick=\{\(\) => onInfo\("verification"\)\}/)
 assert.doesNotMatch(card, /className=\{\`gth-btn \$\{styles\.rank\}\`\}/)
 assert.doesNotMatch(filter, /className="gth-btn inline-flex w-full/)
 assert.doesNotMatch(save, /className=\{\`gth-btn \$\{className\}\`\}/)
 assert.match(filter, /onClick=\{\(\) => chooseCategory\(value\)\}/)
 assert.match(save, /aria-pressed=\{saved\}/)
})
