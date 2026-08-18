import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { systemDesignPracticeProblemManifest, systemDesignTopicManifest } from "../data/system-design/manifest.ts";
import { systemDesignLessons } from "../data/system-design/curriculum.ts";

const ids = ["redis", "kafka-deep-dive", "postgresql", "dynamodb", "elasticsearch", "s3", "cassandra", "rabbitmq", "sqs", "zookeeper", "etcd", "flink-deep-dive"];
const minutes = [45, 45, 40, 40, 35, 35, 35, 28, 25, 25, 25, 35];
const routes = new Map(systemDesignLessons.map((lesson) => [lesson.id, lesson.slug]));

for (const [index, id] of ids.entries()) {
  const topic = systemDesignTopicManifest.find((item) => item.id === id);
  assert.ok(topic, `Missing ${id}.`);
  assert.equal(topic.sectionId, "technology");
  assert.equal(topic.published, true);
  assert.equal(topic.contentStatus, "published");
  assert.equal(topic.sourceCoverage.primarySources, true);
  assert.equal(topic.lastReviewed, "2026-08-14");
  assert.equal(topic.estimatedMinutes, minutes[index]);
  assert.ok(topic.subtopics.length >= 12, `${id} needs interview-depth subtopics.`);
  assert.ok(routes.get(id)?.startsWith("/system-design/technology/"));
  for (const prerequisite of topic.prerequisites) assert.ok(systemDesignTopicManifest.some((item) => item.id === prerequisite), `${id} has unknown prerequisite ${prerequisite}.`);
}

const files = ["core-platforms.tsx", "data-search-object.tsx", "distributed-messaging.tsx", "coordination-streaming.tsx"].map((file) => `content/system-design/technology/${file}`);
const contents = await Promise.all(files.map((file) => readFile(file, "utf8")));
const combined = contents.join("\n");
assert.equal((combined.match(/<TechnologyLessonEnd/g) ?? []).length, 12);
assert.equal((combined.match(/<MermaidDiagram/g) ?? []).length, 13);
assert.equal((combined.match(/<ConceptFirst/g) ?? []).length, 12);
assert.match(combined, /<ConsumerGroupDemo \/>/, "Kafka should reuse the accessible consumer-group visual.");
assert.match(combined, /<ConsistentHashingDemo \/>/, "Cassandra should reuse the accessible consistent-hashing visual.");
assert.ok((combined.match(/<CommonMistakes/g) ?? []).length >= 12);
assert.ok((combined.match(/<InterviewFollowUps/g) ?? []).length >= 12);

for (const phrase of [
  "Kafka guarantees exactly once.",
  "DynamoDB is eventually consistent.",
  "S3 is eventually consistent",
  "Redis Cluster uses consistent hashing",
  "watermarks prove",
  "Postgres = small",
  "DynamoDB = big",
  "In conclusion",
]) assert.equal(combined.includes(phrase), false, `Technology content contains banned shortcut: ${phrase}`);

const practices = new Set(systemDesignPracticeProblemManifest.map((item) => item.id));
for (const source of contents) {
  for (const match of source.matchAll(/practice=\{\[([^\]]+)\]\}/g)) for (const id of [...match[1].matchAll(/"([^"]+)"/g)].map((item) => item[1])) assert.ok(practices.has(id), `Unknown practice ${id}.`);
  for (const href of [...source.matchAll(/href="(\/system-design\/[^"]+)"/g)].map((item) => item[1])) assert.ok(systemDesignLessons.some((lesson) => lesson.slug === href), `Unknown route ${href}.`);
}

const sources = await readFile("content/system-design/technology/sources.ts", "utf8");
for (const domain of ["redis.io", "kafka.apache.org", "postgresql.org", "docs.aws.amazon.com", "elastic.co", "opensearch.org", "cassandra.apache.org", "rabbitmq.com", "zookeeper.apache.org", "etcd.io", "flink-docs-stable"]) assert.match(sources, new RegExp(domain.replaceAll(".", "\\.")));
const route = await readFile("app/system-design/[...segments]/page.tsx", "utf8");
assert.match(route, /technologyLessonIds\.has\(lesson\.id\)/);

console.log(`System Design Technology passed: 12 published lessons, ${ids.map((id) => systemDesignTopicManifest.find((item) => item.id === id).subtopics.length).reduce((a, b) => a + b, 0)} subtopics, 13 Mermaid diagrams, valid concept/practice links, official source metadata, and ${minutes.reduce((a, b) => a + b, 0)} estimated minutes.`);
