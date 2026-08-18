import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { systemDesignPracticeProblemManifest, systemDesignTopicManifest } from "../data/system-design/manifest.ts";
import { systemDesignLessons } from "../data/system-design/curriculum.ts";

const cachingIds = ["caching", "cache-placement", "cache-aside", "read-through", "write-through", "write-behind", "cache-ttl", "cache-eviction", "cache-invalidation", "cache-stampedes", "hot-keys", "cache-penetration", "cache-warming", "distributed-caching", "cache-failure-modes", "redis-caching"];
const expectedMinutes = [25, 20, 20, 15, 15, 20, 15, 20, 25, 25, 20, 15, 15, 25, 25, 15];
const routeById = new Map(systemDesignLessons.map((lesson) => [lesson.id, lesson.slug]));
const practiceIds = new Set(systemDesignPracticeProblemManifest.map((problem) => problem.id));

for (const [index, id] of cachingIds.entries()) {
  const topic = systemDesignTopicManifest.find((item) => item.id === id);
  assert.ok(topic, `Missing Caching topic ${id}.`);
  assert.equal(topic.published, true, `${id} should be published.`);
  assert.equal(topic.contentStatus, "published", `${id} should have published status.`);
  assert.equal(topic.lastReviewed, "2026-08-14", `${id} should carry the editorial review date.`);
  assert.equal(topic.estimatedMinutes, expectedMinutes[index], `${id} duration changed unexpectedly.`);
  assert.ok(topic.sourceCoverage.primarySources, `${id} should have verified primary-source coverage.`);
  assert.ok(routeById.get(id), `${id} needs a curriculum route.`);
}

const files = ["fundamentals.tsx", "strategies.tsx", "pressure.tsx", "distributed.tsx"].map((file) => `content/system-design/caching/${file}`);
const contents = await Promise.all(files.map((file) => readFile(file, "utf8")));
const combined = contents.join("\n");
const components = ["WhyCaching", "CachePlacement", "CacheAside", "ReadThrough", "WriteThrough", "WriteBehind", "CacheTtl", "CacheEviction", "CacheInvalidation", "CacheStampedes", "HotKeys", "CachePenetration", "CacheWarming", "DistributedCaching", "CacheFailureModes", "RedisCaching"];
for (const component of components) assert.match(combined, new RegExp(`export function ${component}LessonContent\\(`), `Missing ${component} lesson component.`);

assert.equal((combined.match(/<RememberThis>/g) ?? []).length, 16, "Every Caching lesson needs a What to remember panel.");
assert.equal((combined.match(/<PracticeConnections ids=/g) ?? []).length, 16, "Every Caching lesson needs practice connections.");
assert.equal((combined.match(/<FurtherReading items=/g) ?? []).length, 16, "Every Caching lesson needs source metadata.");
assert.equal((combined.match(/<MermaidDiagram/g) ?? []).length, 9, "Caching should contain nine purposeful Mermaid diagrams, including a stampede fallback.");
assert.equal((combined.match(/<WorkedExample/g) ?? []).length, 9, "Caching should contain nine structured worked examples.");
assert.match(combined, /<CacheStampedeDemo \/>/, "Cache Stampede should include the custom interactive.");
assert.match(combined, /Expiration.*Eviction.*solve different problems/s, "Eviction must be distinguished from expiration.");
assert.match(combined, /Redis is one possible implementation choice/, "Redis must be presented as one implementation rather than the definition of caching.");
assert.match(combined, /definitely absent/, "Bloom filter guidance must preserve the no-false-negative teaching contract.");
assert.match(combined, /consistent hashing.*does not split one key&apos;s popularity/is, "Hot Keys must explain the consistent-hashing limitation.");

for (const source of contents) {
  for (const phrase of ["In today's digital world", "Imagine a world where", "In conclusion", "It is important to note"]) assert.equal(source.includes(phrase), false, `Caching content contains banned filler: ${phrase}`);
  for (const match of source.matchAll(/PracticeConnections ids=\{\[([^\]]+)\]\}/g)) {
    for (const practiceId of [...match[1].matchAll(/"([^"]+)"/g)].map((item) => item[1])) assert.ok(practiceIds.has(practiceId), `Unknown Caching practice ${practiceId}.`);
  }
  for (const href of [...source.matchAll(/href="(\/system-design\/[^"]+)"/g)].map((item) => item[1])) assert.ok(systemDesignLessons.some((lesson) => lesson.slug === href), `Unknown Caching route ${href}.`);
}

assert.equal(50_000 * (1 - 0.90), 4_999.999999999999, "Why Caching origin-load arithmetic changed unexpectedly.");
assert.ok(Math.abs(20_000 * (1 - 0.99) - 200) < 0.001, "Stampede normal-load arithmetic is wrong.");
assert.equal(100_000 * (1 - 0.95), 5_000.000000000005, "Cache outage normal-load arithmetic changed unexpectedly.");
assert.equal(100_000 - 10_000, 90_000, "Cache outage shortfall arithmetic is wrong.");

const index = await readFile("content/system-design/caching.tsx", "utf8");
const route = await readFile("app/system-design/[...segments]/page.tsx", "utf8");
for (const id of cachingIds) assert.match(index, new RegExp(`"${id}"`), `Caching dispatcher is missing ${id}.`);
assert.match(route, /cachingLessonIds\.has\(lesson\.id\)/, "The catch-all route must render published Caching lessons.");

const interactive = await readFile("components/cache-stampede-demo.tsx", "utf8");
assert.match(interactive, /Expire hot key/, "Stampede demo needs an expiry action.");
assert.match(interactive, /coalescing/, "Stampede demo needs a coalescing comparison.");
assert.match(interactive, /aria-live="polite"/, "Stampede results should be announced.");
assert.match(interactive, /Accessible request-state summary/, "The interactive needs a static accessible summary.");
assert.match(interactive, /databaseRequests === 1 \? "query" : "queries"/, "Stampede output should use the correct singular label.");

const sources = await readFile("content/system-design/caching/sources.ts", "utf8");
for (const domain of ["aws.amazon.com", "redis.io", "rfc-editor.org"]) assert.match(sources, new RegExp(domain.replaceAll(".", "\\.")), `Source metadata should include ${domain}.`);

console.log(`System Design Caching passed: ${cachingIds.length} published lessons, 129 subtopics, 9 Mermaid diagrams, one interactive with accessible/static fallbacks, 9 worked examples, valid routes/practice links, ${expectedMinutes.reduce((sum, value) => sum + value, 0)} estimated minutes, verified arithmetic, and authoritative source metadata.`);
