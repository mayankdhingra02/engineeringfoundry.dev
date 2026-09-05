import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dsaPatterns } from "../data/dsa/index.ts";
import {
  FOUNDRY_75_REVIEWED_AT,
  FOUNDRY_75_VERSION,
  foundry75AdditionIds,
  foundry75Questions,
} from "../data/dsa/foundry-75.ts";
import { dsaInterviewQuestionDatabase } from "../data/dsa/question-database.ts";
import { buildDsaStaticParams } from "../lib/public-route-inventory.ts";

assert.equal(foundry75Questions.length, 75, "Foundry 75 must remain finite and exact");
assert.equal(new Set(foundry75Questions.map((question) => question.slug)).size, 75, "Foundry 75 slugs must be unique");
assert.equal(foundry75AdditionIds.length, 32, "The versioned expansion must remain reviewable");
assert.match(FOUNDRY_75_VERSION, /^\d{4}\.\d{2}$/);
assert.match(FOUNDRY_75_REVIEWED_AT, /^\d{4}-\d{2}-\d{2}$/);

const coveredPatterns = new Set(foundry75Questions.flatMap((question) => question.patterns));
assert.deepEqual([...dsaPatterns.map((pattern) => pattern.slug).filter((slug) => !coveredPatterns.has(slug))], [], "Every canonical pattern needs Foundry 75 practice");

for (const question of foundry75Questions) {
  assert.equal(question.catalogVersion, FOUNDRY_75_VERSION, `${question.slug} must carry the catalog version`);
  assert.ok(question.whyItBelongs.trim(), `${question.slug} needs a selection rationale`);
  assert.ok(question.recognitionPrompt.trim(), `${question.slug} needs a hidden recognition prompt`);
  assert.ok(question.clarifyingQuestions.length >= 3, `${question.slug} needs clarifying prompts`);
  assert.ok(question.bruteForceCheckpoint.trim(), `${question.slug} needs a brute-force checkpoint`);
  assert.ok(question.complexityTarget.trim(), `${question.slug} needs a complexity target`);
  assert.ok(question.testCasePrompts.length >= 3, `${question.slug} needs test prompts`);
  assert.ok(question.followUpVariants.length >= 1, `${question.slug} needs a follow-up`);
  assert.ok(question.interviewBehaviorFocus.trim(), `${question.slug} needs an interview behavior focus`);
  assert.ok(question.roleRelevance.length >= 1, `${question.slug} needs role relevance`);
  if (question.sourceClass === "external-reference") {
    const url = new URL(question.externalUrl ?? "");
    assert.equal(url.protocol, "https:", `${question.slug} must use a secure destination`);
    assert.equal(url.hostname, "leetcode.com", `${question.slug} must identify its external host`);
    assert.equal(question.originalPrompt, undefined, `${question.slug} must not reproduce an external statement`);
  } else {
    assert.ok(question.originalPrompt?.trim(), `${question.slug} needs its Engineering Foundry prompt`);
  }
}

assert.deepEqual(dsaInterviewQuestionDatabase.map((question) => question.id), foundry75Questions.map((question) => question.slug), "The browser must expose exactly the versioned Foundry 75 in catalog order");
const detailRoutes = buildDsaStaticParams().filter(({ segments }) => segments[0] === "questions" && segments.length === 2);
assert.equal(detailRoutes.length, 75, "Every and only Foundry 75 question needs a public detail route");
assert.deepEqual(new Set(detailRoutes.map(({ segments }) => segments[1])), new Set(foundry75Questions.map((question) => question.slug)));

const detail = readFileSync("features/dsa/progress/question-detail.tsx", "utf8");
for (const marker of [
  "Practice brief",
  "Open full prompt",
  "Reveal recognition prompt",
  "Clarify the contract",
  "Anchor with brute force",
  "Commit to a target",
  "Test before declaring done",
  "Follow-up variants",
  "Question provenance",
]) assert.ok(detail.includes(marker), `Question experience is missing ${marker}`);

console.log(`Foundry 75 regression passed: ${foundry75Questions.length} versioned questions, ${coveredPatterns.size} patterns, complete public practice briefs, and exact static detail routes.`);
