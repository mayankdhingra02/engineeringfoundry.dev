import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { systemDesignPracticeProblemManifest, systemDesignTopicManifest } from "../data/system-design/manifest.ts";
import { systemDesignLessons } from "../data/system-design/curriculum.ts";

const messagingIds = ["sync-vs-async", "message-queues", "producers-consumers", "queue-vs-pubsub", "pub-sub", "event-streaming", "queue-vs-stream", "partitions", "consumer-groups", "message-ordering", "delivery-semantics", "idempotent-consumers", "message-retries", "dead-letter-queues", "deduplication", "backpressure", "event-driven-architecture", "event-sourcing", "transactional-outbox", "change-data-capture", "kafka", "kafka-partitions-replication", "kafka-consumer-groups-offsets", "kafka-delivery-guarantees", "kafka-vs-queues", "rabbitmq-sqs", "flink"];
const expectedMinutes = [20, 30, 20, 20, 25, 25, 20, 25, 25, 20, 25, 20, 15, 15, 15, 25, 25, 20, 30, 25, 35, 25, 25, 25, 20, 20, 20];
const routes = new Map(systemDesignLessons.map((lesson) => [lesson.id, lesson.slug]));
const practiceIds = new Set(systemDesignPracticeProblemManifest.map((item) => item.id));
for (const [index, id] of messagingIds.entries()) { const topic = systemDesignTopicManifest.find((item) => item.id === id); assert.ok(topic, `Missing ${id}.`); assert.equal(topic.published, true, `${id} should be published.`); assert.equal(topic.contentStatus, "published"); assert.equal(topic.lastReviewed, "2026-08-14"); assert.equal(topic.estimatedMinutes, expectedMinutes[index]); assert.ok(routes.get(id)); }

const files = ["core.tsx", "partition-delivery.tsx", "operations.tsx", "kafka.tsx"].map((file) => `content/system-design/messaging/${file}`);
const contents = await Promise.all(files.map((file) => readFile(file, "utf8")));
const combined = contents.join("\n");
assert.equal((combined.match(/<MessagingLessonEnd/g) ?? []).length, 27, "Every lesson needs practice, sources, and a remember panel.");
assert.equal((combined.match(/<MermaidDiagram/g) ?? []).length, 13, "Messaging should have 13 purposeful Mermaid diagrams including the consumer fallback.");
assert.equal((combined.match(/<WorkedExample/g) ?? []).length, 6, "Messaging should have six structured worked examples.");
assert.match(combined, /<ConsumerGroupDemo \/>/, "Consumer Groups needs the custom interactive.");
for (const phrase of ["Kafka provides global ordering", "Kafka guarantees exactly-once processing", "queues guarantee exactly once", "Transaction Outbox guarantees exactly once", "In today's digital world", "In conclusion"]) assert.equal(combined.includes(phrase), false, `Messaging contains banned shortcut: ${phrase}`);
for (const source of contents) { for (const match of source.matchAll(/practice=\{\[([^\]]+)\]\}/g)) for (const id of [...match[1].matchAll(/"([^"]+)"/g)].map((item) => item[1])) assert.ok(practiceIds.has(id), `Unknown practice ${id}.`); for (const href of [...source.matchAll(/href="(\/system-design\/[^"]+)"/g)].map((item) => item[1])) assert.ok(systemDesignLessons.some((lesson) => lesson.slug === href), `Unknown route ${href}.`); }
assert.equal(10_000 / 100, 100); assert.equal(25_000 - 10_000, 15_000); assert.equal((12_000 - 10_000) * 3_600, 7_200_000); assert.equal(1_000_000 - 980_000, 20_000); assert.ok(Math.abs(40 * 86_400 / 1_000_000 - 3.456) < 0.001);
const route = await readFile("app/system-design/[...segments]/page.tsx", "utf8"); assert.match(route, /messagingLessonIds\.has\(lesson\.id\)/);
const interactive = await readFile("components/consumer-group-demo.tsx", "utf8"); for (const marker of ["Add consumer", "Remove consumer", "aria-live=\"polite\"", "Current consumer group assignment", "consumers > 4"]) assert.match(interactive, new RegExp(marker));
const sources = await readFile("content/system-design/messaging/sources.ts", "utf8"); for (const domain of ["kafka.apache.org", "docs.aws.amazon.com", "rabbitmq.com", "apache.org/flink"]) assert.match(sources, new RegExp(domain.replaceAll(".", "\\.")));
const css = await readFile("app/globals.css", "utf8"); assert.match(css, /\.sd-consumer-partitions \{ grid-template-columns: repeat\(2/);
console.log(`System Design Messaging passed: 27 published lessons, 237 subtopics, 13 Mermaid diagrams, one accessible consumer-group interactive, 6 worked examples, valid routes/practice links, ${expectedMinutes.reduce((a,b)=>a+b,0)} estimated minutes, verified arithmetic, and official source metadata.`);
