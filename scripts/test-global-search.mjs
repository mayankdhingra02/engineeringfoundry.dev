import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dsaCurriculumPages } from "../data/dsa/curriculum.ts";
import { dsaLanguages } from "../data/dsa/languages.ts";
import { dsaRoadmaps } from "../data/dsa/roadmaps.ts";
import { systemDesignLessons } from "../data/system-design/curriculum.ts";
import {
  GLOBAL_SEARCH_INITIAL_RESULT_LIMIT,
  GLOBAL_SEARCH_RESULT_BATCH_SIZE,
  globalSearchItems,
  matchingGlobalSearchItems,
  nextGlobalSearchResultLimit,
  normalizeGlobalSearchQuery,
  visibleGlobalSearchResults,
} from "../lib/global-search.ts";

const matches = Array.from({ length: 565 }, (_, index) => ({ id: index + 1 }));
assert.equal(GLOBAL_SEARCH_INITIAL_RESULT_LIMIT, 8, "the initial result window must remain intentionally bounded");
assert.equal(GLOBAL_SEARCH_RESULT_BATCH_SIZE, 50, "broad queries must expand in bounded batches");
let visibleLimit = GLOBAL_SEARCH_INITIAL_RESULT_LIMIT;
assert.deepEqual(visibleGlobalSearchResults(matches, visibleLimit), matches.slice(0, 8), "collapsed search must show the initial result window");
while (visibleLimit < matches.length) {
  const previousLimit = visibleLimit;
  visibleLimit = nextGlobalSearchResultLimit(visibleLimit, matches.length);
  assert.ok(visibleLimit > previousLimit && visibleLimit - previousLimit <= GLOBAL_SEARCH_RESULT_BATCH_SIZE, "each recovery step must make bounded forward progress");
}
assert.deepEqual(visibleGlobalSearchResults(matches, visibleLimit), matches, "repeated recovery steps must make every valid match reachable");
assert.equal(nextGlobalSearchResultLimit(visibleLimit, matches.length), GLOBAL_SEARCH_INITIAL_RESULT_LIMIT, "the completed result set must collapse to the initial window");
assert.deepEqual(matches.map((item) => item.id), Array.from({ length: 565 }, (_, index) => index + 1), "windowing must not mutate or reorder matches");

assert.equal(normalizeGlobalSearchQuery("  System   DESIGN \n"), "system design", "queries must normalize surrounding whitespace, internal whitespace, and case consistently");
assert.deepEqual(matchingGlobalSearchItems("  system design  "), matchingGlobalSearchItems("system design"), "surrounding whitespace must not create a false empty state");

const indexedHrefs = new Set(globalSearchItems.map((item) => item.href));
for (const page of dsaCurriculumPages.filter((item) => item.status !== "published")) assert.ok(!indexedHrefs.has(page.slug), `unpublished DSA page leaked into search: ${page.slug}`);
for (const language of dsaLanguages.filter((item) => item.status !== "published")) assert.ok(!indexedHrefs.has(`/dsa/languages/${language.slug}`), `unpublished DSA language leaked into search: ${language.slug}`);
for (const roadmap of dsaRoadmaps.filter((item) => item.status !== "published")) assert.ok(!indexedHrefs.has(`/dsa/roadmaps/${roadmap.roleSlug}/${roadmap.durationDays}-day`), `unpublished DSA roadmap leaked into search: ${roadmap.roleSlug}/${roadmap.durationDays}`);
for (const lesson of systemDesignLessons.filter((item) => item.status !== "published")) assert.ok(!indexedHrefs.has(lesson.slug), `unpublished System Design lesson leaked into search: ${lesson.slug}`);
assert.ok(matchingGlobalSearchItems("feedback").some((item) => item.href === "/feedback" && item.title === "Private website feedback" && item.type === "Support"), "private feedback must have a precise searchable public handoff");

const component = readFileSync(new URL("../components/global-search.tsx", import.meta.url), "utf8");
const styles = readFileSync(new URL("../app/globals.css", import.meta.url), "utf8");
assert.match(component, /aria-controls="global-search-results" aria-expanded=\{results\.length > GLOBAL_SEARCH_INITIAL_RESULT_LIMIT\}/, "the recovery control must expose its expanded state and result relationship");
assert.match(component, /nextGlobalSearchResultLimit\(current, matches\.length\)/, "query matches must expand through the production batch helper");
assert.match(component, /Show first.*GLOBAL_SEARCH_INITIAL_RESULT_LIMIT.*resultNoun/, "completed result and suggestion sets must offer a precise collapse action");
assert.match(component, /setQuery\(e\.target\.value\); setVisibleResultLimit\(GLOBAL_SEARCH_INITIAL_RESULT_LIMIT\)/, "a new query must restore the bounded initial result window");
assert.match(styles, /\.search-results-toggle \{[^}]*min-height: 44px;/, "the recovery control must retain a touch-sized target");

console.log(`Global search recovery regression passed: ${globalSearchItems.length} published entries use normalized queries and bounded progressive recovery.`);
