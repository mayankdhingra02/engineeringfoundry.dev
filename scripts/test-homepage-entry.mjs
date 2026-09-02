import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { getSystemDesignContinuation } from "../lib/home-continuation.ts";

const lessons = [
  { id: "introduction", title: "Introduction", href: "/system-design/start-here/introduction", kind: "lesson" },
  { id: "requirements", title: "Requirements", href: "/system-design/start-here/requirements", kind: "lesson" },
  { id: "problem-url-shortener", title: "URL Shortener", href: "/system-design/url-shortener", kind: "practice" },
];

assert.equal(getSystemDesignContinuation({}, lessons), null, "empty progress must not create a fake continuation");
assert.deepEqual(
  getSystemDesignContinuation({ "topic:introduction": "completed" }, lessons),
  { title: "Requirements", href: "/system-design/start-here/requirements", context: "1 lesson complete in this browser.", completedCount: 1 },
  "completed lessons should lead to the next available lesson",
);
assert.deepEqual(
  getSystemDesignContinuation({ "practice:url-shortener": "in-progress" }, lessons),
  { title: "URL Shortener", href: "/system-design/url-shortener", context: "A saved practice session is in progress in this browser.", completedCount: 0 },
  "in-progress practice should be the primary continuation",
);
assert.equal(getSystemDesignContinuation({ "topic:introduction": "unexpected" }, lessons), null, "unknown statuses must be ignored");

const homepage = readFileSync(new URL("../app/page.tsx", import.meta.url), "utf8");
const entryExperience = readFileSync(new URL("../components/home-entry-experience.tsx", import.meta.url), "utf8");
assert.match(homepage, /What should you prepare next\?/);
assert.match(homepage, /Search topics, questions, or companies/);
for (const href of ["/dsa", "/system-design/start-here/introduction", "/low-level-design", "/companies", "/ml-design", "/behavioral", "/interview-tips"]) {
  assert.ok(entryExperience.includes(href), `homepage must include the ${href} track`);
}
for (const cue of ["Best for coding rounds", "Best for architecture rounds", "Best when one employer is the target", "Best for story-based rounds", "Responsibilities, interfaces, and state", "Data, serving, and evaluation", "Communication, recovery, and closing"]) {
  assert.ok(entryExperience.includes(cue), `homepage must explain the track decision with: ${cue}`);
}
assert.ok(!homepage.includes("1,000+ community members"), "homepage must not use community-size marketing proof in its entry hierarchy");
assert.match(entryExperience, /More interview tracks/, "specialized interview tracks should remain visible without disclosure");
assert.doesNotMatch(homepage, /Show two more preparation tools/, "primary preparation tracks must not be hidden behind a disclosure");

console.log("Homepage entry experience tests passed.");
