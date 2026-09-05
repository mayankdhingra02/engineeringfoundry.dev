import { dsaInterviewQuestionDatabase } from "@/data/dsa/question-database";
import type { DSAQuestionSourceType } from "@/data/dsa/interview-prep";
import { roadmapProblems } from "@/data/dsa/roadmap-problem-registry";

export type CanonicalDsaQuestion = {
  id: string;
  title: string;
  difficulty: "Easy" | "Medium" | "Hard";
  topics: readonly string[];
  patterns: readonly string[];
  companySlugs: readonly string[];
  sourceType: DSAQuestionSourceType;
  sourceLabel: string;
  sourceUrl: string | null;
  inQuestionBrowser: boolean;
  catalogVersion?: string;
  sourceClass?: "external-reference" | "engineering-foundry-original";
  roleRelevance?: readonly string[];
  whyItBelongs?: string;
  recognitionPrompt?: string;
  clarifyingQuestions?: readonly string[];
  bruteForceCheckpoint?: string;
  complexityTarget?: string;
  testCasePrompts?: readonly string[];
  followUpVariants?: readonly string[];
  interviewBehaviorFocus?: string;
  originalPrompt?: string;
};

const browserById = new Map(dsaInterviewQuestionDatabase.map((question) => [question.id, question]));
const roadmapById = new Map(roadmapProblems.map((question) => [question.id, question]));
// Retired IDs stay reserved so removing a demonstration or catalog row cannot
// orphan historical progress or make its identifier reusable.
const retiredIds = ["no-link"] as const;
const ids = [...new Set([...roadmapById.keys(), ...browserById.keys(), ...retiredIds])].sort();

export const canonicalDsaQuestions: readonly CanonicalDsaQuestion[] = ids.map((id) => {
  const browser = browserById.get(id);
  const roadmap = roadmapById.get(id);
  const source = browser?.sources.find((candidate) => candidate.url) ?? browser?.sources[0];
  const retired = retiredIds.includes(id as (typeof retiredIds)[number]);
  return {
    id,
    title: browser?.title ?? roadmap?.title ?? (retired ? "Retired catalog record" : id),
    difficulty: browser?.difficulty ?? roadmap?.difficulty ?? "Medium",
    topics: browser?.topics ?? roadmap?.topicTags ?? [],
    patterns: browser?.patterns ?? (roadmap?.pattern ? [roadmap.pattern] : []),
    companySlugs: browser?.companies.map((company) => company.companySlug) ?? [],
    sourceType: source?.type ?? roadmap?.source ?? "other",
    sourceLabel: source?.label ?? (roadmap?.source === "leetcode" ? "LeetCode" : "Public source"),
    sourceUrl: source?.url ?? roadmap?.url ?? null,
    inQuestionBrowser: Boolean(browser),
    catalogVersion: browser?.catalogVersion,
    sourceClass: browser?.sourceClass,
    roleRelevance: browser?.roleRelevance,
    whyItBelongs: browser?.whyItBelongs ?? roadmap?.whyItMatters,
    recognitionPrompt: browser?.recognitionPrompt,
    clarifyingQuestions: browser?.clarifyingQuestions,
    bruteForceCheckpoint: browser?.bruteForceCheckpoint,
    complexityTarget: browser?.complexityTarget,
    testCasePrompts: browser?.testCasePrompts,
    followUpVariants: browser?.followUpVariants ?? roadmap?.followUps,
    interviewBehaviorFocus: browser?.interviewBehaviorFocus,
    originalPrompt: browser?.originalPrompt,
  };
});

export const canonicalDsaQuestionById = new Map(canonicalDsaQuestions.map((question) => [question.id, question]));

export function getCanonicalDsaQuestion(questionId: string) {
  return canonicalDsaQuestionById.get(questionId) ?? null;
}

export function assertCanonicalDsaQuestionCatalog() {
  if (canonicalDsaQuestionById.size !== canonicalDsaQuestions.length) throw new Error("Canonical DSA question IDs must be unique.");
  for (const question of dsaInterviewQuestionDatabase) {
    if (!canonicalDsaQuestionById.has(question.id)) throw new Error(`Browser question ${question.id} is missing from the canonical catalog.`);
  }
  for (const problem of roadmapProblems) {
    if (!canonicalDsaQuestionById.has(problem.id)) throw new Error(`Roadmap problem ${problem.id} is missing from the canonical catalog.`);
  }
}

assertCanonicalDsaQuestionCatalog();
