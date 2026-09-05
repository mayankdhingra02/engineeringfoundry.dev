import { readFileSync } from "node:fs";
import { behavioralLearningSources, behavioralLessonHref, behavioralLessonPhases, behavioralLessons } from "../data/behavioral/lessons.ts";
import { buildBehavioralLessonStaticParams, finitePublicRouteDefinitions, indexableFinitePublicRoutes } from "../lib/public-route-inventory.ts";

const failures = [];
const read = (path) => readFileSync(path, "utf8");
const requireText = (source, text, message) => { if (!source.includes(text)) failures.push(message); };

if (behavioralLessons.length !== 16) failures.push(`Expected exactly 16 Behavioral lessons; found ${behavioralLessons.length}.`);
if (behavioralLessonPhases.length !== 4) failures.push(`Expected four learning phases; found ${behavioralLessonPhases.length}.`);
const slugs = new Set(behavioralLessons.map((lesson) => lesson.slug));
if (slugs.size !== behavioralLessons.length) failures.push("Behavioral lesson slugs are not unique.");
const numbers = behavioralLessons.map((lesson) => lesson.number);
if (numbers.some((number, index) => number !== index + 1)) failures.push("Behavioral lesson numbers must be the exact 1–16 sequence.");

const sourceIds = new Set(behavioralLearningSources.map((source) => source.id));
for (const lesson of behavioralLessons) {
  if (lesson.concepts.length < 2 || lesson.concepts.some((concept) => concept.checks.length < 3)) failures.push(`${lesson.slug} is not substantial enough: two concepts with three checks each are required.`);
  if (!lesson.example.weak || !lesson.example.stronger || lesson.example.annotations.length < 3) failures.push(`${lesson.slug} lacks a complete worked evidence comparison.`);
  if (lesson.exercise.steps.length < 3 || !lesson.exercise.answerCheck) failures.push(`${lesson.slug} lacks a complete exercise and answer check.`);
  if (!lesson.sourceIds.length || lesson.sourceIds.some((id) => !sourceIds.has(id))) failures.push(`${lesson.slug} references missing or no sources.`);
  if (!lesson.nextAction.href.startsWith("/")) failures.push(`${lesson.slug} lacks a local next action.`);
}

for (const phase of behavioralLessonPhases) {
  const count = behavioralLessons.filter((lesson) => lesson.phase === phase.id).length;
  if (count !== 4) failures.push(`${phase.id} must contain exactly four lessons; found ${count}.`);
}

const params = buildBehavioralLessonStaticParams();
if (params.length !== 16 || params.some(({ slug }) => !slugs.has(slug))) failures.push("Behavioral static params do not exactly match the canonical lessons.");
const routeDefinition = finitePublicRouteDefinitions.find((definition) => definition.pagePattern === "/behavioral/learn/[slug]");
if (!routeDefinition || routeDefinition.paths.length !== 16) failures.push("Behavioral lessons are missing from the finite public-route inventory.");
for (const lesson of behavioralLessons) if (!indexableFinitePublicRoutes.includes(behavioralLessonHref(lesson.slug))) failures.push(`${lesson.slug} is missing from indexable routes.`);

const route = read("app/behavioral/learn/[slug]/page.tsx");
for (const marker of ["dynamicParams = false", "buildBehavioralLessonStaticParams", "getBehavioralLesson", "notFound()", "generateMetadata"]) requireText(route, marker, `Behavioral lesson route lacks ${marker}.`);
const index = read("features/behavioral/learning-path.tsx");
for (const marker of ["16 lessons", "48 prompts", "No private content here", "No hiring prediction", "Return to Interview Playbook", "Research and source boundary"]) requireText(index, marker, `Behavioral learning index lacks ${marker}.`);
const lesson = read("features/behavioral/lesson.tsx");
for (const marker of ["Weak or brittle", "Stronger evidence", "Open the answer check", "Sources for this lesson", "Return to Interview Playbook"]) requireText(lesson, marker, `Behavioral lesson shell lacks ${marker}.`);
const landing = read("components/behavioral-practice.tsx");
requireText(landing, "Start the 16-lesson path", "Behavioral landing does not lead with the learning path.");
requireText(landing, "Explore 48 prompts", "Behavioral landing still advertises a stale prompt count.");
const css = read("app/globals.css");
for (const marker of [".behavioral-learn-contract", ".behavioral-learn-phase", ".behavioral-lesson-layout", ".behavioral-lesson-example", ".behavioral-lesson-exercise", "@media (max-width: 480px)"]) requireText(css, marker, `Behavioral curriculum styling lacks ${marker}.`);

const allContent = behavioralLessons.map((lesson) => JSON.stringify(lesson)).join("\n");
for (const forbidden of [/\b\d+%\s+(?:ready|prepared)\b/i, /likely to (?:pass|be hired)/i, /personality score:\s*\d/i, /culture fit score:\s*\d/i]) if (forbidden.test(allContent)) failures.push(`Behavioral lessons contain forbidden inference language: ${forbidden}.`);

if (failures.length) {
  console.error(`Behavioral curriculum regression failed:\n- ${failures.join("\n- ")}`);
  process.exit(1);
}
console.log("Behavioral curriculum passed: 16 substantial lessons across four phases, finite routes, worked comparisons, exercises, source boundaries, privacy language, and Playbook returns hold.");
