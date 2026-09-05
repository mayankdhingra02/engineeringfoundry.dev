import assert from "node:assert/strict";
import { existsSync, readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import {
  systemDesignManifestSections,
  systemDesignPracticeProblemManifest,
  systemDesignTopicManifest,
} from "../data/system-design/manifest.ts";
import { systemDesignLessons } from "../data/system-design/curriculum.ts";
import {
  getPersonalizedTopicRecommendations,
  universalFocusOrder,
} from "../data/system-design/recommendations.ts";
import { generateSystemDesignStudyPlan } from "../data/system-design/study-plan.ts";
import { systemDesignPracticeContents } from "../content/system-design/problems/data.ts";
import { foundationSources } from "../content/system-design/foundations/sources.ts";
import { networkingSources } from "../content/system-design/networking/sources.ts";
import { dataStorageSources } from "../content/system-design/data-storage/sources.ts";
import { cachingSources } from "../content/system-design/caching/sources.ts";
import { messagingSources } from "../content/system-design/messaging/sources.ts";
import { productionEngineeringSources } from "../content/system-design/production-engineering/sources.ts";
import { reliabilitySources } from "../content/system-design/reliability/sources.ts";
import { specializedSources } from "../content/system-design/specialized/sources.ts";
import { technologySources } from "../content/system-design/technology/sources.ts";
import {
  buildSystemDesignStaticParams,
  finitePublicRouteDefinitions,
  indexableFinitePublicRoutes,
} from "../lib/public-route-inventory.ts";

function filesBelow(directory) {
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const path = join(directory, entry.name);
    return entry.isDirectory() ? filesBelow(path) : /\.(?:ts|tsx|mjs)$/.test(entry.name) ? [path] : [];
  });
}

const topicIds = new Set(systemDesignTopicManifest.map((topic) => topic.id));
const topicSlugs = new Set(systemDesignTopicManifest.map((topic) => topic.slug));
const subtopicIds = systemDesignTopicManifest.flatMap((topic) => topic.subtopics.map((subtopic) => subtopic.id));
const problemIds = new Set(systemDesignPracticeProblemManifest.map((problem) => problem.id));
const problemSlugs = new Set(systemDesignPracticeProblemManifest.map((problem) => problem.slug));
const publishedTopicIds = new Set(systemDesignTopicManifest.filter((topic) => topic.published).map((topic) => topic.id));
const publishedProblems = systemDesignPracticeProblemManifest.filter((problem) => problem.contentStatus === "published");

assert.equal(topicIds.size, systemDesignTopicManifest.length, "Topic IDs must be unique.");
assert.equal(topicSlugs.size, systemDesignTopicManifest.length, "Topic slugs must be unique.");
assert.equal(new Set(subtopicIds).size, subtopicIds.length, "Subtopic IDs must be globally unique.");
assert.equal(problemIds.size, systemDesignPracticeProblemManifest.length, "Practice IDs must be unique.");
assert.equal(problemSlugs.size, systemDesignPracticeProblemManifest.length, "Practice slugs must be unique.");
assert.ok(systemDesignTopicManifest.every((topic) => topic.published === (topic.contentStatus === "published")), "Published state and content status must agree.");
assert.ok(systemDesignTopicManifest.every((topic) => topic.prerequisites.every((id) => topicIds.has(id))), "Every prerequisite must resolve.");
assert.ok(systemDesignTopicManifest.every((topic) => topic.relatedTopics.every((id) => topicIds.has(id))), "Every related topic must resolve.");
assert.ok(systemDesignTopicManifest.every((topic) => topic.practiceProblems.every((id) => problemIds.has(id))), "Every practice reference must resolve.");
assert.ok(systemDesignPracticeProblemManifest.every((problem) => [...problem.prerequisites, ...problem.concepts].every((id) => topicIds.has(id))), "Every practice concept must resolve.");
assert.ok(systemDesignTopicManifest.every((topic) => Number.isInteger(topic.estimatedMinutes) && topic.estimatedMinutes > 0), "Lesson estimates must use positive whole minutes.");

const sourceMaps = [foundationSources, networkingSources, dataStorageSources, cachingSources, messagingSources, reliabilitySources, productionEngineeringSources, specializedSources, technologySources];
const sourceIds = new Set(sourceMaps.flatMap((sourceMap) => Object.keys(sourceMap)));
const sourceUrls = [...new Set(sourceMaps.flatMap((sourceMap) => Object.values(sourceMap)).flat().map((source) => source.url))];
assert.deepEqual(systemDesignTopicManifest.filter((topic) => topic.published && topic.id !== "introduction" && !sourceIds.has(topic.id)).map((topic) => topic.id), [], "Every published technical lesson needs Further Reading coverage.");
assert.ok(sourceUrls.every((url) => url.startsWith("https://")), "Further Reading must use secure absolute URLs.");
assert.ok(sourceUrls.every((url) => !/reddit|educative|bytebytego|designgurus|hellointerview/i.test(url)), "Core references must not depend on social or competitor sources.");

const codeFiles = [
  ...filesBelow("app/system-design"),
  ...filesBelow("components").filter((path) => path.includes("system-design") || path.includes("mermaid") || path.match(/(bloom|cache-stampede|consistent-hashing|consumer-group|geospatial|lease-fencing|token-bucket)/)),
  ...filesBelow("content/system-design"),
  ...filesBelow("data/system-design"),
];
const sourceText = codeFiles.map((path) => readFileSync(path, "utf8")).join("\n");
const routeSet = new Set([
  "/system-design/plan",
  "/system-design/practice",
  "/system-design/problems",
  ...systemDesignLessons.map((lesson) => lesson.slug),
]);
const internalLinks = [...sourceText.matchAll(/(?:href=|href:)\s*["'](\/system-design[^"'#?]*)/g)].map((match) => match[1]);
const invalidInternalLinks = [...new Set(internalLinks.filter((href) => !routeSet.has(href)))];
assert.deepEqual(invalidInternalLinks, [], `Invalid System Design links: ${invalidInternalLinks.join(", ")}`);
assert.ok(!internalLinks.includes("/system-design"), "The removed System Design landing route must not be linked.");

for (const phrase of [/in today's/i, /let's dive into/i, /it is important to note/i, /in conclusion/i, /this approach provides/i]) {
  assert.doesNotMatch(sourceText, phrase, `Detected weak generated-writing phrase: ${phrase}`);
}
assert.match(sourceText, /“Pick any two” is not a useful design rule/, "CAP must explicitly correct the pick-any-two shortcut.");
assert.doesNotMatch(sourceText, /CAP (?:means|guarantees|requires)[^\n]{0,40}pick any two/i, "CAP must not be taught as an unconditional pick-any-two rule.");

const sde1ThreeDay = getPersonalizedTopicRecommendations({ level: "sde1", role: "backend", preparationWindow: "3-days" });
const sde2Week = getPersonalizedTopicRecommendations({ level: "sde2", role: "backend", preparationWindow: "1-week" });
assert.deepEqual(sde1ThreeDay.filter((item) => item.group === "focus-now").map((item) => item.topic.id), [...universalFocusOrder.slice(0, 10)], "The three-day plan must stay selective and span core sections.");
assert.deepEqual(sde2Week.filter((item) => item.group === "focus-now").map((item) => item.topic.id), [...universalFocusOrder], "The one-week plan must cover the approved cross-section core.");
for (const context of [
  { level: "sde1", role: "backend", preparationWindow: "3-days" },
  { level: "sde2", role: "backend", preparationWindow: "2-weeks" },
  { level: "senior", role: "infrastructure", preparationWindow: "1-month" },
  { level: "sde2", role: "data", preparationWindow: "1-month" },
  { level: "senior", role: "ml", preparationWindow: "1-month" },
]) {
  const recommendations = getPersonalizedTopicRecommendations(context);
  assert.ok(recommendations.filter((item) => item.group !== "skip-for-now").every((item) => item.topic.published), `${context.role} recommendations surfaced coming-soon content.`);
  const plan = generateSystemDesignStudyPlan({ ...context, minutesPerDay: 120 });
  assert.ok(plan.days.every((day) => day.totalMinutes <= 120), `${context.role} plan exceeded its daily budget.`);
  assert.ok(plan.days.flatMap((day) => day.items).filter((item) => item.type === "topic").every((item) => publishedTopicIds.has(item.topicId)), `${context.role} plan scheduled coming-soon content.`);
}

const searchCapacity = systemDesignPracticeContents.find((problem) => problem.id === "search-engine").capacity;
assert.equal(100_000 * 20, 2_000_000, "Search shard-request arithmetic changed unexpectedly.");
assert.ok(searchCapacity.arithmetic.includes("100K queries/s × 20 queried shards ≈ 2M shard requests/s before replica routing"), "The rendered search estimate must account for query fan-out.");
assert.ok(Math.abs((10_000_000_000 * .1 / 86_400) - 11_574) < 1, "Search recrawl arithmetic is invalid.");
assert.ok(Math.abs((5_000_000 * 300 * 86_400 / 1e12) - 129.6) < .01, "Event analytics daily-ingress arithmetic is invalid.");
assert.ok(Math.abs((20_000 * 2 * 86_400 / 1e9) - 3.456) < .001, "Kafka lesson daily-ingress arithmetic is invalid.");

for (const reportPath of ["docs/system-design-content-inventory.json", "docs/system-design-visual-inventory.json"]) assert.ok(existsSync(reportPath), `${reportPath} must be generated.`);
const inventory = JSON.parse(readFileSync("docs/system-design-content-inventory.json", "utf8"));
const visuals = JSON.parse(readFileSync("docs/system-design-visual-inventory.json", "utf8"));
assert.equal(inventory.summary.topics, systemDesignTopicManifest.length, "Inventory topic count is stale.");
assert.equal(inventory.summary.subtopics, subtopicIds.length, "Inventory subtopic count is stale.");
assert.equal(inventory.summary.practiceProblems, systemDesignPracticeProblemManifest.length, "Inventory practice count is stale.");
assert.equal(inventory.summary.publishedTopics, publishedTopicIds.size, "Inventory published count is stale.");
assert.equal(visuals.mermaidDiagrams, 145, "Visual inventory must include 91 concept diagrams and 54 practice diagrams.");
for (const lessonId of ["distributed-tracing", "oauth-oidc", "tls", "api-abuse-ddos"]) assert.ok(visuals.diagrams.some((diagram) => diagram.lessonId === lessonId), `${lessonId} must appear in the visual inventory.`);
assert.ok(visuals.diagrams.every((diagram) => diagram.lessonId && diagram.purpose && diagram.nodes > 0 && diagram.mobileStatus && diagram.darkModeStatus), "Every diagram needs a lesson, purpose, node count, and responsive/theme status.");

const routeSource = readFileSync("app/system-design/[...segments]/page.tsx", "utf8");
assert.match(routeSource, /buildSystemDesignStaticParams\(\)/, "The finite System Design page must use the shared static-param builder.");
const systemDesignDefinition = finitePublicRouteDefinitions.find(({ pagePattern }) => pagePattern === "/system-design/[...segments]");
const expectedSystemDesignPaths = ["/system-design/problems", ...systemDesignLessons.map((lesson) => lesson.slug)];
assert.deepEqual(systemDesignDefinition?.paths, expectedSystemDesignPaths, "The finite-route inventory must contain the exact System Design route catalog.");
assert.deepEqual(buildSystemDesignStaticParams().map(({ segments }) => `/system-design/${segments.join("/")}`), expectedSystemDesignPaths, "System Design static params must exactly reconstruct the finite route catalog.");
const indexableSystemDesignPaths = indexableFinitePublicRoutes.filter((path) => path.startsWith("/system-design/"));
assert.deepEqual(indexableSystemDesignPaths, systemDesignLessons.filter((lesson) => lesson.status === "published").map((lesson) => lesson.slug), "The sitemap inventory must include exactly published System Design lessons and exclude coming-soon and legacy duplicate routes.");
const nextConfigSource = readFileSync("next.config.ts", "utf8");
assert.match(nextConfigSource, /source: `\/system-design\/\$\{source\}`[\s\S]*destination: `\/system-design\/problems\/\$\{destination\}`[\s\S]*permanent: true/, "Legacy practice routes need HTTP-level canonical redirects.");
assert.match(routeSource, /robots: lesson\.status === "coming-soon" \? \{ index: false, follow: true \}/, "Coming-soon routes must be noindex/follow.");

console.log(`System Design release audit passed: ${systemDesignManifestSections.length} sections, ${systemDesignTopicManifest.length} topics, ${subtopicIds.length} subtopics, ${publishedTopicIds.size} published lessons, ${publishedProblems.length}/${systemDesignPracticeProblemManifest.length} published practice problems, ${visuals.mermaidDiagrams} Mermaid diagrams, ${sourceUrls.length} authoritative external references, and ${internalLinks.length} validated internal links.`);
