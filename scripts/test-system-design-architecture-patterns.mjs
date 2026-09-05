import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { architecturePatternSources, architecturePatternSourcesReviewedAt } from "../content/system-design/architecture-patterns/sources.ts";

const expectedIds = [
  "scaling-reads", "scaling-writes", "read-heavy-systems", "write-heavy-systems",
  "fan-out", "fanout-read-write", "background-jobs", "long-running-jobs",
  "batch-vs-streaming", "cqrs", "handling-hot-partitions", "handling-contention",
  "multi-step-workflows", "large-file-processing",
];
const base = "content/system-design/architecture-patterns";
const contentFiles = ["load-shaping.tsx", "fanout-jobs.tsx", "processing-coordination.tsx"];
const [index, shared, route, manifest, demo, ...contents] = await Promise.all([
  readFile(`${base}/index.tsx`, "utf8"),
  readFile(`${base}/shared.tsx`, "utf8"),
  readFile("app/system-design/[...segments]/page.tsx", "utf8"),
  readFile("data/system-design/manifest.ts", "utf8"),
  readFile("components/fan-out-demo.tsx", "utf8"),
  ...contentFiles.map((file) => readFile(`${base}/${file}`, "utf8")),
]);
const combined = contents.join("\n");

const setMatch = index.match(/architecturePatternLessonIds = new Set\(\[([\s\S]*?)\]\)/);
assert.ok(setMatch, "Architecture Patterns needs one explicit ID set.");
assert.deepEqual([...setMatch[1].matchAll(/"([^"]+)"/g)].map((match) => match[1]), expectedIds, "The dispatcher set must contain exactly the 14 approved IDs in curriculum order.");
assert.deepEqual([...index.matchAll(/case "([^"]+)": return <([A-Za-z0-9]+) \/>/g)].map((match) => match[1]), expectedIds, "Every approved lesson needs one dispatch case.");
assert.equal((index.match(/default: return null/g) ?? []).length, 1, "The dispatcher needs an honest null default.");
assert.match(route, /architecturePatternLessonIds\.has\(lesson\.id\)[\s\S]*<ArchitecturePatternLessonContent lessonId=\{lesson\.id\}/, "The canonical route must render the family rather than Coming Soon.");

assert.deepEqual([...combined.matchAll(/\bid: "([^"]+)",/g)].map((match) => match[1]), expectedIds, "Grouped content must define one substantive spec per ID.");
assert.equal((combined.match(/export function [A-Za-z0-9]+LessonContent\(\)/g) ?? []).length, 14, "Every approved lesson needs a named content component.");
for (const marker of ["decision:", "mechanism:", "example:", "tradeoffs:", "failure:", "exercise:", "probes:", "practice:", "remember:"]) {
  assert.equal((combined.match(new RegExp(`\\n  ${marker.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}`, "g")) ?? []).length, 14, `Every lesson needs a substantive ${marker.slice(0, -1)} contract.`);
}
assert.ok((combined.match(/diagram: \{ chart:/g) ?? []).length >= 9, "At least nine pattern lessons need a purposeful architecture or state diagram.");
for (const marker of ['id="decision"', 'id="mechanism"', 'id="worked-example"', 'id="tradeoffs"', 'id="failure-diagnosis"', 'id="exercise"', "<InterviewFollowUps>", "<PracticeConnections ids=", "<FurtherReading items=", "Sources reviewed", "<RememberThis>"]) {
  assert.match(shared, new RegExp(marker), `Shared renderer is missing page-contract marker ${marker}.`);
}
assert.match(shared, /<table><thead><tr><th>Option<\/th><th>Choose when<\/th><th>Cost or limit<\/th>/, "Trade-offs need a semantic text table.");
assert.match(shared, /<details><summary>Work the scenario before revealing the checklist<\/summary>/, "Every lesson needs a keyboard-native design checkpoint.");

const architectureSection = manifest.slice(manifest.indexOf('id: "architecture-patterns"'), manifest.indexOf('id: "specialized"'));
for (const id of expectedIds) {
  assert.match(architectureSection, new RegExp(`id: "${id}"[\\s\\S]*?published: true, lastReviewed: "2026-09-04"`), `${id} must be explicitly published and reviewed.`);
}

assert.deepEqual(Object.keys(architecturePatternSources), expectedIds, "Source coverage must exactly match the 14 lesson IDs.");
assert.equal(architecturePatternSourcesReviewedAt, "2026-09-04", "Sources need the approved verification date.");
const allSources = Object.values(architecturePatternSources).flat();
assert.ok(Object.values(architecturePatternSources).every((items) => items.length >= 2), "Every lesson needs at least two primary or authoritative references.");
assert.ok(allSources.every((source) => source.url.startsWith("https://") && source.title && source.publisher), "Every source needs HTTPS, a title, and a publisher.");
assert.ok(allSources.every((source) => !/reddit|educative|bytebytego|designgurus|hellointerview/i.test(`${source.publisher} ${source.url}`)), "Sources must not depend on social or competitor material.");
for (const domain of ["postgresql.org", "aws.amazon.com", "learn.microsoft.com", "cloud.google.com"]) assert.ok(allSources.some((source) => source.url.includes(domain)), `Primary source set must include ${domain}.`);

for (const phrase of [/in today's/i, /let's dive into/i, /it is important to note/i, /in conclusion/i, /this approach provides/i]) assert.doesNotMatch(combined, phrase, `Architecture Patterns contains weak filler phrasing: ${phrase}.`);
for (const phrase of [/A queue moves work through time/, /The projection is allowed to lag/, /Contention is competing ownership/, /compensation as new work/, /one atomic publication boundary/]) assert.match(combined, phrase, `A core pattern boundary is missing: ${phrase}.`);
assert.match(combined, /read-after-write paths remain on the authoritative store/, "Read scaling must preserve explicit freshness semantics.");
assert.match(combined, /Shared work queue[\s\S]*Consumers do not each receive a copy/, "Fan-out must distinguish independent subscriptions from competing consumers.");
assert.match(combined, /Object size and media type are security inputs/, "Large-file processing must include the untrusted-input boundary.");
for (const marker of ['"use client"', 'aria-labelledby="fanout-demo-title"', 'aria-pressed={notificationsPaused}', 'aria-live="polite" aria-atomic="true"', "Accessible subscriber-state summary"]) assert.match(demo, new RegExp(marker), `Interactive fan-out model is missing ${marker}.`);
assert.match(demo, /Search and analytics continue; the notification subscription retains its own recovery work/, "The interactive model must explain isolated failure truthfully.");

console.log(`System Design Architecture Patterns passed: ${expectedIds.length} published lesson specs, ${allSources.length} source placements, complete decision/failure/exercise contracts, and source review ${architecturePatternSourcesReviewedAt}.`);
