import { activeChallenges } from "@/data/challenges";
import { companies } from "@/data/companies";
import { dsaTopics } from "@/data/dsa";
import { dsaCurriculumPages } from "@/data/dsa/curriculum";
import { dsaCompanies } from "@/data/dsa/interview-prep";
import { lowLevelDesignLessons, lowLevelDesignPractice } from "@/data/low-level-design";
import { activeMlDesignProblems } from "@/data/ml-design";
import { salaryNegotiationModules } from "@/data/salary-negotiation";
import { systemDesignLessons } from "@/data/system-design/curriculum";
import { canonicalDsaQuestions } from "@/lib/dsa/catalog";
import {
  V1_ROUND_EXECUTION_GUIDES,
  roundExecutionGuideHref,
} from "@/lib/interview-playbook/round-execution-presentation";
import { mlDesignProblemHref } from "@/lib/ml-design-routes";

export type PublicRoutePath = `/${string}`;

export type FinitePublicPagePattern =
  | "/companies/[slug]"
  | "/interview-experiences/[company]"
  | "/salary-negotiation/[slug]"
  | "/low-level-design/lessons/[slug]"
  | "/low-level-design/practice/[slug]"
  | "/challenges/[slug]"
  | "/system-design/[...segments]"
  | "/interview-tips/rounds/[slug]"
  | "/ml-design/[slug]"
  | "/dsa/[...segments]";

export type FinitePublicRouteDefinition = Readonly<{
  pagePattern: FinitePublicPagePattern;
  paths: readonly PublicRoutePath[];
}>;

function publicPath(value: string, source: string): PublicRoutePath {
  const hasForbiddenCharacter = [...value].some((character) => {
    const codePoint = character.codePointAt(0) ?? 0;
    return codePoint <= 31 || codePoint === 127 || "\\?#[]".includes(character);
  });
  if (
    !value.startsWith("/")
    || value.length === 1
    || value.endsWith("/")
    || value.includes("//")
    || hasForbiddenCharacter
  ) {
    throw new Error(`${source} produced a malformed public route: ${JSON.stringify(value)}`);
  }
  return value as PublicRoutePath;
}

function uniquePaths(values: readonly string[], source: string): readonly PublicRoutePath[] {
  return [...new Set(values.map((value) => publicPath(value, source)))];
}

const companyPaths = uniquePaths(
  companies.map((company) => `/companies/${company.slug}`),
  "/companies/[slug]",
);

const interviewExperiencePaths = uniquePaths(
  companies.map((company) => `/interview-experiences/${company.slug}`),
  "/interview-experiences/[company]",
);

const salaryNegotiationPaths = uniquePaths(
  salaryNegotiationModules.map((module) => `/salary-negotiation/${module.slug}`),
  "/salary-negotiation/[slug]",
);

const lowLevelDesignLessonPaths = uniquePaths(
  lowLevelDesignLessons.map((lesson) => `/low-level-design/lessons/${lesson.slug}`),
  "/low-level-design/lessons/[slug]",
);

const lowLevelDesignPracticePaths = uniquePaths(
  lowLevelDesignPractice.map((problem) => `/low-level-design/practice/${problem.slug}`),
  "/low-level-design/practice/[slug]",
);

const challengePaths = uniquePaths(
  activeChallenges.map((challenge) => `/challenges/${challenge.slug}`),
  "/challenges/[slug]",
);

const systemDesignPaths = uniquePaths(
  [
    "/system-design/problems",
    ...systemDesignLessons.map((lesson) => lesson.slug ?? ""),
  ],
  "/system-design/[...segments]",
);

const interviewRoundPaths = uniquePaths(
  V1_ROUND_EXECUTION_GUIDES.map((guide) => roundExecutionGuideHref(guide.slug)),
  "/interview-tips/rounds/[slug]",
);

const mlDesignPaths = uniquePaths(
  activeMlDesignProblems.map((problem) => mlDesignProblemHref(problem.slug)),
  "/ml-design/[slug]",
);

const dsaPaths = uniquePaths(
  [
    ...dsaCurriculumPages.map((page) => page.slug ?? ""),
    ...dsaTopics.map((topic) => `/dsa/${topic.slug}`),
    ...dsaCompanies.flatMap((company) => [
      `/dsa/companies/${company.slug}`,
      `/dsa/company-questions/${company.slug}`,
    ]),
    ...canonicalDsaQuestions.map((question) => `/dsa/questions/${question.id}`),
    "/dsa/questions",
    "/dsa/companies",
    "/dsa/roadmap",
    "/dsa/roadmap/topic-map",
    "/dsa/study-plans",
    "/dsa/interview-strategy",
    "/dsa/practice",
    "/dsa/company-questions",
    "/dsa/patterns",
  ],
  "/dsa/[...segments]",
);

export const finitePublicRouteDefinitions: readonly FinitePublicRouteDefinition[] = [
  { pagePattern: "/companies/[slug]", paths: companyPaths },
  { pagePattern: "/interview-experiences/[company]", paths: interviewExperiencePaths },
  { pagePattern: "/salary-negotiation/[slug]", paths: salaryNegotiationPaths },
  { pagePattern: "/low-level-design/lessons/[slug]", paths: lowLevelDesignLessonPaths },
  { pagePattern: "/low-level-design/practice/[slug]", paths: lowLevelDesignPracticePaths },
  { pagePattern: "/challenges/[slug]", paths: challengePaths },
  { pagePattern: "/system-design/[...segments]", paths: systemDesignPaths },
  { pagePattern: "/interview-tips/rounds/[slug]", paths: interviewRoundPaths },
  { pagePattern: "/ml-design/[slug]", paths: mlDesignPaths },
  { pagePattern: "/dsa/[...segments]", paths: dsaPaths },
];

export const publicRedirectSourcePaths: readonly PublicRoutePath[] = uniquePaths(
  ["/sign-in", "/sign-up", "/dsa/interview-strategy"],
  "public redirect sources",
);

export const indexableFinitePublicRoutes = uniquePaths(
  [
    ...companyPaths,
    ...interviewExperiencePaths,
    ...dsaTopics.map((topic) => `/dsa/${topic.slug}`),
    ...dsaCurriculumPages.map((page) => page.slug ?? ""),
    "/dsa/questions",
    "/dsa/roadmap",
    "/dsa/patterns",
    ...systemDesignLessons
      .filter((lesson) => lesson.status === "published")
      .map((lesson) => lesson.slug ?? ""),
    ...lowLevelDesignLessons
      .filter((lesson) => lesson.status === "published")
      .map((lesson) => `/low-level-design/lessons/${lesson.slug}`),
    ...lowLevelDesignPractice
      .filter((problem) => problem.status === "published")
      .map((problem) => `/low-level-design/practice/${problem.slug}`),
    ...salaryNegotiationModules
      .filter((module) => module.status === "published")
      .map((module) => `/salary-negotiation/${module.slug}`),
    ...mlDesignPaths,
    ...challengePaths,
    ...interviewRoundPaths,
  ],
  "indexable finite public routes",
);

function singleSegmentParams<K extends string>(
  paths: readonly PublicRoutePath[],
  key: K,
): Array<Record<K, string>> {
  return paths.map((path) => ({ [key]: path.slice(path.lastIndexOf("/") + 1) }) as Record<K, string>);
}

function catchAllParams(paths: readonly PublicRoutePath[], prefix: string) {
  return paths.map((path) => ({ segments: path.slice(prefix.length).split("/") }));
}

export function buildCompanyStaticParams() {
  return singleSegmentParams(companyPaths, "slug");
}

export function buildInterviewExperienceStaticParams() {
  return singleSegmentParams(interviewExperiencePaths, "company");
}

export function buildSalaryNegotiationStaticParams() {
  return singleSegmentParams(salaryNegotiationPaths, "slug");
}

export function buildLowLevelDesignLessonStaticParams() {
  return singleSegmentParams(lowLevelDesignLessonPaths, "slug");
}

export function buildLowLevelDesignPracticeStaticParams() {
  return singleSegmentParams(lowLevelDesignPracticePaths, "slug");
}

export function buildChallengeStaticParams() {
  return singleSegmentParams(challengePaths, "slug");
}

export function buildSystemDesignStaticParams() {
  return catchAllParams(systemDesignPaths, "/system-design/");
}

export function buildInterviewRoundStaticParams() {
  return singleSegmentParams(interviewRoundPaths, "slug");
}

export function buildMlDesignStaticParams() {
  return singleSegmentParams(mlDesignPaths, "slug");
}

export function buildDsaStaticParams() {
  return catchAllParams(dsaPaths, "/dsa/");
}
