import { activeQuestions, patternBySlug, topicBySlug } from "@/data/dsa";
import { sampleCompanyQuestions, type DSAInterviewQuestion, type DSAQuestionSource } from "@/data/dsa/interview-prep";
import type { DsaQuestion } from "@/types";

function sourceFor(question: DsaQuestion): DSAQuestionSource {
  const url = question.externalUrl ?? question.source.url;
  return {
    type: question.source.platform === "leetcode" ? "leetcode" : "other",
    label: question.source.platform === "original" ? "Engineering Foundry" : question.source.name,
    url,
    access: url ? "public-reference" : "metadata-only",
  };
}

function toBrowserQuestion(question: DsaQuestion): DSAInterviewQuestion {
  return {
    // The repository slug is the durable cross-surface identity. Source-specific
    // display IDs (for example `lc-two-sum`) must never own persisted progress.
    id: question.slug,
    slug: question.slug,
    title: question.title,
    difficulty: question.difficulty,
    topics: question.topics.map((slug) => topicBySlug.get(slug)?.name ?? slug),
    patterns: question.patterns.map((slug) => patternBySlug.get(slug)?.name ?? slug),
    companies: question.companyAssociations.map((association) => ({ companySlug: association.companySlug })),
    sources: [sourceFor(question)],
    metadata: { notes: question.note },
    isSample: false,
  };
}

const sampleByTitle = new Map(sampleCompanyQuestions.map((question) => [question.title.toLowerCase(), question]));
const existingTitles = new Set(activeQuestions.map((question) => question.title.toLowerCase()));

/**
 * The public question database combines the repository's existing question
 * metadata with a small, explicitly labeled demo layer for company filtering.
 * Demo records replace matching metadata rows so the browser never shows
 * duplicate question titles.
 */
export const dsaInterviewQuestionDatabase: DSAInterviewQuestion[] = [
  ...activeQuestions.map((question) => {
    const canonical = toBrowserQuestion(question);
    const sample = sampleByTitle.get(question.title.toLowerCase());
    return sample ? {
      ...canonical,
      companies: sample.companies,
      isSample: true,
    } : canonical;
  }),
  ...sampleCompanyQuestions
    .filter((question) => !existingTitles.has(question.title.toLowerCase()))
    .map((question) => ({ ...question, id: question.slug ?? question.id.replace(/^demo-/, "") })),
];

const canonicalIds = dsaInterviewQuestionDatabase.map((question) => question.id);
if (new Set(canonicalIds).size !== canonicalIds.length) {
  throw new Error("The DSA question browser contains duplicate canonical IDs.");
}

export function questionsForInterviewCompany(companySlug: string) {
  return dsaInterviewQuestionDatabase.filter((question) => question.companies.some((association) => association.companySlug === companySlug));
}
