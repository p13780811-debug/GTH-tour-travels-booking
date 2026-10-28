import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

const layout=fs.readFileSync("src/app/layout.tsx","utf8");
const dashboard=fs.readFileSync("src/components/mobile/MobileAppDashboard.tsx","utf8");
const appLayout=fs.readFileSync("src/app/app/layout.tsx","utf8");

test("globally injected Travelpayouts Drive is suppressed only on GTH PRO app routes",()=>{
 const guard='if (window.location.pathname === "/app" || window.location.pathname.startsWith("/app/")) return;';
 const scriptCreation='var script = document.createElement("script");';
 assert.equal(layout.split(guard).length,2,"guard must appear once");
 assert.ok(layout.indexOf(guard)<layout.indexOf(scriptCreation),"guard must precede script creation");
 assert.ok(layout.includes('script.src = "https://emrldtp.com/NTA0MzQy.js?t=504342";'));
 assert.ok(layout.includes('script.async = true;'));
 assert.ok(!dashboard.includes('emrldtp.com'));
 assert.ok(!appLayout.includes('emrldtp.com'));
});
test("mobile app footer is inside dashboard and bottom navigation remains outside",()=>{
 assert.ok(dashboard.includes('Disclosures'));
 assert.ok(dashboard.includes('Privacy'));
 assert.ok(dashboard.includes('Terms'));
 assert.ok(dashboard.includes('Website'));
 assert.ok(dashboard.includes('<footer className='));
 assert.ok(!dashboard.includes('Pick-up at'));
});
