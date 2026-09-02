import {
  activeBehavioralQuestions,
  behavioralCategories,
  behavioralScopes,
  behavioralStoryTypes,
} from "@/data/behavioral";

const ownedKeys = ["search", "category", "story", "scope", "question"] as const;
const categoryNames = new Set(behavioralCategories.map((item) => item.name));
const storyTypeIds = new Set(behavioralStoryTypes.map((item) => item.id));
const scopeNames = new Set<string>(behavioralScopes);
const questionSlugs = new Set(activeBehavioralQuestions.map((item) => item.slug));
const defaultQuestionSlug = activeBehavioralQuestions[0].slug;

type SearchParamsSource = string | { toString(): string };

export type BehavioralPracticeUrlState = {
  query: string;
  category: string;
  storyType: string;
  scope: string;
  questionSlug: string;
};

function paramsFrom(source: SearchParamsSource) {
  return new URLSearchParams(typeof source === "string" ? source : source.toString());
}

export function parseBehavioralPracticeUrlState(source: SearchParamsSource): BehavioralPracticeUrlState {
  const params = paramsFrom(source);
  const category = params.get("category");
  const storyType = params.get("story");
  const scope = params.get("scope");
  const questionSlug = params.get("question");
  return {
    query: (params.get("search") ?? "").slice(0, 160),
    category: category && categoryNames.has(category) ? category : "All",
    storyType: storyType && storyTypeIds.has(storyType) ? storyType : "All",
    scope: scope && scopeNames.has(scope) ? scope : "All",
    questionSlug: questionSlug && questionSlugs.has(questionSlug) ? questionSlug : defaultQuestionSlug,
  };
}

export function serializeBehavioralPracticeUrlState(state: BehavioralPracticeUrlState, base: SearchParamsSource = "") {
  const params = paramsFrom(base);
  for (const key of ownedKeys) params.delete(key);
  if (state.query) params.set("search", state.query.slice(0, 160));
  if (state.category !== "All" && categoryNames.has(state.category)) params.set("category", state.category);
  if (state.storyType !== "All" && storyTypeIds.has(state.storyType)) params.set("story", state.storyType);
  if (state.scope !== "All" && scopeNames.has(state.scope)) params.set("scope", state.scope);
  if (state.questionSlug !== defaultQuestionSlug && questionSlugs.has(state.questionSlug)) params.set("question", state.questionSlug);
  return params;
}

export function behavioralPracticeHref(pathname: string, state: BehavioralPracticeUrlState, base: SearchParamsSource = "", hash = "") {
  const query = serializeBehavioralPracticeUrlState(state, base).toString();
  return `${pathname}${query ? `?${query}` : ""}${hash.startsWith("#") ? hash : ""}`;
}
