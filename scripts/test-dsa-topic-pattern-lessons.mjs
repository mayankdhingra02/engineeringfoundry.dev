import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dsaPatterns, dsaTopics, questionsForPattern, questionsForTopic } from "../data/dsa/index.ts";
import { dsaPatternLessons } from "../data/dsa/pattern-lessons.ts";
import { foundry75Questions } from "../data/dsa/foundry-75.ts";
import { dsaInterviewQuestionDatabase } from "../data/dsa/question-database.ts";
import { filterDsaQuestionsBySearch } from "../lib/dsa/question-search.ts";
import { globalSearchItems } from "../lib/global-search.ts";
import { buildDsaStaticParams } from "../lib/public-route-inventory.ts";

const requiredTopicSlugs = [
  "arrays", "strings", "hash-maps", "sorting", "linked-lists", "stacks-queues", "binary-search", "trees", "heaps", "graphs",
  "topological-ordering", "union-find", "backtracking", "tries", "greedy", "dynamic-programming", "intervals", "bit-manipulation",
  "matrix-grid-traversal", "shortest-paths-weighted-graphs",
];
assert.deepEqual(dsaTopics.map((topic) => topic.slug).sort(), [...requiredTopicSlugs].sort(), "Topic lessons must cover the exact 20 Required core topics.");
for (const topic of dsaTopics) {
  for (const field of ["summary", "interviewUse", "complexityFocus"]) assert.ok(topic[field]?.trim(), `${topic.slug} is missing ${field}.`);
  for (const field of ["recognitionClues", "implementationOptions", "interviewBehavior", "reviewPrompts", "commonMistakes"]) assert.ok(topic[field]?.length >= 3, `${topic.slug} needs at least three ${field}.`);
  assert.ok(Array.isArray(topic.prerequisites), `${topic.slug} is missing explicit prerequisite state.`);
  for (const prerequisite of topic.prerequisites) assert.ok(dsaTopics.some((candidate) => candidate.slug === prerequisite), `${topic.slug} has unknown prerequisite ${prerequisite}.`);
  assert.ok(questionsForTopic(topic.slug).length > 0, `${topic.slug} needs at least one representative Foundry 75 problem.`);
}

assert.equal(dsaPatternLessons.length, 20, "Pattern catalog must expose 20 full lessons.");
assert.deepEqual(dsaPatternLessons.map((lesson) => lesson.slug), dsaPatterns.map((pattern) => pattern.slug), "Pattern index and lesson order must agree exactly.");
for (const lesson of dsaPatternLessons) {
  for (const field of ["problemShape", "invariant", "bruteForce", "pseudocode"]) assert.ok(lesson[field]?.trim(), `${lesson.slug} is missing ${field}.`);
  for (const field of ["recognitionSignals", "antiClues", "derivation", "trace", "wrongApproaches", "edgeCases", "narration", "followUps", "errorLogPrompts", "relatedPatterns"]) assert.ok(lesson[field]?.length >= 2, `${lesson.slug} needs substantive ${field}.`);
  assert.ok(lesson.complexity.time && lesson.complexity.space && lesson.complexity.assumptions, `${lesson.slug} is missing complexity assumptions.`);
  assert.ok(lesson.recognitionExercise.prompt && lesson.recognitionExercise.decision, `${lesson.slug} is missing its unlabeled recognition exercise.`);
  assert.ok(lesson.transferExercise.prompt && lesson.transferExercise.checkpoint, `${lesson.slug} is missing its transfer problem.`);
  const worked = foundry75Questions.find((question) => question.id === lesson.workedProblemId);
  assert.ok(worked?.patterns.includes(lesson.slug), `${lesson.slug} worked problem must be a matching Foundry 75 record.`);
  for (const related of lesson.relatedPatterns) assert.ok(dsaPatternLessons.some((candidate) => candidate.slug === related.slug), `${lesson.slug} links unknown related pattern ${related.slug}.`);
  const canonical = questionsForPattern(lesson.slug).map((question) => question.slug);
  const browserBySlug = filterDsaQuestionsBySearch(dsaInterviewQuestionDatabase, lesson.slug).map((question) => question.slug);
  const browserByName = filterDsaQuestionsBySearch(dsaInterviewQuestionDatabase, lesson.name).map((question) => question.slug);
  assert.deepEqual(browserBySlug, canonical, `${lesson.slug} browser query and canonical practice set disagree.`);
  assert.deepEqual(browserByName, canonical, `${lesson.name} display-name query and canonical practice set disagree.`);
  const searchResult = globalSearchItems.find((item) => item.title === lesson.name && item.type.startsWith("Pattern ·"));
  assert.deepEqual(searchResult, { title: lesson.name, type: `Pattern · ${canonical.length} questions`, href: `/dsa/patterns/${lesson.slug}` }, `${lesson.slug} global-search result must carry the exact count and lesson route.`);
}

for (const question of foundry75Questions) {
  for (const topic of question.topics) assert.ok(dsaTopics.some((candidate) => candidate.slug === topic), `${question.slug} references unknown topic ${topic}.`);
  for (const pattern of question.patterns) assert.ok(dsaPatternLessons.some((candidate) => candidate.slug === pattern), `${question.slug} references unknown pattern ${pattern}.`);
}

const staticPaths = buildDsaStaticParams().map(({ segments }) => `/dsa/${segments.join("/")}`);
assert.deepEqual(staticPaths.filter((path) => path.startsWith("/dsa/patterns/")), dsaPatternLessons.map((lesson) => `/dsa/patterns/${lesson.slug}`), "Static pattern routes must match the 20 lesson records exactly.");
for (const topic of dsaTopics) assert.ok(staticPaths.includes(`/dsa/${topic.slug}`), `${topic.slug} topic route is missing from the finite public inventory.`);

const route = readFileSync("app/dsa/[...segments]/page.tsx", "utf8");
const patternView = readFileSync("features/dsa/pattern-lesson.tsx", "utf8");
const topicView = readFileSync("features/dsa/topic-lesson.tsx", "utf8");
const questionList = readFileSync("components/question-list.tsx", "utf8");
for (const marker of ["Recognize the shape before the name", "Derive the approach", "Trace the state", "Implementation review", "Practice and transfer", "Related patterns and boundaries", "Brute-force baseline", "Unlabeled recognition exercise", "Transfer problem", "Error-log prompts", "Python", "Java"]) assert.ok(patternView.includes(marker), `Pattern lesson UI is missing ${marker}.`);
for (const marker of ["Recognition clues", "Implementation options", "Interview behavior", "Representative problems", "Review state", "Review prompts", "Completion is activity, not mastery"]) assert.ok(topicView.includes(marker), `Topic lesson UI is missing ${marker}.`);
assert.ok(route.includes('segments.length === 2 && segments[0] === "patterns"'), "Catch-all route does not publish pattern details.");
assert.ok(questionList.includes('href={`/dsa/patterns/${slug}`}'), "Question cards do not recover to their pattern lessons.");

console.log(`DSA topic/pattern lesson regression passed: ${dsaTopics.length} topic guides, ${dsaPatternLessons.length} full pattern lessons, exact practice/search counts, and finite public routes agree.`);
