import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { systemDesignPracticeProblemManifest, systemDesignTopicManifest } from "../data/system-design/manifest.ts";
import { systemDesignLessons } from "../data/system-design/curriculum.ts";

const dataIds = ["data-modeling", "sql-vs-nosql", "sql-databases", "key-value-stores", "document-databases", "wide-column-databases", "database-indexes", "transactions", "isolation-levels", "replication", "sharding", "consistent-hashing", "consistency-models", "cap-theorem", "pacelc", "denormalization", "unique-id-generation", "object-storage", "large-file-uploads", "time-series-databases"];
const expectedMinutes = [30, 30, 25, 20, 20, 25, 30, 30, 30, 30, 35, 30, 30, 25, 20, 20, 25, 25, 25, 25];
const routeById = new Map(systemDesignLessons.map((lesson) => [lesson.id, lesson.slug]));
const practiceIds = new Set(systemDesignPracticeProblemManifest.map((problem) => problem.id));

for (const [index, id] of dataIds.entries()) {
  const topic = systemDesignTopicManifest.find((item) => item.id === id);
  assert.ok(topic, `Missing Data & Storage topic ${id}.`);
  assert.equal(topic.published, true, `${id} should be published.`);
  assert.equal(topic.contentStatus, "published", `${id} should have published status.`);
  assert.equal(topic.lastReviewed, "2026-08-14", `${id} should carry the editorial review date.`);
  assert.equal(topic.estimatedMinutes, expectedMinutes[index], `${id} duration changed unexpectedly.`);
  assert.ok(routeById.get(id), `${id} needs a curriculum route.`);
}

const files = ["modeling.tsx", "correctness.tsx", "distribution.tsx", "storage.tsx"].map((file) => `content/system-design/data-storage/${file}`);
const contents = await Promise.all(files.map((file) => readFile(file, "utf8")));
const combined = contents.join("\n");
const components = ["DataModeling", "SqlVsNosql", "RelationalDatabases", "KeyValueStores", "DocumentDatabases", "WideColumnDatabases", "DatabaseIndexes", "Transactions", "IsolationConcurrency", "Replication", "Sharding", "ConsistentHashing", "ConsistencyModels", "CapTheorem", "Pacelc", "Denormalization", "UniqueIdGeneration", "ObjectStorage", "LargeFileUploads", "TimeSeriesDatabases"];
for (const component of components) assert.match(combined, new RegExp(`export function ${component}LessonContent\\(`), `Missing ${component} lesson component.`);

assert.equal((combined.match(/<RememberThis>/g) ?? []).length, 20, "Every Data & Storage lesson needs a What to remember panel.");
assert.equal((combined.match(/<PracticeConnections ids=/g) ?? []).length, 20, "Every Data & Storage lesson needs practice connections.");
assert.equal((combined.match(/<FurtherReading items=/g) ?? []).length, 20, "Every Data & Storage lesson needs source metadata.");
assert.equal((combined.match(/<MermaidDiagram/g) ?? []).length, 9, "Data & Storage should contain nine purposeful Mermaid diagrams.");
assert.equal((combined.match(/<WorkedExample/g) ?? []).length, 4, "Data & Storage should contain four structured worked examples.");
assert.match(combined, /<ConsistentHashingDemo \/>/, "Consistent Hashing should include the custom ring interactive.");
assert.match(combined, /<details><summary>Reveal one access-pattern-first answer/, "Data Modeling should include the expandable News Feed exercise.");
assert.match(combined, /ACID consistency means preserving invariants/, "Transactions must distinguish ACID and distributed consistency.");
assert.match(combined, /“Choose any two” is misleading/, "CAP must correct the pick-two shortcut.");
assert.match(combined, /ON messages\(conversation_id, created_at\)/, "Indexes need the composite-index example.");
assert.match(combined, /WHERE id = 42 AND version = 7/, "Concurrency needs the conditional-update example.");

for (const source of contents) {
  for (const phrase of ["In today's digital world", "Imagine a world where", "In conclusion", "It is important to note", "SQL = consistency", "NoSQL = scalability"]) assert.equal(source.includes(phrase), false, `Data & Storage content contains banned filler or shortcut: ${phrase}`);
  for (const match of source.matchAll(/PracticeConnections ids=\{\[([^\]]+)\]\}/g)) {
    for (const practiceId of [...match[1].matchAll(/"([^"]+)"/g)].map((item) => item[1])) assert.ok(practiceIds.has(practiceId), `Unknown Data & Storage practice ${practiceId}.`);
  }
  for (const href of [...source.matchAll(/href="(\/system-design\/[^"]+)"/g)].map((item) => item[1])) assert.ok(systemDesignLessons.some((lesson) => lesson.slug === href), `Unknown Data & Storage route ${href}.`);
}

const index = await readFile("content/system-design/data-storage/index.tsx", "utf8");
const route = await readFile("app/system-design/[...segments]/page.tsx", "utf8");
for (const id of dataIds) assert.match(index, new RegExp(`"${id}"`), `Data & Storage dispatcher is missing ${id}.`);
assert.match(route, /dataStorageLessonIds\.has\(lesson\.id\)/, "The catch-all route must render published Data & Storage lessons.");

const interactive = await readFile("components/consistent-hashing-demo.tsx", "utf8");
assert.match(interactive, /Add node/, "Consistent-hashing demo needs Add Node.");
assert.match(interactive, /Remove node/, "Consistent-hashing demo needs Remove Node.");
assert.match(interactive, /aria-live="polite"/, "Consistent-hashing movement should be announced.");
assert.match(interactive, /Current key ownership/, "The interactive needs an accessible static ownership table.");

const sources = await readFile("content/system-design/data-storage/sources.ts", "utf8");
for (const domain of ["postgresql.org", "mongodb.com", "cassandra.apache.org", "docs.aws.amazon.com", "doi.org", "rfc-editor.org", "cs.umd.edu"]) assert.match(sources, new RegExp(domain.replaceAll(".", "\\.")), `Source metadata should include ${domain}.`);

console.log(`System Design Data & Storage passed: ${dataIds.length} published lessons, 9 Mermaid diagrams, one interactive with fallback, one exercise, valid routes/practice links, ${expectedMinutes.reduce((sum, value) => sum + value, 0)} estimated minutes, corrected terminology, and authoritative source metadata.`);
