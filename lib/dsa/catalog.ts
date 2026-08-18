import { dsaInterviewQuestionDatabase } from "@/data/dsa/question-database";
import { roadmapProblems } from "@/data/dsa/roadmap-problem-registry";

export type CanonicalDsaQuestion = {
  id: string;
  title: string;
  difficulty: "Easy" | "Medium" | "Hard";
  topics: readonly string[];
  patterns: readonly string[];
  companySlugs: readonly string[];
  sourceLabel: string;
  sourceUrl: string | null;
  inQuestionBrowser: boolean;
};

const browserById = new Map(dsaInterviewQuestionDatabase.map((question) => [question.id, question]));
const roadmapById = new Map(roadmapProblems.map((question) => [question.id, question]));
const ids = [...new Set([...roadmapById.keys(), ...browserById.keys()])].sort();

export const canonicalDsaQuestions: readonly CanonicalDsaQuestion[] = ids.map((id) => {
  const browser = browserById.get(id);
  const roadmap = roadmapById.get(id);
  const source = browser?.sources.find((candidate) => candidate.url) ?? browser?.sources[0];
  return {
    id,
    title: browser?.title ?? roadmap?.title ?? id,
    difficulty: browser?.difficulty ?? roadmap?.difficulty ?? "Medium",
    topics: browser?.topics ?? roadmap?.topicTags ?? [],
    patterns: browser?.patterns ?? (roadmap?.pattern ? [roadmap.pattern] : []),
    companySlugs: browser?.companies.map((company) => company.companySlug) ?? [],
    sourceLabel: source?.label ?? (roadmap?.source === "leetcode" ? "LeetCode" : "Public source"),
    sourceUrl: source?.url ?? roadmap?.url ?? null,
    inQuestionBrowser: Boolean(browser),
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
