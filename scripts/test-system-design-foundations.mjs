import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { systemDesignPracticeProblemManifest, systemDesignTopicManifest } from "../data/system-design/manifest.ts";
import { systemDesignLessons } from "../data/system-design/curriculum.ts";

const foundationIds = ["introduction", "interview-framework", "requirements", "estimation", "core-system-properties"];
const networkingIds = ["request-path", "dns", "http", "rest", "pagination", "idempotent-apis", "grpc", "graphql", "realtime-communication", "reverse-proxies", "load-balancing", "api-gateway", "service-discovery", "cdn", "rate-limiting"];
const dataStorageIds = ["data-modeling", "sql-vs-nosql", "sql-databases", "key-value-stores", "document-databases", "wide-column-databases", "database-indexes", "transactions", "isolation-levels", "replication", "sharding", "consistent-hashing", "consistency-models", "cap-theorem", "pacelc", "denormalization", "unique-id-generation", "object-storage", "large-file-uploads", "time-series-databases"];
const cachingIds = ["caching", "cache-placement", "cache-aside", "read-through", "write-through", "write-behind", "cache-ttl", "cache-eviction", "cache-invalidation", "cache-stampedes", "hot-keys", "cache-penetration", "cache-warming", "distributed-caching", "cache-failure-modes", "redis-caching"];
const messagingIds = ["sync-vs-async", "message-queues", "producers-consumers", "queue-vs-pubsub", "pub-sub", "event-streaming", "queue-vs-stream", "partitions", "consumer-groups", "message-ordering", "delivery-semantics", "idempotent-consumers", "message-retries", "dead-letter-queues", "deduplication", "backpressure", "event-driven-architecture", "event-sourcing", "transactional-outbox", "change-data-capture", "kafka", "kafka-partitions-replication", "kafka-consumer-groups-offsets", "kafka-delivery-guarantees", "kafka-vs-queues", "rabbitmq-sqs", "flink"];
const reliabilityIds = ["failure-thinking", "timeouts", "retries", "exponential-backoff-jitter", "idempotency", "circuit-breaker", "bulkheads", "graceful-degradation", "load-shedding", "backpressure-reliability", "health-checks", "failover", "distributed-locks", "leases-fencing-tokens", "leader-election", "quorums", "distributed-consensus", "raft", "distributed-transactions", "two-phase-commit", "saga", "multi-region", "active-passive-active-active", "disaster-recovery", "rpo-rto", "partial-failure"];
const specializedIds = ["full-text-search", "inverted-indexes", "search-engine-concepts", "search-autocomplete", "tries-prefix-search", "geospatial-search", "geohashing", "quadtrees", "notification-delivery", "job-schedulers", "leaderboards", "distributed-counters", "web-crawling", "media-processing", "bloom-filters", "hyperloglog", "count-min-sketch", "collaborative-editing", "operational-transformation", "crdts", "vector-search", "embeddings-infrastructure", "model-serving", "feature-stores", "choosing-specialized-blocks"];
const technologyIds = ["redis", "kafka-deep-dive", "postgresql", "dynamodb", "elasticsearch", "s3", "cassandra", "rabbitmq", "sqs", "zookeeper", "etcd", "flink-deep-dive"];
const contentFiles = {
  introduction: "content/system-design/foundations/introduction.tsx",
  "interview-framework": "content/system-design/foundations/interview-framework.tsx",
  requirements: "content/system-design/foundations/requirements.tsx",
  estimation: "content/system-design/foundations/estimation.tsx",
  "core-system-properties": "content/system-design/foundations/core-system-properties.tsx",
};
const routeById = new Map(systemDesignLessons.map((lesson) => [lesson.id, lesson.slug]));
const practiceIds = new Set(systemDesignPracticeProblemManifest.map((problem) => problem.id));
const systemDesignUtilityRoutes = new Set(["/system-design/plan"]);

for (const id of foundationIds) {
  const topic = systemDesignTopicManifest.find((item) => item.id === id);
  assert.ok(topic, `Missing ${id} from the manifest.`);
  assert.equal(topic.published, true, `${id} should be published.`);
  assert.equal(topic.contentStatus, "published", `${id} should have published content status.`);
  assert.equal(topic.lastReviewed, "2026-08-14", `${id} should carry the editorial review date.`);
  assert.ok(routeById.get(id), `${id} should remain reachable through curriculum navigation.`);
}

const publishedIds = systemDesignTopicManifest.filter((topic) => topic.published).map((topic) => topic.id).sort();
assert.deepEqual(publishedIds, [...foundationIds, ...networkingIds, ...dataStorageIds, ...cachingIds, ...messagingIds, ...reliabilityIds, ...specializedIds, ...technologyIds].sort(), "Only reviewed content phases should be published.");

const contents = Object.fromEntries(await Promise.all(Object.entries(contentFiles).map(async ([id, file]) => [id, await readFile(file, "utf8")])));
for (const [id, source] of Object.entries(contents)) {
  assert.match(source, /<RememberThis>/, `${id} needs a What to remember panel.`);
  assert.match(source, /<PracticeConnections ids=/, `${id} needs manifest-backed practice links.`);
  assert.match(source, /<FurtherReading items=/, `${id} needs source metadata surfaced.`);
  for (const phrase of ["In today's digital world", "Imagine a world where", "In conclusion", "It is important to note"]) {
    assert.equal(source.includes(phrase), false, `${id} contains banned filler: ${phrase}`);
  }
  for (const match of source.matchAll(/PracticeConnections ids=\{\[([^\]]+)\]\}/g)) {
    for (const practiceId of [...match[1].matchAll(/"([^"]+)"/g)].map((item) => item[1])) assert.ok(practiceIds.has(practiceId), `${id} links unknown practice ${practiceId}.`);
  }
  for (const href of [...source.matchAll(/href="(\/system-design\/[^"]+)"/g)].map((item) => item[1])) {
    assert.ok(systemDesignLessons.some((lesson) => lesson.slug === href) || systemDesignUtilityRoutes.has(href), `${id} links unknown lesson or utility route ${href}.`);
  }
}

assert.equal((contents["interview-framework"].match(/<MermaidDiagram/g) ?? []).length, 1, "Interview framework needs one Mermaid diagram.");
assert.equal((contents["core-system-properties"].match(/<MermaidDiagram/g) ?? []).length, 1, "Core properties needs one Mermaid diagram.");
assert.match(contents.requirements, /<details><summary>Reveal one reasonable answer/, "Requirements exercise should use progressive disclosure.");
assert.match(contents.estimation, /<CapacityCalculator \/>/, "Capacity estimation should include the lightweight calculator.");

assert.equal(100_000_000 * 10 / 86_400, 11_574.074074074075, "Average RPS arithmetic changed unexpectedly.");
assert.ok(Math.abs(100_000_000 * 10 / 86_400 * 5 - 57_870.37037037037) < 0.001, "Peak RPS arithmetic is wrong.");
assert.equal(10_000_000 * 2, 20_000_000, "Daily object storage arithmetic is wrong.");
assert.equal(20 * 365, 7_300, "Annual storage arithmetic is wrong.");
assert.equal(50_000 * 500 / 1_000_000, 25, "Outbound bandwidth arithmetic is wrong.");
assert.equal(20_000_000 * 1 / 1_000_000, 20, "Raw cache size arithmetic is wrong.");
assert.equal(100_000 * 0.05, 5_000, "Cache miss arithmetic is wrong.");
assert.equal(20_000 * 0.2, 4_000, "Concurrency arithmetic is wrong.");
assert.equal(365 * 24 * 0.001, 8.76, "99.9% annual downtime arithmetic is wrong.");

const sources = await readFile("content/system-design/foundations/sources.ts", "utf8");
for (const domain of ["sre.google", "learn.microsoft.com", "docs.aws.amazon.com"]) assert.match(sources, new RegExp(domain.replace(".", "\\.")), `Source metadata should include ${domain}.`);
const progress = await readFile("components/system-design-lesson-progress.tsx", "utf8");
const planner = await readFile("components/system-design-focus-planner.tsx", "utf8");
assert.match(progress, /engineering-foundry-system-design-study-progress-v1/, "Lesson completion should use the study-plan progress store.");
assert.match(planner, /engineering-foundry-system-design-study-progress-v1/, "Planner progress storage contract changed.");

console.log("System Design Foundations passed: five published lessons, two Mermaid diagrams, one calculator, verified arithmetic, valid practice/topic links, source metadata, and shared progress storage.");
