import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";

const chat=readFileSync("src/components/AIChat.tsx","utf8");
const listing=readFileSync("src/components/real-estate/PropertyDetailClient.tsx","utf8");
test("AI Hub Send never compresses into a one-letter vertical column on narrow phones",()=>{
 assert.ok(chat.includes("min-w-0 flex-1 bg-transparent"),"message input must be the element permitted to shrink");
 assert.ok(chat.includes("min-w-[72px] shrink-0 items-center justify-center whitespace-nowrap"),"Send button must keep one-line label and touch target");
 assert.ok(chat.includes('className={`shrink-0 p-2 rounded-full'),"microphone must retain its size");
 assert.ok(chat.includes("flex w-full min-w-0 items-center gap-2"),"composer must remain within chat width");
 assert.ok(chat.includes("onClick={sendMessage}"),"original Send behavior must remain");
});
test("existing property detail sticky Request details action is preserved",()=>{
 assert.ok(listing.includes('aria-label="Mobile listing actions"'));
 assert.ok(listing.includes('href="#enquiry"'));
 assert.ok(listing.includes('"Request details"'));
});
