import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import {
  requiredClosureSources,
  requiredClosureSourcesReviewedAt,
} from "../content/system-design/required-closure/sources.ts";
import { systemDesignTopicManifest } from "../data/system-design/manifest.ts";
import { systemDesignBlueprintCrosswalk } from "../data/system-design/topic-crosswalk.ts";

const expectedIds = [
  "schema-data-migration", "incident-recovery-postmortems",
  "security-threat-modeling", "cost-efficiency", "operational-ownership",
  "backfill-rebuild", "control-plane-data-plane",
  "payments-ledgers", "distributed-file-systems", "storage-compute-separation",
];
const contentFiles = ["reliability-operations.tsx", "platform-operations.tsx", "patterns.tsx", "storage-payments.tsx"];
const [index, shared, route, migration, ...contents] = await Promise.all([
  readFile("content/system-design/required-closure/index.tsx", "utf8"),
  readFile("content/system-design/required-closure/shared.tsx", "utf8"),
  readFile("app/system-design/[...segments]/page.tsx", "utf8"),
  readFile("supabase/migrations/202609040017_publish_system_design_required_closure.sql", "utf8"),
  ...contentFiles.map((file) => readFile(`content/system-design/required-closure/${file}`, "utf8")),
]);
const combined = contents.join("\n");

const setMatch = index.match(/requiredClosureLessonIds = new Set\(\[([\s\S]*?)\]\)/);
assert.ok(setMatch, "The Required-closure dispatcher needs one explicit ID set.");
assert.deepEqual([...setMatch[1].matchAll(/"([^"]+)"/g)].map((match) => match[1]), expectedIds, "The Required-closure dispatcher must expose exactly the ten accepted lesson IDs.");
assert.match(route, /requiredClosureLessonIds\.has\(lesson\.id\)[\s\S]*<RequiredClosureLessonContent lessonId=\{lesson\.id\}/, "The finite lesson route must render the Required-closure family.");
assert.deepEqual([...combined.matchAll(/\n {4}id: "([^"]+)",/g)].map((match) => match[1]), expectedIds, "Grouped content must define one substantive lesson spec per accepted ID.");
for (const marker of ["decision:", "mechanism:", "diagram:", "example:", "tradeoffs:", "failure:", "exercise:", "probes:", "practice:", "remember:"]) {
  assert.equal((combined.match(new RegExp(`\\n    ${marker}`, "g")) ?? []).length, expectedIds.length, `Every lesson needs a substantive ${marker.slice(0, -1)} contract.`);
}
for (const marker of ['id="decision"', 'id="mechanism"', 'id="worked-example"', 'id="tradeoffs"', 'id="failure-diagnosis"', 'id="exercise"', "<MermaidDiagram", "<InterviewFollowUps>", "<PracticeConnections ids=", "<FurtherReading items=", "Sources reviewed", "<RememberThis>"]) {
  assert.match(shared, new RegExp(marker), `The shared renderer is missing ${marker}.`);
}
assert.match(shared, /<table><thead><tr><th>Option<\/th><th>Choose when<\/th><th>Cost or limit<\/th>/, "Trade-offs need a semantic text table.");
assert.match(shared, /<details><summary>Work the scenario before revealing the checklist<\/summary>/, "Design checkpoints must use keyboard-native progressive disclosure.");

const manifestById = new Map(systemDesignTopicManifest.map((topic) => [topic.id, topic]));
for (const id of expectedIds) {
  const topic = manifestById.get(id);
  assert.ok(topic, `${id} must exist in the manifest.`);
  assert.equal(topic.published, true, `${id} must be published.`);
  assert.equal(topic.contentStatus, "published", `${id} must have published content status.`);
  assert.equal(topic.lastReviewed, "2026-09-04", `${id} must carry the source-review date.`);
  assert.equal(topic.visual.type, "mermaid", `${id} must retain its purposeful diagram contract.`);
  const mapping = systemDesignBlueprintCrosswalk.find((entry) => entry.repositoryTopicIds.includes(id));
  assert.ok(mapping, `${id} must close an explicit blueprint row.`);
  assert.equal(mapping.disposition, "exact", `${id} must use an exact blueprint mapping.`);
  assert.match(migration, new RegExp(`'${id}'`), `${id} must be present in the additive catalog migration.`);
}
assert.equal(systemDesignBlueprintCrosswalk.filter((entry) => entry.disposition === "blueprint-only").length, 0, "No Required blueprint-only topic may remain after closure.");

assert.deepEqual(Object.keys(requiredClosureSources), expectedIds, "Source coverage must exactly match the ten accepted lessons.");
assert.equal(requiredClosureSourcesReviewedAt, "2026-09-04", "Sources need the accepted review date.");
const allSources = Object.values(requiredClosureSources).flat();
assert.ok(Object.values(requiredClosureSources).every((items) => items.length >= 2), "Every lesson needs at least two authoritative primary or first-party sources.");
assert.ok(allSources.every((source) => source.url.startsWith("https://") && source.title && source.publisher), "Every source needs HTTPS, a title, and a publisher.");
assert.ok(allSources.every((source) => !/reddit|educative|bytebytego|designgurus|hellointerview/i.test(`${source.publisher} ${source.url}`)), "Sources must not depend on social or competitor material.");
for (const domain of ["aws.amazon.com", "sre.google", "owasp.org", "kubernetes.io", "stripe.com", "apache.org", "postgresql.org"]) {
  assert.ok(allSources.some((source) => source.url.includes(domain)), `The source set must include ${domain}.`);
}

for (const phrase of [/in today's/i, /let's dive into/i, /it is important to note/i, /in conclusion/i, /this approach provides/i]) {
  assert.doesNotMatch(combined, phrase, `Required closure contains weak filler phrasing: ${phrase}.`);
}
for (const boundary of [
  /A migration is a distributed protocol/,
  /mitigation from permanent remediation/,
  /accepted threat needs an explicit owner/,
  /cost per useful outcome/,
  /deploy, observe, recover, migrate, and retire/,
  /stale bulk record cannot overwrite a newer CDC update/,
  /control plane decides and reconciles/,
  /idempotency key is not reconciliation/,
  /small files expensive/,
  /fleet-wide cold start/,
]) assert.match(combined, boundary, `A Required decision boundary is missing: ${boundary}.`);

console.log(`System Design Required closure passed: ${expectedIds.length} published exact-mapped lessons, ${allSources.length} source placements, ten diagrams, and no blueprint-only Required outcomes.`);
