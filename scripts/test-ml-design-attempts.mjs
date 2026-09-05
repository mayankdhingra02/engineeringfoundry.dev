import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import {
  ML_DESIGN_ATTEMPT_CONFLICT_ERROR,
  ML_DESIGN_ATTEMPT_EARLIER_SNAPSHOT_SAVED_MESSAGE,
  ML_DESIGN_ATTEMPT_PENDING_MESSAGE,
  mlDesignAttemptDraftSignature,
  parseMlDesignAttemptCreateInput,
  parseMlDesignAttemptDeleteInput,
  parseMlDesignAttemptDeleteResult,
  parseMlDesignAttemptSaveInput,
  parseMlDesignAttemptSaveResult,
  resolveMlDesignAttemptDisplayState,
} from "../lib/ml-design/attempt-action-input.ts";
import { emptyMlDesignAttemptDocument, validateMlDesignAttemptDocument } from "../lib/ml-design/attempt.ts";
import { PrivateDataUnavailableError } from "../lib/persistence/errors.ts";
import { resolveMlDesignAttemptQuery } from "../lib/ml-design/attempt-query.ts";

const read = (path) => readFileSync(new URL(`../${path}`, import.meta.url), "utf8");
const attemptId = "11111111-1111-4111-8111-111111111111";
const userId = "22222222-2222-4222-8222-222222222222";
const problemId = "personalized-recommendation";

function form(overrides = {}) {
  const fields = {
    expected_revision: "3", title: "Recommendation rehearsal", status: "review", mode: "timed", duration_minutes: "45",
    assumptions: "10M daily users", design_notes: "Candidate generation then ranking.", hints_used: "1", fresh_exposure: "fresh",
    follow_up_actions: "Test long-tail recall\nDefine a rollback threshold", decide_define: "yes", decide_establish: "yes",
    ...Object.fromEntries(["problem-framing","data-and-labels","metrics","architecture","ml-judgment","production-engineering","experimentation","reliability-and-evolution","risk-and-responsibility","communication"].flatMap((id) => [[`review_${id}`, id === "metrics" ? "Strong" : ""], [`evidence_${id}`, id === "metrics" ? "Separates ranking quality from guardrails." : ""]])),
    ...overrides,
  };
  const data = new FormData();
  for (const [key, value] of Object.entries(fields)) {
    if (value === undefined) continue;
    if (Array.isArray(value)) for (const item of value) data.append(key, item);
    else data.set(key, value);
  }
  return data;
}

const create = new FormData();
create.set("title", "Recommendation rehearsal"); create.set("mode", "guided"); create.set("duration_minutes", ""); create.set("fresh_exposure", "repeat");
const created = parseMlDesignAttemptCreateInput(problemId, create);
assert.equal(created.ok, true);
assert.equal(created.ok && created.value.document.fresh_exposure, false);
const invalidGuidedDuration = new FormData();
for (const [key, value] of create.entries()) invalidGuidedDuration.append(key, value);
invalidGuidedDuration.set("duration_minutes", "45");
for (const [id, data] of [["invented", create], [problemId, new URLSearchParams()], [problemId, invalidGuidedDuration]]) assert.equal(parseMlDesignAttemptCreateInput(id, data).ok, false);

const parsed = parseMlDesignAttemptSaveInput(attemptId.toUpperCase(), problemId, form());
assert.equal(parsed.ok, true);
if (!parsed.ok) throw new Error("valid attempt fixture failed");
assert.equal(parsed.value.attemptId, attemptId);
assert.deepEqual(parsed.value.document.completed_decide_sections, ["define", "establish"]);
assert.equal(parsed.value.document.self_review.metrics, "Strong");
for (const override of [{ expected_revision: "0" }, { mode: "guided", duration_minutes: "45" }, { hints_used: "7" }, { status: "complete" }, { surprise: "private" }, { review_metrics: "9/10" }, { title: ["a", "b"] }]) assert.equal(parseMlDesignAttemptSaveInput(attemptId, problemId, form(override)).ok, false);

const row = { id: attemptId, user_id: userId, problem_id: problemId, problem_version: 1, title: parsed.value.title, status: parsed.value.status, mode: parsed.value.mode, duration_minutes: parsed.value.durationMinutes, document: parsed.value.document, revision: 4, first_practiced_at: "2026-09-04T00:00:00Z", created_at: "2026-09-04T00:00:00Z", updated_at: "2026-09-04T00:00:01Z" };
assert.deepEqual(parseMlDesignAttemptSaveResult([row], parsed.value), { status: "saved", revision: 4 });
assert.deepEqual(parseMlDesignAttemptSaveResult([{ ...row, document: { fresh_exposure: true, follow_up_actions: row.document.follow_up_actions, dimension_evidence: row.document.dimension_evidence, self_review: row.document.self_review, hints_used: 1, completed_decide_sections: row.document.completed_decide_sections, design_notes: row.document.design_notes, assumptions: row.document.assumptions } }], parsed.value), { status: "saved", revision: 4 }, "JSONB key order cannot invalidate a correlated save");
assert.equal(parseMlDesignAttemptSaveResult([], parsed.value).status, "conflict");
for (const value of [null, {}, [row, row], [{ ...row, revision: 5 }], [{ ...row, document: emptyMlDesignAttemptDocument(true) }]]) assert.equal(parseMlDesignAttemptSaveResult(value, parsed.value).status, "invalid");
assert.equal(resolveMlDesignAttemptQuery({ data: row, error: null })?.id, attemptId);
for (const result of [{ data: null, error: { message: "secret" } }, { data: { ...row, user_id: "foreign" }, error: null }]) assert.throws(() => resolveMlDesignAttemptQuery(result), PrivateDataUnavailableError);

const deleteForm = new FormData(); deleteForm.set("$ACTION_ID_delete", "framework");
assert.deepEqual(parseMlDesignAttemptDeleteInput(attemptId.toUpperCase(), problemId, 4, deleteForm), { attemptId, problemId, expectedRevision: 4 });
assert.equal(parseMlDesignAttemptDeleteResult([], attemptId).status, "conflict");
assert.equal(parseMlDesignAttemptDeleteResult([{ attempt_id: attemptId }], attemptId).status, "deleted");
assert.equal(parseMlDesignAttemptDeleteResult([{ attempt_id: userId }], attemptId).status, "invalid");

const signatureForm = form(); const signature = mlDesignAttemptDraftSignature(signatureForm); signatureForm.set("design_notes", "new local edit");
assert.notEqual(mlDesignAttemptDraftSignature(signatureForm), signature);
assert.equal(resolveMlDesignAttemptDisplayState({ status: "idle", message: "" }, true, false).message, ML_DESIGN_ATTEMPT_PENDING_MESSAGE);
assert.equal(resolveMlDesignAttemptDisplayState({ status: "success", message: "Attempt saved." }, false, true).message, ML_DESIGN_ATTEMPT_EARLIER_SNAPSHOT_SAVED_MESSAGE);
assert.equal(resolveMlDesignAttemptDisplayState({ status: "error", message: ML_DESIGN_ATTEMPT_CONFLICT_ERROR, conflict: true }, false, true).message, ML_DESIGN_ATTEMPT_CONFLICT_ERROR);

assert.equal(validateMlDesignAttemptDocument({ ...emptyMlDesignAttemptDocument(true), extra: "no" }), null);
assert.equal(validateMlDesignAttemptDocument({ ...emptyMlDesignAttemptDocument(true), follow_up_actions: [{}] }), null);
const actions = read("features/ml-design/actions.ts");
const saveAction = actions.slice(actions.indexOf("export async function saveMlDesignAttemptAction"), actions.indexOf("export async function deleteMlDesignAttemptAction"));
assert.ok(saveAction.indexOf("parseMlDesignAttemptSaveInput(") < saveAction.indexOf("isAccountPlatformAvailable()"), "save input is validated before account work");
assert.doesNotMatch(actions, /track\(/, "private attempt actions never emit analytics");
const editor = read("features/ml-design/attempt-editor.tsx");
assert.match(editor, /never sent to analytics/);
assert.match(editor, /No total score or readiness probability is calculated/);
assert.match(editor, /target="_blank" rel="noopener noreferrer"/);
const route = read("app/ml-design/problems/[problem]/practice/[attemptId]/page.tsx");
assert.match(route, /robots: \{ index: false, follow: false \}/);
assert.match(route, /requireMemberProfile/);
console.log("ML Design private-attempt contract passed: strict inputs, correlated CAS outcomes, private routes, and analytics exclusion are enforced.");
