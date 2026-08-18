import assert from "node:assert/strict";
import { systemDesignTopicManifest } from "../data/system-design/manifest.ts";
import { systemDesignPracticeProblems, systemDesignTopics } from "../data/system-design/recommendations.ts";
import { generateSystemDesignStudyPlan, getSystemDesignStudyPlanDays } from "../data/system-design/study-plan.ts";

const windows = ["3-days", "1-week", "2-weeks", "1-month"];
const studyTimes = [30, 60, 120, 180];
const publishedTopicIds = new Set(systemDesignTopicManifest.filter((topic) => topic.published).map((topic) => topic.id));

function flatten(plan) {
  return plan.days.flatMap((day) => day.items.map((item) => ({ ...item, day: day.day })));
}

for (const preparationWindow of windows) {
  for (const minutesPerDay of studyTimes) {
    const plan = generateSystemDesignStudyPlan({ level: "sde2", role: "backend", preparationWindow, minutesPerDay });
    assert.equal(plan.days.length, getSystemDesignStudyPlanDays(preparationWindow), `${preparationWindow} must generate its exact day count.`);
    assert.ok(plan.days.every((day) => day.totalMinutes <= minutesPerDay), `${preparationWindow}/${minutesPerDay} exceeded a daily budget.`);
    assert.ok(plan.days.every((day) => day.items.length > 0), `${preparationWindow}/${minutesPerDay} should provide a task or short review every day.`);
    assert.ok(plan.totalItems > 0, `${preparationWindow}/${minutesPerDay} should contain useful work.`);
    const lessonIds = flatten(plan).filter((item) => item.type === "topic").map((item) => item.topicId);
    assert.equal(new Set(lessonIds).size, lessonIds.length, "Plans must not duplicate lessons.");
    assert.ok(lessonIds.every((id) => publishedTopicIds.has(id)), "Plans must not schedule coming-soon lessons.");
  }
}

const personas = [
  { level: "sde1", role: "fullstack", preparationWindow: "1-week", minutesPerDay: 60 },
  { level: "sde2", role: "backend", preparationWindow: "1-week", minutesPerDay: 120 },
  { level: "senior", role: "infrastructure", preparationWindow: "2-weeks", minutesPerDay: 120 },
  { level: "sde2", role: "data", preparationWindow: "1-month", minutesPerDay: 60 },
  { level: "senior", role: "ml", preparationWindow: "1-month", minutesPerDay: 120 },
];

for (const persona of personas) {
  const plan = generateSystemDesignStudyPlan(persona);
  const items = flatten(plan);
  const position = new Map(items.map((item, index) => [item.id, index]));
  for (const item of items.filter((candidate) => candidate.type === "topic")) {
    for (const prerequisite of item.prerequisiteIds ?? []) {
      const prerequisitePosition = position.get(`topic:${prerequisite}`);
      if (prerequisitePosition !== undefined) assert.ok(prerequisitePosition < position.get(item.id), `${prerequisite} must precede ${item.topicId}.`);
    }
  }
  for (const item of items.filter((candidate) => candidate.type === "practice")) {
    for (const concept of item.concepts ?? []) assert.ok(position.get(`topic:${concept}`) < position.get(item.id), `${item.problemId} must follow ${concept}.`);
  }
  const firstFocus = items.findIndex((item) => item.type === "topic" && item.recommendationGroup === "focus-now");
  const firstAdvanced = items.findIndex((item) => item.type === "topic" && item.recommendationGroup === "skip-for-now");
  if (firstAdvanced >= 0) assert.ok(firstFocus >= 0 && firstFocus < firstAdvanced, "Focus Now material should begin before selected advanced depth.");
}

const infrastructure = flatten(generateSystemDesignStudyPlan({ level: "senior", role: "infrastructure", preparationWindow: "2-weeks", minutesPerDay: 120 }));
const backend = flatten(generateSystemDesignStudyPlan({ level: "senior", role: "backend", preparationWindow: "2-weeks", minutesPerDay: 120 }));
const data = flatten(generateSystemDesignStudyPlan({ level: "sde2", role: "data", preparationWindow: "1-month", minutesPerDay: 60 }));
const fullstack = flatten(generateSystemDesignStudyPlan({ level: "sde2", role: "fullstack", preparationWindow: "1-month", minutesPerDay: 60 }));
const ml = flatten(generateSystemDesignStudyPlan({ level: "senior", role: "ml", preparationWindow: "1-month", minutesPerDay: 120 }));
const itemPosition = (items, id) => {
  const position = items.findIndex((item) => item.id === id);
  return position < 0 ? Number.POSITIVE_INFINITY : position;
};
assert.ok(itemPosition(infrastructure, "topic:distributed-consensus") < itemPosition(backend, "topic:distributed-consensus"), "Consensus should move earlier for Infrastructure.");
assert.ok(itemPosition(data, "topic:kafka") < itemPosition(fullstack, "topic:kafka"), "Kafka should move earlier for Data than Full Stack.");
for (const id of ["topic:model-serving", "topic:vector-search"]) assert.ok(Number.isFinite(itemPosition(ml, id)), `${id} should appear in the Senior ML plan.`);
assert.ok(!Number.isFinite(itemPosition(ml, "topic:batch-vs-streaming")), "Coming-soon Batch vs Stream Processing must not be scheduled yet.");

const original = generateSystemDesignStudyPlan({ level: "sde2", role: "backend", preparationWindow: "1-week", minutesPerDay: 120 });
const completedId = flatten(original).find((item) => item.type === "topic").id;
const regenerated = generateSystemDesignStudyPlan({ level: "senior", role: "infrastructure", preparationWindow: "2-weeks", minutesPerDay: 120, progress: { [completedId]: "completed" } });
const preserved = flatten(regenerated).find((item) => item.id === completedId);
if (preserved) assert.equal(preserved.status, "completed", "Stable item IDs must preserve completion across plan changes.");

const missed = generateSystemDesignStudyPlan({ level: "sde2", role: "backend", preparationWindow: "1-week", minutesPerDay: 120, missedDays: [1] });
assert.equal(missed.days[0].missed, true, "A missed day should be represented without warning styling semantics.");
assert.ok(missed.days.every((day) => day.totalMinutes <= 120), "Redistribution must continue respecting daily budgets.");

assert.ok(systemDesignTopics.every((topic) => !topic.prerequisites || topic.prerequisites.every((id) => systemDesignTopics.some((candidate) => candidate.id === id))), "All prerequisite IDs must resolve to canonical topics.");
assert.ok(systemDesignPracticeProblems.every((problem) => problem.concepts.length > 0 && problem.concepts.every((id) => systemDesignTopics.some((topic) => topic.id === id))), "Every practice problem must reference canonical concepts.");

console.log("System Design study-plan tests passed: durations, daily budgets, five personas, prerequisites, role ordering, practice readiness, progress preservation, missed-day redistribution, and duplicate prevention are valid.");
