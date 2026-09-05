import assert from "node:assert/strict";
import fs from "node:fs";
import {
  lowLevelDesignFramework,
  lowLevelDesignInterviewTimeVersion,
  lowLevelDesignLessons,
  lowLevelDesignLevels,
  lowLevelDesignPractice,
  lowLevelDesignRubric,
} from "../data/low-level-design/index.ts";
import {
  buildLowLevelDesignPlaybookHref,
  buildLowLevelDesignPracticeHref,
  normalizeLowLevelDesignLevel,
  parseLowLevelDesignPracticeContext,
} from "../lib/low-level-design/practice-url-state.ts";
import { getLowLevelDesignMockPlanSlug } from "../data/mock-interviews/low-level-design-handoffs.ts";
import { parseMockInterviewUrlState } from "../lib/mock-interviews/url-state.ts";
import {
  buildLowLevelDesignLessonStaticParams,
  buildLowLevelDesignPracticeStaticParams,
  finitePublicRouteDefinitions,
  indexableFinitePublicRoutes,
} from "../lib/public-route-inventory.ts";

const source = fs.readFileSync("data/low-level-design/index.ts", "utf8");
const entryRoute = fs.readFileSync("app/low-level-design/page.tsx", "utf8");
const lessonRoute = fs.readFileSync("app/low-level-design/lessons/[slug]/page.tsx", "utf8");
const practiceRoute = fs.readFileSync("app/low-level-design/practice/[slug]/page.tsx", "utf8");
const practiceLibraryRoute = fs.readFileSync("app/low-level-design/practice/page.tsx", "utf8");
const rubricRoute = fs.readFileSync("app/low-level-design/rubric/page.tsx", "utf8");
const lessonView = fs.readFileSync("features/low-level-design/lesson-view.tsx", "utf8");
const practiceView = fs.readFileSync("features/low-level-design/practice-view.tsx", "utf8");
const css = fs.readFileSync("app/globals.css", "utf8");
const ownership = fs.readFileSync("docs/low-level-design-v1.md", "utf8");
const sitemap = fs.readFileSync("app/sitemap.ts", "utf8");
const search = fs.readFileSync("lib/global-search.ts", "utf8");
const companyData = fs.readFileSync("data/company-guides/v1.ts", "utf8");
const companyWorkspace = fs.readFileSync("features/company-guides/company-guide-workspace.tsx", "utf8");
const playbook = fs.readFileSync("lib/interview-playbook/round-execution.ts", "utf8");

const canonicalLevels = ["Entry", "Mid", "Senior", "Staff+"];
assert.deepEqual(lowLevelDesignLevels, canonicalLevels, "LLD must use Engineering Foundry's canonical level taxonomy");
assert.equal(lowLevelDesignLessons.length, 8, "LLD v1 must publish exactly eight core lessons");
assert.ok(lowLevelDesignPractice.length >= 6, "LLD v1 must publish at least six practice designs");

function unique(values, label) { assert.equal(new Set(values).size, values.length, `${label} must be unique`); }
function validLevels(values, label) { for (const level of values) assert.ok(canonicalLevels.includes(level), `${label} contains invalid level ${level}`); }
unique(lowLevelDesignLessons.map((item) => item.id), "lesson ids");
unique(lowLevelDesignLessons.map((item) => item.slug), "lesson slugs");
unique(lowLevelDesignPractice.map((item) => item.id), "practice ids");
unique(lowLevelDesignPractice.map((item) => item.slug), "practice slugs");

const lessonSlugs = new Set(lowLevelDesignLessons.map((item) => item.slug));
const practiceSlugs = new Set(lowLevelDesignPractice.map((item) => item.slug));
for (const lesson of lowLevelDesignLessons) {
  assert.equal(lesson.status, "published", `${lesson.slug} must be published`);
  assert.ok(lesson.objectives.length >= 3, `${lesson.slug} needs learning objectives`);
  assert.ok(lesson.sections.length >= 3, `${lesson.slug} needs substantial sections`);
  validLevels(lesson.levels, lesson.slug);
  for (const section of lesson.sections) {
    for (const field of ["explanation", "example", "commonMistake", "tradeoff", "avoidOverengineering"]) assert.ok(section[field].trim().length > 30, `${lesson.slug}/${section.title} needs ${field}`);
    assert.ok(section.followUps.length >= 2, `${lesson.slug}/${section.title} needs interviewer follow-ups`);
  }
  for (const related of lesson.relatedLessonSlugs) assert.ok(lessonSlugs.has(related), `${lesson.slug} references a missing lesson ${related}`);
  const contract = lesson.contract;
  for (const field of ["interviewDecision", "mentalModel", "domainExample", "badDesign", "betterDesign", "evolutionFollowUp", "concurrencyNote", "systemDesignBoundary"]) assert.ok(contract[field].trim().length > 45, `${lesson.slug} needs a substantive ${field}`);
  assert.ok(contract.useCases.length >= 3, `${lesson.slug} needs use cases`);
  assert.ok(contract.nonGoals.length >= 2, `${lesson.slug} needs non-goals`);
  assert.ok(contract.interfaceSketch.language.length > 0 && contract.interfaceSketch.code.split("\n").length >= 3, `${lesson.slug} needs an interface/code sketch`);
  assert.ok(contract.representativeFlow.length >= 4, `${lesson.slug} needs a representative flow`);
  assert.ok(contract.testCases.length >= 3, `${lesson.slug} needs tests`);
  assert.deepEqual(Object.keys(contract.levelExpectations), canonicalLevels, `${lesson.slug} needs Entry/Mid/Senior/Staff+ expectations`);
  for (const level of canonicalLevels) assert.ok(contract.levelExpectations[level].length > 30, `${lesson.slug} needs ${level} expectations`);
  assert.ok(practiceSlugs.has(contract.practiceSlug), `${lesson.slug} needs an exact practice handoff`);
}

assert.ok(lowLevelDesignFramework.length >= 9, "LLD framework must cover the reusable reasoning flow");
assert.ok(lowLevelDesignInterviewTimeVersion.length >= 4, "LLD needs a compact interview-time rehearsal version");
assert.ok(lowLevelDesignFramework.some(([label]) => label === "Patterns under pressure"), "patterns must follow pressure rather than prescription");
assert.ok(lowLevelDesignFramework.some(([label]) => label === "State and invariants"), "framework must cover state and invariants");
assert.match(source, /Pattern follows pressure or problem/, "curriculum must explicitly teach that patterns follow a concrete problem");
assert.doesNotMatch(source, /must use (?:the )?(?:strategy|factory|observer|state|adapter|command|repository)/i, "curriculum must not prescribe a named pattern as mandatory");

for (const problem of lowLevelDesignPractice) {
  assert.equal(problem.status, "published", `${problem.slug} must be published`);
  validLevels(problem.levels, problem.slug);
  assert.ok(problem.prompt.length > 80, `${problem.slug} needs a substantive prompt`);
  for (const field of ["clarificationQuestions", "requirements", "nonGoals", "entities", "reasoningAreas", "followUps", "commonMistakes", "extensibilityPrompts", "concurrencyAndTestability"]) assert.ok(problem[field].length >= 2, `${problem.slug} needs ${field}`);
  assert.ok(problem.guidance.length >= 3, `${problem.slug} needs progressive guidance`);
  assert.ok(problem.solutionApproach.length >= 2, `${problem.slug} needs alternatives and trade-offs`);
  for (const related of problem.relatedLessonSlugs) assert.ok(lessonSlugs.has(related), `${problem.slug} references a missing lesson ${related}`);
  const contract = problem.contract;
  for (const field of ["domainModel", "responsibilities", "stateAndInvariants", "representativeFlow", "errorHandling", "testingStrategy"]) assert.ok(contract[field].length >= 3, `${problem.slug} needs ${field}`);
  assert.ok(contract.interfaces.length >= 2, `${problem.slug} needs explicit interfaces`);
  for (const item of contract.interfaces) assert.ok(item.signature.length > 8 && item.purpose.length > 25, `${problem.slug} interface needs signature and purpose`);
  assert.equal(typeof contract.concurrency.relevant, "boolean", `${problem.slug} needs an explicit concurrency relevance decision`);
  assert.ok(contract.concurrency.note.length > 45, `${problem.slug} needs proportional concurrency reasoning`);
  assert.ok(contract.alternatives.length >= 2, `${problem.slug} needs multiple alternatives`);
  for (const alternative of contract.alternatives) assert.ok(alternative.useWhen.length > 25 && alternative.tradeoff.length > 25, `${problem.slug} alternative needs pressure and trade-off`);
  assert.ok(contract.rubricEmphasis.length >= 2, `${problem.slug} needs rubric emphasis`);
}

const expectedRubricIds = ["scope-control", "domain-modeling", "responsibility-ownership", "interfaces-dependencies", "state-invariants", "flow-validation", "pattern-judgment", "concurrency-judgment", "errors-idempotency", "testability", "evolution", "communication"];
assert.deepEqual(lowLevelDesignRubric.map((dimension) => dimension.id), expectedRubricIds, "LLD rubric must publish the 12 canonical dimensions in order");
for (const dimension of lowLevelDesignRubric) for (const field of ["prompt", "revisit", "developing", "evident"]) assert.ok(dimension[field].length > 45, `${dimension.id} needs qualitative ${field} guidance`);

assert.doesNotMatch(source, /\b\d{1,3}%\b|readiness score|pass probability|hiring probability/i, "LLD must not create numeric readiness or pass scoring");
assert.doesNotMatch(source, /leetcode|grokking|hello interview|paid course/i, "LLD practice must remain original rather than copy a branded problem source");
assert.match(entryRoute, /Low-Level Design[\s\S]*Internal responsibilities[\s\S]*System Design[\s\S]*Distributed architecture/s, "entry page must represent the System Design boundary");
assert.match(entryRoute, /secondary public preparation surface[\s\S]*four primary continuation tracks/s, "entry page must document the P0.2 continuation boundary");
assert.match(lessonRoute, /dynamicParams = false[\s\S]*generateStaticParams/, "lesson route must use canonical static params and reject unknown slugs");
assert.match(practiceRoute, /dynamicParams = false[\s\S]*generateStaticParams/, "practice route must use canonical static params and reject unknown slugs");
assert.match(lessonRoute, /buildLowLevelDesignLessonStaticParams\(\)/, "lesson route must use the shared finite-route static-param builder");
assert.match(practiceRoute, /buildLowLevelDesignPracticeStaticParams\(\)/, "practice route must use the shared finite-route static-param builder");
assert.match(practiceRoute, /parseLowLevelDesignPracticeContext/, "practice route must parse bounded Playbook context");
assert.deepEqual(buildLowLevelDesignLessonStaticParams(), lowLevelDesignLessons.map((lesson) => ({ slug: lesson.slug })), "lesson static params must exactly match the complete LLD lesson catalog");
assert.deepEqual(buildLowLevelDesignPracticeStaticParams(), lowLevelDesignPractice.map((problem) => ({ slug: problem.slug })), "practice static params must exactly match the complete LLD practice catalog");
const lessonDefinition = finitePublicRouteDefinitions.find(({ pagePattern }) => pagePattern === "/low-level-design/lessons/[slug]");
const practiceDefinition = finitePublicRouteDefinitions.find(({ pagePattern }) => pagePattern === "/low-level-design/practice/[slug]");
assert.deepEqual(lessonDefinition?.paths, lowLevelDesignLessons.map((lesson) => `/low-level-design/lessons/${lesson.slug}`), "finite-route inventory must contain every LLD lesson route exactly once");
assert.deepEqual(practiceDefinition?.paths, lowLevelDesignPractice.map((problem) => `/low-level-design/practice/${problem.slug}`), "finite-route inventory must contain every LLD practice route exactly once");
const indexableRoutes = new Set(indexableFinitePublicRoutes);
for (const lesson of lowLevelDesignLessons) assert.equal(indexableRoutes.has(`/low-level-design/lessons/${lesson.slug}`), lesson.status === "published", `${lesson.slug} sitemap publication must follow lesson status`);
for (const problem of lowLevelDesignPractice) assert.equal(indexableRoutes.has(`/low-level-design/practice/${problem.slug}`), problem.status === "published", `${problem.slug} sitemap publication must follow practice status`);
assert.match(search, /lowLevelDesignLessons[\s\S]*lowLevelDesignPractice/, "global search must index published lessons and practice designs");
assert.match(search, /Low-Level Design self-review rubric[\s\S]*\/low-level-design\/rubric/, "global search must expose the LLD rubric");
assert.match(sitemap, /\/low-level-design\/rubric/, "the canonical rubric must be discoverable in the sitemap");
assert.match(companyData, /id: "lld"[\s\S]*href: "\/low-level-design\/practice"/, "company-guide LLD domain must point to the canonical public practice library");
assert.match(companyWorkspace, /href="\/low-level-design"[\s\S]*Open the Low-Level Design curriculum/, "mature company guides must link to canonical LLD curriculum");
assert.match(playbook, /slug: "low-level-design"[\s\S]*relatedHrefs: \["\/low-level-design", "\/low-level-design\/practice", "\/mock-interviews"\]/, "Playbook LLD dossier must link to curriculum and practice without changing evidence semantics");
assert.match(lessonView, /interviewDecision[\s\S]*useCases[\s\S]*nonGoals[\s\S]*interfaceSketch[\s\S]*representativeFlow[\s\S]*testCases[\s\S]*evolutionFollowUp[\s\S]*concurrencyNote[\s\S]*systemDesignBoundary[\s\S]*levelExpectations[\s\S]*practiceSlug/, "every lesson must render the exact content contract and practice handoff");
assert.match(practiceView, /lowLevelDesignPracticeModes[\s\S]*Session-only timer/, "practice must render Guided, Independent, and Timed behavior");
assert.match(practiceView, /domainModel[\s\S]*responsibilities[\s\S]*interfaces[\s\S]*stateAndInvariants[\s\S]*errorHandling[\s\S]*representativeFlow[\s\S]*testingStrategy[\s\S]*alternatives/, "practice must render the complete dossier contract");
assert.match(practiceView, /lowLevelDesignRubric\.every[\s\S]*disabled=\{!reviewComplete\}[\s\S]*Compare the example approach/, "self-review must precede the example approach");
assert.match(practiceView, /authored dossier remains hidden until all 12 qualitative dimensions[\s\S]*!solutionRevealed[\s\S]*<DesignDossier problem=\{problem\}/s, "answer-bearing dossier must stay behind completed self-review in every mode");
assert.match(practiceView, /creates no score, readiness claim, or saved evaluation/i, "practice must explain the qualitative self-review boundary");
assert.doesNotMatch(practiceView, /\btrack\(/, "timer, hint, and rubric interactions must not be sent to analytics");
assert.match(practiceView, /getLowLevelDesignMockPlanSlug\(problem\.slug\)[\s\S]*problem=\$\{mockPlanSlug\}/, "practice must use the canonical Mock plan mapping");
assert.match(rubricRoute, /lowLevelDesignRubric\.map/, "the rubric route must render every dimension");
assert.match(rubricRoute, /does not produce a score/i, "the rubric route must reject opaque scoring");
assert.match(practiceLibraryRoute, /buildLowLevelDesignPracticeHref\(problem\.slug, context\)/, "practice selection must preserve bounded Playbook context");
assert.match(ownership, /timer, revealed hints, and 12-dimension self-review exist only in the current page session[\s\S]*Application ids, round ids, notes[\s\S]*never enter the public practice URL/s, "ownership docs must state progress and privacy behavior");
assert.match(ownership, /low-level systems\/C\+\+ work remain a separate future family/i, "ownership docs must preserve the Low-Level Systems boundary");
assert.match(css, /\.lld-interface-sketch pre \{[^}]*overflow-x: auto/s, "interface sketches must contain horizontal overflow");
assert.match(css, /@media \(max-width: 620px\)[\s\S]*\.lld-self-review label span \{ min-height: 44px; \}/s, "mobile rubric targets must meet the 44px floor");

assert.equal(normalizeLowLevelDesignLevel("SDE II"), "Mid", "role levels must normalize to the canonical taxonomy");
assert.equal(normalizeLowLevelDesignLevel("unknown band"), null, "unknown role levels must not be invented");
assert.deepEqual(parseLowLevelDesignPracticeContext({ source: "playbook", round: "low-level-design", level: "Senior", company: "amazon", mode: "timed" }), { source: "playbook", round: "low-level-design", level: "Senior", company: "amazon", mode: "timed" }, "valid Playbook context must round-trip");
assert.deepEqual(parseLowLevelDesignPracticeContext({ source: "other", round: "low-level-design", level: "Senior", company: "unknown", mode: "opaque" }), { source: null, round: null, level: null, company: null, mode: "guided" }, "untrusted context must fail closed");
assert.equal(buildLowLevelDesignPracticeHref("parking-allocation", { source: "playbook", round: "low-level-design", level: "Staff+", company: "amazon", mode: "timed" }), "/low-level-design/practice/parking-allocation?source=playbook&round=low-level-design&level=Staff%2B&company=amazon&mode=timed", "practice href must preserve only bounded public modifiers");
assert.equal(buildLowLevelDesignPlaybookHref({ companySlug: "amazon", roleLevel: "SDE II", mode: "independent" }), "/low-level-design/practice?source=playbook&round=low-level-design&level=Mid&company=amazon&mode=independent", "Playbook handoff must configure round, level, company, and mode");
assert.doesNotMatch(buildLowLevelDesignPlaybookHref({ companySlug: "unknown", roleLevel: "unmapped", mode: "guided" }), /company=|level=|application|roundId/, "unknown or private Playbook values must be omitted");

const expectedMockHandoffs = {
  "parking-allocation": "parking-lot",
  "elevator-dispatch": "elevator-control",
  "vending-workflow": "vending-machine",
  "package-delivery-lifecycle": "amazon-locker-parcel-locker",
  "meeting-room-scheduler": "conference-room-booking",
  "notification-orchestrator": "notification-system",
};
for (const problem of lowLevelDesignPractice) {
  const mockPlanSlug = getLowLevelDesignMockPlanSlug(problem.slug);
  assert.equal(mockPlanSlug, expectedMockHandoffs[problem.slug], `${problem.slug} must map to its exact Mock plan`);
  assert.deepEqual(parseMockInterviewUrlState(`track=low-level-design&problem=${mockPlanSlug}&mode=solo`), { track: "low-level-design", problem: mockPlanSlug, mode: "solo" }, `${problem.slug} exact handoff must survive Mock URL parsing without fallback`);
}

console.log("Low-Level Design qualification passed: 8 complete lessons, 6 complete dossiers, 12-dimension self-review, practice modes, boundaries, and configured Playbook handoff hold.");
