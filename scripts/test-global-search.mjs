import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { GLOBAL_SEARCH_INITIAL_RESULT_LIMIT, visibleGlobalSearchResults } from "../lib/global-search-results.ts";

const matches = Array.from({ length: 13 }, (_, index) => ({ id: index + 1 }));
assert.equal(GLOBAL_SEARCH_INITIAL_RESULT_LIMIT, 8, "the initial result window must remain intentionally bounded");
assert.deepEqual(visibleGlobalSearchResults(matches, false), matches.slice(0, 8), "collapsed search must show the initial result window");
assert.deepEqual(visibleGlobalSearchResults(matches, true), matches, "expanded search must make every valid match reachable");
assert.deepEqual(matches.map((item) => item.id), Array.from({ length: 13 }, (_, index) => index + 1), "windowing must not mutate or reorder matches");

const component = readFileSync(new URL("../components/global-search.tsx", import.meta.url), "utf8");
const styles = readFileSync(new URL("../app/globals.css", import.meta.url), "utf8");
assert.match(component, /aria-controls="global-search-results" aria-expanded=\{expandedResults\}/, "the recovery control must expose its expanded state and result relationship");
assert.match(component, /Show all.*matches\.length.*results/, "query matches must offer an explicit show-all action");
assert.match(component, /Show all.*matches\.length.*suggestions/, "suggested results must not silently hide the final suggestion");
assert.match(component, /setQuery\(e\.target\.value\); setExpandedResults\(false\)/, "a new query must restore the bounded initial result window");
assert.match(styles, /\.search-results-toggle \{[^}]*min-height: 44px;/, "the recovery control must retain a touch-sized target");

console.log("Global search recovery regression passed: every match is reachable through an accessible in-dialog control.");
