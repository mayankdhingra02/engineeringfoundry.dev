import assert from "node:assert/strict";
import { systemDesignPracticeContents } from "../content/system-design/problems/data.ts";
import { systemDesignPracticeProblemManifest, systemDesignTopicManifest } from "../data/system-design/manifest.ts";
import { getPracticeProblemRecommendations } from "../data/system-design/recommendations.ts";

const expectedIds = [
  "url-shortener", "rate-limiter", "pastebin", "leaderboard",
  "notification-service", "search-autocomplete", "chat-system", "news-feed", "job-scheduler", "web-crawler", "cloud-file-storage",
  "video-streaming", "ride-sharing", "nearby-search", "ticketmaster", "payment-system",
  "metrics-platform", "distributed-cache", "distributed-queue", "key-value-store", "kafka-platform", "search-engine",
  "collaborative-editor", "event-analytics", "ml-inference-service", "feature-store", "vector-search",
];
const topicIds = new Set(systemDesignTopicManifest.map((topic) => topic.id));
const manifestById = new Map(systemDesignPracticeProblemManifest.map((problem) => [problem.id, problem]));

assert.equal(systemDesignPracticeContents.length, 27, "The first end-to-end practice library must publish exactly 27 walkthroughs.");
assert.deepEqual(systemDesignPracticeContents.map((problem) => problem.id), expectedIds, "Practice order must follow the approved library.");
assert.equal(new Set(expectedIds).size, expectedIds.length, "Practice IDs must be unique.");

const distribution = Object.fromEntries(["foundation", "intermediate", "advanced", "specialized"].map((difficulty) => [difficulty, systemDesignPracticeContents.filter((problem) => problem.difficulty === difficulty).length]));
assert.deepEqual(distribution, { foundation: 4, intermediate: 7, advanced: 11, specialized: 5 }, "Difficulty distribution must match the approved phase.");

for (const problem of systemDesignPracticeContents) {
  const manifest = manifestById.get(problem.id);
  assert.ok(manifest, `${problem.id} must resolve in the canonical manifest.`);
  assert.equal(manifest.slug, `/system-design/problems/${problem.id}`, `${problem.id} must use its canonical route.`);
  assert.equal(manifest.contentStatus, "published", `${problem.id} must be published.`);
  assert.equal(manifest.difficulty, problem.difficulty, `${problem.id} difficulty must match content.`);
  assert.equal(manifest.estimatedMinutes, problem.estimatedMinutes, `${problem.id} duration must match content.`);
  assert.ok(problem.concepts.every((id) => topicIds.has(id)), `${problem.id} must link only canonical concepts.`);
  assert.ok(problem.prerequisites.every((id) => topicIds.has(id)), `${problem.id} must link only canonical prerequisites.`);
  assert.ok(problem.functionalRequirements.length >= 3 && problem.nonFunctionalRequirements.length >= 3 && problem.outOfScope.length >= 3, `${problem.id} needs a complete scope boundary.`);
  assert.ok(problem.apis.length >= 2 && problem.apis.every((api) => api.path.startsWith("/")), `${problem.id} needs concrete API examples.`);
  assert.ok(problem.dataModel.length >= 2, `${problem.id} needs a concrete core data model.`);
  assert.ok(problem.simpleDesign.length >= 3, `${problem.id} must start simple.`);
  assert.match(problem.simpleDiagram, /flowchart|sequenceDiagram|stateDiagram/, `${problem.id} simple Mermaid must declare a supported diagram.`);
  assert.match(problem.scaledDiagram, /flowchart|sequenceDiagram|stateDiagram/, `${problem.id} scaled Mermaid must declare a supported diagram.`);
  assert.ok(problem.criticalFlows.length >= 2 && problem.criticalFlows.every((flow) => flow.steps.length >= 3), `${problem.id} needs explicit critical flows.`);
  assert.ok(problem.bottlenecks.length >= 3 && problem.scalingSteps.length >= 3, `${problem.id} needs bottleneck-led scaling.`);
  assert.ok(problem.failures.length >= 3 && problem.failures.every((failure) => Object.values(failure).every(Boolean)), `${problem.id} needs three complete failure deep dives.`);
  assert.ok(problem.decisions.length >= 2, `${problem.id} needs meaningful design alternatives.`);
  assert.ok(problem.variants.length >= 4, `${problem.id} needs requirement-change variants.`);
  assert.ok(problem.mistakes.length >= 3 && problem.followUps.length >= 3, `${problem.id} needs candidate mistakes and interviewer follow-ups.`);
  assert.ok(problem.selfCheck.length >= 3 && problem.selfCheck.length <= 6, `${problem.id} needs 3–6 self-check questions.`);
  assert.deepEqual(problem.timedPlans.map((plan) => plan.minutes), [30, 45, 60], `${problem.id} needs all timed-practice variants.`);
  assert.doesNotMatch(`${problem.summary} ${problem.remember}`, /exactly how (WhatsApp|Uber|YouTube|Google|Meta|Amazon)/i, `${problem.id} must not claim private architecture knowledge.`);
}

const capacityIds = systemDesignPracticeContents.filter((problem) => problem.capacity).map((problem) => problem.id);
assert.deepEqual(capacityIds, ["url-shortener", "pastebin", "chat-system", "news-feed", "web-crawler", "cloud-file-storage", "video-streaming", "ride-sharing", "metrics-platform", "kafka-platform", "search-engine", "event-analytics"], "Only problems where arithmetic changes the design should contain worked estimates.");
for (const problem of systemDesignPracticeContents.filter((item) => item.capacity)) {
  assert.ok(problem.capacity.arithmetic.every((line) => /[≈×/=]/.test(line)), `${problem.id} estimates must show arithmetic.`);
  assert.ok(problem.capacity.decision.length > 30, `${problem.id} estimates must connect to a design decision.`);
}

assert.match(systemDesignPracticeContents.find((problem) => problem.id === "ticketmaster").simpleDiagram, /stateDiagram/, "Ticketmaster must show the seat state machine.");
assert.match(systemDesignPracticeContents.find((problem) => problem.id === "payment-system").scaledDiagram, /sequenceDiagram/, "Payments must show the ambiguous external workflow.");

for (const context of [
  { level: "sde1", preparationWindow: "3-days" },
  { level: "sde2", preparationWindow: "1-week", role: "backend" },
  { level: "senior", preparationWindow: "2-weeks", role: "infrastructure" },
  { level: "staff", preparationWindow: "1-month", role: "data" },
]) {
  const recommendations = getPracticeProblemRecommendations(context);
  assert.equal(recommendations.length, 27, "Practice recommendations must contain all and only published walkthroughs.");
  assert.ok(recommendations.every((item) => expectedIds.includes(item.problem.id)), "Recommendations must never surface an upcoming walkthrough.");
}
assert.equal(getPracticeProblemRecommendations({}), null, "No personalization preserves the default practice library.");

console.log(`System Design practice passed: 27 walkthroughs, ${distribution.foundation}/${distribution.intermediate}/${distribution.advanced}/${distribution.specialized} by difficulty, ${capacityIds.length} worked estimates, 54 Mermaid diagrams, and validated personalization/progress IDs.`);
