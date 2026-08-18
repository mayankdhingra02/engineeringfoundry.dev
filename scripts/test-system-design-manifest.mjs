import assert from "node:assert/strict";
import {
  systemDesignManifestSections,
  systemDesignPracticeProblemManifest,
  systemDesignTopicManifest,
} from "../data/system-design/manifest.ts";
import { systemDesignLessons, systemDesignProblemLessons } from "../data/system-design/curriculum.ts";
import { systemDesignPracticeProblems, systemDesignTopics } from "../data/system-design/recommendations.ts";

const topicIds = new Set(systemDesignTopicManifest.map((topic) => topic.id));
const topicSlugs = new Set(systemDesignTopicManifest.map((topic) => topic.slug));
const problemIds = new Set(systemDesignPracticeProblemManifest.map((problem) => problem.id));
const problemSlugs = new Set(systemDesignPracticeProblemManifest.map((problem) => problem.slug));

assert.equal(topicIds.size, systemDesignTopicManifest.length, "Topic IDs must be unique.");
assert.equal(topicSlugs.size, systemDesignTopicManifest.length, "Topic slugs must be unique.");
assert.equal(problemIds.size, systemDesignPracticeProblemManifest.length, "Practice problem IDs must be unique.");
assert.equal(problemSlugs.size, systemDesignPracticeProblemManifest.length, "Practice problem slugs must be unique.");
assert.ok(systemDesignManifestSections.length >= 10, "The manifest must preserve the complete conceptual curriculum grouping.");
assert.ok(systemDesignPracticeProblemManifest.length >= 50, "The practice manifest must retain the complete 50+ problem catalog.");

for (const topic of systemDesignTopicManifest) {
  assert.ok(topic.priority, `${topic.id} needs priority metadata.`);
  assert.ok(Number.isInteger(topic.estimatedMinutes) && topic.estimatedMinutes > 0, `${topic.id} needs a positive estimated duration.`);
  assert.ok(topic.contentStatus, `${topic.id} needs a content/research status.`);
  assert.ok([1, 2, 3].includes(topic.publishingPhase), `${topic.id} needs a publishing phase.`);
  assert.ok(topic.subtopics.length > 0, `${topic.id} needs explicit subtopics.`);
  assert.ok(topic.examples.length > 0, `${topic.id} needs example requirements.`);
  assert.ok(topic.visual?.type, `${topic.id} needs an explicit visual decision.`);
  assert.deepEqual(topic.depth.available, ["quick", "interview", "deep-dive"], `${topic.id} must support progressive depth from one content model.`);
  assert.ok(topic.prerequisites.every((id) => topicIds.has(id)), `${topic.id} has an invalid prerequisite.`);
  assert.ok(topic.relatedTopics.every((id) => topicIds.has(id)), `${topic.id} has an invalid related-topic reference.`);
  assert.ok(topic.practiceProblems.every((id) => problemIds.has(id)), `${topic.id} has an invalid practice-problem reference.`);
  for (const role of ["backend", "fullstack", "infrastructure", "data", "ml"]) assert.ok(topic.rolePriority[role], `${topic.id} needs ${role} relevance.`);
  for (const level of ["sde1", "sde2", "senior", "staff"]) assert.ok(topic.levelPriority[level], `${topic.id} needs ${level} relevance.`);
}

for (const problem of systemDesignPracticeProblemManifest) {
  assert.ok(problem.concepts.length > 0 && problem.concepts.every((id) => topicIds.has(id)), `${problem.id} must reference canonical concepts.`);
  assert.ok(problem.prerequisites.every((id) => topicIds.has(id)), `${problem.id} has an invalid prerequisite.`);
  assert.ok(Number.isInteger(problem.estimatedMinutes) && problem.estimatedMinutes > 0, `${problem.id} needs a positive estimated duration.`);
  assert.ok(problem.architectureDiagramNeeded, `${problem.id} must require an architecture diagram.`);
  assert.ok(problem.deepDiveSections.length > 0 && problem.interviewerFollowUps.length > 0, `${problem.id} needs deep dives and interviewer follow-up categories.`);
  for (const role of ["backend", "fullstack", "infrastructure", "data", "ml"]) assert.ok(problem.rolePriority[role], `${problem.id} needs ${role} relevance.`);
  for (const level of ["sde1", "sde2", "senior", "staff"]) assert.ok(problem.levelPriority[level], `${problem.id} needs ${level} relevance.`);
}

const topicOrder = new Map(systemDesignTopicManifest.map((topic, index) => [topic.id, index]));
for (const topic of systemDesignTopicManifest.filter((item) => item.priority === "advanced")) {
  for (const prerequisite of topic.prerequisites) {
    assert.ok(topicOrder.get(prerequisite) < topicOrder.get(topic.id), `Advanced topic ${topic.id} appears before prerequisite ${prerequisite}.`);
  }
}

const visitState = new Map();
function visit(id, path = []) {
  if (visitState.get(id) === "done") return;
  assert.notEqual(visitState.get(id), "visiting", `Prerequisite cycle detected: ${[...path, id].join(" -> ")}`);
  visitState.set(id, "visiting");
  const topic = systemDesignTopicManifest.find((item) => item.id === id);
  for (const prerequisite of topic.prerequisites) visit(prerequisite, [...path, id]);
  visitState.set(id, "done");
}
for (const topic of systemDesignTopicManifest) visit(topic.id);

assert.equal(systemDesignTopics.length, systemDesignTopicManifest.length, "Personalization must be derived from every canonical topic.");
assert.equal(systemDesignPracticeProblems.length, systemDesignPracticeProblemManifest.length, "Practice recommendations must be derived from the practice manifest.");
assert.equal(systemDesignLessons.length, systemDesignTopicManifest.length + systemDesignPracticeProblemManifest.length, "Navigation must be derived from canonical topics and problems.");
assert.equal(systemDesignProblemLessons.length, systemDesignPracticeProblemManifest.length, "The sidebar problem catalog must match the practice manifest.");

const customInteractiveIds = systemDesignTopicManifest.filter((topic) => topic.visual.type === "interactive").map((topic) => topic.id);
for (const id of ["consistent-hashing", "rate-limiting", "cache-stampedes", "kafka", "replication", "fan-out", "leases-fencing-tokens", "geospatial-search", "bloom-filters"]) {
  assert.ok(customInteractiveIds.includes(id), `${id} should be planned as a custom interactive.`);
}

console.log(`System Design manifest passed: ${systemDesignManifestSections.length} sections, ${systemDesignTopicManifest.length} topics, ${systemDesignTopicManifest.reduce((sum, topic) => sum + topic.subtopics.length, 0)} subtopics, and ${systemDesignPracticeProblemManifest.length} practice problems share one validated source of truth.`);
