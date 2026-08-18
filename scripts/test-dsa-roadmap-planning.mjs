import { readFileSync } from "node:fs";
import { dsaLevelRoadmaps, getDsaLevelRoadmap } from "../data/dsa/level-roadmaps.ts";
import { getCompanyProblemAssignments, roadmapCompanies } from "../data/dsa/roadmap-companies.ts";
import { getRoadmapProblemIds, roadmapProblemById, roadmapProblems } from "../data/dsa/roadmap-problem-registry.ts";
import { emptyRoadmapProgress, getRecommendedRoadmapItems, getRoadmapSelectionFromInterviewContext, getRoadmapTopicGuidance, roadmapPreparationPlans } from "../data/dsa/roadmap-planning.ts";

const failures = [];
const expect = (condition, message) => { if (!condition) failures.push(message); };
const read = (path) => readFileSync(path, "utf8");

expect(dsaLevelRoadmaps.length === 3, "All three roadmap levels must remain available.");
expect(getRoadmapProblemIds(getDsaLevelRoadmap("sde1")).length === 79, "SDE I must remain at 79 unique problems.");
expect(getRoadmapProblemIds(getDsaLevelRoadmap("sde2")).length === 85, "SDE II must remain at 85 unique problems.");
expect(getRoadmapProblemIds(getDsaLevelRoadmap("sde3plus")).length === 52, "SDE III+ must remain at 52 unique problems.");
expect(roadmapPreparationPlans.map((plan) => plan.id).join("|") === "two-week|30d|60d|90d|no-deadline", "Preparation modes are incomplete or out of order.");

const planCounts = {};
for (const level of ["sde1", "sde2", "sde3plus"]) {
  const plans = roadmapPreparationPlans.map((plan) => getRecommendedRoadmapItems({ level, plan: plan.id }));
  planCounts[level] = Object.fromEntries(plans.map((plan) => [plan.plan.id, plan.selectedProblemIds.length]));
  expect(plans[0].selectedProblemIds.length < plans[1].selectedProblemIds.length, `${level} short plan must be more selective than 30 days.`);
  expect(plans[1].selectedProblemIds.length <= plans[2].selectedProblemIds.length, `${level} 30-day plan cannot exceed 60 days.`);
  expect(plans[2].selectedProblemIds.length <= plans[3].selectedProblemIds.length, `${level} 60-day plan cannot exceed 90 days.`);
  expect(plans[0].optionalProblemIds.length === 0, `${level} short plan must defer Stretch work.`);
  expect(plans[3].optionalProblemIds.every((id) => !plans[3].requiredProblemIds.includes(id)), `${level} optional content blocks 90-day completion.`);
  expect(plans.every((plan) => new Set(plan.selectedProblemIds).size === plan.selectedProblemIds.length), `${level} plan duplicates canonical problems.`);
  expect(plans.every((plan) => plan.selectedProblemIds.every((id) => roadmapProblemById.has(id))), `${level} plan references an unknown problem.`);
  expect(plans.every((plan) => plan.nextUp.length > 0 && plan.nextUp.length <= 3), `${level} Next Up must contain one to three grounded recommendations.`);
  expect(plans.every((plan) => plan.readiness.every((item) => item.status === "insufficient")), `${level} signed-out readiness must not guess.`);
}

const researched = roadmapCompanies.filter((company) => company.researchStatus === "available");
expect(researched.map((company) => company.id).join("|") === "amazon|google|meta|walmart", "Only the four researched company guides should expose populated overlays.");
expect(roadmapCompanies.length === 12, "The target-company selector should expose the requested twelve companies.");
for (const company of roadmapCompanies) {
  for (const assignment of company.problemAssignments ?? []) {
    expect(roadmapProblemById.has(assignment.problemId), `${company.id} references unknown problem ${assignment.problemId}.`);
    expect(Boolean(assignment.sourceType && assignment.note), `${company.id}/${assignment.problemId} lacks evidence metadata.`);
  }
}

const canonicalBefore = roadmapProblemById.get("course-schedule");
const amazonPlan = getRecommendedRoadmapItems({ level: "sde2", plan: "30d", company: "amazon" });
expect(getCompanyProblemAssignments("amazon", "sde2").length > 0, "Amazon SDE II add-on is empty.");
expect(amazonPlan.companyProblemIds.length === getCompanyProblemAssignments("amazon", "sde2").length, "Company add-ons are not counted separately.");
expect(roadmapProblemById.get("course-schedule") === canonicalBefore, "Company overlay mutated a canonical problem entity.");

const reviewProgress = { ...emptyRoadmapProgress, statusByProblemId: { "number-of-islands": "review", "two-sum": "solved" }, confidenceByProblemId: { "two-sum": "high" }, source: "account" };
const reviewPlan = getRecommendedRoadmapItems({ level: "sde1", plan: "30d", progress: reviewProgress });
expect(reviewPlan.reviewProblemIds.includes("number-of-islands"), "Review queue omits explicitly reviewed work.");
expect(reviewPlan.nextUp[0]?.title.includes("Review"), "Next Up does not prioritize review work.");
expect(reviewPlan.completedRequiredCount === 2, "Solved/Review completion semantics are incorrect.");

const sde2 = getDsaLevelRoadmap("sde2");
const unionFind = sde2.modules.flatMap((module) => module.topics).find((topic) => topic.id === "sde2-union-find");
expect(Boolean(unionFind && getRoadmapTopicGuidance("sde2", unionFind).prerequisites.length), "Union Find prerequisites are missing.");
const shortestPath = sde2.modules.flatMap((module) => module.topics).find((topic) => topic.id === "sde2-shortest-path");
expect(Boolean(shortestPath && getRoadmapTopicGuidance("sde2", shortestPath).prerequisites.includes("sde2-heaps")), "Dijkstra guidance must include heap fluency.");

const trackerSeed = getRoadmapSelectionFromInterviewContext({ companySlug: "amazon", roleLevel: "SDE II", interviewDate: "2026-08-28" }, new Date("2026-08-14T12:00:00Z"));
expect(trackerSeed.level === "sde2" && trackerSeed.plan === "two-week" && trackerSeed.company === "amazon", "Interview-tracker context adapter is incorrect.");

const canonicalIds = roadmapProblems.map((problem) => problem.id);
const canonicalUrls = roadmapProblems.map((problem) => problem.url).filter(Boolean);
expect(new Set(canonicalIds).size === canonicalIds.length, "Canonical problem IDs are duplicated.");
expect(new Set(canonicalUrls).size === canonicalUrls.length, "Canonical problem URLs are duplicated.");

const experience = read("features/dsa/roadmap/level-roadmap-experience.tsx");
for (const marker of ["useSearchParams", 'searchParams.get("level")', 'searchParams.get("plan")', 'searchParams.get("company")', "No level assumed", "Show all", "RoadmapFilters", "RoadmapReviewReadiness"]) expect(experience.includes(marker), `Roadmap experience lacks ${marker}.`);
expect(!experience.includes("localStorage"), "Roadmap created a parallel localStorage progress system.");
const plannerUi = read("features/dsa/roadmap/roadmap-personalization.tsx");
for (const marker of ["Next Up", "Skip for now", "Not enough practice data", "add-on coming soon", "Explore all tagged questions", "Search and filters"]) expect(plannerUi.includes(marker), `Planner UI lacks ${marker}.`);
const planningSource = read("data/dsa/roadmap-planning.ts");
for (const marker of ["1–2 Weeks", "30 Days", "60 Days", "90 Days", "No Deadline"]) expect(planningSource.includes(marker), `Planning configuration lacks ${marker}.`);
expect(read("features/dsa/roadmap/level-roadmap-module.tsx").includes("Why am I learning this?"), "Topic UI lacks its learning justification.");
const route = read("app/dsa/[...segments]/page.tsx");
expect(route.includes("<Suspense") && route.includes("<LevelRoadmapExperience"), "URL-driven roadmap planner is not inside a Suspense boundary.");
const analytics = read("lib/analytics.ts");
for (const event of ["roadmap_level_selected", "roadmap_plan_selected", "company_overlay_selected", "roadmap_topic_opened", "roadmap_problem_opened", "roadmap_hint_revealed", "mixed_set_started", "timed_practice_started", "roadmap_filter_changed"]) expect(analytics.includes(event), `Analytics hook ${event} is missing.`);
const css = read("app/globals.css");
for (const marker of [".dsa-roadmap-time-options", ".dsa-roadmap-company-overlay", ".dsa-roadmap-next-up", ".dsa-roadmap-filter-grid", ".dsa-roadmap-review-readiness", "@media (max-width: 640px)", "overflow-x: auto"]) expect(css.includes(marker), `Responsive planner CSS lacks ${marker}.`);

if (failures.length) {
  console.error(`DSA roadmap planning regression failed:\n- ${failures.join("\n- ")}`);
  process.exit(1);
}

console.log(`DSA roadmap planning regression passed: plans ${JSON.stringify(planCounts)}, four evidence-backed company overlays, separate company counts, grounded Next Up/review/readiness rules, prerequisites, URL state, analytics hooks, canonical integrity, and responsive safeguards.`);
