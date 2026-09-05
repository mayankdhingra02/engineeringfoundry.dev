import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { activeBehavioralQuestions, behavioralCatalogAudit, behavioralLessons } from "../data/behavioral/index.ts";
import {
  behavioralPracticeContexts,
  behavioralPracticeLevels,
  behavioralPracticeNextActions,
  behavioralRubricDimensions,
  behavioralSelfReviewQuestions,
  currentBehavioralProbe,
  orderBehavioralEvidenceGaps,
  parseBehavioralAdaptivePracticeState,
  recordBehavioralProbeOutcome,
  serializeBehavioralAdaptivePracticeState,
} from "../lib/behavioral/adaptive-practice.ts";

const read = (path) => readFileSync(path, "utf8");
const expectedDimensions = ["relevance", "specificity", "ownership", "judgment", "technical-understanding", "outcome-evidence", "learning", "communication", "follow-up-depth", "level-scope", "integrity"];
const expectedBands = ["needs-evidence", "acceptable", "strong", "exceptional"];

assert.equal(activeBehavioralQuestions.length, behavioralCatalogAudit.expectedQuestionCount, "the preserved Behavioral catalog must contain exactly 48 active prompts");
assert.equal(behavioralCatalogAudit.reviewedAt, "2026-09-05");
assert.equal(new Set(activeBehavioralQuestions.map((question) => question.id)).size, 48, "question IDs must remain unique");
assert.equal(new Set(activeBehavioralQuestions.map((question) => question.slug)).size, 48, "question slugs must remain unique");
assert.equal(new Set(activeBehavioralQuestions.map((question) => question.prompt.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim())).size, 48, "canonical prompts must not contain superficial duplicates");
for (const question of activeBehavioralQuestions) {
  assert.deepEqual(question.levelRelevance, ["Entry", "Mid", "Senior", "Staff+"], `${question.id} must name every calibrated level`);
  assert.ok(question.roleRelevance.includes("Individual contributor"), `${question.id} must support IC preparation`);
  assert.ok(question.followUpFamilies.length >= 6, `${question.id} must carry a useful follow-up-family audit`);
  assert.ok(question.followUpFamilies.includes("confidentiality"), `${question.id} must carry a confidentiality probe`);
  assert.equal(question.companyModifierSourceIds.length, 0, `${question.id} must not invent company mappings`);
  assert.match(question.privacyWarning, /allowed to disclose/i, `${question.id} must expose a privacy boundary`);
  assert.equal(question.editorialReviewDate, behavioralCatalogAudit.reviewedAt, `${question.id} must carry the audit date`);
}

assert.equal(behavioralLessons.length, 16, "the Required Behavioral curriculum must contain exactly 16 lessons");
assert.deepEqual(new Set(behavioralRubricDimensions.map((item) => item.id)), new Set(expectedDimensions), "the rubric must expose exactly the eleven specified evidence dimensions");
for (const dimension of behavioralRubricDimensions) {
  assert.deepEqual(Object.keys(dimension.bands), expectedBands, `${dimension.id} must expose four descriptive bands`);
  assert.equal(dimension.probes.length, 2, `${dimension.id} must support a deeper adaptive probe`);
  assert.ok(dimension.lessonHref.startsWith("/behavioral/learn/"), `${dimension.id} must lead to a useful lesson`);
}
assert.equal(behavioralSelfReviewQuestions.length, 8, "self-review must ask the eight specified questions before feedback");
assert.deepEqual(behavioralPracticeLevels.map((item) => item.id), ["entry", "mid", "senior", "staff-plus"], "Entry, Mid/SDE II, Senior, and Staff+ calibration must be present");
assert.deepEqual(behavioralPracticeContexts.map((item) => item.id), ["general", "international", "small-company", "individual-contributor"], "general, international, small-company, and IC lenses must be present");

const question = activeBehavioralQuestions.find((item) => item.category === "Technical Judgment");
assert.ok(question, "a Technical Judgment prompt must remain in the preserved catalog");
const restored = parseBehavioralAdaptivePracticeState("question=" + question.slug + "&level=senior&context=small-company&stage=drill&gaps=communication,technical-understanding,ownership&step=0");
assert.equal(serializeBehavioralAdaptivePracticeState(restored).toString(), "question=" + question.slug + "&level=senior&context=small-company&stage=drill&gaps=communication%2Ctechnical-understanding%2Cownership", "validated practice state must round-trip deterministically for history restoration");
assert.deepEqual(orderBehavioralEvidenceGaps(question, restored.gaps), ["technical-understanding", "ownership", "communication"], "the prompt's evidence target must outrank generic probe order");
const firstProbe = currentBehavioralProbe(question, restored);
assert.equal(firstProbe?.dimension.id, "technical-understanding", "the drill must ask only the highest-value remaining gap");
assert.notEqual(firstProbe?.prompt, firstProbe?.dimension.probes[1], "the first probe must begin at the first evidence layer");
const deeper = currentBehavioralProbe(question, { ...restored, depth: 1 });
assert.equal(deeper?.prompt, firstProbe?.dimension.probes[1], "a deeper request must adapt the current probe before advancing");
const afterResolved = recordBehavioralProbeOutcome(restored, question, "resolved");
assert.equal(afterResolved.step, 1);
assert.deepEqual(afterResolved.resolved, ["technical-understanding"]);
assert.equal(currentBehavioralProbe(question, afterResolved)?.dimension.id, "ownership", "resolved evidence must advance to the next highest-value gap");
const afterStrengthen = recordBehavioralProbeOutcome(afterResolved, question, "strengthen");
const afterBounded = recordBehavioralProbeOutcome(afterStrengthen, question, "bounded");
assert.equal(afterBounded.stage, "summary", "the drill must end after every selected gap has one recorded outcome");
assert.deepEqual(afterBounded.strengthen, ["ownership"]);
assert.deepEqual(afterBounded.bounded, ["communication"]);
const actions = behavioralPracticeNextActions(afterBounded);
assert.ok(actions.length >= 1 && actions.length <= 3, "every practice outcome must produce one to three actions");
assert.ok(actions.some((action) => action.href === "/interview-playbook"), "every practice outcome must return evidence to the Interview Playbook");

const sanitized = parseBehavioralAdaptivePracticeState("question=unknown&level=ceo&context=secret&stage=hired&gaps=integrity,personality,integrity&step=999&depth=9&resolved=personality");
assert.equal(sanitized.stage, "review", "unknown practice stages must be rejected");
assert.deepEqual(sanitized.gaps, ["integrity"], "unknown and duplicate dimensions must be rejected");
assert.equal(sanitized.step, 1, "step must be bounded to the selected gap count");
assert.equal(sanitized.depth, 0, "probe depth must be a closed enum");

const practiceRoute = read("app/behavioral/practice/page.tsx");
const practiceUi = read("features/behavioral/adaptive-practice.tsx");
const reviewRoute = read("app/behavioral/review/page.tsx");
const reviewUi = read("features/behavioral/review-reference.tsx");
const landing = read("components/behavioral-practice.tsx");
const sitemap = read("app/sitemap.ts");
const css = read("app/globals.css");
for (const marker of ["BehavioralAdaptivePractice", "Suspense", "answer collection", "hiring prediction"]) assert.ok(practiceRoute.includes(marker), `practice route must include ${marker}`);
for (const marker of ["Self-check before feedback", "I don’t know / can’t share", "one highest-value question at a time", "Consistency and evidence summary", "Return to Interview Playbook", "popstate", "pushState"]) assert.ok(practiceUi.includes(marker), `practice UI must include ${marker}`);
for (const marker of ["BehavioralReviewReference", "eleven descriptive dimensions"]) assert.ok(reviewRoute.includes(marker), `review route must include ${marker}`);
for (const marker of ["Eleven evidence dimensions", "Self-review comes first", "behavioralPracticeContexts", "behavioralPracticeLevels", "hire probability"]) assert.ok(reviewUi.includes(marker), `review reference must include ${marker}`);
assert.ok(landing.includes("Run an evidence-gap drill") && landing.includes("Review all 11 dimensions"), "the Behavioral entry page must expose practice and review");
assert.ok(sitemap.includes('"/behavioral/practice"') && sitemap.includes('"/behavioral/review"'), "public practice and review must be discoverable");
for (const marker of [".behavioral-drill-header", ".behavioral-gap-review", ".behavioral-probe", ".behavioral-drill-summary", ".behavioral-rubric-table-wrap", "@media (max-width: 480px)"]) assert.ok(css.includes(marker), `Behavioral practice CSS must include ${marker}`);

const publicBehavioralContent = [read("data/behavioral/lessons.ts"), read("lib/behavioral/adaptive-practice.ts"), practiceUi, reviewUi].join("\n");
for (const forbidden of [/culture fit score/i, /personality score/i, /hire probability:\s*\d/i, /likely to (?:pass|be hired)/i, /executive presence score/i]) assert.doesNotMatch(publicBehavioralContent, forbidden, `public Behavioral content must not contain unsupported inference: ${forbidden}`);

console.log("Behavioral Required closure passed: the preserved 48-question catalog, 16 lessons, 11-dimension rubric, adaptive URL-restorable text drill, context calibration, privacy boundary, and Playbook handoff are present.");
