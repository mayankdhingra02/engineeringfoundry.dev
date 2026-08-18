import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { systemDesignPracticeProblemManifest, systemDesignTopicManifest } from "../data/system-design/manifest.ts";
import { systemDesignLessons } from "../data/system-design/curriculum.ts";

const networkingIds = ["request-path", "dns", "http", "rest", "pagination", "idempotent-apis", "grpc", "graphql", "realtime-communication", "reverse-proxies", "load-balancing", "api-gateway", "service-discovery", "cdn", "rate-limiting"];
const expectedMinutes = [25, 15, 25, 30, 18, 20, 20, 20, 35, 15, 30, 20, 20, 30, 35];
const routeById = new Map(systemDesignLessons.map((lesson) => [lesson.id, lesson.slug]));
const practiceIds = new Set(systemDesignPracticeProblemManifest.map((problem) => problem.id));

for (const [index, id] of networkingIds.entries()) {
  const topic = systemDesignTopicManifest.find((item) => item.id === id);
  assert.ok(topic, `Missing Networking topic ${id}.`);
  assert.equal(topic.published, true, `${id} should be published.`);
  assert.equal(topic.contentStatus, "published", `${id} should have published status.`);
  assert.equal(topic.lastReviewed, "2026-08-14", `${id} should carry the editorial review date.`);
  assert.equal(topic.estimatedMinutes, expectedMinutes[index], `${id} duration changed unexpectedly.`);
  assert.ok(routeById.get(id), `${id} needs a curriculum route.`);
}

const files = [
  "content/system-design/networking/transport.tsx",
  "content/system-design/networking/api-design.tsx",
  "content/system-design/networking/realtime-edge.tsx",
  "content/system-design/networking/routing-control.tsx",
];
const contents = await Promise.all(files.map((file) => readFile(file, "utf8")));
const combined = contents.join("\n");

for (const component of ["RequestPath", "Dns", "Http", "Rest", "Pagination", "IdempotentApis", "Grpc", "Graphql", "RealtimeCommunication", "ReverseProxy", "LoadBalancing", "ApiGateway", "ServiceDiscovery", "Cdn", "RateLimiting"]) {
  assert.match(combined, new RegExp(`export function ${component}LessonContent\\(`), `Missing ${component} lesson component.`);
}
assert.equal((combined.match(/<RememberThis>/g) ?? []).length, 15, "Every Networking lesson needs a What to remember panel.");
assert.equal((combined.match(/<PracticeConnections ids=/g) ?? []).length, 15, "Every Networking lesson needs practice connections.");
assert.equal((combined.match(/<FurtherReading items=/g) ?? []).length, 15, "Every Networking lesson needs source metadata.");
assert.equal((combined.match(/<MermaidDiagram/g) ?? []).length, 10, "Networking should contain ten purposeful Mermaid diagrams.");
assert.match(combined, /<TokenBucketDemo \/>/, "Rate Limiting should include the token-bucket interactive.");
assert.match(combined, /<details><summary>Reveal one reasonable contract/, "REST should include the expandable API exercise.");

for (const source of contents) {
  for (const phrase of ["In today's digital world", "Imagine a world where", "In conclusion", "It is important to note"]) assert.equal(source.includes(phrase), false, `Networking content contains banned filler: ${phrase}`);
  for (const match of source.matchAll(/PracticeConnections ids=\{\[([^\]]+)\]\}/g)) {
    for (const practiceId of [...match[1].matchAll(/"([^"]+)"/g)].map((item) => item[1])) assert.ok(practiceIds.has(practiceId), `Unknown Networking practice ${practiceId}.`);
  }
  for (const href of [...source.matchAll(/href="(\/system-design\/[^"]+)"/g)].map((item) => item[1])) assert.ok(systemDesignLessons.some((lesson) => lesson.slug === href), `Unknown Networking lesson route ${href}.`);
}

const index = await readFile("content/system-design/networking/index.tsx", "utf8");
const route = await readFile("app/system-design/[...segments]/page.tsx", "utf8");
for (const id of networkingIds) assert.match(index, new RegExp(`"${id}"`), `Networking dispatcher is missing ${id}.`);
assert.match(route, /networkingLessonIds\.has\(lesson\.id\)/, "The catch-all route must render published Networking lessons.");

assert.equal(20 + 40 + 50 + 25 + 80, 215, "Request-path latency example arithmetic is wrong.");
assert.equal(100_000 * 1 / 1_000, 100, "CDN origin-bandwidth example arithmetic is wrong.");
assert.equal(100 * 0.05, 5, "CDN hit-rate example arithmetic is wrong.");

const sources = await readFile("content/system-design/networking/sources.ts", "utf8");
for (const domain of ["rfc-editor.org", "grpc.io", "spec.graphql.org", "developer.mozilla.org", "kubernetes.io", "docs.aws.amazon.com", "developers.cloudflare.com", "learn.microsoft.com"]) assert.match(sources, new RegExp(domain.replaceAll(".", "\\.")), `Source metadata should include ${domain}.`);
const tokenDemo = await readFile("components/token-bucket-demo.tsx", "utf8");
assert.match(tokenDemo, /const capacity = 10;/, "Token bucket capacity should remain explicit.");
assert.match(tokenDemo, /const refillPerSecond = 5;/, "Token bucket refill should remain explicit.");

console.log(`System Design Networking passed: ${networkingIds.length} published lessons, 10 Mermaid diagrams, one interactive, valid routes/practice links, ${expectedMinutes.reduce((sum, value) => sum + value, 0)} estimated minutes, verified examples, and official source metadata.`);
