import { readFileSync } from "node:fs";
import { foundry75Questions } from "../data/dsa/foundry-75.ts";
import { dsaPatternLessons } from "../data/dsa/pattern-lessons.ts";
import { dsaTopicLessons } from "../data/dsa/topic-lessons.ts";
import { dsaLanguages } from "../data/dsa/languages.ts";
import { javaLanguageGuide } from "../content/dsa/languages/java-content.ts";
import { pythonLanguageGuide } from "../content/dsa/languages/python-content.ts";
import { dsaPracticeModeDefinitions, dsaRubricDimensions } from "../lib/dsa/practice-attempt.ts";

const failures = [];
const read = (path) => readFileSync(path, "utf8");
const requireText = (source, text, message) => { if (!source.includes(text)) failures.push(message); };

for (const [label, actual, expected] of [
  ["Foundry 75 questions", foundry75Questions.length, 75],
  ["pattern lessons", dsaPatternLessons.length, 20],
  ["topic lessons", dsaTopicLessons.length, 20],
  ["practice modes", dsaPracticeModeDefinitions.length, 6],
  ["independent self-review dimensions", dsaRubricDimensions.length, 12],
]) if (actual !== expected) failures.push(`Expected ${expected} ${label}; found ${actual}.`);

const published = dsaLanguages.filter((language) => language.status === "published").map((language) => language.slug).sort();
if (published.join(",") !== "java,python") failures.push(`Only reviewed Python and Java guides may be published; found ${published.join(", ") || "none"}.`);
if (dsaLanguages.filter((language) => language.status === "coming-soon").length !== 3) failures.push("The three unreviewed language guides must remain explicitly unavailable.");

const sourceRegistry = JSON.parse(read("docs/product-blueprint/registry/sources.json"));
const sourceIds = new Set(sourceRegistry.sources.map((source) => source.id));
const expectedExerciseKinds = ["choose", "predict", "repair", "trace", "transfer"];
for (const guide of [pythonLanguageGuide, javaLanguageGuide]) {
  if (!guide.runtimeNote || !guide.reviewedAt) failures.push(`${guide.name} lacks a visible runtime/review boundary.`);
  if (guide.sources.length < 4 || guide.sources.some((source) => !sourceIds.has(source.id) || !source.url || !source.supports)) failures.push(`${guide.name} lacks four source-ledger-backed guide sources.`);
  if (guide.templates.length !== 15) failures.push(`${guide.name} must expose exactly 15 reusable templates; found ${guide.templates.length}.`);
  if (guide.debuggingChecklist.length < 5 || guide.interviewerTopics.length < 5) failures.push(`${guide.name} lacks the bounded debugging/interviewer operating sections.`);
  const kinds = guide.exercises.map((exercise) => exercise.kind).sort();
  if (kinds.join(",") !== expectedExerciseKinds.join(",")) failures.push(`${guide.name} must provide exactly the five required exercise types.`);
}

const questionBrowser = read("features/dsa/questions/question-browser.tsx");
const questionTable = read("features/dsa/questions/question-table.tsx");
for (const marker of ["hideTaxonomyLabels", "Topic and pattern filters stay hidden", "!hideTaxonomyLabels && <TopicQuickFilters", "hideTaxonomyLabels={hideTaxonomyLabels}"]) requireText(questionBrowser, marker, `Blind-mode question browser lacks ${marker}.`);
requireText(questionTable, "!hideTaxonomyLabels && <th", "Blind-mode question table must remove its Topics column.");

const attemptEditor = read("features/dsa/practice/attempt-editor.tsx");
for (const marker of ["setDirty(true); setRunning", "setDirty(true); setDuration", "setDirty(true); setRunning(false); setElapsed(0)"]) requireText(attemptEditor, marker, `Private attempt timer lacks unsaved-state evidence for ${marker}.`);

const sidebar = read("components/dsa-sidebar.tsx");
const workspaceSidebar = read("components/dsa-workspace-sidebar.tsx");
const guideComponent = read("features/dsa/languages/language-guide.tsx");
for (const [source, label] of [[sidebar, "DSA sidebar"], [workspaceSidebar, "DSA workspace sidebar"], [guideComponent, "language guide"]]) requireText(source, "/interview-playbook", `${label} lacks an explicit Interview Playbook return.`);

const workflow = read(".github/workflows/ci.yml");
requireText(workflow, "actions/setup-java@0f481fcb613427c0f801b606911222b5b6f3083a", "CI lacks the pinned Java toolchain action.");
requireText(workflow, 'java-version: "25"', "CI lacks the reviewed Java 25 compile boundary.");

const requirements = JSON.parse(read("docs/product-blueprint/registry/requirements.json"));
const dsa = requirements.requirements.find((requirement) => requirement.id === "EF-DSA");
if (!dsa || dsa.status !== "implemented" || dsa.research_status !== "approved" || dsa.publication_status !== "published" || dsa.known_gaps.length) failures.push("EF-DSA is not closed as an implemented, approved, published Required family.");

if (failures.length) {
  console.error(`DSA Required closure regression failed:\n- ${failures.join("\n- ")}`);
  process.exit(1);
}
console.log("DSA Required closure passed: 75 questions, 20 patterns, 20 topics, six practice modes, 12 private evidence dimensions, two reviewed language manuals, blind-mode boundaries, and Playbook returns hold.");
