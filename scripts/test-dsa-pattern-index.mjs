import { readFileSync } from "node:fs";
import { dsaPatterns } from "../data/dsa/index.ts";
import { dsaInterviewQuestionDatabase } from "../data/dsa/question-database.ts";
import { filterDsaQuestionsBySearch } from "../lib/dsa/question-search.ts";

const failures = [];
const read = (file) => readFileSync(file, "utf8");
const requireText = (source, text, message) => { if (!source.includes(text)) failures.push(message); };
const prohibit = (source, pattern, message) => { if (pattern.test(source)) failures.push(message); };

const route = read("app/dsa/[...segments]/page.tsx");
const styles = read("app/globals.css");
const browser = read("features/dsa/questions/question-browser.tsx");
const search = read("lib/global-search.ts");

if (!Array.isArray(dsaPatterns) || dsaPatterns.length === 0) failures.push("Curated DSA pattern data is empty.");
for (const pattern of dsaPatterns) {
  if (!pattern.id || !pattern.slug || !pattern.name || !pattern.summary || !pattern.recognitionSignals?.length || !pattern.commonMistakes?.length) {
    failures.push(`Curated pattern ${pattern.slug ?? pattern.id ?? "(unknown)"} is missing index content.`);
  }
}

requireText(route, 'filterDsaQuestionsBySearch(dsaInterviewQuestionDatabase, pattern.slug).length', "Pattern card counts do not use the production browser search helper and public question collection.");
requireText(route, 'className="pattern-grid"', "Pattern index does not use the responsive pattern-card grid.");
requireText(route, '<h3 className="pattern-grid-title">{pattern.name}</h3>', "Topic pattern cards do not preserve semantic title hierarchy.");
requireText(styles, ".pattern-grid h3.pattern-grid-title { margin: 0; font-size: 13px; font-weight: 700; }", "Topic pattern-card headings do not preserve their compact title styling.");
requireText(route, 'dsaPatterns.map((pattern) =>', "Pattern index is not derived from curated pattern data.");
for (const field of ["pattern.id", "pattern.name", "pattern.summary", "pattern.recognitionSignals.map", "pattern.commonMistakes.map"]) {
  requireText(route, field, `Pattern index does not render ${field} from curated data.`);
}
requireText(route, 'href={`/dsa/questions?q=${encodeURIComponent(pattern.slug)}`}', "Pattern practice link does not safely encode the canonical pattern slug.");
requireText(route, "No matching questions cataloged yet.", "Pattern index must be honest when no active question matches a pattern.");
prohibit(route, /Detailed guide coming soon|dsaPatternIndex/, "Pattern index still contains the hard-coded coming-soon listing.");
requireText(browser, 'search: params.get("q") ?? ""', "Question browser does not read the linked q filter.");
requireText(browser, "matchesDsaQuestionSearch(question, deferredSearch, companyNames)", "Question browser does not use the production search helper.");
// These source contracts guard the no-remount architecture. Active-element and
// browser-history behavior still require a real DOM/browser integration test.
requireText(browser, "const filters = useMemo(() => parseFilters(new URLSearchParams(queryString)), [queryString]);", "Question browser controls are not derived from the current URL for direct loads and Back/Forward navigation.");
requireText(browser, 'window.history.replaceState(null, "", query ? `${pathname}?${query}` : pathname)', "Question browser filter changes do not update the URL through the Next.js-compatible native history API.");
requireText(browser, "filters={filters}", "Question browser does not reconcile every control and result set from URL-derived filters.");
prohibit(browser, /<BrowserCore\s+key=/, "Question browser still remounts its interactive subtree when the query string changes, risking input-focus loss.");
requireText(search, 'href: `/dsa/questions?q=${encodeURIComponent(pattern.slug)}`', "Global search pattern results do not use the canonical pattern query.");
for (const marker of ["Reviewed report directory", "Private local reflection", "Reviewed reports · private local reflection"]) {
  requireText(search, marker, `Global search does not accurately describe the live interview-experience surface: ${marker}.`);
}
prohibit(search, /Future reviewed directory|Private writing tool/, "Global search still describes the live interview-experience directory as future or private-only.");

for (const pattern of dsaPatterns) {
  const slugResults = filterDsaQuestionsBySearch(dsaInterviewQuestionDatabase, pattern.slug);
  const nameResults = filterDsaQuestionsBySearch(dsaInterviewQuestionDatabase, pattern.name);
  if (slugResults.map((question) => question.id).join("|") !== nameResults.map((question) => question.id).join("|")) {
    failures.push(`${pattern.name} display-name and canonical-slug queries disagree.`);
  }
  if (slugResults.length === 0 && !route.includes("No matching questions cataloged yet.")) {
    failures.push(`${pattern.name} has no production results but the index lacks an honest unavailable state.`);
  }
}

if (failures.length) {
  console.error(`DSA pattern-index regression failed:\n- ${failures.join("\n- ")}`);
  process.exit(1);
}

console.log(`DSA pattern-index regression passed: ${dsaPatterns.length} curated patterns use the production search helper for exact counts and canonical links; structural contracts require URL-derived controls and prohibit keyed browser remounts.`);
