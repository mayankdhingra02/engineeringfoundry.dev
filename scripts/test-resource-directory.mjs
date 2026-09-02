import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { resourceAccessLevels, resourceCategories, resourceTypes } from "../data/resources/index.ts";
import {
  canonicalizeResourceDirectoryUrlState,
  defaultResourceDirectoryUrlState,
  parseResourceDirectoryUrlState,
  RESOURCE_DIRECTORY_SEARCH_LIMIT,
  resourceDirectoryHref,
  resourceSorts,
  resourceSources,
  serializeResourceDirectoryUrlState,
} from "../lib/resources/resource-directory-url-state.ts";

const queryFromHref = (href) => href.split("?")[1]?.split("#")[0] ?? "";

assert.deepEqual(parseResourceDirectoryUrlState(""), defaultResourceDirectoryUrlState);

const selected = {
  search: "distributed systems",
  category: resourceCategories[1],
  type: resourceTypes[1],
  access: resourceAccessLevels[0],
  source: resourceSources[1],
  sort: resourceSorts[1],
};
for (const category of resourceCategories) assert.equal(parseResourceDirectoryUrlState(`category=${encodeURIComponent(category)}`).category, category);
for (const type of resourceTypes) assert.equal(parseResourceDirectoryUrlState(`type=${encodeURIComponent(type)}`).type, type);
for (const access of resourceAccessLevels) assert.equal(parseResourceDirectoryUrlState(`access=${encodeURIComponent(access)}`).access, access);
for (const source of resourceSources) assert.equal(parseResourceDirectoryUrlState(`source=${encodeURIComponent(source)}`).source, source);
for (const sort of resourceSorts) assert.equal(parseResourceDirectoryUrlState(`sort=${encodeURIComponent(sort)}`).sort, sort);
const selectedHref = resourceDirectoryHref("/resources", selected, "utm_source=review", "#directory");
assert.ok(selectedHref.endsWith("#directory"), "Resource-directory navigation must preserve the current hash.");
assert.equal(new URLSearchParams(queryFromHref(selectedHref)).get("utm_source"), "review", "Resource-directory navigation must preserve unrelated public parameters.");
assert.deepEqual(parseResourceDirectoryUrlState(queryFromHref(selectedHref)), selected, "Every valid resource filter must round-trip through the production serializer.");

const invalid = parseResourceDirectoryUrlState("category=unknown&type=unknown&access=unknown&source=unknown&sort=unknown");
assert.deepEqual(invalid, defaultResourceDirectoryUrlState, "Invalid owned parameters must fail closed to canonical defaults.");
assert.equal(parseResourceDirectoryUrlState(`search=${"x".repeat(RESOURCE_DIRECTORY_SEARCH_LIMIT + 40)}`).search.length, RESOURCE_DIRECTORY_SEARCH_LIMIT, "Resource search state must remain bounded.");

const paddedSearch = parseResourceDirectoryUrlState("search=%20%20github%20%20");
assert.equal(canonicalizeResourceDirectoryUrlState(paddedSearch).search, "github", "Committed search state must trim redundant outer whitespace.");
assert.equal(resourceDirectoryHref("/resources", canonicalizeResourceDirectoryUrlState(parseResourceDirectoryUrlState("search=%20%20"))), "/resources", "Whitespace-only search state must canonicalize to the unfiltered directory URL.");

const canonicalDefaults = serializeResourceDirectoryUrlState(defaultResourceDirectoryUrlState, "utm_source=review&category=unknown&sort=unknown");
assert.equal(canonicalDefaults.toString(), "utm_source=review", "Default state must remove invalid owned values without deleting unrelated parameters.");

const stateA = parseResourceDirectoryUrlState(queryFromHref(resourceDirectoryHref("/resources", defaultResourceDirectoryUrlState)));
const stateB = parseResourceDirectoryUrlState(queryFromHref(selectedHref));
const stateARestored = parseResourceDirectoryUrlState(queryFromHref(resourceDirectoryHref("/resources", stateA)));
assert.deepEqual(stateARestored, stateA, "Resource-directory A→B→A history snapshots must be deterministic.");
assert.notDeepEqual(stateA, stateB);

const canonicalSelectedHref = resourceDirectoryHref("/resources", selected, queryFromHref(selectedHref), "#directory");
assert.equal(canonicalSelectedHref, selectedHref, "Serializing an already canonical URL must be an exact no-op.");

const component = readFileSync("features/resources/resource-directory.tsx", "utf8");
for (const marker of [
  "parseResourceDirectoryUrlState",
  "canonicalizeResourceDirectoryUrlState",
  "resourceDirectoryHref",
  'window.history.pushState(null, "", href)',
  'window.history.replaceState(null, "", href)',
  'mode: "push" | "replace"',
  'if (canonicalHref !== currentHref) window.history.replaceState(null, "", canonicalHref)',
  'if (href === currentHref) return',
  'updateFilter("search", event.target.value.slice(0, RESOURCE_DIRECTORY_SEARCH_LIMIT), "replace")',
  'onBlur={() => commitFilters(canonicalFilters, "replace")}',
  'onChange={(event) => updateFilter("category", event.target.value)}',
  'onClick={() => commitFilters(defaultResourceDirectoryUrlState, "push")}',
  'role="status" aria-live="polite" aria-atomic="true"',
  "Reset filters",
  "maxLength={RESOURCE_DIRECTORY_SEARCH_LIMIT}",
]) assert.ok(component.includes(marker), `Resource-directory URL/accessibility wiring is missing ${marker}.`);
assert.ok(!/useState\([^)]*searchParams|get\("(?:search|category|type|access|source|sort)"\)/.test(component), "Resource-directory controls must not snapshot URL state into local state.");
assert.ok(!/<[^>]+key=\{queryString\}/.test(component), "Resource-directory URL reconciliation must not remount the interactive subtree.");

// Focus retention, live-region announcements, and real Back/Forward traversal
// still require rendered browser validation; this test covers production URL
// logic and the source-level integration contract without claiming otherwise.
console.log("Resource-directory regression passed: production catalogs validate bounded, canonical, round-trippable URL state; source contracts cover push/replace wiring, reset, and live results. Rendered focus and announcements remain a browser-validation requirement.");
