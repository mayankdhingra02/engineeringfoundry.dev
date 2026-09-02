export const GLOBAL_SEARCH_INITIAL_RESULT_LIMIT = 8;

export function visibleGlobalSearchResults<T>(matches: readonly T[], expanded: boolean): readonly T[] {
  return expanded ? matches : matches.slice(0, GLOBAL_SEARCH_INITIAL_RESULT_LIMIT);
}
