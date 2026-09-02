import { resourceAccessLevels, resourceCategories, resourceTypes } from "@/data/resources";

export const RESOURCE_DIRECTORY_SEARCH_LIMIT = 160;
export const resourceSources = ["Internal", "External"] as const;
export const resourceSorts = ["Category", "Alphabetical", "Recently verified"] as const;

const ownedKeys = ["search", "category", "type", "access", "source", "sort"] as const;
const categoryValues = new Set<string>(resourceCategories);
const typeValues = new Set<string>(resourceTypes);
const accessValues = new Set<string>(resourceAccessLevels);
const sourceValues = new Set<string>(resourceSources);
const sortValues = new Set<string>(resourceSorts);

type SearchParamsSource = string | { toString(): string };

export type ResourceDirectoryUrlState = {
  search: string;
  category: string;
  type: string;
  access: string;
  source: string;
  sort: string;
};

export const defaultResourceDirectoryUrlState: ResourceDirectoryUrlState = {
  search: "",
  category: "All categories",
  type: "All types",
  access: "All access",
  source: "All sources",
  sort: "Category",
};

function paramsFrom(source: SearchParamsSource) {
  return new URLSearchParams(typeof source === "string" ? source : source.toString());
}

function allowedOrDefault(value: string | null, allowed: ReadonlySet<string>, fallback: string) {
  return value && allowed.has(value) ? value : fallback;
}

export function parseResourceDirectoryUrlState(source: SearchParamsSource): ResourceDirectoryUrlState {
  const params = paramsFrom(source);
  return {
    search: (params.get("search") ?? "").slice(0, RESOURCE_DIRECTORY_SEARCH_LIMIT),
    category: allowedOrDefault(params.get("category"), categoryValues, defaultResourceDirectoryUrlState.category),
    type: allowedOrDefault(params.get("type"), typeValues, defaultResourceDirectoryUrlState.type),
    access: allowedOrDefault(params.get("access"), accessValues, defaultResourceDirectoryUrlState.access),
    source: allowedOrDefault(params.get("source"), sourceValues, defaultResourceDirectoryUrlState.source),
    sort: allowedOrDefault(params.get("sort"), sortValues, defaultResourceDirectoryUrlState.sort),
  };
}

export function canonicalizeResourceDirectoryUrlState(state: ResourceDirectoryUrlState): ResourceDirectoryUrlState {
  return { ...state, search: state.search.trim() };
}

export function serializeResourceDirectoryUrlState(state: ResourceDirectoryUrlState, base: SearchParamsSource = "") {
  const params = paramsFrom(base);
  for (const key of ownedKeys) params.delete(key);

  const search = state.search.slice(0, RESOURCE_DIRECTORY_SEARCH_LIMIT);
  if (search) params.set("search", search);
  if (categoryValues.has(state.category)) params.set("category", state.category);
  if (typeValues.has(state.type)) params.set("type", state.type);
  if (accessValues.has(state.access)) params.set("access", state.access);
  if (sourceValues.has(state.source)) params.set("source", state.source);
  if (state.sort !== defaultResourceDirectoryUrlState.sort && sortValues.has(state.sort)) params.set("sort", state.sort);
  return params;
}

export function resourceDirectoryHref(pathname: string, state: ResourceDirectoryUrlState, base: SearchParamsSource = "", hash = "") {
  const query = serializeResourceDirectoryUrlState(state, base).toString();
  return `${pathname}${query ? `?${query}` : ""}${hash.startsWith("#") ? hash : ""}`;
}
