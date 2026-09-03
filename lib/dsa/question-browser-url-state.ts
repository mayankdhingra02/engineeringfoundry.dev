import type { DSACompany, DSAInterviewQuestion, DSAQuestionSourceType } from "@/data/dsa/interview-prep";

export const DSA_QUESTION_BROWSER_SEARCH_LIMIT = 160;
export const dsaQuestionBrowserPageSizes = [25, 50, 100] as const;

export type DsaQuestionBrowserPageSize = (typeof dsaQuestionBrowserPageSizes)[number];
export type DsaQuestionBrowserDifficulty = "all" | "easy" | "medium" | "hard";
export type DsaQuestionBrowserProgress = "all" | "not_started" | "attempted" | "solved" | "review" | "bookmarked";

export type DsaQuestionBrowserUrlState = {
  search: string;
  company: string;
  difficulty: DsaQuestionBrowserDifficulty;
  topics: string[];
  source: "all" | DSAQuestionSourceType;
  progress: DsaQuestionBrowserProgress;
  page: number;
  pageSize: DsaQuestionBrowserPageSize;
};

export type DsaQuestionBrowserUrlContext = {
  companySlugs: readonly string[];
  topicSlugs: readonly string[];
  sourceTypes: readonly DSAQuestionSourceType[];
  fixedCompanySlug?: string;
  signedIn: boolean;
  /** This must be the owner-scoped application ID returned by the server. */
  applicationId?: string | null;
};

export const defaultDsaQuestionBrowserUrlState: DsaQuestionBrowserUrlState = {
  search: "",
  company: "all",
  difficulty: "all",
  topics: [],
  source: "all",
  progress: "all",
  page: 1,
  pageSize: 25,
};

type SearchParamsSource = string | { toString(): string };

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const difficultyValues = new Set<DsaQuestionBrowserDifficulty>(["all", "easy", "medium", "hard"]);
const progressValues = new Set<DsaQuestionBrowserProgress>(["all", "not_started", "attempted", "solved", "review", "bookmarked"]);
const sourceValues = new Set<DSAQuestionSourceType>(["leetcode", "leetcode-ca", "other"]);
const pageSizeValues = new Set<number>(dsaQuestionBrowserPageSizes);

function paramsFrom(source: SearchParamsSource) {
  return new URLSearchParams(typeof source === "string" ? source : source.toString());
}

function singleValue(params: URLSearchParams, key: string) {
  const values = params.getAll(key);
  return values.length === 1 ? values[0] : null;
}

function unique<T>(values: readonly T[]) {
  return [...new Set(values)];
}

function recordFrom(value: unknown): Record<string, unknown> {
  return value !== null && typeof value === "object" && !Array.isArray(value) ? value as Record<string, unknown> : {};
}

function positiveSafeInteger(value: unknown, fallback: number) {
  return typeof value === "number" && Number.isSafeInteger(value) && value >= 1 ? value : fallback;
}

function parsePositiveSafeInteger(value: string | null, fallback: number) {
  if (!value || !/^[0-9]+$/.test(value)) return fallback;
  const parsed = Number(value);
  return Number.isSafeInteger(parsed) && parsed >= 1 ? parsed : fallback;
}

export function dsaQuestionBrowserTopicSlug(value: string) {
  return value.toLowerCase().replace(/&/g, "and").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

export function parseDsaQuestionBrowserApplicationId(value: unknown) {
  if (typeof value !== "string") return null;
  const candidate = value.trim();
  return UUID_PATTERN.test(candidate) ? candidate.toLowerCase() : null;
}

export function createDsaQuestionBrowserUrlContext({
  questions,
  companies,
  fixedCompanySlug,
  signedIn,
  applicationId,
}: {
  questions: readonly DSAInterviewQuestion[];
  companies: readonly DSACompany[];
  fixedCompanySlug?: string;
  signedIn: boolean;
  applicationId?: string | null;
}): DsaQuestionBrowserUrlContext {
  const scopedQuestions = fixedCompanySlug
    ? questions.filter((question) => question.companies.some((association) => association.companySlug === fixedCompanySlug))
    : questions;
  return {
    companySlugs: unique(companies.map((company) => company.slug)),
    topicSlugs: unique(scopedQuestions.flatMap((question) => question.topics.map(dsaQuestionBrowserTopicSlug)).filter(Boolean)),
    sourceTypes: unique(scopedQuestions.flatMap((question) => question.sources.map((source) => source.type)).filter((source) => sourceValues.has(source))),
    fixedCompanySlug,
    signedIn,
    applicationId: parseDsaQuestionBrowserApplicationId(applicationId),
  };
}

function normalizedState(value: unknown, context: DsaQuestionBrowserUrlContext, trimSearch: boolean): DsaQuestionBrowserUrlState {
  const state = recordFrom(value);
  const companySlugs = new Set(context.companySlugs);
  const topicSlugs = new Set(context.topicSlugs);
  const allowedSources = new Set(context.sourceTypes.filter((source) => sourceValues.has(source)));
  const searchValue = typeof state.search === "string" ? state.search.slice(0, DSA_QUESTION_BROWSER_SEARCH_LIMIT) : "";
  const company = context.fixedCompanySlug
    ?? (typeof state.company === "string" && companySlugs.has(state.company) ? state.company : "all");
  const difficulty = typeof state.difficulty === "string" && difficultyValues.has(state.difficulty as DsaQuestionBrowserDifficulty)
    ? state.difficulty as DsaQuestionBrowserDifficulty
    : "all";
  const topics = Array.isArray(state.topics)
    ? unique(state.topics.filter((topic): topic is string => typeof topic === "string" && topicSlugs.has(topic)))
      .sort((left, right) => context.topicSlugs.indexOf(left) - context.topicSlugs.indexOf(right))
    : [];
  const source = typeof state.source === "string" && allowedSources.has(state.source as DSAQuestionSourceType)
    ? state.source as DSAQuestionSourceType
    : "all";
  const progress = context.signedIn && typeof state.progress === "string" && progressValues.has(state.progress as DsaQuestionBrowserProgress)
    ? state.progress as DsaQuestionBrowserProgress
    : "all";
  const pageSize = typeof state.pageSize === "number" && pageSizeValues.has(state.pageSize)
    ? state.pageSize as DsaQuestionBrowserPageSize
    : defaultDsaQuestionBrowserUrlState.pageSize;

  return {
    search: trimSearch ? searchValue.trim() : searchValue,
    company,
    difficulty,
    topics,
    source,
    progress,
    page: positiveSafeInteger(state.page, defaultDsaQuestionBrowserUrlState.page),
    pageSize,
  };
}

export function parseDsaQuestionBrowserUrlState(source: SearchParamsSource, context: DsaQuestionBrowserUrlContext) {
  const params = paramsFrom(source);
  const topics = singleValue(params, "topic");
  return normalizedState({
    search: singleValue(params, "q") ?? "",
    company: singleValue(params, "company") ?? "all",
    difficulty: singleValue(params, "difficulty") ?? "all",
    topics: topics ? topics.split(",").filter(Boolean) : [],
    source: singleValue(params, "source") ?? "all",
    progress: singleValue(params, "progress") ?? "all",
    page: parsePositiveSafeInteger(singleValue(params, "page"), defaultDsaQuestionBrowserUrlState.page),
    pageSize: parsePositiveSafeInteger(singleValue(params, "pageSize"), defaultDsaQuestionBrowserUrlState.pageSize),
  }, context, false);
}

export function canonicalizeDsaQuestionBrowserUrlState(state: unknown, context: DsaQuestionBrowserUrlContext) {
  return normalizedState(state, context, true);
}

export function clampDsaQuestionBrowserPage(state: DsaQuestionBrowserUrlState, resultCount: number) {
  const pageSize = pageSizeValues.has(state?.pageSize) ? state.pageSize : defaultDsaQuestionBrowserUrlState.pageSize;
  const safeResultCount = Number.isSafeInteger(resultCount) && resultCount >= 0 ? resultCount : 0;
  const pageCount = Math.max(1, Math.ceil(safeResultCount / pageSize));
  const page = Math.min(positiveSafeInteger(state?.page, defaultDsaQuestionBrowserUrlState.page), pageCount);
  return { ...state, pageSize, page };
}

export function serializeDsaQuestionBrowserUrlState(state: unknown, context: DsaQuestionBrowserUrlContext) {
  const canonical = normalizedState(state, context, false);
  const params = new URLSearchParams();
  if (canonical.search) params.set("q", canonical.search);
  if (!context.fixedCompanySlug && canonical.company !== "all") params.set("company", canonical.company);
  if (canonical.difficulty !== "all") params.set("difficulty", canonical.difficulty);
  if (canonical.topics.length) params.set("topic", canonical.topics.join(","));
  if (canonical.source !== "all") params.set("source", canonical.source);
  if (canonical.progress !== "all") params.set("progress", canonical.progress);
  if (canonical.page > 1) params.set("page", String(canonical.page));
  if (canonical.pageSize !== defaultDsaQuestionBrowserUrlState.pageSize) params.set("pageSize", String(canonical.pageSize));
  const applicationId = parseDsaQuestionBrowserApplicationId(context.applicationId);
  if (applicationId) params.set("application", applicationId);
  return params;
}

export function dsaQuestionBrowserHref(pathname: string, state: unknown, context: DsaQuestionBrowserUrlContext, hash = "") {
  const query = serializeDsaQuestionBrowserUrlState(state, context).toString();
  return `${pathname}${query ? `?${query}` : ""}${hash.startsWith("#") ? hash : ""}`;
}
