import { dsaPatterns } from "@/data/dsa";
import type { DSAInterviewQuestion } from "@/data/dsa/interview-prep";

export function normalizeDsaQuestionSearch(value: string) {
  return value.toLowerCase().replace(/&/g, "and").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

const patternSlugBySearchValue = new Map(
  dsaPatterns.flatMap((pattern) => [
    [normalizeDsaQuestionSearch(pattern.slug), pattern.slug],
    [normalizeDsaQuestionSearch(pattern.name), pattern.slug],
  ]),
);

function questionPatternSlugs(question: DSAInterviewQuestion) {
  return question.patterns.map((pattern) => patternSlugBySearchValue.get(normalizeDsaQuestionSearch(pattern)) ?? normalizeDsaQuestionSearch(pattern));
}

export function matchesDsaQuestionSearch(question: DSAInterviewQuestion, query: string, companyNames: readonly string[] = []) {
  const normalizedQuery = normalizeDsaQuestionSearch(query);
  if (!normalizedQuery) return true;

  const patternSlug = patternSlugBySearchValue.get(normalizedQuery);
  if (patternSlug) return questionPatternSlugs(question).includes(patternSlug);

  return [question.id, question.slug, question.title, ...question.topics, ...question.patterns, ...companyNames]
    .filter(Boolean)
    .some((value) => normalizeDsaQuestionSearch(String(value)).includes(normalizedQuery));
}

export function filterDsaQuestionsBySearch(questions: readonly DSAInterviewQuestion[], query: string) {
  return questions.filter((question) => matchesDsaQuestionSearch(question, query));
}
