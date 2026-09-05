import { activeQuestions, patternBySlug, topicBySlug } from "@/data/dsa";
import { sampleCompanyQuestions, type DSAInterviewQuestion, type DSAQuestionSource } from "@/data/dsa/interview-prep";
import type { Foundry75Question } from "@/data/dsa/foundry-75";
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

function toBrowserQuestion(question: Foundry75Question): DSAInterviewQuestion {
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
    catalogVersion: question.catalogVersion,
    sourceClass: question.sourceClass,
    roleRelevance: question.roleRelevance,
    whyItBelongs: question.whyItBelongs,
    recognitionPrompt: question.recognitionPrompt,
    clarifyingQuestions: question.clarifyingQuestions,
    bruteForceCheckpoint: question.bruteForceCheckpoint,
    complexityTarget: question.complexityTarget,
    testCasePrompts: question.testCasePrompts,
    followUpVariants: question.followUpVariants,
    interviewBehaviorFocus: question.interviewBehaviorFocus,
    originalPrompt: question.originalPrompt,
  };
}

const sampleByTitle = new Map(sampleCompanyQuestions.map((question) => [question.title.toLowerCase(), question]));

/**
 * The public browser is the versioned Foundry 75. Demonstration company
 * associations may decorate matching questions, but never add catalog rows.
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
];

const canonicalIds = dsaInterviewQuestionDatabase.map((question) => question.id);
if (new Set(canonicalIds).size !== canonicalIds.length) {
  throw new Error("The DSA question browser contains duplicate canonical IDs.");
}

export function questionsForInterviewCompany(companySlug: string) {
  return dsaInterviewQuestionDatabase.filter((question) => question.companies.some((association) => association.companySlug === companySlug));
}
