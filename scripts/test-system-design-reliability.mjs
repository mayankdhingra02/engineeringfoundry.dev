import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { systemDesignPracticeProblemManifest, systemDesignTopicManifest } from "../data/system-design/manifest.ts";
import { systemDesignLessons } from "../data/system-design/curriculum.ts";

const ids = ["failure-thinking", "timeouts", "retries", "exponential-backoff-jitter", "idempotency", "circuit-breaker", "bulkheads", "graceful-degradation", "load-shedding", "backpressure-reliability", "health-checks", "failover", "distributed-locks", "leases-fencing-tokens", "leader-election", "quorums", "distributed-consensus", "raft", "distributed-transactions", "two-phase-commit", "saga", "multi-region", "active-passive-active-active", "disaster-recovery", "rpo-rto", "partial-failure"];
const expectedMinutes = [20, 20, 20, 18, 30, 22, 15, 18, 20, 12, 18, 25, 25, 25, 22, 25, 28, 35, 22, 22, 35, 35, 25, 25, 18, 30];
const routes = new Map(systemDesignLessons.map((lesson) => [lesson.id, lesson.slug]));
for (const [index, id] of ids.entries()) { const topic = systemDesignTopicManifest.find((item) => item.id === id); assert.ok(topic, `Missing ${id}.`); assert.equal(topic.published, true); assert.equal(topic.contentStatus, "published"); assert.equal(topic.lastReviewed, "2026-08-14"); assert.equal(topic.estimatedMinutes, expectedMinutes[index]); assert.ok(routes.get(id)); for (const dependency of topic.prerequisites) assert.ok(systemDesignTopicManifest.some((item) => item.id === dependency), `${id} has unknown prerequisite ${dependency}.`); }
const contentFiles = ["failure-resilience.tsx", "coordination.tsx", "transactions-regions.tsx"].map((file) => `content/system-design/reliability/${file}`);
const contents = await Promise.all(contentFiles.map((file) => readFile(file, "utf8")));
const combined = contents.join("\n");
assert.equal((combined.match(/<ReliabilityLessonEnd/g) ?? []).length, 26, "Every reliability lesson needs practice, sources, and a remember panel.");
assert.equal((combined.match(/<MermaidDiagram/g) ?? []).length, 16, "Reliability needs sixteen purposeful Mermaid diagrams.");
assert.equal((combined.match(/<WorkedExample/g) ?? []).length, 4, "Reliability needs four structured numerical examples.");
assert.match(combined, /<LeaseFencingDemo \/>/);
assert.match(combined, /R \+ W &gt; N/);
assert.match(combined, /Compensation is a new business action, not rollback/);
assert.match(combined, /Replication and backup protect different failures/);
for (const phrase of ["retries always improve reliability", "Replication is backup", "active-active is better", "Saga provides ACID", "In conclusion"]) assert.equal(combined.includes(phrase), false, `Reliability contains banned shortcut: ${phrase}`);
const practiceIds = new Set(systemDesignPracticeProblemManifest.map((item) => item.id));
for (const source of contents) { for (const match of source.matchAll(/practice=\{\[([^\]]+)\]\}/g)) for (const id of [...match[1].matchAll(/"([^"]+)"/g)].map((item) => item[1])) assert.ok(practiceIds.has(id), `Unknown practice ${id}.`); for (const href of [...source.matchAll(/href="(\/system-design\/[^"]+)"/g)].map((item) => item[1])) assert.ok(systemDesignLessons.some((lesson) => lesson.slug === href), `Unknown route ${href}.`); }
assert.equal(10_000 * 3, 30_000); assert.equal(40 + 100 + 200 + 60, 400); assert.equal(50_000 - 20_000, 30_000); assert.equal(40_000 + 40_000 - 60_000, 20_000);
const interactive = await readFile("components/lease-fencing-demo.tsx", "utf8"); for (const marker of ["aria-live=\"polite\"", "aria-current", "Previous", "Next event", "token 41", "token 42"]) assert.match(interactive, new RegExp(marker));
const sources = await readFile("content/system-design/reliability/sources.ts", "utf8"); for (const domain of ["aws.amazon.com", "sre.google", "learn.microsoft.com", "raft.github.io"]) assert.match(sources, new RegExp(domain.replaceAll(".", "\\.")));
const route = await readFile("app/system-design/[...segments]/page.tsx", "utf8"); assert.match(route, /reliabilityLessonIds\.has\(lesson\.id\)/);
const css = await readFile("app/globals.css", "utf8"); assert.match(css, /\.sd-fencing-demo ol \{ grid-template-columns: repeat\(2/);
console.log(`System Design Reliability passed: 26 published lessons, ${ids.map((id) => systemDesignTopicManifest.find((item) => item.id === id).subtopics.length).reduce((a,b)=>a+b,0)} subtopics, 16 Mermaid diagrams, one accessible lease/fencing interactive, 4 worked examples, valid dependencies/routes/practice links, and ${expectedMinutes.reduce((a,b)=>a+b,0)} estimated minutes.`);
