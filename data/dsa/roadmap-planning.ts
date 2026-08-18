import type { DSARoadmap, ProblemClassification, RoadmapLevel, RoadmapProblem, RoadmapStage, RoadmapTopic, TopicPriority } from "./level-roadmaps.ts";
import { getDsaLevelRoadmap } from "./level-roadmaps.ts";
import { getCompanyProblemAssignments, getRoadmapCompany, type RoadmapCompanyId } from "./roadmap-companies.ts";
import { getRoadmapProblemIds, resolveRoadmapProblems, roadmapProblemById } from "./roadmap-problem-registry.ts";

export type RoadmapPlanId = "two-week" | "30d" | "60d" | "90d" | "no-deadline";
export type RoadmapProblemStatus = "not-started" | "attempted" | "solved" | "review";
export type RoadmapReadinessStatus = "ready" | "needs-work" | "insufficient";

export type RoadmapInterviewContext = {
  companySlug?: string | null;
  roleLevel?: string | null;
  interviewDate?: string | null;
};

export type RoadmapProgressSnapshot = {
  statusByProblemId: Readonly<Partial<Record<string, RoadmapProblemStatus>>>;
  confidenceByProblemId?: Readonly<Partial<Record<string, "low" | "medium" | "high">>>;
  diagnosticReviewProblemIds?: readonly string[];
  mixedSetStatusById?: Readonly<Partial<Record<string, "attempted" | "completed">>>;
  timedPracticeCompletedIds?: readonly string[];
  lastProblemId?: string;
  source: "none" | "account";
};

export type RoadmapPreparationPlan = {
  id: RoadmapPlanId;
  label: string;
  shortLabel: string;
  description: string;
  allowedClassifications: readonly ProblemClassification[];
  problemCapByLevel?: Partial<Record<RoadmapLevel, number>>;
  mixedSetCount: number;
  timedSessionCount: number;
  mockGuidance: string;
};

export type RoadmapTopicRecommendation = {
  topicId: string;
  title: string;
  stageId: RoadmapStage;
  stageTitle: string;
  priority: TopicPriority;
  reason: string;
  problemIds: string[];
};

export type RoadmapNextItem = {
  id: string;
  kind: "problem" | "topic" | "mixed-set" | "company";
  title: string;
  eyebrow: string;
  reason: string;
  href?: string;
};

export type RoadmapReadinessItem = {
  id: string;
  label: string;
  status: RoadmapReadinessStatus;
  evidence: string;
};

export type RecommendedRoadmapPlan = {
  level: RoadmapLevel;
  plan: RoadmapPreparationPlan;
  selectedProblemIds: string[];
  requiredProblemIds: string[];
  optionalProblemIds: string[];
  deferredProblemIds: string[];
  focusNow: RoadmapTopicRecommendation[];
  learnNext: RoadmapTopicRecommendation[];
  skipForNow: RoadmapTopicRecommendation[];
  nextUp: RoadmapNextItem[];
  reviewProblemIds: string[];
  companyProblemIds: string[];
  companyCompletedCount: number;
  completedRequiredCount: number;
  mixedSetCount: number;
  timedSessionCount: number;
  readiness: RoadmapReadinessItem[];
};

export const emptyRoadmapProgress: RoadmapProgressSnapshot = {
  statusByProblemId: {},
  confidenceByProblemId: {},
  diagnosticReviewProblemIds: [],
  mixedSetStatusById: {},
  timedPracticeCompletedIds: [],
  source: "none",
};

export const roadmapPreparationPlans: readonly RoadmapPreparationPlan[] = [
  {
    id: "two-week",
    label: "1–2 Weeks",
    shortLabel: "Interview soon",
    description: "Diagnostic, highest-signal Core work, one mixed set, and a timed rehearsal.",
    allowedClassifications: ["learn", "core"],
    problemCapByLevel: { sde1: 28, sde2: 30, sde3plus: 24 },
    mixedSetCount: 1,
    timedSessionCount: 1,
    mockGuidance: "Move to mixed and timed practice quickly; defer most Stretch work.",
  },
  {
    id: "30d",
    label: "30 Days",
    shortLabel: "Focused month",
    description: "Complete Core, add selected Practice, and build toward regular timed sessions.",
    allowedClassifications: ["learn", "core", "practice"],
    problemCapByLevel: { sde1: 50, sde2: 56, sde3plus: 38 },
    mixedSetCount: 3,
    timedSessionCount: 3,
    mockGuidance: "Use 2–3 timed sessions per week near the end when practical.",
  },
  {
    id: "60d",
    label: "60 Days",
    shortLabel: "Balanced preparation",
    description: "Cover Core and Practice with review cycles, mixed sets, and company specialization.",
    allowedClassifications: ["learn", "core", "practice"],
    mixedSetCount: 4,
    timedSessionCount: 4,
    mockGuidance: "Start with one timed session weekly, then increase to 1–2 mixed sessions.",
  },
  {
    id: "90d",
    label: "90 Days",
    shortLabel: "Thorough preparation",
    description: "Use the complete roadmap, deeper follow-ups, selected Stretch work, and more mocks.",
    allowedClassifications: ["learn", "core", "practice", "stretch"],
    mixedSetCount: 5,
    timedSessionCount: 5,
    mockGuidance: "Build from weekly fluency sessions toward realistic final-loop rehearsals.",
  },
  {
    id: "no-deadline",
    label: "No Deadline",
    shortLabel: "Competency based",
    description: "Follow the standard Core and Practice curriculum without artificial calendar pressure.",
    allowedClassifications: ["learn", "core", "practice"],
    mixedSetCount: 5,
    timedSessionCount: 4,
    mockGuidance: "Add timed sessions after the major prerequisite chains are comfortable.",
  },
] as const;

export const roadmapPreparationPlanById = new Map(roadmapPreparationPlans.map((plan) => [plan.id, plan]));

type TopicGuidance = { prerequisites?: string[]; why?: string };

const topicGuidanceByLevel: Partial<Record<RoadmapLevel, Record<string, TopicGuidance>>> = {
  sde1: {
    "hash-maps-sets": { prerequisites: ["arrays-strings"], why: "Fast membership and frequency lookup appear inside many interview patterns." },
    "two-pointers": { prerequisites: ["arrays-strings"], why: "Ordered pointer movement replaces many quadratic pair scans." },
    "sliding-window": { prerequisites: ["arrays-strings", "hash-maps-sets"], why: "Incremental range state avoids recomputing every contiguous candidate." },
    "prefix-sums": { prerequisites: ["arrays-strings"], why: "Precomputed aggregates make repeated range reasoning cheap and precise." },
    "binary-search": { prerequisites: ["complexity-big-o", "arrays-strings"], why: "A shrinking candidate-space invariant powers exact, boundary, and answer-space search." },
    "tree-bfs": { prerequisites: ["trees-bst", "queue-deque"] },
    "tree-dfs": { prerequisites: ["trees-bst"] },
    "graph-bfs-dfs": { prerequisites: ["graph-fundamentals", "queue-deque"] },
    "basic-dynamic-programming": { prerequisites: ["arrays-strings", "tree-dfs"] },
    "topological-sort": { prerequisites: ["graph-fundamentals", "graph-bfs-dfs"] },
  },
  sde2: {
    "sde2-prefix-hashing": { prerequisites: ["sde2-hashing-refresh"], why: "Prefix counts handle arbitrary subarrays when ordinary sliding windows fail." },
    "sde2-advanced-window": { prerequisites: ["sde2-hashing-refresh", "sde2-two-pointers-refresh"] },
    "sde2-binary-answer": { prerequisites: ["sde2-search-refresh"], why: "Binary search can target the first feasible answer, not only a stored value." },
    "sde2-tree-invariants": { prerequisites: ["sde2-tree-graph-refresh"] },
    "sde2-tries": { prerequisites: ["sde2-hashing-refresh", "sde2-tree-invariants"] },
    "sde2-topological": { prerequisites: ["sde2-tree-graph-refresh"] },
    "sde2-union-find": { prerequisites: ["sde2-tree-graph-refresh"], why: "Union Find is a compact tool for repeated incremental connectivity updates." },
    "sde2-shortest-path": { prerequisites: ["sde2-tree-graph-refresh", "sde2-heaps"] },
    "sde2-mst": { prerequisites: ["sde2-union-find", "sde2-heaps"] },
    "sde2-stateful-core": { prerequisites: ["sde2-heaps", "sde2-tree-invariants"] },
  },
  sde3plus: {
    "sde3-cache-structures": { prerequisites: ["sde3-array-search-refresh"], why: "Cache APIs test whether several mutable structures stay synchronized under strict operation guarantees." },
    "sde3-mutable-api": { prerequisites: ["sde3-cache-structures"] },
    "sde3-mutable-intervals": { prerequisites: ["sde3-array-search-refresh", "sde3-mutable-api"] },
    "sde3-monotonic-state": { prerequisites: ["sde3-array-search-refresh"] },
    "sde3-time-indexed-state": { prerequisites: ["sde3-array-search-refresh", "sde3-mutable-api"] },
    "sde3-dependencies": { prerequisites: ["sde3-graph-modeling"] },
    "sde3-shortest-paths": { prerequisites: ["sde3-graph-modeling", "sde3-heap-refresh"] },
    "sde3-connectivity": { prerequisites: ["sde3-graph-modeling"] },
    "sde3-graph-criticality": { prerequisites: ["sde3-connectivity"] },
    "sde3-tries-indexing": { prerequisites: ["sde3-array-search-refresh"] },
    "sde3-search-ranking": { prerequisites: ["sde3-tries-indexing", "sde3-heap-refresh"] },
    "sde3-streaming-statistics": { prerequisites: ["sde3-heap-refresh", "sde3-monotonic-state"] },
    "sde3-heap-index": { prerequisites: ["sde3-heap-refresh", "sde3-mutable-api"] },
    "sde3-api-contracts": { prerequisites: ["sde3-cache-structures", "sde3-mutable-api"] },
    "sde3-concurrency": { prerequisites: ["sde3-api-contracts"] },
    "sde3-memory-approximation": { prerequisites: ["sde3-streaming-statistics", "sde3-tries-indexing"] },
    "sde3-persistence-scale": { prerequisites: ["sde3-api-contracts"] },
  },
};

export function getRoadmapTopicGuidance(level: RoadmapLevel, topic: RoadmapTopic) {
  const configured = topicGuidanceByLevel[level]?.[topic.id];
  return {
    prerequisites: configured?.prerequisites ?? [],
    why: configured?.why ?? topic.description,
  };
}

function statusFor(progress: RoadmapProgressSnapshot, problemId: string): RoadmapProblemStatus {
  return progress.statusByProblemId[problemId] ?? "not-started";
}

function completed(status: RoadmapProblemStatus) {
  return status === "solved" || status === "review";
}

function buildProblemContexts(roadmap: DSARoadmap) {
  const contexts = new Map<string, { stageIndex: number; stageId: RoadmapStage; stageTitle: string; topic: RoadmapTopic; topicIndex: number }[]>();
  roadmap.modules.forEach((module, stageIndex) => module.topics.forEach((topic, topicIndex) => {
    for (const problemId of topic.problemIds ?? topic.problems?.map((problem) => problem.id) ?? []) {
      const current = contexts.get(problemId) ?? [];
      current.push({ stageIndex, stageId: module.id, stageTitle: module.title, topic, topicIndex });
      contexts.set(problemId, current);
    }
  }));
  return contexts;
}

function recommendationScore(problem: RoadmapProblem, context: ReturnType<typeof buildProblemContexts> extends Map<string, infer T> ? T : never, progress: RoadmapProgressSnapshot, companyProblemIds: Set<string>) {
  const classificationScore: Record<ProblemClassification, number> = { learn: 92, core: 90, practice: 52, stretch: 18 };
  const priorityScore: Record<TopicPriority, number> = { core: 26, "high-value": 11, advanced: -20 };
  const bestContext = [...context].sort((a, b) => a.stageIndex - b.stageIndex || a.topicIndex - b.topicIndex)[0];
  const status = statusFor(progress, problem.id);
  const statusScore: Record<RoadmapProblemStatus, number> = { "not-started": 0, attempted: 18, solved: -12, review: 45 };
  return classificationScore[problem.classification]
    + priorityScore[bestContext?.topic.priority ?? "core"]
    + Math.max(0, 18 - (bestContext?.stageIndex ?? 5) * 3)
    + statusScore[status]
    + (companyProblemIds.has(problem.id) ? 8 : 0);
}

function topicsForGroup(roadmap: DSARoadmap, selectedIds: Set<string>, group: "focus" | "next" | "skip") {
  const result: RoadmapTopicRecommendation[] = [];
  roadmap.modules.forEach((module) => module.topics.forEach((topic) => {
    const topicProblemIds = [...new Set(topic.problemIds ?? topic.problems?.map((problem) => problem.id) ?? [])];
    const selectedTopicIds = topicProblemIds.filter((id) => selectedIds.has(id));
    const matches = group === "focus"
      ? topic.priority === "core" && (selectedTopicIds.length > 0 || topicProblemIds.length === 0)
      : group === "next"
        ? topic.priority === "high-value" && selectedTopicIds.length > 0
        : topic.priority === "advanced" || (topicProblemIds.length > 0 && selectedTopicIds.length === 0);
    if (!matches) return;
    result.push({ topicId: topic.id, title: topic.title, stageId: module.id, stageTitle: module.title, priority: topic.priority, reason: getRoadmapTopicGuidance(roadmap.level, topic).why, problemIds: topicProblemIds });
  }));
  for (const topic of roadmap.optionalTopics ?? []) {
    if (group !== "skip") continue;
    result.push({ topicId: topic.id, title: topic.title, stageId: "high-value-patterns", stageTitle: "Optional Advanced", priority: topic.priority, reason: topic.description, problemIds: [...new Set(topic.problemIds ?? [])] });
  }
  return result;
}

function buildReadiness(roadmap: DSARoadmap, progress: RoadmapProgressSnapshot, requiredIds: readonly string[], contexts: ReturnType<typeof buildProblemContexts>): RoadmapReadinessItem[] {
  const statuses = requiredIds.map((id) => statusFor(progress, id));
  const evidenceCount = statuses.filter((status) => status !== "not-started").length;
  const highConfidenceCount = requiredIds.filter((id) => completed(statusFor(progress, id)) && progress.confidenceByProblemId?.[id] === "high").length;
  const completedCount = statuses.filter(completed).length;
  const mixedCompleted = Object.values(progress.mixedSetStatusById ?? {}).filter((status) => status === "completed").length;
  const timedCompleted = progress.timedPracticeCompletedIds?.length ?? 0;
  const topicIdsForProblem = (problemId: string) => (contexts.get(problemId) ?? []).map((context) => `${context.topic.id} ${context.topic.title}`.toLowerCase());
  const graphTreeIds = requiredIds.filter((id) => topicIdsForProblem(id).some((value) => /tree|graph|bfs|dfs|topological|shortest|connectivity/.test(value)));
  const graphTreeCompleted = graphTreeIds.filter((id) => completed(statusFor(progress, id))).length;
  const evidenceStatus = (isReady: boolean, hasEvidence = evidenceCount > 0): RoadmapReadinessStatus => !hasEvidence ? "insufficient" : isReady ? "ready" : "needs-work";
  const items: RoadmapReadinessItem[] = [
    { id: "recognition", label: "Pattern Recognition", status: evidenceStatus(mixedCompleted >= 2, mixedCompleted > 0), evidence: mixedCompleted ? `${mixedCompleted} mixed set${mixedCompleted === 1 ? "" : "s"} completed.` : "Complete a mixed set before this can be assessed." },
    { id: "implementation", label: "Implementation", status: evidenceStatus(completedCount >= Math.max(3, Math.ceil(requiredIds.length * 0.6))), evidence: evidenceCount ? `${completedCount} of ${requiredIds.length} plan problems marked Solved or Review.` : "No account-backed problem attempts are available." },
    { id: "complexity", label: "Complexity Analysis", status: evidenceStatus(highConfidenceCount >= 3), evidence: highConfidenceCount ? `${highConfidenceCount} completed problems have self-reported high confidence.` : "Record high confidence on independently reproducible solved work to supply evidence." },
    { id: "trees-graphs", label: "Trees & Graphs", status: evidenceStatus(graphTreeCompleted >= Math.max(2, Math.ceil(graphTreeIds.length * 0.5)), graphTreeIds.some((id) => statusFor(progress, id) !== "not-started")), evidence: graphTreeCompleted ? `${graphTreeCompleted} selected tree/graph problems completed.` : "No tree or graph practice evidence yet." },
    { id: "timed", label: "Timed Practice", status: evidenceStatus(timedCompleted >= 2, timedCompleted > 0), evidence: timedCompleted ? `${timedCompleted} timed session${timedCompleted === 1 ? "" : "s"} completed.` : "Complete a timed session before this can be assessed." },
  ];
  if (roadmap.level === "sde2") items.push({ id: "followups", label: "Follow-ups & Trade-offs", status: "insufficient", evidence: "Follow-up completion is not persisted yet." });
  if (roadmap.level === "sde3plus") items.push({ id: "invariants", label: "Stateful Design & Invariants", status: "insufficient", evidence: "Invariant and follow-up mastery are not persisted yet." });
  return items;
}

function buildNextUp(roadmap: DSARoadmap, progress: RoadmapProgressSnapshot, focusNow: RoadmapTopicRecommendation[], selectedIds: Set<string>, reviewIds: string[], companyId?: RoadmapCompanyId) {
  const items: RoadmapNextItem[] = [];
  const resolvedById = new Map(resolveRoadmapProblems(getRoadmapProblemIds(roadmap), roadmap.problemAssignments).map((problem) => [problem.id, problem]));
  for (const problemId of reviewIds.slice(0, 2)) {
    const problem = resolvedById.get(problemId) ?? roadmapProblemById.get(problemId);
    if (problem) items.push({ id: `review-${problemId}`, kind: "problem", title: `${problem.title} — Review`, eyebrow: "Review queue", reason: "This item was explicitly marked for another pass.", href: problem.url });
  }
  if (progress.lastProblemId && selectedIds.has(progress.lastProblemId) && items.length < 3) {
    const problem = resolvedById.get(progress.lastProblemId);
    if (problem && !completed(statusFor(progress, problem.id))) items.push({ id: `continue-${problem.id}`, kind: "problem", title: `Continue: ${problem.title}`, eyebrow: "Continue", reason: "Resume the last account-backed roadmap item.", href: problem.url });
  }
  for (const topic of focusNow) {
    if (items.length >= 3) break;
    const nextProblem = topic.problemIds.map((id) => resolvedById.get(id)).find((problem) => problem && selectedIds.has(problem.id) && !completed(statusFor(progress, problem.id)));
    if (!nextProblem || items.some((item) => item.id.endsWith(nextProblem.id))) continue;
    items.push({ id: `topic-${topic.topicId}-${nextProblem.id}`, kind: "problem", title: nextProblem.title, eyebrow: topic.title, reason: `Next high-priority work in ${topic.stageTitle}.`, href: nextProblem.url });
  }
  if (companyId && items.length < 3) {
    const company = getRoadmapCompany(companyId);
    if (company?.researchStatus === "available") items.push({ id: `company-${company.id}`, kind: "company", title: `${company.name} add-on`, eyebrow: "Company overlay", reason: "Use the researched add-on after the portable Core work.", href: company.guideHref });
  }
  return items.slice(0, 3);
}

export function getRecommendedRoadmapItems({
  level,
  plan: planId,
  company,
  progress = emptyRoadmapProgress,
}: {
  level: RoadmapLevel;
  plan: RoadmapPlanId;
  company?: RoadmapCompanyId;
  progress?: RoadmapProgressSnapshot;
}): RecommendedRoadmapPlan {
  const roadmap = getDsaLevelRoadmap(level);
  const plan = roadmapPreparationPlanById.get(planId) ?? roadmapPreparationPlans.at(-1)!;
  const contexts = buildProblemContexts(roadmap);
  const companyAssignments = getCompanyProblemAssignments(company, level);
  const companyProblemIds = new Set(companyAssignments.map((assignment) => assignment.problemId));
  const allProblems = resolveRoadmapProblems(getRoadmapProblemIds(roadmap), roadmap.problemAssignments);
  const eligible = allProblems
    .filter((problem) => plan.allowedClassifications.includes(problem.classification))
    .sort((a, b) => recommendationScore(b, contexts.get(b.id) ?? [], progress, companyProblemIds) - recommendationScore(a, contexts.get(a.id) ?? [], progress, companyProblemIds) || allProblems.indexOf(a) - allProblems.indexOf(b));
  const cap = plan.problemCapByLevel?.[level] ?? eligible.length;
  const selectedProblems = eligible.slice(0, cap);
  const selectedProblemIds = selectedProblems.map((problem) => problem.id);
  const selectedIds = new Set(selectedProblemIds);
  const optionalProblemIds = selectedProblems.filter((problem) => problem.classification === "stretch").map((problem) => problem.id);
  const requiredProblemIds = selectedProblems.filter((problem) => problem.classification !== "stretch").map((problem) => problem.id);
  const deferredProblemIds = allProblems.filter((problem) => !selectedIds.has(problem.id)).map((problem) => problem.id);
  const reviewProblemIds = [...new Set([
    ...Object.entries(progress.statusByProblemId).filter(([, status]) => status === "review").map(([id]) => id),
    ...(progress.diagnosticReviewProblemIds ?? []),
  ])].filter((id) => roadmapProblemById.has(id));
  const focusNow = topicsForGroup(roadmap, selectedIds, "focus");
  const learnNext = topicsForGroup(roadmap, selectedIds, "next");
  const skipForNow = topicsForGroup(roadmap, selectedIds, "skip");
  const companyCompletedCount = companyAssignments.filter((assignment) => completed(statusFor(progress, assignment.problemId))).length;
  const completedRequiredCount = requiredProblemIds.filter((id) => completed(statusFor(progress, id))).length;
  return {
    level,
    plan,
    selectedProblemIds,
    requiredProblemIds,
    optionalProblemIds,
    deferredProblemIds,
    focusNow,
    learnNext,
    skipForNow,
    nextUp: buildNextUp(roadmap, progress, focusNow, selectedIds, reviewProblemIds, company),
    reviewProblemIds,
    companyProblemIds: [...companyProblemIds],
    companyCompletedCount,
    completedRequiredCount,
    mixedSetCount: Math.min(plan.mixedSetCount, roadmap.mixedPracticeSets?.length ?? 0),
    timedSessionCount: Math.min(plan.timedSessionCount, roadmap.timedPracticeModes?.length ?? 0),
    readiness: buildReadiness(roadmap, progress, requiredProblemIds, contexts),
  };
}

export function isRoadmapLevel(value: string | null): value is RoadmapLevel {
  return value === "sde1" || value === "sde2" || value === "sde3plus";
}

export function isRoadmapPlanId(value: string | null): value is RoadmapPlanId {
  return roadmapPreparationPlanById.has(value as RoadmapPlanId);
}

export function isRoadmapCompanyId(value: string | null): value is RoadmapCompanyId {
  return Boolean(value && getRoadmapCompany(value));
}

export function getRoadmapSelectionFromInterviewContext(context: RoadmapInterviewContext, now = new Date()) {
  const normalizedLevel = context.roleLevel?.toLowerCase() ?? "";
  const level: RoadmapLevel | undefined = /staff|principal|senior|sde iii|sde 3/.test(normalizedLevel)
    ? "sde3plus"
    : /sde ii|sde 2|mid/.test(normalizedLevel)
      ? "sde2"
      : /sde i|sde 1|new grad|early/.test(normalizedLevel)
        ? "sde1"
        : undefined;
  let plan: RoadmapPlanId | undefined;
  if (context.interviewDate) {
    const interviewAt = new Date(context.interviewDate);
    if (!Number.isNaN(interviewAt.getTime())) {
      const days = Math.ceil((interviewAt.getTime() - now.getTime()) / 86_400_000);
      plan = days <= 14 ? "two-week" : days <= 30 ? "30d" : days <= 60 ? "60d" : days <= 90 ? "90d" : "no-deadline";
    }
  }
  const company = isRoadmapCompanyId(context.companySlug ?? null) ? context.companySlug as RoadmapCompanyId : undefined;
  return { level, plan, company };
}

export function assertRoadmapPlanningIntegrity() {
  for (const level of ["sde1", "sde2", "sde3plus"] as const) {
    const roadmap = getDsaLevelRoadmap(level);
    const topicIds = new Set(roadmap.modules.flatMap((module) => module.topics.map((topic) => topic.id)));
    for (const [topicId, guidance] of Object.entries(topicGuidanceByLevel[level] ?? {})) {
      if (!topicIds.has(topicId)) throw new Error(`${level} prerequisite configuration references unknown topic ${topicId}.`);
      for (const prerequisite of guidance.prerequisites ?? []) if (!topicIds.has(prerequisite)) throw new Error(`${level}/${topicId} references unknown prerequisite ${prerequisite}.`);
    }
    const short = getRecommendedRoadmapItems({ level, plan: "two-week" });
    const month = getRecommendedRoadmapItems({ level, plan: "30d" });
    const sixty = getRecommendedRoadmapItems({ level, plan: "60d" });
    const ninety = getRecommendedRoadmapItems({ level, plan: "90d" });
    if (!(short.selectedProblemIds.length < month.selectedProblemIds.length && month.selectedProblemIds.length <= sixty.selectedProblemIds.length && sixty.selectedProblemIds.length <= ninety.selectedProblemIds.length)) throw new Error(`${level} preparation modes do not expand monotonically.`);
    if (ninety.optionalProblemIds.some((id) => ninety.requiredProblemIds.includes(id))) throw new Error(`${level} Stretch work incorrectly blocks plan completion.`);
  }
}

assertRoadmapPlanningIntegrity();
