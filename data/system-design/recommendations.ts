import {
  systemDesignPracticeProblemManifest,
  systemDesignTopicManifest,
  type SystemDesignLevel,
  type SystemDesignTargetRole,
  type SystemDesignTopicPriority,
} from "./manifest.ts";

export type { SystemDesignLevel, SystemDesignTargetRole, SystemDesignTopicPriority } from "./manifest.ts";
export type SystemDesignPreparationWindow = "3-days" | "1-week" | "2-weeks" | "1-month" | "2-plus-months";
export type SystemDesignRecommendationGroup = "focus-now" | "learn-next" | "skip-for-now";

export interface SystemDesignRecommendationContext {
  level?: SystemDesignLevel;
  preparationWindow?: SystemDesignPreparationWindow;
  role?: SystemDesignTargetRole;
}

export interface SystemDesignTopic {
  id: string;
  title: string;
  href: string;
  category: string;
  defaultPriority: SystemDesignTopicPriority;
  levelPriority?: Partial<Record<SystemDesignLevel, SystemDesignTopicPriority>>;
  rolePriority?: Partial<Record<SystemDesignTargetRole, SystemDesignTopicPriority>>;
  roleReason?: Partial<Record<SystemDesignTargetRole, string>>;
  prerequisites?: readonly string[];
  estimatedMinutes: number;
  published: boolean;
}

export interface SystemDesignTopicRecommendation {
  topic: SystemDesignTopic;
  group: SystemDesignRecommendationGroup;
  priority: SystemDesignTopicPriority;
  rank: number;
  reason: string;
}

export interface SystemDesignPracticeProblem {
  id: string;
  title: string;
  href: string;
  defaultPriority: SystemDesignTopicPriority;
  levelPriority?: Partial<Record<SystemDesignLevel, SystemDesignTopicPriority>>;
  rolePriority?: Partial<Record<SystemDesignTargetRole, SystemDesignTopicPriority>>;
  roleReason?: Partial<Record<SystemDesignTargetRole, string>>;
  concepts: readonly string[];
  difficulty: "foundation" | "intermediate" | "advanced" | "specialized";
  estimatedMinutes: number;
  published: boolean;
}

export interface SystemDesignPracticeRecommendation {
  problem: SystemDesignPracticeProblem;
  group: SystemDesignRecommendationGroup;
  priority: SystemDesignTopicPriority;
  rank: number;
  reason: string;
}

export const systemDesignLevelOptions: ReadonlyArray<{ value: SystemDesignLevel; label: string; description: string }> = [
  { value: "sde1", label: "SDE I", description: "Core building blocks and a repeatable interview flow" },
  { value: "sde2", label: "SDE II", description: "Breadth, scaling tradeoffs, and dependable system choices" },
  { value: "senior", label: "Senior", description: "Architecture depth, failure handling, and judgment" },
  { value: "staff", label: "Staff", description: "Cross-system tradeoffs, distributed systems, and operations" },
];

export const systemDesignPreparationWindowOptions: ReadonlyArray<{ value: SystemDesignPreparationWindow; label: string; shortLabel: string }> = [
  { value: "3-days", label: "3 days", shortLabel: "3 days" },
  { value: "1-week", label: "1 week", shortLabel: "7 days" },
  { value: "2-weeks", label: "2 weeks", shortLabel: "14 days" },
  { value: "1-month", label: "1 month", shortLabel: "1 month" },
  { value: "2-plus-months", label: "2+ months", shortLabel: "2+ months" },
];

export const systemDesignRoleOptions: ReadonlyArray<{ value: SystemDesignTargetRole | "general"; label: string; description: string }> = [
  { value: "general", label: "General SWE", description: "Balanced System Design preparation" },
  { value: "backend", label: "Backend", description: "APIs, data, messaging, and reliability" },
  { value: "fullstack", label: "Full Stack", description: "Product systems, real-time UX, and storage" },
  { value: "infrastructure", label: "Infrastructure", description: "Distributed systems, operations, and resilience" },
  { value: "data", label: "Data", description: "Pipelines, streaming, storage, and processing" },
  { value: "ml", label: "ML", description: "Serving, inference, feature, and embedding infrastructure" },
];

export const systemDesignTopicPrerequisites: Readonly<Record<string, readonly string[]>> = Object.fromEntries(
  systemDesignTopicManifest.filter((topic) => topic.prerequisites.length > 0).map((topic) => [topic.id, topic.prerequisites]),
);

export const systemDesignTopics: readonly SystemDesignTopic[] = systemDesignTopicManifest.map((topic) => ({
  id: topic.id,
  title: topic.title,
  href: topic.slug,
  category: topic.section,
  defaultPriority: topic.priority,
  levelPriority: topic.levelPriority,
  rolePriority: topic.rolePriority,
  roleReason: topic.roleReason,
  prerequisites: topic.prerequisites,
  estimatedMinutes: topic.estimatedMinutes,
  published: topic.published,
}));

export const systemDesignPracticeProblems: readonly SystemDesignPracticeProblem[] = systemDesignPracticeProblemManifest.map((problem) => ({
  id: problem.id,
  title: problem.title,
  href: problem.slug,
  defaultPriority: problem.priority,
  levelPriority: problem.levelPriority,
  rolePriority: problem.rolePriority,
  roleReason: Object.fromEntries(Object.entries(problem.rolePriority)
    .filter(([, priority]) => priority === "must-know")
    .map(([role]) => [role, `${problem.title} directly exercises high-return ${role} architecture decisions.`])),
  concepts: problem.concepts,
  difficulty: problem.difficulty,
  estimatedMinutes: problem.estimatedMinutes,
  published: problem.contentStatus === "published",
}));

const windowConfiguration: Record<SystemDesignPreparationWindow, { focusCount: number; learnCount: number }> = {
  "3-days": { focusCount: 10, learnCount: 12 },
  "1-week": { focusCount: 22, learnCount: 20 },
  "2-weeks": { focusCount: 36, learnCount: 30 },
  "1-month": { focusCount: 60, learnCount: 40 },
  "2-plus-months": { focusCount: 100, learnCount: 40 },
};

const priorityWeight: Record<SystemDesignTopicPriority, number> = { "must-know": 3, important: 2, advanced: 1 };

// Short plans must cross section boundaries. Taking the first N manifest
// entries would overfit to foundations/networking and postpone the database,
// cache, messaging, and failure concepts that interviews combine.
export const universalFocusOrder = [
  "interview-framework",
  "requirements",
  "estimation",
  "core-system-properties",
  "load-balancing",
  "caching",
  "sql-vs-nosql",
  "database-indexes",
  "replication",
  "sharding",
  "consistent-hashing",
  "message-queues",
  "pub-sub",
  "partitions",
  "delivery-semantics",
  "rate-limiting",
  "realtime-communication",
  "idempotency",
  "retries",
  "redis",
  "kafka",
  "cdn",
] as const;

const universalFocusRank = new Map<string, number>(universalFocusOrder.map((id, index) => [id, index]));

// Precedence is explicit and centralized:
// default priority -> level adjustment -> role adjustment -> preparation-window quotas.
export const recommendationScoringConfiguration = {
  levelAdjustmentWeight: 0.75,
  roleAdjustmentWeight: 1,
  mustKnowThreshold: 2.25,
  importantThreshold: 1.5,
} as const;

function recommendationSignalScore(
  defaultPriority: SystemDesignTopicPriority,
  context: Pick<SystemDesignRecommendationContext, "level" | "role">,
  levelPriority?: Partial<Record<SystemDesignLevel, SystemDesignTopicPriority>>,
  rolePriority?: Partial<Record<SystemDesignTargetRole, SystemDesignTopicPriority>>,
) {
  const baseScore = priorityWeight[defaultPriority];
  const levelScore = context.level ? priorityWeight[levelPriority?.[context.level] ?? defaultPriority] : baseScore;
  const roleScore = context.role ? priorityWeight[rolePriority?.[context.role] ?? defaultPriority] : baseScore;
  return baseScore
    + (levelScore - baseScore) * recommendationScoringConfiguration.levelAdjustmentWeight
    + (roleScore - baseScore) * recommendationScoringConfiguration.roleAdjustmentWeight;
}

function priorityFromScore(score: number): SystemDesignTopicPriority {
  if (score >= recommendationScoringConfiguration.mustKnowThreshold) return "must-know";
  if (score >= recommendationScoringConfiguration.importantThreshold) return "important";
  return "advanced";
}

function rankedTopics(context: Required<Pick<SystemDesignRecommendationContext, "level" | "preparationWindow">> & Pick<SystemDesignRecommendationContext, "role">) {
  return systemDesignTopics
    .map((topic, catalogIndex) => ({ topic, score: recommendationSignalScore(topic.defaultPriority, context, topic.levelPriority, topic.rolePriority), catalogIndex }))
    .map((item) => ({ ...item, priority: priorityFromScore(item.score) }))
    .sort((left, right) => {
      if (left.topic.published !== right.topic.published) return left.topic.published ? -1 : 1;
      const leftCore = universalFocusRank.get(left.topic.id);
      const rightCore = universalFocusRank.get(right.topic.id);
      if (leftCore !== undefined || rightCore !== undefined) return (leftCore ?? Number.POSITIVE_INFINITY) - (rightCore ?? Number.POSITIVE_INFINITY);
      return right.score - left.score || left.catalogIndex - right.catalogIndex;
    });
}

function recommendationReason(topic: SystemDesignTopic, group: SystemDesignRecommendationGroup, priority: SystemDesignTopicPriority, context: Required<Pick<SystemDesignRecommendationContext, "level" | "preparationWindow">> & Pick<SystemDesignRecommendationContext, "role">) {
  const roleReason = context.role ? topic.roleReason?.[context.role] : undefined;
  if (roleReason) return roleReason;
  const level = systemDesignLevelOptions.find((option) => option.value === context.level)?.label ?? context.level;
  const windowLabel = systemDesignPreparationWindowOptions.find((option) => option.value === context.preparationWindow)?.label ?? context.preparationWindow;
  if (group === "focus-now") return `${priority === "must-know" ? "Essential" : "High-return"} ${level} material for a ${windowLabel} preparation window.`;
  if (group === "learn-next") return `Worth covering after the highest-return ${level} material is secure.`;
  return `Useful depth that can wait until the higher-ROI material for this ${windowLabel} window is covered.`;
}

export function getTopicRecommendation(topic: SystemDesignTopic, context: SystemDesignRecommendationContext): SystemDesignTopicRecommendation | null {
  if (!context.level || !context.preparationWindow) return null;
  const completeContext = { level: context.level, preparationWindow: context.preparationWindow, role: context.role };
  const ranked = rankedTopics(completeContext);
  const rank = ranked.findIndex((item) => item.topic.id === topic.id);
  if (rank < 0) return null;
  const { focusCount, learnCount } = windowConfiguration[context.preparationWindow];
  const group: SystemDesignRecommendationGroup = rank < focusCount ? "focus-now" : rank < focusCount + learnCount ? "learn-next" : "skip-for-now";
  const priority = ranked[rank].priority;
  return { topic, group, priority, rank: rank + 1, reason: recommendationReason(topic, group, priority, completeContext) };
}

export function getPersonalizedTopicRecommendations(context: SystemDesignRecommendationContext): SystemDesignTopicRecommendation[] | null {
  if (!context.level || !context.preparationWindow) return null;
  return systemDesignTopics
    .map((topic) => getTopicRecommendation(topic, context))
    .filter((recommendation): recommendation is SystemDesignTopicRecommendation => recommendation !== null)
    .sort((left, right) => left.rank - right.rank);
}

export function getRecommendationCounts(recommendations: readonly SystemDesignTopicRecommendation[]) {
  return recommendations.reduce<Record<SystemDesignRecommendationGroup, number>>((counts, recommendation) => {
    counts[recommendation.group] += 1;
    return counts;
  }, { "focus-now": 0, "learn-next": 0, "skip-for-now": 0 });
}

const practiceWindowConfiguration: Record<SystemDesignPreparationWindow, { focusCount: number; learnCount: number }> = {
  "3-days": { focusCount: 3, learnCount: 4 },
  "1-week": { focusCount: 5, learnCount: 6 },
  "2-weeks": { focusCount: 8, learnCount: 8 },
  "1-month": { focusCount: 12, learnCount: 12 },
  "2-plus-months": { focusCount: 20, learnCount: 20 },
};

export function getPracticeProblemRecommendations(context: SystemDesignRecommendationContext): SystemDesignPracticeRecommendation[] | null {
  if (!context.level || !context.preparationWindow) return null;
  const ranked = systemDesignPracticeProblems
    .filter((problem) => problem.published)
    .map((problem, catalogIndex) => ({
      problem,
      score: recommendationSignalScore(problem.defaultPriority, context, problem.levelPriority, problem.rolePriority)
        + (context.role && problem.defaultPriority !== "must-know" && problem.rolePriority?.[context.role] === "must-know" ? 1 : 0),
      catalogIndex,
    }))
    .map((item) => ({ ...item, priority: priorityFromScore(item.score) }))
    .sort((left, right) => right.score - left.score || left.catalogIndex - right.catalogIndex);
  const { focusCount, learnCount } = practiceWindowConfiguration[context.preparationWindow];

  return ranked.map(({ problem, priority }, index) => {
    const group: SystemDesignRecommendationGroup = index < focusCount ? "focus-now" : index < focusCount + learnCount ? "learn-next" : "skip-for-now";
    const roleReason = context.role ? problem.roleReason?.[context.role] : undefined;
    const reason = roleReason ?? (group === "focus-now" ? "A high-return practice problem for your selected interview plan." : group === "learn-next" ? "Worth practicing after the highest-return problems are secure." : "Useful practice that can wait until the focused set is complete.");
    return { problem, group, priority, rank: index + 1, reason };
  });
}
