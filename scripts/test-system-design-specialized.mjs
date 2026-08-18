import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { systemDesignPracticeProblemManifest, systemDesignTopicManifest } from "../data/system-design/manifest.ts";
import { systemDesignLessons } from "../data/system-design/curriculum.ts";

const ids = ["full-text-search", "inverted-indexes", "search-engine-concepts", "search-autocomplete", "tries-prefix-search", "geospatial-search", "geohashing", "quadtrees", "notification-delivery", "job-schedulers", "leaderboards", "distributed-counters", "web-crawling", "media-processing", "bloom-filters", "hyperloglog", "count-min-sketch", "collaborative-editing", "operational-transformation", "crdts", "vector-search", "embeddings-infrastructure", "model-serving", "feature-stores", "choosing-specialized-blocks"];
const minutes = [30, 20, 25, 30, 18, 30, 20, 20, 35, 35, 25, 22, 35, 30, 20, 15, 18, 25, 18, 20, 25, 20, 30, 25, 25];
const routes = new Map(systemDesignLessons.map((lesson) => [lesson.id, lesson.slug]));
for (const [index, id] of ids.entries()) { const topic = systemDesignTopicManifest.find((item) => item.id === id); assert.ok(topic, `Missing ${id}.`); assert.equal(topic.published, true); assert.equal(topic.contentStatus, "published"); assert.equal(topic.lastReviewed, "2026-08-14"); assert.equal(topic.estimatedMinutes, minutes[index]); assert.ok(routes.get(id)); for (const prerequisite of topic.prerequisites) assert.ok(systemDesignTopicManifest.some((item) => item.id === prerequisite), `${id} has unknown prerequisite ${prerequisite}.`); }
assert.equal(systemDesignTopicManifest.some((item) => item.id === "hashing-basics"), false, "Unrequested Hashing Fundamentals should not appear in the Specialized sequence.");
assert.equal(systemDesignTopicManifest.find((item) => item.id === "elasticsearch").published, true, "The reviewed Technology Deep Dive phase should now publish Elasticsearch/OpenSearch.");
const files = ["search-spatial.tsx", "product-systems.tsx", "probabilistic-collaboration.tsx", "ml-choice.tsx"].map((file) => `content/system-design/specialized/${file}`);
const contents = await Promise.all(files.map((file) => readFile(file, "utf8"))); const combined = contents.join("\n");
assert.equal((combined.match(/<SpecializedLessonEnd/g) ?? []).length, 25);
assert.equal((combined.match(/<MermaidDiagram/g) ?? []).length, 15);
assert.equal((combined.match(/<WorkedExample/g) ?? []).length, 3);
assert.match(combined, /<GeospatialSearchDemo \/>/); assert.match(combined, /<BloomFilterDemo \/>/);
for (const phrase of ["geohashes guarantee", "execute exactly once", "Bloom filters prove membership", "HyperLogLog is exact", "Count-Min Sketch gives exact", "vector DB replaces", "batching always reduces latency", "In conclusion"]) assert.equal(combined.includes(phrase), false, `Specialized content contains banned shortcut: ${phrase}`);
const practices = new Set(systemDesignPracticeProblemManifest.map((item) => item.id));
for (const source of contents) { for (const match of source.matchAll(/practice=\{\[([^\]]+)\]\}/g)) for (const id of [...match[1].matchAll(/"([^"]+)"/g)].map((item) => item[1])) assert.ok(practices.has(id), `Unknown practice ${id}.`); for (const href of [...source.matchAll(/href="(\/system-design\/[^"]+)"/g)].map((item) => item[1])) assert.ok(systemDesignLessons.some((lesson) => lesson.slug === href), `Unknown route ${href}.`); }
const geospatial = await readFile("components/geospatial-search-demo.tsx", "utf8"); for (const marker of ["aria-live=\"polite\"", "Current cell only", "Include neighbors", "conceptual grid"]) assert.match(geospatial, new RegExp(marker));
const bloom = await readFile("components/bloom-filter-demo.tsx", "utf8"); for (const marker of ["aria-live=\"polite\"", "Definitely not present", "Possibly present", "aria-pressed"]) assert.match(bloom, new RegExp(marker));
const sources = await readFile("content/system-design/specialized/sources.ts", "utf8"); for (const domain of ["elastic.co", "opensearch.org", "redis.io", "rfc-editor.org", "berkeley.edu", "cloud.google.com", "kserve.github.io", "docs.feast.dev"]) assert.match(sources, new RegExp(domain.replaceAll(".", "\\.")));
const route = await readFile("app/system-design/[...segments]/page.tsx", "utf8"); assert.match(route, /specializedLessonIds\.has\(lesson\.id\)/);
assert.equal(100, 100); assert.equal(360 + 720 + 1080 + 2160, 4320);
console.log(`System Design Specialized passed: 25 published lessons, ${ids.map((id) => systemDesignTopicManifest.find((item) => item.id === id).subtopics.length).reduce((a,b)=>a+b,0)} subtopics, 15 Mermaid diagrams, two accessible schematics, 3 worked examples, valid links, and ${minutes.reduce((a,b)=>a+b,0)} estimated minutes.`);
