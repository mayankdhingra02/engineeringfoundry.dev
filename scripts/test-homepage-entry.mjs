import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { getSystemDesignContinuation } from "../lib/home-continuation.ts";
import { homeCoreTracks, homeSupportingTracks } from "../lib/home-track-catalog.ts";

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
assert.match(homepage, /import \{ cookies \} from "next\/headers"/, "homepage must read the deletion proof from the server request");
assert.match(homepage, /accountDeletionProofCookieName, isAccountDeletionProof/, "homepage must use the shared deletion-proof contract");
assert.match(homepage, /isAccountDeletionProof\(\(await cookies\(\)\)\.get\(accountDeletionProofCookieName\)\?\.value\)/, "homepage must validate the exact server-controlled proof cookie");
assert.doesNotMatch(homepage, /searchParams|\.account\s*===\s*["']deleted["']/, "query parameters alone must never prove account deletion");
assert.match(homepage, /accountDeleted && <div className="account-deleted-notice" role="status">/, "verified account deletion must retain its accessible status notice");
assert.deepEqual(homeCoreTracks.map((track) => track.href), ["/dsa", "/system-design/start-here/introduction", "/ml-design", "/behavioral"], "homepage core tracks must match the master blueprint");
assert.deepEqual(homeSupportingTracks.map((track) => track.href), ["/low-level-design", "/companies", "/interview-tips"], "supporting preparation tracks must remain directly discoverable");
assert.match(entryExperience, /homeCoreTracks\.map[\s\S]*className="home-track-link"/, "core track data must render as direct links");
assert.match(entryExperience, /homeSupportingTracks\.map[\s\S]*<Link href=\{track\.href\}/, "supporting track data must render as direct links");
assert.ok(!homepage.includes("1,000+ community members"), "homepage must not use community-size marketing proof in its entry hierarchy");
assert.match(entryExperience, /More interview tracks/, "specialized interview tracks should remain visible without disclosure");
assert.doesNotMatch(`${homepage}\n${entryExperience}`, /<details|Show two more preparation tools/, "preparation tracks must not be hidden behind a disclosure");

console.log("Homepage entry experience tests passed.");
