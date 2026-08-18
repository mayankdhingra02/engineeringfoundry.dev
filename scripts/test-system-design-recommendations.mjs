import assert from "node:assert/strict";
import {
  getPersonalizedTopicRecommendations,
  getPracticeProblemRecommendations,
  getRecommendationCounts,
  getTopicRecommendation,
  systemDesignPracticeProblems,
  systemDesignTopics,
  universalFocusOrder,
} from "../data/system-design/recommendations.ts";
import { systemDesignLessons } from "../data/system-design/curriculum.ts";
import { systemDesignPracticeProblemManifest, systemDesignTopicManifest } from "../data/system-design/manifest.ts";

assert.equal(systemDesignTopics.length, systemDesignTopicManifest.length, "Personalization must expose the complete canonical topic manifest.");
assert.equal(systemDesignPracticeProblems.length, systemDesignPracticeProblemManifest.length, "Practice recommendations must expose the complete practice manifest.");
assert.ok(systemDesignTopics.every((topic) => Number.isInteger(topic.estimatedMinutes) && topic.estimatedMinutes > 0), "Every topic needs positive duration metadata.");
assert.equal(new Set(systemDesignTopics.map((topic) => topic.id)).size, systemDesignTopics.length, "Topic IDs must be unique.");
assert.equal(new Set(systemDesignTopics.map((topic) => topic.href)).size, systemDesignTopics.length, "Topic routes must be unique.");
const lessonRoutes = new Set(systemDesignLessons.map((lesson) => lesson.slug));
assert.deepEqual(systemDesignTopics.filter((topic) => !lessonRoutes.has(topic.href)), [], "Every topic must link to a real curriculum route.");

function plan(level, preparationWindow, role) {
  const recommendations = getPersonalizedTopicRecommendations({ level, preparationWindow, role });
  assert.ok(recommendations, `${level} + ${role ?? "general"} + ${preparationWindow} should produce recommendations.`);
  assert.equal(recommendations.length, systemDesignTopics.length, "Personalization must never remove canonical topics.");
  return recommendations;
}

function find(recommendations, id) {
  const recommendation = recommendations.find((item) => item.topic.id === id);
  assert.ok(recommendation, `Missing recommendation for ${id}.`);
  return recommendation;
}

const representativeCases = [
  ["sde1", "3-days", undefined, { "focus-now": 10, "learn-next": 12, "skip-for-now": 156 }],
  ["sde2", "1-week", "backend", { "focus-now": 22, "learn-next": 20, "skip-for-now": 136 }],
  ["senior", "2-weeks", "infrastructure", { "focus-now": 36, "learn-next": 30, "skip-for-now": 112 }],
  ["staff", "1-month", "data", { "focus-now": 60, "learn-next": 40, "skip-for-now": 78 }],
  ["staff", "2-plus-months", "ml", { "focus-now": 100, "learn-next": 40, "skip-for-now": 38 }],
];
for (const [level, window, role, counts] of representativeCases) assert.deepEqual(getRecommendationCounts(plan(level, window, role)), counts, `Unexpected quotas for ${level}/${role ?? "general"}/${window}.`);

const sde2Week = plan("sde2", "1-week", "backend").filter((item) => item.group === "focus-now");
assert.deepEqual(sde2Week.map((item) => item.topic.id), [...universalFocusOrder], "The one-week focus must span framework, data, caching, messaging, reliability, and key technologies.");
assert.ok(sde2Week.every((item) => item.topic.published), "Focus Now must never recommend coming-soon lessons.");
for (const recommendations of representativeCases.map(([level, window, role]) => plan(level, window, role))) {
  assert.ok(recommendations.filter((item) => item.group !== "skip-for-now").every((item) => item.topic.published), "Focus Now and Learn Next must contain published lessons only.");
}

const context = { level: "senior", preparationWindow: "1-month" };
const byRole = Object.fromEntries(["backend", "fullstack", "infrastructure", "data", "ml"].map((role) => [role, plan(context.level, context.preparationWindow, role)]));
for (const role of Object.keys(byRole)) assert.equal(find(byRole[role], "caching").group, "focus-now", `Caching should remain high priority for ${role}.`);
assert.equal(find(byRole.data, "flink").priority, "must-know", "Flink should increase strongly for Data.");
assert.equal(find(byRole.infrastructure, "raft").priority, "must-know", "Raft should increase strongly for Infrastructure.");
assert.equal(find(byRole.fullstack, "realtime-communication").group, "focus-now", "Real-time communication should be focused for Full Stack.");
for (const id of ["model-serving", "vector-search"]) {
  assert.equal(find(byRole.ml, id).priority, "must-know", `${id} should increase for ML.`);
  assert.ok(find(byRole.ml, id).rank < find(byRole.backend, id).rank, `${id} should rank above its Backend position for ML.`);
}
assert.ok(systemDesignTopics.some((topic) => topic.defaultPriority === "advanced"), "Advanced topics must remain visible in All Topics.");

const practiceExpectations = {
  backend: ["url-shortener", "rate-limiter", "payment-system"],
  fullstack: ["rate-limiter", "notification-service", "chat-system"],
  infrastructure: ["rate-limiter", "metrics-platform", "distributed-cache"],
  data: ["rate-limiter", "metrics-platform", "distributed-queue"],
  ml: ["rate-limiter", "ml-inference-service", "feature-store"],
};
for (const [role, expected] of Object.entries(practiceExpectations)) {
  const recommendations = getPracticeProblemRecommendations({ level: "senior", preparationWindow: "1-month", role });
  assert.ok(recommendations, `Practice recommendations should exist for ${role}.`);
  const focused = new Set(recommendations.filter((item) => item.group === "focus-now").map((item) => item.problem.id));
  for (const id of expected) assert.ok(focused.has(id), `${role} practice should focus on ${id}.`);
  assert.equal(recommendations.length, systemDesignPracticeProblems.filter((problem) => problem.published).length, "Role-aware practice must retain every published problem without recommending upcoming walkthroughs.");
}

assert.equal(getPersonalizedTopicRecommendations({}), null, "No personalization should preserve the default curriculum.");
assert.equal(getPersonalizedTopicRecommendations({ role: "backend" }), null, "Role alone should preserve default ordering until a complete plan is selected.");
assert.equal(getTopicRecommendation(systemDesignTopics[0], { preparationWindow: "1-week" }), null, "A window without a level should preserve the default curriculum.");

console.log(`System Design recommendation tests passed: ${systemDesignTopics.length} canonical topics, five role profiles, deterministic windows, ${systemDesignPracticeProblems.length} role-aware practice problems, and reset/default behavior are valid.`);
