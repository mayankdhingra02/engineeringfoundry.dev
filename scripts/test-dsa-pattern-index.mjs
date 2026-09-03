import { readFileSync } from "node:fs";
import { dsaPatterns } from "../data/dsa/index.ts";
import { dsaCompanies } from "../data/dsa/interview-prep.ts";
import { dsaInterviewQuestionDatabase } from "../data/dsa/question-database.ts";
import {
  DSA_QUESTION_BROWSER_SEARCH_LIMIT,
  canonicalizeDsaQuestionBrowserUrlState,
  clampDsaQuestionBrowserPage,
  createDsaQuestionBrowserUrlContext,
  defaultDsaQuestionBrowserUrlState,
  dsaQuestionBrowserHref,
  dsaQuestionBrowserTopicSlug,
  parseDsaQuestionBrowserApplicationId,
  parseDsaQuestionBrowserUrlState,
  serializeDsaQuestionBrowserUrlState,
} from "../lib/dsa/question-browser-url-state.ts";
import { filterDsaQuestionsBySearch } from "../lib/dsa/question-search.ts";

const failures = [];
const read = (file) => readFileSync(file, "utf8");
const requireText = (source, text, message) => { if (!source.includes(text)) failures.push(message); };
const prohibit = (source, pattern, message) => { if (pattern.test(source)) failures.push(message); };

const route = read("app/dsa/[...segments]/page.tsx");
const styles = read("app/globals.css");
const browser = read("features/dsa/questions/question-browser.tsx");
const questionBrowserUrlState = read("lib/dsa/question-browser-url-state.ts");
const dsaQueries = read("lib/dsa/queries.ts");
const search = read("lib/global-search.ts");

const trustedApplicationId = "11111111-1111-4111-8111-111111111111";
const otherApplicationId = "22222222-2222-4222-8222-222222222222";
const signedOutContext = createDsaQuestionBrowserUrlContext({
  questions: dsaInterviewQuestionDatabase,
  companies: dsaCompanies,
  signedIn: false,
});
const signedInContext = createDsaQuestionBrowserUrlContext({
  questions: dsaInterviewQuestionDatabase,
  companies: dsaCompanies,
  signedIn: true,
  applicationId: trustedApplicationId.toUpperCase(),
});
const [firstTopic, secondTopic] = signedInContext.topicSlugs;
const firstCompany = signedInContext.companySlugs[0];
const firstSource = signedInContext.sourceTypes[0];

if (!firstTopic || !secondTopic || !firstCompany || !firstSource) failures.push("Production question-browser catalogs do not expose enough real values for URL-state regression coverage.");

const defaultState = parseDsaQuestionBrowserUrlState("", signedOutContext);
if (JSON.stringify(defaultState) !== JSON.stringify(defaultDsaQuestionBrowserUrlState)) failures.push("Missing query parameters do not resolve to the canonical question-browser defaults.");

const validState = parseDsaQuestionBrowserUrlState(new URLSearchParams({
  q: " Two Sum ",
  company: firstCompany,
  difficulty: "medium",
  topic: `${secondTopic},${firstTopic},${secondTopic}`,
  source: firstSource,
  progress: "review",
  page: "2",
  pageSize: "50",
  application: otherApplicationId,
  private_note: "must-not-survive",
}), signedInContext);
if (validState.search !== " Two Sum " || validState.company !== firstCompany || validState.difficulty !== "medium" || validState.source !== firstSource || validState.progress !== "review" || validState.page !== 2 || validState.pageSize !== 50) failures.push("A valid production-catalog question-browser URL does not round-trip through the parser.");
if (JSON.stringify(validState.topics) !== JSON.stringify([firstTopic, secondTopic])) failures.push("Topic parsing does not deduplicate and restore production catalog order.");
const canonicalValidState = canonicalizeDsaQuestionBrowserUrlState(validState, signedInContext);
if (canonicalValidState.search !== "Two Sum") failures.push("Question-browser canonicalization does not trim search text.");

const serializedValid = serializeDsaQuestionBrowserUrlState(canonicalValidState, signedInContext);
if (serializedValid.get("application") !== trustedApplicationId || serializedValid.get("private_note") !== null) failures.push("Serialization does not replace raw/private query state with only the server-resolved application ID.");
if (serializedValid.getAll("topic").length !== 1 || serializedValid.get("topic") !== `${firstTopic},${secondTopic}`) failures.push("Serialization does not emit one deterministic topic parameter.");
const ownedKeys = new Set(["q", "company", "difficulty", "topic", "source", "progress", "page", "pageSize", "application"]);
if ([...serializedValid.keys()].some((key) => !ownedKeys.has(key))) failures.push("Question-browser serialization emits a foreign or private query key.");
const validHref = dsaQuestionBrowserHref("/dsa/questions", canonicalValidState, signedInContext, "#results");
if (!validHref.endsWith("#results") || validHref.includes(otherApplicationId) || validHref.includes("private_note")) failures.push("Question-browser hrefs do not preserve fragments while excluding raw or foreign state.");
if (validHref !== dsaQuestionBrowserHref("/dsa/questions", canonicalValidState, signedInContext, "#results")) failures.push("Question-browser href serialization is not deterministic.");

const duplicateScalarCases = [
  ["q=one&q=two", "search", ""],
  [`company=${firstCompany}&company=${firstCompany}`, "company", "all"],
  ["difficulty=easy&difficulty=hard", "difficulty", "all"],
  [`topic=${firstTopic}&topic=${secondTopic}`, "topics", []],
  [`source=${firstSource}&source=${firstSource}`, "source", "all"],
  ["progress=review&progress=solved", "progress", "all"],
  ["page=2&page=3", "page", 1],
  ["pageSize=50&pageSize=100", "pageSize", 25],
];
for (const [query, field, expected] of duplicateScalarCases) {
  const actual = parseDsaQuestionBrowserUrlState(query, signedInContext)[field];
  if (JSON.stringify(actual) !== JSON.stringify(expected)) failures.push(`Duplicate ${field} values do not fail closed.`);
}

const invalidState = parseDsaQuestionBrowserUrlState("q=value&q=duplicate&company=unknown&difficulty=impossible&topic=unknown&source=private&progress=complete&page=1.5&pageSize=26", signedInContext);
if (invalidState.search || invalidState.company !== "all" || invalidState.difficulty !== "all" || invalidState.topics.length || invalidState.source !== "all" || invalidState.progress !== "all" || invalidState.page !== 1 || invalidState.pageSize !== 25) failures.push("Unknown or malformed question-browser URL values do not fail closed.");

for (const invalidPage of ["0", "-1", "1.5", "1e2", "Infinity", "9007199254740992"]) {
  if (parseDsaQuestionBrowserUrlState(`page=${encodeURIComponent(invalidPage)}`, signedInContext).page !== 1) failures.push(`Invalid page value ${invalidPage} does not fail closed.`);
}
for (const pageSize of [25, 50, 100]) {
  if (parseDsaQuestionBrowserUrlState(`pageSize=${pageSize}`, signedInContext).pageSize !== pageSize) failures.push(`Supported page size ${pageSize} does not survive parsing.`);
}
for (const difficulty of ["easy", "medium", "hard"]) {
  if (parseDsaQuestionBrowserUrlState(`difficulty=${difficulty}`, signedInContext).difficulty !== difficulty) failures.push(`Supported difficulty ${difficulty} does not survive parsing.`);
}
for (const source of signedInContext.sourceTypes) {
  if (parseDsaQuestionBrowserUrlState(`source=${source}`, signedInContext).source !== source) failures.push(`Production source type ${source} does not survive parsing.`);
}
for (const progress of ["not_started", "attempted", "solved", "review", "bookmarked"]) {
  if (parseDsaQuestionBrowserUrlState(`progress=${progress}`, signedInContext).progress !== progress) failures.push(`Signed-in progress filter ${progress} does not survive parsing.`);
  if (parseDsaQuestionBrowserUrlState(`progress=${progress}`, signedOutContext).progress !== "all") failures.push(`Signed-out progress filter ${progress} can still create a hidden false-empty state.`);
}

const longSearch = parseDsaQuestionBrowserUrlState(`q=${"x".repeat(DSA_QUESTION_BROWSER_SEARCH_LIMIT + 20)}`, signedOutContext);
if (longSearch.search.length !== DSA_QUESTION_BROWSER_SEARCH_LIMIT) failures.push("Question-browser search parsing does not enforce its exact public URL bound.");
if (canonicalizeDsaQuestionBrowserUrlState({ ...defaultDsaQuestionBrowserUrlState, search: "  arrays  " }, signedOutContext).search !== "arrays") failures.push("Question-browser search canonicalization does not remove boundary whitespace.");

const fixedCompanySlug = "amazon";
const fixedContext = createDsaQuestionBrowserUrlContext({
  questions: dsaInterviewQuestionDatabase,
  companies: dsaCompanies,
  fixedCompanySlug,
  signedIn: false,
});
const fixedState = parseDsaQuestionBrowserUrlState("company=google&progress=solved&topic=not-a-topic", fixedContext);
if (fixedState.company !== fixedCompanySlug || fixedState.progress !== "all" || fixedState.topics.length) failures.push("Fixed-company parsing can be overridden or retain a hidden invalid filter.");
if (serializeDsaQuestionBrowserUrlState(fixedState, fixedContext).has("company")) failures.push("Fixed-company serialization emits a redundant or conflicting company parameter.");
const fixedQuestionTopics = [...new Set(dsaInterviewQuestionDatabase
  .filter((question) => question.companies.some((association) => association.companySlug === fixedCompanySlug))
  .flatMap((question) => question.topics.map(dsaQuestionBrowserTopicSlug))
  .filter(Boolean))];
if (JSON.stringify(fixedContext.topicSlugs) !== JSON.stringify(fixedQuestionTopics)) failures.push("Fixed-company context topics are not derived from its scoped production questions.");
const fixedQuestionSources = [...new Set(dsaInterviewQuestionDatabase
  .filter((question) => question.companies.some((association) => association.companySlug === fixedCompanySlug))
  .flatMap((question) => question.sources.map((source) => source.type)))];
if (JSON.stringify(fixedContext.sourceTypes) !== JSON.stringify(fixedQuestionSources)) failures.push("Fixed-company context sources are not derived from its scoped production questions.");

if (parseDsaQuestionBrowserApplicationId(trustedApplicationId.toUpperCase()) !== trustedApplicationId) failures.push("Canonical application UUID parsing does not normalize a valid UUID.");
for (const invalidApplicationId of [undefined, null, "", "not-a-uuid", "00000000-0000-0000-0000-000000000000", [trustedApplicationId], { id: trustedApplicationId }]) {
  if (parseDsaQuestionBrowserApplicationId(invalidApplicationId) !== null) failures.push("Malformed application context can reach the owner-scoped query.");
}
const invalidApplicationContext = createDsaQuestionBrowserUrlContext({ questions: dsaInterviewQuestionDatabase, companies: dsaCompanies, signedIn: true, applicationId: "not-a-uuid" });
if (dsaQuestionBrowserHref("/dsa/questions", defaultDsaQuestionBrowserUrlState, invalidApplicationContext).includes("application=")) failures.push("An invalid application ID is serialized into a public browser URL.");

const pageState = { ...defaultDsaQuestionBrowserUrlState, page: 99, pageSize: 25 };
for (const [count, expectedPage] of [[0, 1], [25, 1], [26, 2], [50, 2], [51, 3]]) {
  if (clampDsaQuestionBrowserPage(pageState, count).page !== expectedPage) failures.push(`Result count ${count} does not clamp page 99 to ${expectedPage}.`);
}
if (clampDsaQuestionBrowserPage(pageState, -1).page !== 1 || clampDsaQuestionBrowserPage(pageState, Number.NaN).page !== 1) failures.push("Invalid result counts do not fail closed to the first page.");

const runtimeInvalidSerialization = serializeDsaQuestionBrowserUrlState({
  search: 42,
  company: "unknown",
  difficulty: "Impossible",
  topics: ["unknown", 42],
  source: "private",
  progress: "solved",
  page: Number.POSITIVE_INFINITY,
  pageSize: 1,
  token: "must-not-survive",
}, signedOutContext);
if (runtimeInvalidSerialization.toString() !== "") failures.push("Runtime-invalid state emits unsupported, hidden, or foreign question-browser URL fields.");

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
requireText(browser, "parseDsaQuestionBrowserUrlState(queryString, context)", "Question browser does not derive controls from the production URL-state parser.");
requireText(browser, "matchesDsaQuestionSearch(question, deferredSearch, companyNames)", "Question browser does not use the production search helper.");
// These source contracts guard the no-remount architecture. Active-element and
// browser-history behavior still require a real DOM/browser integration test.
requireText(browser, "canonicalizeDsaQuestionBrowserUrlState(filters, context)", "Question browser does not canonicalize parsed URL state.");
requireText(browser, "clampDsaQuestionBrowserPage(filters, filtered.length)", "Question browser does not replace an out-of-range result page with its bounded page.");
requireText(browser, "if (deferredSearch !== filters.search) return;", "Question browser can overwrite a restored page using stale deferred search results.");
requireText(browser, 'const searchIsActive = document.activeElement?.id === "dsa-question-browser-search";', "Guarded canonicalization does not preserve active search typing.");
requireText(browser, 'if (href !== currentHref) window.history.replaceState(null, "", href);', "Direct or malformed URL state is not repaired with replacement history.");
requireText(browser, 'onChange={(event) => commit({ search: event.target.value }, true, "search")}', "Question-browser search typing does not use replacement history.");
requireText(browser, 'onBlur={() => commit({ search: filters.search.trim() }, false, "replace")}', "Question-browser search does not canonicalize on blur.");
requireText(browser, 'intent: BrowserHistoryIntent = "push"', "Question-browser discrete controls do not default to push history.");
requireText(browser, 'onFiltersChange?.(next, "push");', "Question-browser reset does not create a traversable history entry.");
requireText(browser, 'if (intent === "push") window.history.pushState(null, "", href);', "Discrete question-browser changes do not create traversable history entries.");
requireText(browser, 'else window.history.replaceState(null, "", href);', "Question-browser typing and guarded canonicalization do not replace the current history entry.");
requireText(browser, "if (href === currentHref) return;", "Question-browser history updates do not avoid duplicate no-op entries.");
requireText(browser, "filters={filters}", "Question browser does not reconcile every control and result set from URL-derived filters.");
for (const marker of [
  'window.addEventListener("popstate", handlePopState);',
  "if (!previousFocus || previousFocus.isConnected) return;",
  "activeElement !== document.body && activeElement.isConnected",
  'document.getElementById("dsa-question-browser-results")?.focus();',
  'window.removeEventListener("popstate", handlePopState);',
]) requireText(browser, marker, `Question-browser history focus recovery is missing its source-level guard: ${marker}`);
prohibit(browser, /<BrowserCore\s+key=/, "Question browser still remounts its interactive subtree when the query string changes, risking input-focus loss.");
prohibit(browser, /searchParams\.get\(["']application["']\)/, "Question browser still preserves a raw, unowned application query value.");
prohibit(browser, /\btrack\s*\(/, "Question-browser history restoration emits navigation-only analytics.");
requireText(questionBrowserUrlState, "const values = params.getAll(key);", "Production URL parsing does not reject duplicate scalar keys.");
requireText(questionBrowserUrlState, "const applicationId = parseDsaQuestionBrowserApplicationId(context.applicationId);", "Serialization does not restrict application context to the canonical server-resolved ID.");
const applicationValidationIndex = dsaQueries.indexOf("const canonicalApplicationId = parseDsaQuestionBrowserApplicationId(applicationId);");
const accountAvailabilityIndex = dsaQueries.indexOf("const accountPlatformAvailable = isAccountPlatformAvailable();");
const applicationQueryIndex = dsaQueries.indexOf('.eq("id", canonicalApplicationId)');
if (applicationValidationIndex < 0 || applicationValidationIndex > accountAvailabilityIndex || applicationQueryIndex < accountAvailabilityIndex || applicationQueryIndex < applicationValidationIndex) failures.push("DSA workspace queries do not validate application context before account work and the owner-scoped query.");
prohibit(dsaQueries, /\.eq\("id", applicationId\)/, "Malformed raw application context can still reach the DSA application query.");
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

console.log(`DSA pattern-index regression passed: ${dsaPatterns.length} curated patterns use the production search helper; executable production URL-state contracts cover catalogs, hidden signed-out state, fixed-company and owner-resolved application context, bounds, and deterministic serialization. Source contracts cover history and focus integration without claiming rendered browser automation.`);
