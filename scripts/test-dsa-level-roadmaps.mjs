import { readFileSync } from "node:fs";
import { dsaLevelRoadmaps, getDsaLevelRoadmap, getRoadmapPriorityCounts, getRoadmapTopicCount } from "../data/dsa/level-roadmaps.ts";
import { getSde1ProblemCounts, sde1ProblemById, sde1Problems } from "../data/dsa/sde1-problems.ts";
import { getSde1RoadmapProblemIds, sde1Roadmap } from "../data/dsa/sde1-roadmap.ts";
import { getRoadmapProblemCounts, getRoadmapProblemIds, resolveRoadmapProblems, roadmapProblemById } from "../data/dsa/roadmap-problem-registry.ts";
import { sde2ProblemAssignments, sde2Roadmap } from "../data/dsa/sde2-roadmap.ts";
import { sde2Problems } from "../data/dsa/sde2-problems.ts";
import { sde3ProblemAssignments, sde3Roadmap } from "../data/dsa/sde3-roadmap.ts";
import { sde3Problems } from "../data/dsa/sde3-problems.ts";
import { systemDesignLessons } from "../data/system-design/curriculum.ts";

const failures = [];
const read = (file) => readFileSync(file, "utf8");
const requireText = (source, text, message) => { if (!source.includes(text)) failures.push(message); };

if (dsaLevelRoadmaps.length !== 3) failures.push(`Expected 3 level roadmaps; found ${dsaLevelRoadmaps.length}.`);
const expectedStages = {
  sde1: ["foundations", "core-patterns", "core-data-structures", "trees-graphs", "high-value-patterns", "interview-practice"],
  sde2: ["foundations", "core-patterns", "trees-graphs", "high-value-patterns", "level-patterns", "interview-practice"],
  sde3plus: ["foundations", "core-data-structures", "trees-graphs", "high-value-patterns", "level-patterns", "interview-practice"],
};

for (const level of ["sde1", "sde2", "sde3plus"]) {
  const roadmap = getDsaLevelRoadmap(level);
  if (roadmap.level !== level) failures.push(`${level} selector does not return its own roadmap.`);
  if (roadmap.modules.map((module) => module.id).join("|") !== expectedStages[level].join("|")) failures.push(`${level} does not expose its six stages in order.`);
  const priorities = getRoadmapPriorityCounts(roadmap);
  for (const priority of ["core", "high-value", "advanced"]) if (priorities[priority] < 1) failures.push(`${level} has no ${priority} topics.`);
  if (getRoadmapTopicCount(roadmap) < 20) failures.push(`${level} roadmap scope is unexpectedly small.`);
  for (const topic of roadmap.modules.flatMap((module) => module.topics)) if (!topic.description || !topic.recognitionSignals?.length || !topic.masteryCriteria?.length) failures.push(`${level}/${topic.id} lacks topic-card learning metadata.`);
}

const sde1 = getDsaLevelRoadmap("sde1");
const sde2 = getDsaLevelRoadmap("sde2");
const sde3 = getDsaLevelRoadmap("sde3plus");
for (const [roadmap, marker] of [[sde1, "Recognize"], [sde2, "Compose"], [sde3, "Reason about Invariants"]]) if (!roadmap.progression.includes(marker)) failures.push(`${roadmap.level} lacks its distinct progression language.`);
for (const title of ["Complexity & Big-O", "Arrays & Strings", "Two Pointers", "Core Data Structures", "Trees / BST", "Basic Dynamic Programming", "Interview Readiness Check"]) {
  const inTopic = sde1.modules.flatMap((module) => module.topics).some((topic) => topic.title === title);
  const inModule = sde1.modules.some((module) => module.title === title);
  if (!inTopic && !inModule) failures.push(`SDE I is missing ${title}.`);
}
for (const title of ["Prefix Sum + Hashing", "Binary Search on Answer", "Tree Invariants & Serialization", "Dynamic Programming Families", "Mutable API Design", "Mixed Interview Rehearsal"]) if (!sde2.modules.flatMap((module) => module.topics).some((topic) => topic.title === title)) failures.push(`SDE II is missing ${title}.`);
for (const title of ["Cache Structures", "Mutable Intervals", "Shortest-Path Decision Guide", "Streaming Statistics", "API & Object Design", "Code Review"]) if (!sde3.modules.flatMap((module) => module.topics).some((topic) => topic.title === title)) failures.push(`SDE III+ is missing ${title}.`);

const problemIds = sde1Problems.map((problem) => problem.id);
if (new Set(problemIds).size !== problemIds.length) failures.push("SDE I registry contains duplicate problem IDs.");
if (sde1Problems.length < 65 || sde1Problems.length > 80) failures.push(`SDE I has ${sde1Problems.length} unique problems; expected 65–80.`);
const problemCounts = getSde1ProblemCounts();
if (problemCounts.core !== 44 || problemCounts.practice !== 25 || problemCounts.stretch !== 10) failures.push(`Unexpected SDE I classification counts: ${JSON.stringify(problemCounts)}.`);
if (sde1Roadmap.estimatedProblems !== sde1Problems.length) failures.push("SDE I estimated problem total is not derived from the registry.");
if (getSde1RoadmapProblemIds().length !== sde1Problems.length) failures.push("Cross-tagged problems inflate or omit the unique roadmap total.");
for (const id of ["find-pivot-index", "product-of-array-except-self", "best-time-to-buy-and-sell-stock", "non-overlapping-intervals", "top-k-frequent-elements"]) {
  const problem = sde1ProblemById.get(id);
  if (!problem || (problem.topicTags?.length ?? 0) < 2) failures.push(`${id} is not modeled as one cross-tagged canonical problem.`);
}
for (const problem of sde1Problems) {
  if (problem.url !== `https://leetcode.com/problems/${problem.id}/`) failures.push(`${problem.id} does not use its canonical LeetCode URL.`);
  if (problem.source !== "leetcode" || !problem.difficulty || !problem.classification || !problem.whyItMatters || !problem.skills?.length) failures.push(`${problem.id} has incomplete problem metadata.`);
}
if ((sde1Roadmap.mixedPracticeSets?.length ?? 0) !== 4) failures.push("SDE I needs four mixed-practice sets.");
for (const set of sde1Roadmap.mixedPracticeSets ?? []) {
  if (set.revealPatternsByDefault !== false) failures.push(`${set.id} reveals patterns by default.`);
  if (set.problemIds.length < 2 || set.problemIds.length > 4) failures.push(`${set.id} has an invalid mixed-set size.`);
}
if ((sde1Roadmap.timedPracticeModes?.length ?? 0) !== 3) failures.push("SDE I timed interview progression is incomplete.");
if ((sde1Roadmap.readinessCriteria?.length ?? 0) < 6) failures.push("SDE I readiness checkpoint is incomplete.");
if ((sde1Roadmap.optionalTopics ?? []).some((topic) => topic.completionRequired !== false)) failures.push("Optional SDE I topics incorrectly block completion.");

const sde2Ids = getRoadmapProblemIds(sde2Roadmap);
const sde2Counts = getRoadmapProblemCounts(sde2Roadmap);
if (sde2Ids.length !== 85 || new Set(sde2Ids).size !== 85) failures.push(`SDE II needs exactly 85 unique assignments; found ${sde2Ids.length}.`);
if (sde2Counts.core !== 48 || sde2Counts.practice !== 25 || sde2Counts.stretch !== 12) failures.push(`Unexpected SDE II classification counts: ${JSON.stringify(sde2Counts)}.`);
if (sde2Roadmap.estimatedProblems !== 85) failures.push("SDE II estimated total is not derived from its assignments.");
if (sde2Problems.some((problem) => sde1ProblemById.has(problem.id))) failures.push("SDE II additions duplicate a canonical SDE I problem entity.");
for (const id of ["k-closest-points-to-origin", "number-of-islands", "top-k-frequent-elements", "house-robber", "course-schedule"]) {
  if (!sde1ProblemById.has(id) || !sde2Ids.includes(id)) failures.push(`${id} is not reused across SDE I and SDE II.`);
  if (roadmapProblemById.get(id) !== sde1ProblemById.get(id)) failures.push(`${id} does not retain one canonical registry entity.`);
}
const sharedClassification = resolveRoadmapProblems(["search-in-rotated-sorted-array"], sde2ProblemAssignments)[0];
if (sde1ProblemById.get("search-in-rotated-sorted-array")?.classification !== "stretch" || sharedClassification.classification !== "core") failures.push("Level-specific classification overlays do not preserve SDE I while promoting SDE II.");
for (const problem of resolveRoadmapProblems(sde2Ids, sde2ProblemAssignments)) {
  if (problem.url !== `https://leetcode.com/problems/${problem.id}/` || problem.source !== "leetcode") failures.push(`${problem.id} lacks a canonical public problem link.`);
  if (!problem.difficulty || !problem.pattern || !problem.whyItMatters || !problem.skills?.length) failures.push(`${problem.id} has incomplete canonical metadata.`);
}
if ((sde2Roadmap.diagnostic?.problemIds.length ?? 0) < 8 || (sde2Roadmap.diagnostic?.problemIds.length ?? 0) > 12) failures.push("SDE II diagnostic must contain 8–12 representative shared problems.");
for (const id of sde2Roadmap.diagnostic?.problemIds ?? []) if (!sde1ProblemById.has(id)) failures.push(`Diagnostic problem ${id} is not reused from SDE I.`);
if ((sde2Roadmap.mixedPracticeSets?.length ?? 0) !== 5 || (sde2Roadmap.mixedPracticeSets ?? []).some((set) => set.revealPatternsByDefault !== false)) failures.push("SDE II needs five hidden-pattern mixed sets.");
if ((sde2Roadmap.timedPracticeModes?.length ?? 0) !== 4) failures.push("SDE II needs four timed practice modes.");
if ((sde2Roadmap.failureModes?.length ?? 0) < 5) failures.push("SDE II common failure modes are incomplete.");
if ((sde2Roadmap.optionalTopics ?? []).some((current) => current.completionRequired !== false)) failures.push("Optional SDE II topics incorrectly block completion.");
const richAssignments = resolveRoadmapProblems(["top-k-frequent-elements", "lru-cache", "serialize-and-deserialize-binary-tree"], sde2ProblemAssignments);
if (!richAssignments.every((problem) => problem.levelRationale)) failures.push("Representative SDE II problems lack level-specific rationale.");
if (!richAssignments.some((problem) => problem.alternativeApproaches?.length)) failures.push("SDE II lacks alternative-solution checkpoints.");
if (!richAssignments.some((problem) => problem.designBridge)) failures.push("SDE II lacks coding-to-design bridges.");
if (!richAssignments.some((problem) => problem.followUps?.length)) failures.push("SDE II lacks follow-up mode content.");
for (const scope of sde2Roadmap.scopePaths ?? []) {
  const count = scope.classifications.reduce((total, classification) => total + sde2Counts[classification], 0);
  if (scope.id === "short" && count !== 48) failures.push("SDE II refresh scope does not select the Core layer.");
  if (scope.id === "standard" && count !== 73) failures.push("SDE II standard scope does not select Core + Practice.");
  if (scope.id === "thorough" && count !== 85) failures.push("SDE II thorough scope does not select all assignments.");
}

const sde3Ids = getRoadmapProblemIds(sde3Roadmap);
const sde3Counts = getRoadmapProblemCounts(sde3Roadmap);
if (sde3Ids.length !== 52 || new Set(sde3Ids).size !== 52) failures.push(`SDE III+ needs exactly 52 unique assignments; found ${sde3Ids.length}.`);
if (sde3Counts.core !== 32 || sde3Counts.practice !== 14 || sde3Counts.stretch !== 6) failures.push(`Unexpected SDE III+ classification counts: ${JSON.stringify(sde3Counts)}.`);
if (sde3Roadmap.estimatedProblems !== sde3Ids.length) failures.push("SDE III+ estimated total is not derived from its assignments.");
if (sde3Problems.some((problem) => sde1ProblemById.has(problem.id) || sde2Problems.some((existing) => existing.id === problem.id))) failures.push("SDE III+ additions duplicate an existing canonical problem entity.");
for (const id of ["product-of-array-except-self", "top-k-frequent-elements", "network-delay-time", "lru-cache", "find-median-from-data-stream"]) {
  if (!sde3Ids.includes(id) || !roadmapProblemById.has(id)) failures.push(`${id} is not reused canonically by SDE III+.`);
}
for (const problem of resolveRoadmapProblems(sde3Ids, sde3ProblemAssignments)) {
  if (problem.url !== `https://leetcode.com/problems/${problem.id}/` || problem.source !== "leetcode") failures.push(`${problem.id} lacks a canonical public problem link.`);
  if (!problem.difficulty || !problem.pattern || !problem.whyItMatters || !problem.skills?.length) failures.push(`${problem.id} has incomplete canonical metadata.`);
}
const seniorLru = resolveRoadmapProblems(["lru-cache"], sde3ProblemAssignments)[0];
const midLru = resolveRoadmapProblems(["lru-cache"], sde2ProblemAssignments)[0];
if (!seniorLru.invariants?.length || seniorLru.levelRationaleLabel !== "Why this is SDE III+") failures.push("Senior LRU invariant metadata is missing.");
if (midLru.invariants?.length || midLru.categorizedFollowUps?.length) failures.push("Senior-only LRU extensions leaked into SDE II.");
if (!seniorLru.categorizedFollowUps?.some((item) => item.category === "concurrency")) failures.push("Senior LRU lacks a categorized concurrency follow-up.");
if (!seniorLru.failureChecks?.length || !seniorLru.apiContract) failures.push("Senior LRU lacks failure or API-contract metadata.");
const seniorTopK = resolveRoadmapProblems(["top-k-frequent-elements"], sde3ProblemAssignments)[0];
if (seniorTopK.categorizedFollowUps?.some((item) => item.category === "concurrency")) failures.push("Concurrency follow-up renders on an unrelated senior problem.");
if (!seniorTopK.alternativeApproaches?.length || seniorTopK.alternativeLabel !== "Engineering trade-offs") failures.push("Senior trade-off metadata is incomplete.");
const systemDesignPaths = new Set(systemDesignLessons.map((lesson) => lesson.slug));
for (const problem of resolveRoadmapProblems(sde3Ids, sde3ProblemAssignments)) if (problem.designBridge?.href && !systemDesignPaths.has(problem.designBridge.href)) failures.push(`${problem.id} has a broken System Design bridge: ${problem.designBridge.href}.`);
if ((sde3Roadmap.diagnostic?.problemIds.length ?? 0) < 8 || (sde3Roadmap.diagnostic?.problemIds.length ?? 0) > 10) failures.push("SDE III+ diagnostic must contain 8–10 representative shared problems.");
for (const id of sde3Roadmap.diagnostic?.problemIds ?? []) if (sde3Problems.some((problem) => problem.id === id)) failures.push(`Senior diagnostic problem ${id} should be reused from a lower level.`);
if ((sde3Roadmap.mixedPracticeSets?.length ?? 0) !== 5 || (sde3Roadmap.mixedPracticeSets ?? []).some((set) => set.revealPatternsByDefault !== false)) failures.push("SDE III+ needs five hidden-pattern mixed sets.");
if ((sde3Roadmap.timedPracticeModes?.length ?? 0) !== 5) failures.push("SDE III+ needs five senior practice formats.");
if ((sde3Roadmap.ambiguousExercises?.length ?? 0) < 2) failures.push("SDE III+ ambiguous interview mode is incomplete.");
if ((sde3Roadmap.codeReviewExercises?.length ?? 0) < 2) failures.push("SDE III+ code-review mode is incomplete.");
if ((sde3Roadmap.optionalTopics ?? []).some((current) => current.completionRequired !== false)) failures.push("Optional SDE III+ topics incorrectly block completion.");
if ((sde3Roadmap.readinessCriteria?.length ?? 0) < 14) failures.push("Senior readiness criteria are incomplete.");
for (const scope of sde3Roadmap.scopePaths ?? []) {
  const count = scope.classifications.reduce((total, classification) => total + sde3Counts[classification], 0);
  if (scope.id === "short" && count !== 32) failures.push("SDE III+ essentials scope does not select Core.");
  if (scope.id === "standard" && count !== 46) failures.push("SDE III+ standard scope does not select Core + Practice.");
  if (scope.id === "thorough" && count !== 52) failures.push("SDE III+ thorough scope does not select all assignments.");
}

const route = read("app/dsa/[...segments]/page.tsx");
for (const marker of ["LevelRoadmapPage", "LevelRoadmapExperience", 'segments[0] === "roadmap"', 'segments[1] === "topic-map"']) requireText(route, marker, `DSA roadmap routing lacks ${marker}.`);
const experience = read("features/dsa/roadmap/level-roadmap-experience.tsx");
for (const marker of ["LevelRoadmapSelector", "RoadmapPlanningControls", "getRecommendedRoadmapItems", "setExpandedModule", "RoadmapPracticeSections", "RoadmapDiagnostic", "RoadmapFailureModes", "OptionalRoadmapTopics", "/dsa/roadmap/topic-map"]) requireText(experience, marker, `Level roadmap experience lacks ${marker}.`);
const selector = read("features/dsa/roadmap/level-roadmap-selector.tsx");
for (const marker of ["aria-pressed", "onSelect", "shortTitle"]) requireText(selector, marker, `Level selector lacks ${marker}.`);
const moduleSource = read("features/dsa/roadmap/level-roadmap-module.tsx");
for (const marker of ["aria-expanded", "onToggle", "Learn", "Recognize It When", "Core Problems", "Practice Problems", "Stretch", "Mastery Check", "RoadmapProblemRow"]) requireText(moduleSource, marker, `Level roadmap module lacks ${marker}.`);
const scopeFilter = read("features/dsa/roadmap/roadmap-scope-filter.tsx");
for (const marker of ["aria-pressed", "classifications", "unique problems", "onSelect"]) requireText(scopeFilter, marker, `SDE I scope filter lacks ${marker}.`);
const problemRow = read("features/dsa/roadmap/roadmap-problem-row.tsx");
for (const marker of ["target=\"_blank\"", 'rel="noopener noreferrer"', "Staged hints", "Interview follow-ups", "Alternative approaches", "From Algorithm to Design", "Why this is SDE II", "Invariant", "Senior follow-ups", "Concurrency Follow-up", "API Contract", "What can go wrong?", "statusLabels"]) requireText(problemRow, marker, `Problem row lacks ${marker}.`);
const practiceSource = read("features/dsa/roadmap/sde1-practice-sections.tsx");
for (const marker of ["hidePattern={!revealed}", "Reveal patterns", "Timed progression", "Interview Readiness Check", "Account-backed persistence is intentionally deferred", "Add to review", "not saved to an account", "failureModes", "Ambiguous interview mode", "Code review mode", "Reveal constraints", "Reveal findings", "Explained invariant", "Completed follow-up"]) requireText(practiceSource, marker, `Roadmap practice UI lacks ${marker}.`);
const css = read("app/globals.css");
for (const marker of [".dsa-roadmap-scope-filter", ".dsa-roadmap-problem-row", ".dsa-sde1-mixed-grid", ".dsa-sde1-review-grid", ".dsa-roadmap-diagnostic", ".dsa-roadmap-comparison-table", ".dsa-roadmap-failure-modes", ".dsa-roadmap-invariant", ".dsa-roadmap-senior-followups", ".dsa-senior-practice", "@media (max-width: 640px)", "min-width: 0", "overflow: hidden"]) requireText(css, marker, `Level roadmap responsive styling lacks ${marker}.`);
const sidebar = read("components/dsa-workspace-sidebar.tsx");
requireText(sidebar, 'label: "Roadmap", href: "/dsa/roadmap"', "DSA workspace does not expose a prominent Roadmap destination.");
requireText(read("app/dsa/page.tsx"), "DSA", "The existing /dsa page is missing.");

if (failures.length) {
  console.error(`DSA level roadmap regression failed:\n- ${failures.join("\n- ")}`);
  process.exit(1);
}

console.log(`DSA level roadmap regression passed: SDE I remains ${sde1Problems.length}; SDE II remains ${sde2Ids.length}; SDE III+ has ${sde3Ids.length} unique assignments (${sde3Counts.core} core, ${sde3Counts.practice} practice, ${sde3Counts.stretch} stretch), canonical reuse, invariants, senior follow-ups, API/failure metadata, valid System Design bridges, ambiguity and code-review modes, hidden mixed sets, and responsive safeguards.`);
