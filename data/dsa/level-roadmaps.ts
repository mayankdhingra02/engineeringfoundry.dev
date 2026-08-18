import { sde1Roadmap } from "./sde1-roadmap.ts";
import { sde2Roadmap } from "./sde2-roadmap.ts";
import { sde3Roadmap } from "./sde3-roadmap.ts";

export type RoadmapLevel = "sde1" | "sde2" | "sde3plus";

export type TopicPriority = "core" | "high-value" | "advanced";
export type ProblemClassification = "learn" | "core" | "practice" | "stretch";
export type ReviewState = "new" | "learning" | "review" | "comfortable";
export type SeniorFollowUpCategory = "correctness" | "complexity" | "alternative" | "mutation" | "streaming" | "memory" | "concurrency" | "persistence" | "scale" | "failure" | "API" | "approximation";

export type CategorizedFollowUp = {
  category: SeniorFollowUpCategory;
  prompt: string;
};

export type APIContract = {
  operations: string[];
  complexityGoals: string[];
  assumptions: string[];
};

export type RoadmapProblem = {
  id: string;
  title: string;
  slug?: string;
  url?: string;
  difficulty?: "Easy" | "Medium" | "Hard";
  classification: ProblemClassification;
  pattern: string;
  whyItMatters?: string;
  skills?: string[];
  topicTags?: string[];
  prerequisites?: string[];
  followUps?: string[];
  seniorExtensions?: string[];
  hints?: [string, string, string];
  source?: "leetcode" | "leetcode-ca" | "other";
  levelRationale?: string;
  levelRationaleLabel?: string;
  alternativeApproaches?: AlternativeApproach[];
  alternativeLabel?: string;
  designBridge?: DesignBridge;
  invariants?: string[];
  categorizedFollowUps?: CategorizedFollowUp[];
  failureChecks?: string[];
  apiContract?: APIContract;
  companyRelevance?: string[];
};

export type AlternativeApproach = {
  title: string;
  time: string;
  space: string;
  whenUseful: string;
};

export type DesignBridge = {
  title: string;
  points: string[];
  href?: string;
  linkLabel?: string;
};

export type RoadmapProblemAssignment = {
  problemId: string;
  classification: ProblemClassification;
  levelRationale?: string;
  levelRationaleLabel?: string;
  followUps?: string[];
  alternativeApproaches?: AlternativeApproach[];
  alternativeLabel?: string;
  designBridge?: DesignBridge;
  invariants?: string[];
  categorizedFollowUps?: CategorizedFollowUp[];
  failureChecks?: string[];
  apiContract?: APIContract;
  companyRelevance?: string[];
};

export type RoadmapTopic = {
  id: string;
  title: string;
  priority: TopicPriority;
  description: string;
  recognitionSignals?: string[];
  concepts?: string[];
  problems?: RoadmapProblem[];
  problemIds?: string[];
  masteryCriteria?: string[];
  completionRequired?: boolean;
  interviewNotes?: string[];
  comparisonExamples?: { label: string; complexity: string }[];
};

export type RoadmapStage =
  | "foundations"
  | "core-patterns"
  | "level-patterns"
  | "core-data-structures"
  | "trees-graphs"
  | "high-value-patterns"
  | "interview-practice"
  | "mixed-practice"
  | "timed-interviews"
  | "company-prep";

export type RoadmapModule = {
  id: RoadmapStage;
  title: string;
  description: string;
  topics: RoadmapTopic[];
};

export type MixedPracticeSet = {
  id: string;
  title: string;
  description: string;
  problemIds: string[];
  revealPatternsByDefault: false;
};

export type TimedPracticeMode = {
  id: string;
  title: string;
  duration: string;
  description: string;
  expectations: string[];
};

export type RoadmapScopePath = {
  id: "short" | "standard" | "thorough";
  title: string;
  description: string;
  classifications: ProblemClassification[];
};

export type DSARoadmap = {
  level: RoadmapLevel;
  title: string;
  shortTitle: string;
  subtitle: string;
  objective: string;
  progression: string[];
  modules: RoadmapModule[];
  problemAssignments?: RoadmapProblemAssignment[];
  diagnostic?: {
    title: string;
    description: string;
    problemIds: string[];
    masteryCriteria: string[];
  };
  failureModes?: { title: string; description: string }[];
  ambiguousExercises?: {
    id: string;
    title: string;
    prompt: string;
    clarifyingQuestions: string[];
    revealedConstraints: string[];
  }[];
  codeReviewExercises?: {
    id: string;
    title: string;
    description: string;
    language: "python" | "typescript" | "pseudocode";
    code: string;
    reviewPrompts: string[];
    findings: string[];
  }[];
  optionalTopics?: RoadmapTopic[];
  mixedPracticeSets?: MixedPracticeSet[];
  timedPracticeModes?: TimedPracticeMode[];
  readinessCriteria?: string[];
  reviewGuidance?: string[];
  scopePaths?: RoadmapScopePath[];
  estimatedProblems?: number;
  estimatedWeeks?: string;
};

export const dsaLevelRoadmaps: readonly DSARoadmap[] = [
  sde1Roadmap,
  sde2Roadmap,
  sde3Roadmap,
] as const;

export const dsaRoadmapLevels = dsaLevelRoadmaps.map(({ level, shortTitle, subtitle, objective }) => ({ level, shortTitle, subtitle, objective }));

export function getDsaLevelRoadmap(level: RoadmapLevel) {
  return dsaLevelRoadmaps.find((roadmap) => roadmap.level === level) ?? dsaLevelRoadmaps[0];
}

export function getRoadmapTopicCount(roadmap: DSARoadmap) {
  return roadmap.modules.reduce((total, current) => total + current.topics.length, 0);
}

export function getRoadmapPriorityCounts(roadmap: DSARoadmap) {
  return [...roadmap.modules.flatMap((current) => current.topics), ...(roadmap.optionalTopics ?? [])].reduce<Record<TopicPriority, number>>((counts, current) => {
    counts[current.priority] += 1;
    return counts;
  }, { core: 0, "high-value": 0, advanced: 0 });
}

export function assertDsaLevelRoadmapIntegrity() {
  for (const roadmap of dsaLevelRoadmaps) {
    const expectedStages: RoadmapStage[] = roadmap.level === "sde1"
      ? ["foundations", "core-patterns", "core-data-structures", "trees-graphs", "high-value-patterns", "interview-practice"]
      : roadmap.level === "sde2"
        ? ["foundations", "core-patterns", "trees-graphs", "high-value-patterns", "level-patterns", "interview-practice"]
        : ["foundations", "core-data-structures", "trees-graphs", "high-value-patterns", "level-patterns", "interview-practice"];
    const stages = roadmap.modules.map((current) => current.id);
    if (stages.join("|") !== expectedStages.join("|")) throw new Error(`${roadmap.level} must define all six roadmap stages in order.`);
    const topicIds = roadmap.modules.flatMap((current) => current.topics.map((currentTopic) => currentTopic.id));
    if (new Set(topicIds).size !== topicIds.length) throw new Error(`${roadmap.level} contains duplicate topic IDs.`);
  }
}

assertDsaLevelRoadmapIntegrity();
