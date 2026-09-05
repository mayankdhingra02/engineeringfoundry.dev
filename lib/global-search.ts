import { activeChallenges } from "@/data/challenges";
import { companies } from "@/data/companies";
import { behavioralCategories, behavioralSearchQuestions } from "@/data/behavioral";
import { activeQuestions, dsaPatterns, dsaTopics } from "@/data/dsa";
import { dsaCurriculumPages } from "@/data/dsa/curriculum";
import { dsaCompanies } from "@/data/dsa/interview-prep";
import { dsaLanguages } from "@/data/dsa/languages";
import { dsaRoadmaps } from "@/data/dsa/roadmaps";
import { interviewPlaybookSections } from "@/data/interview-tips";
import { lowLevelDesignLessons, lowLevelDesignPractice } from "@/data/low-level-design";
import { activeMlDesignProblems, mlDesignConcepts } from "@/data/ml-design";
import { activeResources } from "@/data/resources";
import { salaryNegotiationModules } from "@/data/salary-negotiation";
import { systemDesignLessons } from "@/data/system-design/curriculum";
import { mlDesignConceptHref, mlDesignProblemHref } from "@/lib/ml-design-routes";

export interface GlobalSearchItem {
  title: string;
  type: string;
  href: string;
}

export const GLOBAL_SEARCH_INITIAL_RESULT_LIMIT = 8;
export const GLOBAL_SEARCH_RESULT_BATCH_SIZE = 50;

const staticResults: readonly GlobalSearchItem[] = [
  { title: "Preparation hub", type: "Start here", href: "/prepare" },
  { title: "Interactive DSA interview roadmap", type: "Roadmap", href: "/dsa/roadmap" },
  { title: "System Design study planner", type: "Planner", href: "/system-design/plan" },
  { title: "Low-Level Design curriculum", type: "Curriculum", href: "/low-level-design" },
  { title: "Salary Negotiation toolkit", type: "Career tool", href: "/salary-negotiation" },
  { title: "ML system design", type: "Roadmap", href: "/ml-design" },
  { title: "Mock Interview Practice Lab", type: "Practice", href: "/mock-interviews" },
  { title: "Referral Request Builder", type: "Career tool", href: "/referrals?mode=request" },
  { title: "Referrer Toolkit", type: "Career tool", href: "/referrals?mode=referrer" },
  { title: "Engineering Challenge Lab", type: "Practice", href: "/challenges" },
  { title: "Community Hub", type: "Community", href: "/community" },
  { title: "Community Recognition Preview", type: "Community", href: "/leaderboard" },
  { title: "Interview Experiences", type: "Reviewed report directory", href: "/interview-experiences" },
  { title: "Interview Experience Reflection", type: "Private local reflection", href: "/interview-experiences" },
  { title: "Private website feedback", type: "Support", href: "/feedback" },
];

export const suggestedGlobalSearchItems: readonly GlobalSearchItem[] = [
  { title: "Preparation hub", type: "Start here", href: "/prepare" },
  { title: "Coding interview questions", type: "DSA practice", href: "/dsa/questions" },
  { title: "Interactive DSA interview roadmap", type: "DSA roadmap", href: "/dsa/roadmap" },
  { title: "Introduction to System Design", type: "System Design lesson", href: "/system-design/start-here/introduction" },
  { title: "System Design practice library", type: "System Design practice", href: "/system-design/problems" },
  { title: "Low-Level Design curriculum", type: "Low-Level Design", href: "/low-level-design" },
  { title: "Low-Level Design practice library", type: "Low-Level Design practice", href: "/low-level-design/practice" },
  { title: "Salary Negotiation toolkit", type: "Career tool", href: "/salary-negotiation" },
  { title: "Company interview guides", type: "Company preparation", href: "/companies" },
];

export const globalSearchItems: readonly GlobalSearchItem[] = [
  ...activeQuestions.map((question) => ({ title: question.title, type: `Question · ${question.source.name}`, href: `/dsa/questions?q=${encodeURIComponent(question.title)}` })),
  ...dsaTopics.map((topic) => ({ title: topic.name, type: "Topic", href: `/dsa/${topic.slug}` })),
  ...dsaPatterns.map((pattern) => ({ title: pattern.name, type: "Pattern", href: `/dsa/questions?q=${encodeURIComponent(pattern.slug)}` })),
  ...dsaCurriculumPages.filter((page) => page.status === "published").map((page) => ({ title: page.navigationTitle ?? page.title, type: `DSA guide · ${page.category}`, href: page.slug! })),
  ...dsaCompanies.map((company) => ({ title: `${company.name} coding interview questions`, type: "DSA company index · demo tags", href: `/dsa/companies/${company.slug}` })),
  ...dsaLanguages.filter((language) => language.status === "published").map((language) => ({ title: `DSA in ${language.name}`, type: "DSA language guide", href: `/dsa/languages/${language.slug}` })),
  ...dsaRoadmaps.filter((roadmap) => roadmap.status === "published").map((roadmap) => ({ title: `${roadmap.role} ${roadmap.durationDays}-day DSA roadmap`, type: "DSA roadmap", href: `/dsa/roadmaps/${roadmap.roleSlug}/${roadmap.durationDays}-day` })),
  ...companies.map((company) => ({ title: company.name, type: "Company guide", href: `/companies/${company.slug}` })),
  ...companies.map((company) => ({ title: `${company.name} interview experiences`, type: "Reviewed reports · private local reflection", href: `/interview-experiences/${company.slug}` })),
  ...activeChallenges.map((challenge) => ({ title: challenge.title, type: `${challenge.category} challenge`, href: `/challenges/${challenge.slug}` })),
  ...systemDesignLessons.filter((lesson) => lesson.status === "published").map((lesson) => ({ title: lesson.navigationTitle ?? lesson.title, type: `System Design lesson · ${lesson.category}`, href: lesson.slug! })),
  ...lowLevelDesignLessons.filter((lesson) => lesson.status === "published").map((lesson) => ({ title: lesson.title, type: "Low-Level Design lesson", href: `/low-level-design/lessons/${lesson.slug}` })),
  ...lowLevelDesignPractice.filter((problem) => problem.status === "published").map((problem) => ({ title: problem.title, type: "Low-Level Design practice", href: `/low-level-design/practice/${problem.slug}` })),
  ...salaryNegotiationModules.filter((module) => module.status === "published").map((module) => ({ title: module.title, type: "Salary Negotiation module", href: `/salary-negotiation/${module.slug}` })),
  ...activeMlDesignProblems.map((problem) => ({ title: problem.title, type: "ML Design problem", href: mlDesignProblemHref(problem.slug) })),
  ...mlDesignConcepts.map((concept) => ({ title: concept.title, type: "ML Design concept", href: mlDesignConceptHref(concept.slug) })),
  ...behavioralCategories.map((category) => ({ title: category.name, type: "Behavioral category", href: `/behavioral?category=${encodeURIComponent(category.name)}` })),
  ...behavioralSearchQuestions.map((question) => ({ title: question.prompt, type: "Behavioral practice", href: `/behavioral?question=${question.slug}` })),
  ...interviewPlaybookSections.map((section) => ({ title: `${section.title} playbook`, type: "Interview playbook", href: `/interview-tips#${section.id}` })),
  ...activeResources.map((resource) => ({ title: resource.title, type: `Resource · ${resource.provider}`, href: `/resources?search=${encodeURIComponent(resource.title)}` })),
  ...staticResults,
];

export function normalizeGlobalSearchQuery(query: string): string {
  return query.trim().toLowerCase().replace(/\s+/g, " ");
}

export function matchingGlobalSearchItems(query: string): readonly GlobalSearchItem[] {
  const normalizedQuery = normalizeGlobalSearchQuery(query);
  if (!normalizedQuery) return suggestedGlobalSearchItems;
  return globalSearchItems.filter((item) => `${item.title} ${item.type}`.toLowerCase().includes(normalizedQuery));
}

export function visibleGlobalSearchResults<T>(matches: readonly T[], visibleLimit: number): readonly T[] {
  return matches.slice(0, Math.max(GLOBAL_SEARCH_INITIAL_RESULT_LIMIT, visibleLimit));
}

export function nextGlobalSearchResultLimit(currentLimit: number, totalResults: number): number {
  if (currentLimit >= totalResults) return GLOBAL_SEARCH_INITIAL_RESULT_LIMIT;
  return Math.min(totalResults, Math.max(GLOBAL_SEARCH_INITIAL_RESULT_LIMIT, currentLimit) + GLOBAL_SEARCH_RESULT_BATCH_SIZE);
}
