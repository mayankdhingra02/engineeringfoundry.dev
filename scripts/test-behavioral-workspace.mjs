import { existsSync, readFileSync } from "node:fs";
import assert from "node:assert/strict";

const failures = [];
const read = (file) => readFileSync(file, "utf8");
const requireText = (source, marker, message) => { if (!source.includes(marker)) failures.push(message); };
const check = (condition, message) => { if (!condition) failures.push(message); };
const functionSource = (source, name) => {
  const start = source.indexOf(`export async function ${name}`);
  const end = source.indexOf("\nexport async function ", start + 1);
  return start < 0 ? "" : source.slice(start, end < 0 ? undefined : end);
};
const sqlFunctionSource = (source, name) => {
  const start = source.indexOf(`create or replace function public.${name}`);
  const end = source.indexOf("\n$$;", start);
  return start < 0 || end < 0 ? "" : source.slice(start, end + 4);
};
const { isBehavioralRoundType, storyReadiness } = await import("../lib/behavioral/readiness.ts");
const { ANSWER_STATUSES, STORY_THEMES } = await import("../lib/behavioral/options.ts");
const {
  BEHAVIORAL_ANSWER_CONFLICT_ERROR,
  BEHAVIORAL_ANSWER_CREATE_ERROR,
  BEHAVIORAL_ANSWER_EXPECTED_REVISION_FIELD,
  BEHAVIORAL_ANSWER_FACT_CONFIRMATION_PRESENT_FIELD,
  BEHAVIORAL_ANSWER_INVALID_INPUT_ERROR,
  BEHAVIORAL_ANSWER_PRIMARY_PRESENT_FIELD,
  BEHAVIORAL_ANSWER_UPDATE_ERROR,
  isCanonicalBehavioralAnswerRevision,
  parseBehavioralAnswerActionInput,
  parseBehavioralAnswerMutationResult,
  parseBehavioralAnswerQuestionId,
  parseCanonicalBehavioralAnswerId,
} = await import("../lib/behavioral/answer-action-input.ts");
const {
  BEHAVIORAL_STORY_CONFLICT_ERROR,
  BEHAVIORAL_STORY_CREATE_ERROR,
  BEHAVIORAL_STORY_DUPLICATE_ERROR,
  BEHAVIORAL_STORY_EXPECTED_REVISION_FIELD,
  BEHAVIORAL_STORY_INVALID_INPUT_ERROR,
  BEHAVIORAL_STORY_THEMES_PRESENT_FIELD,
  BEHAVIORAL_STORY_UPDATE_ERROR,
  isCanonicalBehavioralStoryRevision,
  parseBehavioralStoryActionInput,
  parseBehavioralStoryMutationResult,
  parseCanonicalBehavioralStoryId,
} = await import("../lib/behavioral/story-action-input.ts");
const {
  BEHAVIORAL_ANSWER_DELETE_ERROR,
  BEHAVIORAL_STORY_DELETE_ERROR,
  parseBehavioralAnswerDeleteInput,
  parseBehavioralDeleteResult,
  parseBehavioralStoryDeleteInput,
} = await import("../lib/behavioral/delete-revision.ts");
const {
  BEHAVIORAL_QUESTION_ABSENT_REVISION,
  BEHAVIORAL_QUESTION_CONFLICT_ERROR,
  BEHAVIORAL_QUESTION_DELETE_ERROR,
  BEHAVIORAL_QUESTION_EARLIER_SNAPSHOT_SAVED_MESSAGE,
  BEHAVIORAL_QUESTION_EXPECTED_REVISION_FIELD,
  BEHAVIORAL_QUESTION_ID_FIELD,
  BEHAVIORAL_QUESTION_INVALID_INPUT_ERROR,
  BEHAVIORAL_QUESTION_PERSISTENCE_ERROR,
  BEHAVIORAL_QUESTION_SAVED_MESSAGE,
  isCanonicalBehavioralQuestionRevision,
  parseBehavioralQuestionActionInput,
  parseBehavioralQuestionDeleteResult,
  parseBehavioralQuestionMutationResult,
  parseBehavioralQuestionRevision,
  parseCanonicalBehavioralQuestionId,
  resolveBehavioralQuestionDisplayState,
} = await import("../lib/behavioral/question-action-input.ts");
const { resolveBehavioralStoryEditSnapshot } = await import("../lib/behavioral/story-edit-state.ts");

const canonicalStoryId = "123e4567-e89b-42d3-a456-426614174000";
const canonicalStoryRevision = "2026-09-03T18:15:00.123456+00:00";
const deleteActionForm = () => {
  const form = new FormData();
  form.set("$ACTION_ID_test", "trusted framework metadata");
  return form;
};
assert.deepEqual(
  parseBehavioralStoryDeleteInput(canonicalStoryId.toUpperCase(), canonicalStoryRevision, deleteActionForm()),
  { storyId: canonicalStoryId, expectedUpdatedAt: canonicalStoryRevision },
);
for (const [label, storyId, revision, form] of [
  ["non-FormData input", canonicalStoryId, canonicalStoryRevision, {}],
  ["invalid story ID", "not-a-story", canonicalStoryRevision, deleteActionForm()],
  ["invalid revision", canonicalStoryId, "2026-02-30T00:00:00Z", deleteActionForm()],
  ["unexpected form field", canonicalStoryId, canonicalStoryRevision, new FormData()],
]) {
  if (label === "unexpected form field") form.set("story_id", canonicalStoryId);
  check(parseBehavioralStoryDeleteInput(storyId, revision, form) === null, `story delete parsing rejects ${label}`);
}
check(BEHAVIORAL_STORY_DELETE_ERROR.includes("may have changed") && !/postgres|sql|uuid/i.test(BEHAVIORAL_STORY_DELETE_ERROR), "story deletion uses stable conflict-safe copy");
const storyFields = {
  title: "  Stabilized a launch  ",
  company_or_context: "Engineering Foundry",
  role: "Staff engineer",
  approximate_period: "Q3 2026",
  project: "Release safety",
  situation: "A release was at risk.",
  task: "I owned the recovery plan.",
  action: "I aligned owners and staged a rollback.",
  result: "The release completed safely.",
  reflection: "I would create the runbook earlier.",
  short_summary: "Protected a risky release.",
  notes: "Private follow-up notes.",
};
const storyFieldNames = Object.keys(storyFields);
const storyForm = ({ revision, themes = ["Leadership", "Ownership"], metadata = false } = {}) => {
  const form = new FormData();
  for (const [name, value] of Object.entries(storyFields)) form.set(name, value);
  form.set(BEHAVIORAL_STORY_THEMES_PRESENT_FIELD, "true");
  for (const theme of themes) form.append("themes", theme);
  if (revision !== undefined) form.set(BEHAVIORAL_STORY_EXPECTED_REVISION_FIELD, revision);
  if (metadata) form.set("$ACTION_ID_test", "trusted framework metadata");
  return form;
};
const parses = (input, mode) => parseBehavioralStoryActionInput(input, mode);

const validCreate = parses(storyForm({ metadata: true }), { kind: "create" });
check(validCreate.ok, "strict story parser accepts a complete create form and framework metadata");
check(validCreate.ok && validCreate.value.story.title === "Stabilized a launch", "story parser trims the required title");
check(validCreate.ok && validCreate.value.story.company_or_context === "Engineering Foundry", "story parser preserves bounded optional text");
check(validCreate.ok && validCreate.value.expectedUpdatedAt === null && validCreate.value.storyId === null, "create parsing never invents an edit revision or story ID");
check(validCreate.ok && validCreate.value.themes.join("|") === "Leadership|Ownership", "story parser preserves exact canonical theme order");
const emptyThemes = parses(storyForm({ themes: [] }), { kind: "create" });
check(emptyThemes.ok && emptyThemes.value.themes.length === 0, "an explicit theme-presence sentinel permits an intentional empty theme set");
const validEdit = parses(storyForm({ revision: canonicalStoryRevision }), { kind: "edit", storyId: canonicalStoryId.toUpperCase() });
check(validEdit.ok && validEdit.value.storyId === canonicalStoryId && validEdit.value.expectedUpdatedAt === canonicalStoryRevision, "edit parsing canonicalizes an uppercase UUID and preserves the database revision");

const canonicalStoryOwnerId = "223e4567-e89b-42d3-a456-426614174000";
const persistedStorySnapshot = {
  id: canonicalStoryId.toUpperCase(),
  user_id: canonicalStoryOwnerId.toUpperCase(),
  title: "Stabilized a launch",
  company_or_context: "Engineering Foundry",
  role: "Staff engineer",
  approximate_period: "Q3 2026",
  project: "Release safety",
  situation: "A release was at risk.",
  task: "I owned the recovery plan.",
  action: "I aligned owners and staged a rollback.",
  result: "The release completed safely.",
  reflection: "I would create the runbook earlier.",
  short_summary: "Protected a risky release.",
  status: "Ready",
  notes: "Private follow-up notes.",
  created_at: "2026-09-03T18:00:00+00:00",
  updated_at: canonicalStoryRevision,
  behavioral_story_themes: [{ theme: "Ownership" }, { theme: "Leadership" }],
};
const coherentSnapshot = resolveBehavioralStoryEditSnapshot(
  { data: persistedStorySnapshot, error: null },
  canonicalStoryId,
  canonicalStoryOwnerId,
);
check(coherentSnapshot.status === "ready" && coherentSnapshot.value.story.id === canonicalStoryId && coherentSnapshot.value.story.user_id === canonicalStoryOwnerId && coherentSnapshot.value.themes.join("|") === "Leadership|Ownership", "one valid nested row resolves a canonical parent revision and controlled themes from the same snapshot");
check(resolveBehavioralStoryEditSnapshot({ data: null, error: null }, canonicalStoryId, canonicalStoryOwnerId).status === "missing", "an explicit successful null story is the only missing result");
for (const value of [
  null,
  {},
  { data: null },
  { error: null },
  { data: persistedStorySnapshot, error: { message: "private detail" } },
  { data: [persistedStorySnapshot], error: null },
  { data: { ...persistedStorySnapshot, extra: true }, error: null },
  { data: { ...persistedStorySnapshot, id: canonicalStoryOwnerId }, error: null },
  { data: { ...persistedStorySnapshot, user_id: canonicalStoryId }, error: null },
  { data: { ...persistedStorySnapshot, title: " " }, error: null },
  { data: { ...persistedStorySnapshot, status: "Published" }, error: null },
  { data: { ...persistedStorySnapshot, updated_at: "2026-02-30T00:00:00Z" }, error: null },
  { data: { ...persistedStorySnapshot, notes: 1 }, error: null },
  { data: { ...persistedStorySnapshot, behavioral_story_themes: [{ theme: "Leadership" }, { theme: "Leadership" }] }, error: null },
  { data: { ...persistedStorySnapshot, behavioral_story_themes: [{ theme: "Unknown" }] }, error: null },
  { data: { ...persistedStorySnapshot, behavioral_story_themes: [{ theme: "Leadership", extra: true }] }, error: null },
]) {
  check(resolveBehavioralStoryEditSnapshot(value, canonicalStoryId, canonicalStoryOwnerId).status === "unavailable", "failed, malformed, uncorrelated, or noncanonical edit snapshots must be unavailable rather than missing");
}
check(resolveBehavioralStoryEditSnapshot({ data: persistedStorySnapshot, error: null }, "bad-id", canonicalStoryOwnerId).status === "unavailable" && resolveBehavioralStoryEditSnapshot({ data: persistedStorySnapshot, error: null }, canonicalStoryId, "bad-owner").status === "unavailable", "invalid expected story or owner identity must fail closed");

for (const invalid of [null, undefined, "form", [], {}, new URLSearchParams()]) {
  check(!parses(invalid, { kind: "create" }).ok, `story parser rejects non-FormData input: ${String(invalid)}`);
}
for (const name of storyFieldNames) {
  const missing = storyForm(); missing.delete(name);
  check(!parses(missing, { kind: "create" }).ok, `story parser rejects a missing ${name}`);
  const duplicate = storyForm(); duplicate.append(name, "duplicate");
  check(!parses(duplicate, { kind: "create" }).ok, `story parser rejects a duplicate ${name}`);
  const file = storyForm(); file.delete(name); file.append(name, new Blob(["file payload"]), `${name}.txt`);
  check(!parses(file, { kind: "create" }).ok, `story parser rejects a File-valued ${name}`);
}
for (const [label, mutate] of [
  ["unknown field", (form) => form.set("unexpected", "value")],
  ["missing theme sentinel", (form) => form.delete(BEHAVIORAL_STORY_THEMES_PRESENT_FIELD)],
  ["duplicate theme sentinel", (form) => form.append(BEHAVIORAL_STORY_THEMES_PRESENT_FIELD, "true")],
  ["wrong-case theme sentinel", (form) => form.set(BEHAVIORAL_STORY_THEMES_PRESENT_FIELD, "TRUE")],
  ["File-valued theme sentinel", (form) => { form.delete(BEHAVIORAL_STORY_THEMES_PRESENT_FIELD); form.append(BEHAVIORAL_STORY_THEMES_PRESENT_FIELD, new Blob(["true"]), "sentinel.txt"); }],
  ["File-valued theme", (form) => form.append("themes", new Blob(["Leadership"]), "theme.txt")],
  ["duplicate theme", (form) => form.append("themes", "Leadership")],
  ["unsupported theme", (form) => form.append("themes", "Guaranteed hire")],
  ["wrong-case theme", (form) => { form.delete("themes"); form.append("themes", "leadership"); }],
]) {
  const form = storyForm(); mutate(form);
  check(!parses(form, { kind: "create" }).ok, `story parser rejects ${label}`);
}
for (const [label, value] of [
  ["one-character title", "x"],
  ["NUL text", "bad\0note"],
  ["C1 control text", `bad${String.fromCodePoint(0x85)}note`],
]) {
  const form = storyForm(); form.set(label.includes("title") ? "title" : "notes", value);
  check(!parses(form, { kind: "create" }).ok, `story parser rejects ${label}`);
}
const unicodeTitleAtLimit = storyForm(); unicodeTitleAtLimit.set("title", "😀".repeat(200));
check(parses(unicodeTitleAtLimit, { kind: "create" }).ok, "story parser counts a 200-code-point Unicode title at the documented limit");
const unicodeTitleOverLimit = storyForm(); unicodeTitleOverLimit.set("title", "😀".repeat(201));
check(!parses(unicodeTitleOverLimit, { kind: "create" }).ok, "story parser rejects a 201-code-point Unicode title");
const notesAtLimit = storyForm(); notesAtLimit.set("notes", "😀".repeat(50_000));
check(parses(notesAtLimit, { kind: "create" }).ok, "story parser accepts private notes at the 50,000-code-point limit");
const notesOverLimit = storyForm(); notesOverLimit.set("notes", "😀".repeat(50_001));
check(!parses(notesOverLimit, { kind: "create" }).ok, "story parser rejects private notes above the 50,000-code-point limit");
const invalidTitle = parses(unicodeTitleOverLimit, { kind: "create" });
check(!invalidTitle.ok && invalidTitle.fieldErrors?.title === "Add a title between 2 and 200 characters.", "bounded title failures return stable field-linked copy");
const invalidNotes = parses(notesOverLimit, { kind: "create" });
check(!invalidNotes.ok && invalidNotes.fieldErrors?.notes === "Notes must be 50,000 characters or fewer.", "bounded private-note failures return stable field-linked copy");
const allowedWhitespace = storyForm(); allowedWhitespace.set("notes", "line one\nline two\tcontext\r\n");
check(parses(allowedWhitespace, { kind: "create" }).ok, "story parser preserves allowed multiline whitespace");
for (const [field, value] of [["title", "one\nline"], ["company_or_context", "one\ttwo"]]) {
  const form = storyForm(); form.set(field, value);
  check(!parses(form, { kind: "create" }).ok, `story parser rejects multiline whitespace in single-line ${field}`);
}

const createWithRevision = storyForm({ revision: canonicalStoryRevision });
check(!parses(createWithRevision, { kind: "create" }).ok, "create parsing rejects a caller-supplied edit revision");
for (const [label, revision] of [
  ["missing", undefined],
  ["blank", ""],
  ["date only", "2026-09-03"],
  ["impossible date", "2026-02-30T00:00:00Z"],
  ["year zero", "0000-01-01T00:00:00Z"],
  ["invalid offset", "2026-09-03T12:00:00+14:01"],
]) {
  const form = storyForm({ revision });
  check(!parses(form, { kind: "edit", storyId: canonicalStoryId }).ok, `edit parsing rejects a ${label} revision`);
}
const duplicateRevision = storyForm({ revision: canonicalStoryRevision }); duplicateRevision.append(BEHAVIORAL_STORY_EXPECTED_REVISION_FIELD, canonicalStoryRevision);
check(!parses(duplicateRevision, { kind: "edit", storyId: canonicalStoryId }).ok, "edit parsing rejects duplicate revisions");
const fileRevision = storyForm(); fileRevision.append(BEHAVIORAL_STORY_EXPECTED_REVISION_FIELD, new Blob([canonicalStoryRevision]), "revision.txt");
check(!parses(fileRevision, { kind: "edit", storyId: canonicalStoryId }).ok, "edit parsing rejects a File-valued revision");
for (const storyId of [null, "", "not-a-uuid", "00000000-0000-0000-0000-000000000000", "123e4567-e89b-02d3-a456-426614174000"]) {
  check(!parses(storyForm({ revision: canonicalStoryRevision }), { kind: "edit", storyId }).ok, `edit parsing rejects malformed story ID ${String(storyId)}`);
}
check(parseCanonicalBehavioralStoryId(canonicalStoryId.toUpperCase()) === canonicalStoryId, "standalone story ID parsing accepts UUID case without changing identity");
check(isCanonicalBehavioralStoryRevision(canonicalStoryRevision), "standalone revision validation accepts a real database timestamp");

const savedRow = [{ story_id: canonicalStoryId.toUpperCase(), updated_at: canonicalStoryRevision }];
assert.deepEqual(parseBehavioralStoryMutationResult(savedRow, canonicalStoryId), { status: "saved", storyId: canonicalStoryId, updatedAt: canonicalStoryRevision });
assert.deepEqual(parseBehavioralStoryMutationResult([], canonicalStoryId), { status: "missing" });
for (const [label, value] of [
  ["non-array", savedRow[0]],
  ["multiple rows", [...savedRow, ...savedRow]],
  ["null row", [null]],
  ["extra row key", [{ ...savedRow[0], owner_id: canonicalStoryId }]],
  ["missing row key", [{ story_id: canonicalStoryId }]],
  ["invalid returned ID", [{ story_id: "not-a-uuid", updated_at: canonicalStoryRevision }]],
  ["invalid returned revision", [{ story_id: canonicalStoryId, updated_at: "2026-02-30T00:00:00Z" }]],
  ["mismatched returned ID", savedRow],
]) {
  const expectedId = label === "mismatched returned ID" ? "223e4567-e89b-42d3-a456-426614174000" : canonicalStoryId;
  check(parseBehavioralStoryMutationResult(value, expectedId).status === "invalid", `mutation-result parser rejects ${label}`);
}
check(BEHAVIORAL_STORY_INVALID_INPUT_ERROR === "Review the story fields and try again.", "invalid story input uses stable curated copy");
check(BEHAVIORAL_STORY_CONFLICT_ERROR.includes("Your edits were not saved") && BEHAVIORAL_STORY_CONFLICT_ERROR.includes("Review the latest saved version"), "story conflict copy states preservation and recovery");
check([BEHAVIORAL_STORY_CREATE_ERROR, BEHAVIORAL_STORY_UPDATE_ERROR, BEHAVIORAL_STORY_DUPLICATE_ERROR].every((message) => message.length > 0 && !/postgres|sql|owner|uuid/i.test(message)), "story persistence failures use stable sanitized copy");

const canonicalQuestionId = "323e4567-e89b-42d3-a456-426614174000";
const canonicalQuestionRevision = "2026-09-04T11:15:00.123456+00:00";
const questionValues = {
  question_text: "  Tell me about a difficult technical tradeoff?  ",
  category: "  Leadership  ",
  company_slug: " OpenAI ",
  description: "  Private interview context.  ",
  notes: "  Private preparation notes.  ",
};
const questionForm = ({ values = {}, revision = BEHAVIORAL_QUESTION_ABSENT_REVISION, metadata = false } = {}) => {
  const form = new FormData();
  form.set(BEHAVIORAL_QUESTION_ID_FIELD, canonicalQuestionId.toUpperCase());
  form.set(BEHAVIORAL_QUESTION_EXPECTED_REVISION_FIELD, revision);
  for (const [name, value] of Object.entries({ ...questionValues, ...values })) form.set(name, value);
  if (metadata) form.set("$ACTION_ID_test", "trusted framework metadata");
  return form;
};

const validQuestionCreate = parseBehavioralQuestionActionInput(questionForm({ metadata: true }));
check(validQuestionCreate.ok, "strict question parser accepts a complete absent create snapshot and framework metadata");
check(validQuestionCreate.ok && validQuestionCreate.value.questionId === canonicalQuestionId && validQuestionCreate.value.expectAbsent && validQuestionCreate.value.expectedUpdatedAt === null, "question create parsing canonicalizes caller identity and preserves explicit absence");
check(validQuestionCreate.ok && validQuestionCreate.value.question.question_text === "Tell me about a difficult technical tradeoff?" && validQuestionCreate.value.question.company_slug === "openai", "question parser trims text and normalizes bounded company context");
const validQuestionEdit = parseBehavioralQuestionActionInput(questionForm({ revision: canonicalQuestionRevision }));
check(validQuestionEdit.ok && !validQuestionEdit.value.expectAbsent && validQuestionEdit.value.expectedUpdatedAt === canonicalQuestionRevision, "question edit parsing preserves the exact persisted revision");
const blankQuestionOptionals = parseBehavioralQuestionActionInput(questionForm({ values: { category: "", company_slug: "", description: "", notes: "" } }));
check(blankQuestionOptionals.ok && blankQuestionOptionals.value.question.category === "Other" && blankQuestionOptionals.value.question.company_slug === null && blankQuestionOptionals.value.question.description === null && blankQuestionOptionals.value.question.notes === null, "question parser resolves explicit blank optionals without inventing private text");
for (const invalid of [null, undefined, "form", [], {}, new URLSearchParams()]) {
  check(!parseBehavioralQuestionActionInput(invalid).ok, `question parser rejects non-FormData input: ${String(invalid)}`);
}
for (const name of [BEHAVIORAL_QUESTION_ID_FIELD, BEHAVIORAL_QUESTION_EXPECTED_REVISION_FIELD, ...Object.keys(questionValues)]) {
  const missing = questionForm(); missing.delete(name);
  check(!parseBehavioralQuestionActionInput(missing).ok, `question parser rejects missing singleton ${name}`);
  const duplicate = questionForm(); duplicate.append(name, "duplicate");
  check(!parseBehavioralQuestionActionInput(duplicate).ok, `question parser rejects duplicate singleton ${name}`);
  const file = questionForm(); file.delete(name); file.append(name, new Blob(["file"]), `${name}.txt`);
  check(!parseBehavioralQuestionActionInput(file).ok, `question parser rejects File-valued singleton ${name}`);
}
for (const [label, mutate] of [
  ["unknown field", (form) => form.set("unexpected", "value")],
  ["malformed question id", (form) => form.set(BEHAVIORAL_QUESTION_ID_FIELD, "not-a-uuid")],
  ["blank revision", (form) => form.set(BEHAVIORAL_QUESTION_EXPECTED_REVISION_FIELD, "")],
  ["impossible revision", (form) => form.set(BEHAVIORAL_QUESTION_EXPECTED_REVISION_FIELD, "2026-02-30T00:00:00Z")],
  ["invalid revision offset", (form) => form.set(BEHAVIORAL_QUESTION_EXPECTED_REVISION_FIELD, "2026-09-04T12:00:00+14:01")],
]) {
  const form = questionForm(); mutate(form);
  check(!parseBehavioralQuestionActionInput(form).ok, `question parser rejects ${label}`);
}
for (const [field, limit] of [["question_text", 1_000], ["category", 100], ["company_slug", 80], ["description", 5_000], ["notes", 20_000]]) {
  const atLimit = questionForm({ values: { [field]: "😀".repeat(limit) } });
  check(parseBehavioralQuestionActionInput(atLimit).ok, `question parser counts ${field} Unicode code points at its limit`);
  const overLimit = questionForm({ values: { [field]: "😀".repeat(limit + 1) } });
  check(!parseBehavioralQuestionActionInput(overLimit).ok, `question parser rejects ${field} above its Unicode code-point limit`);
  const control = questionForm({ values: { [field]: "valid\u0000value" } });
  check(!parseBehavioralQuestionActionInput(control).ok, `question parser rejects control characters in ${field}`);
}
check(parseBehavioralQuestionActionInput(questionForm({ values: { question_text: "Tell me\nabout the decision?", description: "Context\nline", notes: "Private\tnote" } })).ok, "question parser preserves supported multiline whitespace");
check(parseCanonicalBehavioralQuestionId(canonicalQuestionId.toUpperCase()) === canonicalQuestionId && parseCanonicalBehavioralQuestionId("00000000-0000-0000-0000-000000000000") === null, "standalone question ID parsing canonicalizes valid IDs and rejects deceptive UUIDs");
check(isCanonicalBehavioralQuestionRevision(canonicalQuestionRevision), "standalone question revision accepts a database timestamp");
assert.deepEqual(parseBehavioralQuestionRevision(canonicalQuestionId.toUpperCase(), canonicalQuestionRevision), { questionId: canonicalQuestionId, expectedUpdatedAt: canonicalQuestionRevision });
check(parseBehavioralQuestionRevision("bad-id", canonicalQuestionRevision) === null && parseBehavioralQuestionRevision(canonicalQuestionId, "bad-revision") === null, "delete revision parsing fails closed on malformed identity or revision");

const savedQuestionRow = [{ question_id: canonicalQuestionId.toUpperCase(), updated_at: canonicalQuestionRevision }];
assert.deepEqual(parseBehavioralQuestionMutationResult(savedQuestionRow, canonicalQuestionId), { status: "saved", questionId: canonicalQuestionId, updatedAt: canonicalQuestionRevision });
assert.deepEqual(parseBehavioralQuestionMutationResult([], canonicalQuestionId), { status: "conflict" });
assert.deepEqual(parseBehavioralQuestionDeleteResult([{ question_id: canonicalQuestionId.toUpperCase() }], canonicalQuestionId), { status: "deleted", questionId: canonicalQuestionId });
assert.deepEqual(parseBehavioralQuestionDeleteResult([], canonicalQuestionId), { status: "conflict" });
for (const value of [savedQuestionRow[0], null, [null], [...savedQuestionRow, ...savedQuestionRow], [{ ...savedQuestionRow[0], extra: true }], [{ question_id: canonicalQuestionId }], [{ question_id: canonicalStoryId, updated_at: canonicalQuestionRevision }], [{ question_id: canonicalQuestionId, updated_at: "bad" }]]) {
  check(parseBehavioralQuestionMutationResult(value, canonicalQuestionId).status === "invalid", "question mutation-result parser rejects malformed, extra, or mismatched rows");
}
for (const input of [
  [null],
  [{ question_id: canonicalQuestionId, extra: true }],
  [{ question_id: canonicalStoryId }],
  [{ question_id: canonicalQuestionId }, { question_id: canonicalQuestionId }],
]) {
  check(parseBehavioralQuestionDeleteResult(input, canonicalQuestionId).status === "invalid", "question delete-result parser rejects malformed, extra, duplicate, or mismatched rows");
}
assert.deepEqual(resolveBehavioralQuestionDisplayState({ status: "success", message: BEHAVIORAL_QUESTION_SAVED_MESSAGE }, true, true), { status: "pending", message: "Saving question…" });
assert.deepEqual(resolveBehavioralQuestionDisplayState({ status: "success", message: BEHAVIORAL_QUESTION_SAVED_MESSAGE }, false, true), { status: "success", message: BEHAVIORAL_QUESTION_EARLIER_SNAPSHOT_SAVED_MESSAGE });
assert.deepEqual(resolveBehavioralQuestionDisplayState({ status: "error", message: BEHAVIORAL_QUESTION_CONFLICT_ERROR }, false, true), { status: "error", message: BEHAVIORAL_QUESTION_CONFLICT_ERROR });
check([BEHAVIORAL_QUESTION_INVALID_INPUT_ERROR, BEHAVIORAL_QUESTION_PERSISTENCE_ERROR, BEHAVIORAL_QUESTION_DELETE_ERROR].every((message) => message.length > 0 && !/postgres|sql|owner|uuid/i.test(message)), "question failures use stable sanitized copy");

const canonicalAnswerId = "223e4567-e89b-42d3-a456-426614174000";
const canonicalAnswerRevision = "2026-09-03T19:45:00.654321+00:00";
const canonicalCuratedQuestionIds = new Set(["beh-lead-01", "beh-tech-01"]);
assert.deepEqual(
  parseBehavioralAnswerDeleteInput("beh-lead-01", canonicalAnswerId.toUpperCase(), canonicalAnswerRevision, deleteActionForm(), canonicalCuratedQuestionIds),
  { questionId: "beh-lead-01", answerId: canonicalAnswerId, expectedUpdatedAt: canonicalAnswerRevision },
);
assert.deepEqual(
  parseBehavioralAnswerDeleteInput(canonicalStoryId.toUpperCase(), canonicalAnswerId, canonicalAnswerRevision, deleteActionForm(), canonicalCuratedQuestionIds),
  { questionId: canonicalStoryId, answerId: canonicalAnswerId, expectedUpdatedAt: canonicalAnswerRevision },
);
for (const [label, questionId, answerId, revision, form] of [
  ["unknown curated question", "beh-unknown-999", canonicalAnswerId, canonicalAnswerRevision, deleteActionForm()],
  ["invalid custom question", "not-a-question", canonicalAnswerId, canonicalAnswerRevision, deleteActionForm()],
  ["invalid answer ID", "beh-lead-01", "not-an-answer", canonicalAnswerRevision, deleteActionForm()],
  ["invalid revision", "beh-lead-01", canonicalAnswerId, "2026-02-30T00:00:00Z", deleteActionForm()],
  ["non-FormData input", "beh-lead-01", canonicalAnswerId, canonicalAnswerRevision, {}],
]) {
  check(parseBehavioralAnswerDeleteInput(questionId, answerId, revision, form, canonicalCuratedQuestionIds) === null, `answer delete parsing rejects ${label}`);
}
assert.deepEqual(parseBehavioralDeleteResult([{ story_id: canonicalStoryId.toUpperCase() }], "story_id", canonicalStoryId), { status: "deleted", recordId: canonicalStoryId });
assert.deepEqual(parseBehavioralDeleteResult([{ answer_id: canonicalAnswerId.toUpperCase() }], "answer_id", canonicalAnswerId), { status: "deleted", recordId: canonicalAnswerId });
assert.deepEqual(parseBehavioralDeleteResult([], "story_id", canonicalStoryId), { status: "conflict" });
for (const [label, value, key, expectedId] of [
  ["non-array", {}, "story_id", canonicalStoryId],
  ["multiple rows", [{ story_id: canonicalStoryId }, { story_id: canonicalStoryId }], "story_id", canonicalStoryId],
  ["extra key", [{ story_id: canonicalStoryId, user_id: canonicalAnswerId }], "story_id", canonicalStoryId],
  ["wrong key", [{ answer_id: canonicalStoryId }], "story_id", canonicalStoryId],
  ["mismatched ID", [{ answer_id: canonicalAnswerId }], "answer_id", canonicalStoryId],
]) {
  check(parseBehavioralDeleteResult(value, key, expectedId).status === "invalid", `Behavioral delete-result parsing rejects ${label}`);
}
check(BEHAVIORAL_ANSWER_DELETE_ERROR.includes("may have changed") && !/postgres|sql|uuid/i.test(BEHAVIORAL_ANSWER_DELETE_ERROR), "answer deletion uses stable conflict-safe copy");
const answerValues = {
  title: "  General leadership framing  ",
  status: "Ready",
  company_slug: " OpenAI ",
  application_id: canonicalAnswerId,
  story_id: canonicalStoryId,
  opening_framing: "  Open with the decision gap.  ",
  details_to_emphasize: "  Emphasize the reversible plan.  ",
  details_to_avoid: "  Avoid confidential details.  ",
  notes: "  Private preparation note.  ",
  answer_text: "  Full rehearsal draft.  ",
};
const answerFieldNames = Object.keys(answerValues);
const answerInputForm = ({
  values = {},
  primary = false,
  confirmed = false,
  revision,
  metadata = false,
} = {}) => {
  const form = new FormData();
  for (const [name, value] of Object.entries({ ...answerValues, ...values })) form.set(name, value);
  form.set(BEHAVIORAL_ANSWER_PRIMARY_PRESENT_FIELD, "true");
  form.set(BEHAVIORAL_ANSWER_FACT_CONFIRMATION_PRESENT_FIELD, "true");
  if (primary) form.set("is_primary", "on");
  if (confirmed) form.set("fact_integrity_confirmed", "on");
  if (revision !== undefined) form.set(BEHAVIORAL_ANSWER_EXPECTED_REVISION_FIELD, revision);
  if (metadata) form.set("$ACTION_ID_test", "trusted framework metadata");
  return form;
};
const parseAnswer = (input, mode) => parseBehavioralAnswerActionInput(input, mode, canonicalCuratedQuestionIds);

const validAnswerCreate = parseAnswer(answerInputForm({ primary: true, confirmed: true, metadata: true }), { kind: "create", questionId: "beh-lead-01" });
check(validAnswerCreate.ok, "strict answer parser accepts a complete curated-question create form and framework metadata");
assert.deepEqual(validAnswerCreate.ok ? validAnswerCreate.value : null, {
  questionId: "beh-lead-01",
  answerId: null,
  expectedUpdatedAt: null,
  answer: {
    title: "General leadership framing",
    answer_text: "Full rehearsal draft.",
    opening_framing: "Open with the decision gap.",
    details_to_emphasize: "Emphasize the reversible plan.",
    details_to_avoid: "Avoid confidential details.",
    notes: "Private preparation note.",
    status: "Ready",
    company_slug: "openai",
    story_id: canonicalStoryId,
    application_id: canonicalAnswerId,
  },
  isPrimary: true,
  factIntegrityConfirmed: true,
});
const emptyOptionalAnswer = parseAnswer(answerInputForm({ values: { company_slug: "", application_id: "", opening_framing: "", details_to_emphasize: "", details_to_avoid: "", notes: "", answer_text: "" } }), { kind: "create", questionId: "beh-lead-01" });
check(emptyOptionalAnswer.ok && emptyOptionalAnswer.value.answer.company_slug === null && emptyOptionalAnswer.value.answer.application_id === null && emptyOptionalAnswer.value.answer.answer_text === "" && emptyOptionalAnswer.value.answer.notes === null && !emptyOptionalAnswer.value.isPrimary && !emptyOptionalAnswer.value.factIntegrityConfirmed, "intentional blank optional answer fields and absent checkboxes preserve null, empty-draft, and false semantics");
const validAnswerEdit = parseAnswer(answerInputForm({ revision: canonicalAnswerRevision }), { kind: "edit", questionId: "beh-lead-01", answerId: canonicalAnswerId.toUpperCase() });
check(validAnswerEdit.ok && validAnswerEdit.value.answerId === canonicalAnswerId && validAnswerEdit.value.expectedUpdatedAt === canonicalAnswerRevision, "answer edit parsing canonicalizes UUID case and preserves the exact persisted revision");
const validCustomQuestion = parseAnswer(answerInputForm(), { kind: "create", questionId: canonicalStoryId.toUpperCase() });
check(validCustomQuestion.ok && validCustomQuestion.value.questionId === canonicalStoryId, "answer parser accepts a canonical custom-question UUID without changing its identity");
for (const status of ANSWER_STATUSES) {
  const parsed = parseAnswer(answerInputForm({ values: { status } }), { kind: "create", questionId: "beh-lead-01" });
  check(parsed.ok && parsed.value.answer.status === status, `answer parser accepts canonical status ${status}`);
}

for (const invalid of [null, undefined, "form", [], {}, new URLSearchParams()]) {
  check(!parseAnswer(invalid, { kind: "create", questionId: "beh-lead-01" }).ok, `answer parser rejects non-FormData input: ${String(invalid)}`);
}
for (const name of [...answerFieldNames, BEHAVIORAL_ANSWER_PRIMARY_PRESENT_FIELD, BEHAVIORAL_ANSWER_FACT_CONFIRMATION_PRESENT_FIELD]) {
  const missing = answerInputForm(); missing.delete(name);
  check(!parseAnswer(missing, { kind: "create", questionId: "beh-lead-01" }).ok, `answer parser rejects missing singleton field ${name}`);
  const duplicate = answerInputForm(); duplicate.append(name, "duplicate");
  check(!parseAnswer(duplicate, { kind: "create", questionId: "beh-lead-01" }).ok, `answer parser rejects duplicate singleton field ${name}`);
  const file = answerInputForm(); file.delete(name); file.append(name, new Blob(["file payload"]), `${name}.txt`);
  check(!parseAnswer(file, { kind: "create", questionId: "beh-lead-01" }).ok, `answer parser rejects File-valued singleton field ${name}`);
}
for (const [label, mutate] of [
  ["unknown field", (form) => form.set("unexpected", "value")],
  ["wrong-case primary sentinel", (form) => form.set(BEHAVIORAL_ANSWER_PRIMARY_PRESENT_FIELD, "TRUE")],
  ["wrong-case fact sentinel", (form) => form.set(BEHAVIORAL_ANSWER_FACT_CONFIRMATION_PRESENT_FIELD, "TRUE")],
  ["wrong primary value", (form) => form.set("is_primary", "true")],
  ["duplicate primary value", (form) => { form.set("is_primary", "on"); form.append("is_primary", "on"); }],
  ["File-valued primary", (form) => form.append("is_primary", new Blob(["on"]), "primary.txt")],
  ["wrong fact confirmation", (form) => form.set("fact_integrity_confirmed", "true")],
  ["duplicate fact confirmation", (form) => { form.set("fact_integrity_confirmed", "on"); form.append("fact_integrity_confirmed", "on"); }],
  ["File-valued fact confirmation", (form) => form.append("fact_integrity_confirmed", new Blob(["on"]), "confirmation.txt")],
]) {
  const form = answerInputForm(); mutate(form);
  check(!parseAnswer(form, { kind: "create", questionId: "beh-lead-01" }).ok, `answer parser rejects ${label}`);
}
const createAnswerWithRevision = answerInputForm({ revision: canonicalAnswerRevision });
check(!parseAnswer(createAnswerWithRevision, { kind: "create", questionId: "beh-lead-01" }).ok, "answer create parsing rejects a caller-supplied edit revision");
for (const [label, revision] of [
  ["missing", undefined],
  ["blank", ""],
  ["date only", "2026-09-03"],
  ["impossible date", "2026-02-30T00:00:00Z"],
  ["year zero", "0000-01-01T00:00:00Z"],
  ["invalid offset", "2026-09-03T12:00:00+14:01"],
]) {
  const form = answerInputForm({ revision });
  check(!parseAnswer(form, { kind: "edit", questionId: "beh-lead-01", answerId: canonicalAnswerId }).ok, `answer edit parsing rejects a ${label} revision`);
}
const duplicateAnswerRevision = answerInputForm({ revision: canonicalAnswerRevision }); duplicateAnswerRevision.append(BEHAVIORAL_ANSWER_EXPECTED_REVISION_FIELD, canonicalAnswerRevision);
check(!parseAnswer(duplicateAnswerRevision, { kind: "edit", questionId: "beh-lead-01", answerId: canonicalAnswerId }).ok, "answer edit parsing rejects duplicate revisions");
const fileAnswerRevision = answerInputForm(); fileAnswerRevision.append(BEHAVIORAL_ANSWER_EXPECTED_REVISION_FIELD, new Blob([canonicalAnswerRevision]), "revision.txt");
check(!parseAnswer(fileAnswerRevision, { kind: "edit", questionId: "beh-lead-01", answerId: canonicalAnswerId }).ok, "answer edit parsing rejects a File-valued revision");
for (const questionId of [null, "", "beh-lead-01 ", "BEH-LEAD-01", "beh-unknown-999", "00000000-0000-0000-0000-000000000000", "not-a-question"]) {
  check(!parseAnswer(answerInputForm(), { kind: "create", questionId }).ok, `answer parsing rejects deceptive or unknown question ID ${String(questionId)}`);
}
for (const answerId of [null, "", "not-an-answer", "00000000-0000-0000-0000-000000000000", "223e4567-e89b-02d3-a456-426614174000"]) {
  check(!parseAnswer(answerInputForm({ revision: canonicalAnswerRevision }), { kind: "edit", questionId: "beh-lead-01", answerId }).ok, `answer edit parsing rejects malformed answer ID ${String(answerId)}`);
}
for (const [field, value] of [["story_id", "not-a-story"], ["application_id", "not-an-application"]]) {
  const form = answerInputForm({ values: { [field]: value } });
  const parsed = parseAnswer(form, { kind: "create", questionId: "beh-lead-01" });
  check(!parsed.ok && Boolean(parsed.fieldErrors?.[field]), `answer parser rejects and identifies malformed ${field}`);
}
for (const [field, value] of [["title", ""], ["title", "😀".repeat(201)], ["title", "single\nline"], ["company_slug", "😀".repeat(201)], ["company_slug", "one\ttwo"], ["status", "ready"]]) {
  const form = answerInputForm({ values: { [field]: value } });
  const parsed = parseAnswer(form, { kind: "create", questionId: "beh-lead-01" });
  check(!parsed.ok && Boolean(parsed.fieldErrors?.[field]), `answer parser rejects invalid bounded ${field}`);
}
const answerTextLimits = { opening_framing: 10_000, details_to_emphasize: 20_000, details_to_avoid: 20_000, notes: 50_000, answer_text: 50_000 };
for (const [field, maximum] of Object.entries(answerTextLimits)) {
  const atLimit = answerInputForm({ values: { [field]: "😀".repeat(maximum) } });
  check(parseAnswer(atLimit, { kind: "create", questionId: "beh-lead-01" }).ok, `answer parser counts ${field} Unicode code points at the documented limit`);
  const overLimit = answerInputForm({ values: { [field]: "😀".repeat(maximum + 1) } });
  const parsedOverLimit = parseAnswer(overLimit, { kind: "create", questionId: "beh-lead-01" });
  check(!parsedOverLimit.ok && Boolean(parsedOverLimit.fieldErrors?.[field]), `answer parser rejects ${field} above its Unicode code-point limit`);
  const control = answerInputForm({ values: { [field]: "private\0value" } });
  const parsedControl = parseAnswer(control, { kind: "create", questionId: "beh-lead-01" });
  check(!parsedControl.ok && Boolean(parsedControl.fieldErrors?.[field]), `answer parser rejects NUL in ${field}`);
}
const multilineAnswer = answerInputForm({ values: { opening_framing: "line one\nline two\tcontext\r\n" } });
check(parseAnswer(multilineAnswer, { kind: "create", questionId: "beh-lead-01" }).ok, "answer parser preserves allowed multiline whitespace in long-form fields");
check(parseCanonicalBehavioralAnswerId(canonicalAnswerId.toUpperCase()) === canonicalAnswerId, "standalone answer ID parsing accepts UUID case without changing identity");
check(parseBehavioralAnswerQuestionId("beh-lead-01", canonicalCuratedQuestionIds) === "beh-lead-01" && parseBehavioralAnswerQuestionId("BEH-LEAD-01", canonicalCuratedQuestionIds) === null, "question parsing binds exact curated IDs without accepting case variants");
check(isCanonicalBehavioralAnswerRevision(canonicalAnswerRevision), "standalone answer revision validation accepts a real database timestamp");

const savedAnswerRow = [{ answer_id: canonicalAnswerId.toUpperCase(), updated_at: canonicalAnswerRevision }];
assert.deepEqual(parseBehavioralAnswerMutationResult(savedAnswerRow, canonicalAnswerId), { status: "saved", answerId: canonicalAnswerId, updatedAt: canonicalAnswerRevision });
assert.deepEqual(parseBehavioralAnswerMutationResult([], canonicalAnswerId), { status: "missing" });
for (const [label, value] of [
  ["non-array", savedAnswerRow[0]],
  ["multiple rows", [...savedAnswerRow, ...savedAnswerRow]],
  ["null row", [null]],
  ["extra row key", [{ ...savedAnswerRow[0], user_id: canonicalStoryId }]],
  ["missing row key", [{ answer_id: canonicalAnswerId }]],
  ["invalid returned ID", [{ answer_id: "not-an-id", updated_at: canonicalAnswerRevision }]],
  ["invalid returned revision", [{ answer_id: canonicalAnswerId, updated_at: "2026-02-30T00:00:00Z" }]],
  ["mismatched returned ID", savedAnswerRow],
]) {
  const expectedId = label === "mismatched returned ID" ? canonicalStoryId : canonicalAnswerId;
  check(parseBehavioralAnswerMutationResult(value, expectedId).status === "invalid", `answer mutation-result parser rejects ${label}`);
}
check(BEHAVIORAL_ANSWER_INVALID_INPUT_ERROR === "Review the highlighted fields.", "invalid answer input uses stable curated copy");
check(BEHAVIORAL_ANSWER_CONFLICT_ERROR.includes("Your edits were not saved") && BEHAVIORAL_ANSWER_CONFLICT_ERROR.includes("Review the latest saved version"), "answer conflict copy states draft preservation and recovery");
check([BEHAVIORAL_ANSWER_CREATE_ERROR, BEHAVIORAL_ANSWER_UPDATE_ERROR].every((message) => message.length > 0 && !/postgres|sql|owner|uuid/i.test(message)), "answer persistence failures use stable sanitized copy");

if (storyReadiness({ situation: null, task: null, action: null, result: null }) !== "Draft") failures.push("A title-only story must remain Draft.");
if (storyReadiness({ situation: "A production dependency changed during launch planning.", task: "I owned the safe rollout.", action: "I compared rollback options, aligned the incident lead, staged the change, and watched the agreed service indicators during release.", result: "The launch completed without customer impact and the runbook gained a tested fallback." }) !== "Ready") failures.push("A meaningfully complete STAR story must be Ready.");
if (storyReadiness({ situation: "A launch was at risk because ownership was unclear.", task: "I owned triage.", action: "I mapped the missing decisions and brought the owners together.", result: null }) !== "Needs detail") failures.push("A partially complete STAR story must need detail.");
if (!isBehavioralRoundType("Virtual Onsite") || !isBehavioralRoundType("Hiring Manager") || isBehavioralRoundType("Technical screen")) failures.push("Behavioral round detection is not selective.");
const routes = [
  "app/behavioral/workspace/page.tsx", "app/behavioral/questions/page.tsx", "app/behavioral/questions/new/page.tsx",
  "app/behavioral/questions/[questionId]/page.tsx", "app/behavioral/questions/[questionId]/edit/page.tsx",
  "app/behavioral/questions/[questionId]/answers/new/page.tsx", "app/behavioral/stories/page.tsx",
  "app/behavioral/questions/[questionId]/answers/[answerId]/edit/page.tsx",
  "app/behavioral/stories/new/page.tsx", "app/behavioral/stories/[id]/page.tsx", "app/behavioral/stories/[id]/edit/page.tsx",
];
for (const route of routes) if (!existsSync(route)) failures.push(`Missing behavioral workspace route: ${route}`);

const questions = JSON.parse(read("data/behavioral/questions.json")).filter((question) => question.status === "active");
if (questions.length < 40 || questions.length > 60) failures.push(`Curated question catalog must contain 40–60 active questions; found ${questions.length}.`);
if (new Set(questions.map((question) => question.id)).size !== questions.length) failures.push("Curated behavioral question IDs are not unique.");
for (const question of questions) for (const key of ["prompt", "category", "signals", "followUps", "answerGuidance", "commonMistakes"]) if (!question[key]?.length) failures.push(`${question.id} lacks ${key}.`);

const migration = read("supabase/migrations/202608140001_create_behavioral_workspace.sql");
for (const marker of ["behavioral_custom_questions", "behavioral_stories", "behavioral_story_themes", "behavioral_story_question_links", "behavioral_answers", "enable row level security", "on delete cascade", "custom_question_id", "curated_question_id", "application_id", "Owners manage behavioral answers", "revoke all"]) requireText(migration, marker, `Behavioral migration lacks ${marker}.`);
const phase3Migration = read("supabase/migrations/202608140005_complete_behavioral_phase3.sql");
for (const marker of ["opening_framing", "details_to_emphasize", "details_to_avoid", "is_primary", "behavioral_answers_primary_curated_unique", "behavioral_answers_primary_custom_unique", "set_behavioral_primary_answer", "auth.uid()", "application_id"]) requireText(phase3Migration, marker, `Phase 3 behavioral migration lacks ${marker}.`);
const integrityMigration = read("supabase/migrations/202608140006_enforce_behavioral_relationships.sql");
for (const marker of ["behavioral_curated_questions", "behavioral_links_curated_question_fkey", "behavioral_answers_curated_question_fkey", "behavioral_saved_questions_curated_question_fkey", "behavioral_story_database_status", "revoke insert (status), update (status)", "enforce_behavioral_answer_context", "ensure_behavioral_answer_story_link", "protect_behavioral_answer_story_link"]) requireText(integrityMigration, marker, `Behavioral integrity migration lacks ${marker}.`);
const aggregateMigration = read("supabase/migrations/202609030005_save_behavioral_story_aggregate.sql");
for (const marker of [
  "set_behavioral_story_updated_at",
  "create_behavioral_story_with_themes",
  "update_behavioral_story_with_themes_if_revision",
  "duplicate_behavioral_story_with_themes",
  "pg_advisory_xact_lock",
  "story.updated_at = target_expected_updated_at",
  "greatest(",
  "old.updated_at + interval '1 microsecond'",
  "security definer",
  "set search_path = ''",
  "auth.uid()",
  "revoke insert, update on table public.behavioral_stories from authenticated",
  "revoke insert, update, delete on table public.behavioral_story_themes from authenticated",
  "Atomic Behavioral story saving is required",
  "0A000",
]) requireText(aggregateMigration, marker, `Behavioral aggregate migration lacks ${marker}.`);
for (const rpc of [
  "create_behavioral_story_with_themes(text,text,text,text,text,text,text,text,text,text,text,text,text[])",
  "update_behavioral_story_with_themes_if_revision(uuid,timestamptz,text,text,text,text,text,text,text,text,text,text,text,text,text[])",
  "duplicate_behavioral_story_with_themes(uuid)",
]) {
  check(aggregateMigration.includes(`revoke all on function public.${rpc} from public, anon, authenticated`) && aggregateMigration.includes(`grant execute on function public.${rpc} to authenticated`), `${rpc} must start closed and grant only authenticated execution`);
}
check(!aggregateMigration.includes("revoke delete on table public.behavioral_stories"), "aggregate migration preserves owner-scoped story deletion");
const themeAllowlist = aggregateMigration.match(/btrim\(supplied\.theme\) not in \(([\s\S]*?)\n\s*\)/)?.[1]?.match(/'([^']+)'/g)?.map((value) => value.slice(1, -1)) ?? [];
check(themeAllowlist.length === STORY_THEMES.length && new Set(themeAllowlist).size === STORY_THEMES.length && [...themeAllowlist].sort().join("|") === [...STORY_THEMES].sort().join("|"), "database aggregate theme allowlist exactly matches the production catalog without omissions or extras");
const answerAggregateMigration = read("supabase/migrations/202609030007_save_behavioral_answer_aggregate.sql");
for (const marker of [
  "set_behavioral_answer_updated_at",
  "create_behavioral_answer_aggregate",
  "update_behavioral_answer_aggregate_if_revision",
  "pg_advisory_xact_lock",
  "answer.updated_at = target_expected_updated_at",
  "greatest(",
  "old.updated_at + interval '1 microsecond'",
  "security definer",
  "set search_path = ''",
  "auth.uid()",
  "revoke insert, update on table public.behavioral_answers from authenticated",
  "Atomic Behavioral answer saving is required",
  "0A000",
]) requireText(answerAggregateMigration, marker, `Behavioral answer aggregate migration lacks ${marker}.`);
for (const rpc of [
  "create_behavioral_answer_aggregate(uuid,text,uuid,text,uuid,text,text,text,text,text,text,text,boolean)",
  "update_behavioral_answer_aggregate_if_revision(uuid,timestamptz,uuid,text,uuid,text,uuid,text,text,text,text,text,text,text,boolean)",
]) {
  check(answerAggregateMigration.includes(`revoke all on function public.${rpc} from public, anon, authenticated`) && answerAggregateMigration.includes(`grant execute on function public.${rpc} to authenticated`), `${rpc} must start closed and grant only authenticated execution`);
}
const createAnswerAggregateSql = sqlFunctionSource(answerAggregateMigration, "create_behavioral_answer_aggregate");
const updateAnswerAggregateSql = sqlFunctionSource(answerAggregateMigration, "update_behavioral_answer_aggregate_if_revision");
const legacyPrimarySql = sqlFunctionSource(answerAggregateMigration, "set_behavioral_primary_answer");
for (const [name, source] of [["create", createAnswerAggregateSql], ["update", updateAnswerAggregateSql]]) {
  for (const marker of ["auth.uid()", "pg_catalog.pg_advisory_xact_lock", "target_make_primary", "update public.behavioral_answers as answer", "return query"]) requireText(source, marker, `Behavioral answer ${name} RPC lacks atomic marker ${marker}.`);
  check(source.indexOf("pg_catalog.pg_advisory_xact_lock") < source.indexOf("update public.behavioral_answers as answer"), `Behavioral answer ${name} RPC must lock the owner/question key before changing primary state`);
}
check(createAnswerAggregateSql.includes("insert into public.behavioral_answers") && createAnswerAggregateSql.indexOf("update public.behavioral_answers as answer") < createAnswerAggregateSql.indexOf("insert into public.behavioral_answers"), "answer creation changes prior primary state and inserts the new aggregate in one locked function");
for (const marker of ["target_expected_updated_at is null", "for update", "if not found then", "answer.updated_at = target_expected_updated_at", "answer.id <> target_answer_id"]) requireText(updateAnswerAggregateSql, marker, `Behavioral answer CAS update lacks ${marker}.`);
check(updateAnswerAggregateSql.indexOf("for update") < updateAnswerAggregateSql.lastIndexOf("if target_make_primary") && updateAnswerAggregateSql.lastIndexOf("if target_make_primary") < updateAnswerAggregateSql.lastIndexOf("update public.behavioral_answers as answer"), "answer CAS verifies and locks the exact revision before changing sibling primary state or the target aggregate");
check(legacyPrimarySql.includes("raise exception 'Atomic Behavioral answer saving is required' using errcode = '0A000'"), "legacy primary-only RPC must be a stable authenticated no-mutation failure");
check(!answerAggregateMigration.includes("revoke select, delete on table public.behavioral_answers") && !answerAggregateMigration.includes("delete from public.behavioral_answers"), "answer aggregate migration preserves owner-scoped reads and deletion without destructive data changes");
const deleteRevisionMigration = read("supabase/migrations/202609040009_delete_behavioral_records_if_revision.sql");
for (const marker of [
  "delete_behavioral_story_if_revision",
  "delete_behavioral_answer_if_revision",
  "target_expected_updated_at",
  "pg_catalog.pg_advisory_xact_lock",
  "security definer",
  "set search_path = ''",
  "auth.uid()",
  "revoke delete on table public.behavioral_stories from authenticated",
  "revoke delete on table public.behavioral_answers from authenticated",
]) requireText(deleteRevisionMigration, marker, `Behavioral delete revision migration lacks ${marker}.`);
for (const rpc of [
  "delete_behavioral_story_if_revision(uuid,timestamptz)",
  "delete_behavioral_answer_if_revision(uuid,timestamptz,uuid,text)",
]) {
  check(deleteRevisionMigration.includes(`revoke all on function public.${rpc} from public, anon, authenticated`) && deleteRevisionMigration.includes(`grant execute on function public.${rpc} to authenticated`), `${rpc} must start closed and grant only authenticated execution`);
}
const deleteStorySql = sqlFunctionSource(deleteRevisionMigration, "delete_behavioral_story_if_revision");
const deleteAnswerSql = sqlFunctionSource(deleteRevisionMigration, "delete_behavioral_answer_if_revision");
for (const [name, source, mutation] of [
  ["story", deleteStorySql, "delete from public.behavioral_stories as story"],
  ["answer", deleteAnswerSql, "delete from public.behavioral_answers as answer"],
]) {
  for (const marker of ["auth.uid()", "target_expected_updated_at", "pg_catalog.pg_advisory_xact_lock", mutation, "return query"]) requireText(source, marker, `Behavioral ${name} delete RPC lacks ${marker}.`);
  check(source.indexOf("pg_catalog.pg_advisory_xact_lock") < source.indexOf(mutation), `Behavioral ${name} delete RPC must serialize before deleting`);
}
for (const marker of ["target_custom_question_id", "target_curated_question_id", "question_lock_key", "is not distinct from"]) requireText(deleteAnswerSql, marker, `Behavioral answer deletion lacks question correlation marker ${marker}.`);
const questionRevisionMigration = read("supabase/migrations/202609040007_save_behavioral_custom_question_if_revision.sql");
for (const marker of [
  "set_behavioral_custom_question_updated_at",
  "save_behavioral_custom_question_if_revision",
  "delete_behavioral_custom_question_if_revision",
  "target_expect_absent",
  "on conflict on constraint behavioral_custom_questions_pkey do nothing",
  "question.updated_at = target_expected_updated_at",
  "pg_catalog.pg_advisory_xact_lock",
  "greatest(",
  "old.updated_at + interval '1 microsecond'",
  "security definer",
  "set search_path = ''",
  "auth.uid()",
  "revoke insert, update, delete on table public.behavioral_custom_questions",
  "revoke insert (",
  "revoke update (",
]) requireText(questionRevisionMigration, marker, `Behavioral question revision migration lacks ${marker}.`);
for (const rpc of [
  "save_behavioral_custom_question_if_revision(uuid,boolean,timestamptz,text,text,text,text,text)",
  "delete_behavioral_custom_question_if_revision(uuid,timestamptz)",
]) {
  const functionName = rpc.slice(0, rpc.indexOf("("));
  check(questionRevisionMigration.includes(`revoke all on function public.${functionName}(`) && questionRevisionMigration.includes(`grant execute on function public.${functionName}(`), `${rpc} must start closed and grant only authenticated execution`);
}
const saveQuestionSql = sqlFunctionSource(questionRevisionMigration, "save_behavioral_custom_question_if_revision");
const deleteQuestionSql = sqlFunctionSource(questionRevisionMigration, "delete_behavioral_custom_question_if_revision");
for (const [name, source, mutation] of [["save", saveQuestionSql, "update public.behavioral_custom_questions as question"], ["delete", deleteQuestionSql, "delete from public.behavioral_custom_questions as question"]]) {
  for (const marker of ["auth.uid()", "target_question_id", "target_expected_updated_at", "pg_catalog.pg_advisory_xact_lock", mutation, "return query"]) requireText(source, marker, `Behavioral question ${name} RPC lacks ${marker}.`);
  check(source.indexOf("pg_catalog.pg_advisory_xact_lock") < source.indexOf(mutation), `Behavioral question ${name} RPC must lock before mutating`);
}
const aggregateDatabaseTest = read("supabase/tests/database/behavioral_workspace.test.sql");
for (const marker of [
  "plan(156)",
  "the exact aggregate revision updates the parent and themes",
  "a stale aggregate update preserves the parent row",
  "a stale aggregate update preserves the theme set",
  "duplicate copies the coherent theme snapshot",
  "invalid themes roll back aggregate creation",
  "clients cannot bypass aggregate revision checks with a direct story update",
  "clients cannot bypass story revision checks with a direct delete",
  "a stale story delete preserves linked answer provenance",
  "an exact story revision deletes one owned aggregate",
  "select public.replace_behavioral_story_themes",
  "deleting a story cascades its themes",
  "an exact answer revision saves content and desired primary state atomically",
  "a stale answer revision returns no row",
  "a stale aggregate update preserves the answer snapshot",
  "a rejected aggregate save leaves the prior primary unchanged",
  "clients cannot bypass aggregate answer creation",
  "clients cannot bypass aggregate answer revision checks",
  "clients cannot bypass answer revision checks with a direct delete",
  "a stale answer delete preserves the answer snapshot",
  "an exact answer revision deletes one owned answer",
  "another user receives no answer aggregate update row",
  "a missing answer aggregate update returns the same zero-row result",
  "authenticated can save a revision-checked custom question",
  "clients cannot bypass custom-question revision checks with a direct update",
  "an exact custom-question revision advances monotonically",
  "a stale custom-question revision preserves private notes",
  "another user receives no custom-question save row",
  "a stale custom-question delete preserves the question",
  "an exact custom-question delete cascades its private children",
]) requireText(aggregateDatabaseTest, marker, `Behavioral aggregate pgTAP lacks ${marker}.`);
const persistenceQualifier = read("scripts/qualify-persistence-local.mjs");
for (const marker of [
  "concurrent stale full-story saves commit exactly one coherent aggregate",
  "reversed concurrent stale saves preserve the second winner as one aggregate",
  "a concurrent Behavioral story edit read keeps the parent revision and theme snapshot coherent",
  "concurrent Behavioral story save and revision-delete accept exactly one coherent outcome",
  "concurrent duplicate captures either complete aggregate snapshot",
  "invalid aggregate themes roll back both parent and theme changes",
  "foreign and missing story duplicates are indistinguishable",
  "authenticated legacy theme replacement fails without mutation",
  "concurrent full Behavioral answer saves accept one revision and preserve the winner",
  "concurrent Behavioral answer save and revision-delete accept exactly one outcome",
  "competing Behavioral primary saves serialize to one desired primary",
  "invalid Behavioral aggregate input rolls back before changing the primary",
  "legacy primary-only mutation fails without changing the aggregate",
  "concurrent custom-question saves accept exactly one coherent snapshot",
  "stale parent-revision custom-question delete preserves the question and children",
  "revision-checked story deletion cascades themes without erasing a newer aggregate",
]) requireText(persistenceQualifier, marker, `Behavioral persistence qualification lacks ${marker}.`);
const securityQualifier = read("scripts/qualify-security-local.mjs");
for (const marker of [
  "Behavioral aggregate RPCs deny anonymous callers",
  "Behavioral aggregate derives its owner and closes direct mutation bypasses",
  "foreign and missing Behavioral aggregate targets are indistinguishable",
  "Behavioral answer aggregate derives its owner and closes split-write bypasses",
  "foreign and missing Behavioral answer targets are indistinguishable",
  "Behavioral custom-question RPCs deny anonymous and direct mutation",
  "foreign and missing Behavioral custom-question targets are indistinguishable",
]) requireText(securityQualifier, marker, `Behavioral security qualification lacks ${marker}.`);
const lifecycleQualifier = read("scripts/qualify-account-lifecycle-local.mjs");
for (const marker of ["create_behavioral_story_with_themes", "story.data[0].story_id", "create_behavioral_answer_aggregate", "answer.data?.length", "Private behavioral note"]) requireText(lifecycleQualifier, marker, `Behavioral account-lifecycle qualification lacks aggregate compatibility marker ${marker}.`);
const preparationDatabaseTest = read("supabase/tests/database/user_preparation_state.test.sql");
for (const marker of ["create_behavioral_story_with_themes", "update_behavioral_story_with_themes_if_revision", "duplicate_behavioral_story_with_themes", "invalid theme replacement leaves existing themes intact"]) requireText(preparationDatabaseTest, marker, `Behavioral preparation pgTAP compatibility lacks ${marker}.`);
const behavioralWorkspaceDoc = read("docs/behavioral-workspace.md");
for (const marker of ["one owner-scoped nested database statement", "successful null result is a missing story", "cannot pair a newer parent revision with older theme defaults", "Story deletion shares the aggregate's owner/story lock", "Answer deletion shares that owner/question lock", "202609040009_delete_behavioral_records_if_revision.sql"]) requireText(behavioralWorkspaceDoc, marker, `Behavioral workspace documentation lacks coherent edit/delete truth: ${marker}.`);

const actions = read("features/behavioral/actions.ts");
const actor = read("lib/auth/actor.ts");
for (const marker of ["getAuthenticatedActor", 'eq("user_id", current.user.id)', "createStoryAction", "updateStoryAction", "deleteStoryAction", "duplicateStoryAction", "saveQuestionAction", "deleteQuestionAction", "linkStoryAction", "linkQuestionToStoryAction", "unlinkStoryAction", "createAnswerAction", "updateAnswerAction", "deleteAnswerAction", "create_behavioral_answer_aggregate", "update_behavioral_answer_aggregate_if_revision", "save_behavioral_custom_question_if_revision", "delete_behavioral_custom_question_if_revision", "delete_behavioral_story_if_revision", "delete_behavioral_answer_if_revision"]) requireText(actions, marker, `Behavioral actions lack ${marker}.`);
for (const marker of ["auth.getUser", "getAuthenticatedActor", "createSupabaseServerClient"]) requireText(actor, marker, `Canonical behavioral actor lacks ${marker}.`);
const createStoryAction = functionSource(actions, "createStoryAction");
const updateStoryAction = functionSource(actions, "updateStoryAction");
const deleteStoryAction = functionSource(actions, "deleteStoryAction");
const duplicateStoryAction = functionSource(actions, "duplicateStoryAction");
for (const [name, body, parser, rpc] of [
  ["createStoryAction", createStoryAction, "parseBehavioralStoryActionInput", "create_behavioral_story_with_themes"],
  ["updateStoryAction", updateStoryAction, "parseBehavioralStoryActionInput", "update_behavioral_story_with_themes_if_revision"],
  ["duplicateStoryAction", duplicateStoryAction, "parseCanonicalBehavioralStoryId", "duplicate_behavioral_story_with_themes"],
]) {
  check(body.includes(parser) && body.includes(rpc), `${name} must use the frozen parser and atomic RPC`);
  check(body.indexOf(parser) < body.indexOf("getAuthenticatedActor") && body.indexOf("getAuthenticatedActor") < body.indexOf(`rpc("${rpc}"`), `${name} must parse before actor and atomic persistence work`);
  for (const obsolete of ['from("behavioral_stories").insert', 'from("behavioral_stories").update', 'rpc("replace_behavioral_story_themes"']) check(!body.includes(obsolete), `${name} must not retain split parent/theme mutation ${obsolete}`);
}
for (const [body, marker, message] of [
  [createStoryAction, "BEHAVIORAL_STORY_CREATE_ERROR", "createStoryAction must return only its stable aggregate persistence error"],
  [updateStoryAction, "BEHAVIORAL_STORY_UPDATE_ERROR", "updateStoryAction must return only its stable aggregate persistence error"],
  [updateStoryAction, "BEHAVIORAL_STORY_CONFLICT_ERROR", "updateStoryAction must return stable conflict recovery copy"],
  [duplicateStoryAction, "BEHAVIORAL_STORY_DUPLICATE_ERROR", "duplicateStoryAction must throw only its stable aggregate failure"],
]) check(body.includes(marker), message);
check(createStoryAction.indexOf("if (!parsed.ok) return") < createStoryAction.indexOf("getAuthenticatedActor"), "createStoryAction returns invalid input before actor work");
check(updateStoryAction.indexOf("if (!parsed.ok) return") < updateStoryAction.indexOf("getAuthenticatedActor"), "updateStoryAction returns invalid input before actor work");
check(createStoryAction.indexOf("parseBehavioralStoryMutationResult") < createStoryAction.indexOf("redirect("), "createStoryAction validates its RPC row before claiming success");
check(updateStoryAction.includes('outcome.status === "missing"') && updateStoryAction.includes("conflict: true") && updateStoryAction.indexOf("parseBehavioralStoryMutationResult") < updateStoryAction.indexOf("refreshBehavioral"), "updateStoryAction distinguishes a zero-row conflict and validates success before refresh");
check(duplicateStoryAction.indexOf("parseBehavioralStoryMutationResult") < duplicateStoryAction.indexOf("redirect("), "duplicateStoryAction validates its RPC row before redirecting");
check(deleteStoryAction.indexOf("parseBehavioralStoryDeleteInput") < deleteStoryAction.indexOf("getAuthenticatedActor") && deleteStoryAction.indexOf("getAuthenticatedActor") < deleteStoryAction.indexOf('rpc(\n    "delete_behavioral_story_if_revision"'), "deleteStoryAction parses the bound revision before actor and CAS deletion work");
check(deleteStoryAction.includes("parseBehavioralDeleteResult") && deleteStoryAction.includes("conflict: outcome.status === \"conflict\"") && deleteStoryAction.indexOf("parseBehavioralDeleteResult") < deleteStoryAction.indexOf("refreshBehavioral"), "deleteStoryAction accepts only a correlated row and returns a zero-row conflict without refresh");
check(!deleteStoryAction.includes('.from("behavioral_stories").delete'), "deleteStoryAction cannot bypass the revision-bound story RPC");
const saveQuestionAction = functionSource(actions, "saveQuestionAction");
const deleteQuestionAction = functionSource(actions, "deleteQuestionAction");
check(saveQuestionAction.indexOf("parseBehavioralQuestionActionInput(formData)") < saveQuestionAction.indexOf("getAuthenticatedActor") && saveQuestionAction.indexOf("getAuthenticatedActor") < saveQuestionAction.indexOf('rpc(\n    "save_behavioral_custom_question_if_revision"'), "saveQuestionAction parses the complete runtime snapshot before actor and revision-checked persistence work");
check(saveQuestionAction.includes("parseBehavioralQuestionMutationResult") && saveQuestionAction.includes('outcome.status === "conflict"') && saveQuestionAction.includes("conflict: true"), "saveQuestionAction distinguishes a zero-row conflict through its strict result parser");
check(saveQuestionAction.indexOf("parseBehavioralQuestionMutationResult") < saveQuestionAction.indexOf("refreshBehavioral()") && !saveQuestionAction.includes("redirect("), "saveQuestionAction validates one correlated row before refresh and retains the form after success");
for (const obsolete of ['from("behavioral_custom_questions").insert', 'from("behavioral_custom_questions").update', "parseQuestionForm"]) check(!saveQuestionAction.includes(obsolete), `saveQuestionAction must not retain ${obsolete}`);
check(deleteQuestionAction.indexOf("parseBehavioralQuestionRevision") < deleteQuestionAction.indexOf("getAuthenticatedActor") && deleteQuestionAction.indexOf("getAuthenticatedActor") < deleteQuestionAction.indexOf('rpc(\n    "delete_behavioral_custom_question_if_revision"'), "deleteQuestionAction validates identity and revision before actor and deletion work");
check(deleteQuestionAction.indexOf("parseBehavioralQuestionDeleteResult") < deleteQuestionAction.indexOf("refreshBehavioral()") && !deleteQuestionAction.includes('from("behavioral_custom_questions").delete'), "deleteQuestionAction accepts only one correlated RPC result before redirecting");
const createAnswerAction = functionSource(actions, "createAnswerAction");
const updateAnswerAction = functionSource(actions, "updateAnswerAction");
const deleteAnswerAction = functionSource(actions, "deleteAnswerAction");
for (const [name, body, rpc] of [
  ["createAnswerAction", createAnswerAction, "create_behavioral_answer_aggregate"],
  ["updateAnswerAction", updateAnswerAction, "update_behavioral_answer_aggregate_if_revision"],
]) {
  check(body.includes("parseBehavioralAnswerActionInput") && body.includes(rpc), `${name} must use the strict answer parser and aggregate RPC`);
  check(body.indexOf("const parsed = parseBehavioralAnswerActionInput") < body.indexOf("getAuthenticatedActor") && body.indexOf("getAuthenticatedActor") < body.indexOf(`rpc("${rpc}"`), `${name} must parse as its first action step before actor, relationship, fact, or aggregate persistence work`);
  check(body.indexOf("if (!parsed.ok) return") < body.indexOf("getAuthenticatedActor"), `${name} returns malformed runtime input before account work`);
  for (const obsolete of ['from("behavioral_answers").insert', 'from("behavioral_answers").update', 'rpc("set_behavioral_primary_answer"', "parseAnswerForm"]) check(!body.includes(obsolete), `${name} must not retain split answer/primary mutation ${obsolete}`);
}
check(createAnswerAction.includes("BEHAVIORAL_ANSWER_CREATE_ERROR") && createAnswerAction.indexOf("parseBehavioralAnswerMutationResult") < createAnswerAction.indexOf("refreshBehavioral"), "createAnswerAction validates its exact aggregate result before refresh or success navigation");
check(updateAnswerAction.includes("BEHAVIORAL_ANSWER_UPDATE_ERROR") && updateAnswerAction.includes("BEHAVIORAL_ANSWER_CONFLICT_ERROR") && updateAnswerAction.includes("conflict: true"), "updateAnswerAction keeps persistence failure distinct from a stable zero-row conflict");
check(updateAnswerAction.indexOf("parseBehavioralAnswerMutationResult") < updateAnswerAction.indexOf("refreshBehavioral") && updateAnswerAction.indexOf("refreshBehavioral") < updateAnswerAction.indexOf("redirect("), "updateAnswerAction validates one correlated saved row before refresh and redirect");
check(deleteAnswerAction.indexOf("parseBehavioralAnswerDeleteInput") < deleteAnswerAction.indexOf("getAuthenticatedActor") && deleteAnswerAction.indexOf("getAuthenticatedActor") < deleteAnswerAction.indexOf('rpc(\n    "delete_behavioral_answer_if_revision"'), "deleteAnswerAction parses question, answer, revision, and action form before actor and CAS deletion work");
check(deleteAnswerAction.includes("parseBehavioralDeleteResult") && deleteAnswerAction.includes("conflict: outcome.status === \"conflict\"") && deleteAnswerAction.indexOf("parseBehavioralDeleteResult") < deleteAnswerAction.indexOf("refreshBehavioral"), "deleteAnswerAction accepts only a correlated row and returns a zero-row conflict without refresh");
check(!deleteAnswerAction.includes('.from("behavioral_answers").delete') && deleteAnswerAction.indexOf("ownedQuestion") < deleteAnswerAction.indexOf('rpc(\n    "delete_behavioral_answer_if_revision"'), "deleteAnswerAction correlates the displayed question and cannot bypass the revision-bound answer RPC");
check(!actions.includes("parseAnswerForm") && !actions.includes('rpc("set_behavioral_primary_answer"'), "production actions remove the fail-open answer parser and legacy primary-only mutation path");
check(!actions.includes("parseQuestionForm") && !actions.includes('from("behavioral_custom_questions").insert') && !actions.includes('from("behavioral_custom_questions").update') && !actions.includes('from("behavioral_custom_questions").delete'), "production actions remove coercive and direct custom-question mutation paths");

const queries = read("lib/behavioral/queries.ts");
for (const marker of ["CURATED_BEHAVIORAL_QUESTIONS", "preparationStatus", 'return "Ready"', 'return "Drafted"', 'return "Story linked"', 'return "Not started"']) requireText(queries, marker, `Behavioral data layer lacks ${marker}.`);
requireText(queries, "getAuthenticatedActor", "Behavioral reads do not resolve the current server actor.");
if (/function getBehavioralWorkspaceData\s*\([^)]*userId/.test(queries)) failures.push("Behavioral reads accept an arbitrary user identifier.");
const editPageSource = read("app/behavioral/stories/[id]/edit/page.tsx");
const editSnapshotStart = queries.indexOf("export async function getBehavioralStoryEditSnapshot");
const editSnapshotEnd = queries.indexOf("export function linkMatchesQuestion", editSnapshotStart);
const editSnapshotQuery = queries.slice(editSnapshotStart, editSnapshotEnd);
for (const marker of ["parseCanonicalBehavioralStoryId(storyIdInput)", "getAuthenticatedActor()", '.from("behavioral_stories")', "behavioral_story_themes!behavioral_story_themes_story_owner_fkey(theme)", '.eq("id", storyId)', '.eq("user_id", current.user.id)', ".maybeSingle()", "resolveBehavioralStoryEditSnapshot", 'throw new PrivateDataUnavailableError("behavioral story")']) requireText(editSnapshotQuery, marker, `Coherent story edit query lacks ${marker}.`);
check(editSnapshotQuery.indexOf("parseCanonicalBehavioralStoryId(storyIdInput)") < editSnapshotQuery.indexOf("getAuthenticatedActor()") && editSnapshotQuery.indexOf("getAuthenticatedActor()") < editSnapshotQuery.indexOf('.from("behavioral_stories")') && editSnapshotQuery.indexOf(".maybeSingle()") < editSnapshotQuery.indexOf("resolveBehavioralStoryEditSnapshot"), "Story edit reads must validate identity, resolve the actor, issue one nested owner query, then strictly resolve its result");
for (const marker of ["getBehavioralStoryEditSnapshot(id)", "snapshot.story", "themes={[...snapshot.themes]}"]) requireText(editPageSource, marker, `Story edit route lacks coherent snapshot wiring ${marker}.`);
check(!editPageSource.includes("getBehavioralWorkspaceData") && !editPageSource.includes("data.themes.filter"), "Story editing must not reconstruct a revision and theme defaults from independent workspace requests");
const storyFormSource = read("features/behavioral/story-form.tsx");
for (const marker of ["beforeunload", "Unsaved changes", "Situation", "Task", "Action", "Result", "Reflection", "STORY_THEMES"]) requireText(storyFormSource, marker, `Story editor lacks ${marker}.`);
if (storyFormSource.includes('name="status"')) failures.push("Story readiness is still manually editable instead of deterministic.");
for (const marker of [
  "BEHAVIORAL_STORY_EXPECTED_REVISION_FIELD",
  "BEHAVIORAL_STORY_THEMES_PRESENT_FIELD",
  'value={story.updated_at}',
  'value="true"',
  "submissionPending",
  "aria-busy={pending}",
  "aria-disabled={pending}",
  'const liveStatus = pending ? "idle" : state.status',
  'role={liveStatus === "error" ? "alert" : "status"}',
  'aria-live={liveStatus === "error" ? "assertive" : "polite"}',
  'aria-atomic="true"',
  "Saving story…",
  "Review latest story in a new tab",
  'target="_blank"',
  'rel="noopener noreferrer"',
]) requireText(storyFormSource, marker, `Story editor lacks source-regressed aggregate recovery marker ${marker}.`);
const submitStart = storyFormSource.indexOf("const submit =");
const submitEnd = storyFormSource.indexOf("const liveStatus", submitStart);
const submitSource = storyFormSource.slice(submitStart, submitEnd);
for (const marker of ["event.preventDefault()", "if (submissionPending.current) return", "submissionPending.current = true", "new FormData(event.currentTarget)", "startTransition(() => formAction(formData))"]) requireText(submitSource, marker, `Story editor submit flow lacks ${marker}.`);
check(submitSource.indexOf("event.preventDefault()") < submitSource.indexOf("if (submissionPending.current) return") && submitSource.indexOf("if (submissionPending.current) return") < submitSource.indexOf("submissionPending.current = true") && submitSource.indexOf("submissionPending.current = true") < submitSource.indexOf("new FormData(event.currentTarget)") && submitSource.indexOf("new FormData(event.currentTarget)") < submitSource.indexOf("startTransition(() => formAction(formData))"), "Story editor must prevent native reset, synchronously guard duplicates, snapshot the draft, then enter the transition");
check(storyFormSource.includes("<form action={formAction}") && storyFormSource.includes("onSubmit={submit}"), "Story editor retains its host-action fallback while intercepting hydrated submissions");
check(storyFormSource.includes('const cancelHref = story ? `/behavioral/stories/${story.id}` : "/behavioral/stories"') && storyFormSource.includes('<Link href={cancelHref} target="_blank" rel="noopener noreferrer">Review latest story in a new tab</Link>'), "Conflict recovery opens the same persisted story in a safe new tab without replacing the draft");
check(!/<button[^>]*\sdisabled=\{pending\}/.test(storyFormSource), "Story editor must not use native disabled while a pending control owns focus");
check(!/behavioral-unsaved[^>]*role=/.test(storyFormSource), "Unsaved copy must not compete with the save live region");
check(storyFormSource.includes("state.fieldErrors?.short_summary") && storyFormSource.includes("state.fieldErrors?.notes"), "Story editor opens optional summary and note fields when their server errors return");
const formParts = read("features/behavioral/form-parts.tsx");
for (const marker of ['"aria-invalid": Boolean(message)', '"aria-describedby": message ? `${name}-error` : undefined', 'id={`${name}-error`}']) requireText(formParts, marker, `Behavioral field error wiring lacks ${marker}.`);
for (const name of ["title", "company_or_context", "role", "approximate_period", "project", "short_summary", "notes"]) {
  check(storyFormSource.includes(`behavioralErrorProps(state, "${name}")`), `Story editor must connect ${name} to returned field-error semantics`);
  check(storyFormSource.includes(`<BehavioralFieldError state={state} name="${name}"`), `Story editor must render the ${name} error target`);
}
for (const name of ["situation", "task", "action", "result", "reflection"]) check(storyFormSource.includes(`["${name}",`), `Story editor STAR field map must retain ${name}`);
check(storyFormSource.includes("behavioralErrorProps(state, name)") && storyFormSource.includes("<BehavioralFieldError state={state} name={name}"), "Every mapped STAR field shares the conditional aria relationship and matching error target");
check(storyFormSource.includes('<BehavioralFieldError state={state} name="themes"'), "Story editor renders the controlled-theme error target");
const questionFormSource = read("features/behavioral/question-form.tsx");
for (const marker of [
  "BEHAVIORAL_QUESTION_ID_FIELD",
  "BEHAVIORAL_QUESTION_EXPECTED_REVISION_FIELD",
  "BEHAVIORAL_QUESTION_ABSENT_REVISION",
  "submissionPending",
  "changedSinceSubmit",
  "resolveBehavioralQuestionDisplayState",
  "aria-busy={pending}",
  "aria-disabled={pending}",
  'aria-atomic="true"',
  "Review latest question in a new tab",
  'target="_blank"',
  'rel="noopener noreferrer"',
  "View question",
]) requireText(questionFormSource, marker, `Custom-question editor lacks source-regressed revision or recovery marker ${marker}.`);
const questionSubmitStart = questionFormSource.indexOf("const submit =");
const questionSubmitEnd = questionFormSource.indexOf("const displayState", questionSubmitStart);
const questionSubmitSource = questionFormSource.slice(questionSubmitStart, questionSubmitEnd);
for (const marker of ["event.preventDefault()", "if (submissionPending.current) return", "submissionPending.current = true", "setChangedSinceSubmit(false)", "setDirty(false)", "new FormData(event.currentTarget)", "startTransition(() => formAction(formData))"]) requireText(questionSubmitSource, marker, `Custom-question submit flow lacks ${marker}.`);
check(questionSubmitSource.indexOf("event.preventDefault()") < questionSubmitSource.indexOf("if (submissionPending.current) return") && questionSubmitSource.indexOf("if (submissionPending.current) return") < questionSubmitSource.indexOf("submissionPending.current = true") && questionSubmitSource.indexOf("submissionPending.current = true") < questionSubmitSource.indexOf("new FormData(event.currentTarget)") && questionSubmitSource.indexOf("new FormData(event.currentTarget)") < questionSubmitSource.indexOf("startTransition(() => formAction(formData))"), "Custom-question editor prevents native reset, blocks duplicate dispatch, captures the complete draft, then enters the action transition");
check(questionFormSource.includes("<form action={formAction} onSubmit={submit}") && questionFormSource.includes("if (submissionPending.current) setChangedSinceSubmit(true)"), "Custom-question editor retains no-JS action fallback and records edits made after the submitted snapshot");
check(!/<button[^>]*\sdisabled=\{pending\}/.test(questionFormSource), "Custom-question editor keeps the focused submit control available while pending");
for (const name of ["question_text", "category", "company_slug", "description", "notes"]) {
  check(questionFormSource.includes(`behavioralErrorProps(state, "${name}")`) && questionFormSource.includes(`<BehavioralFieldError state={state} name="${name}"`), `Custom-question editor connects ${name} to its exact server error target`);
}
const newQuestionPage = read("app/behavioral/questions/new/page.tsx");
const editQuestionPage = read("app/behavioral/questions/[questionId]/edit/page.tsx");
const questionDetailPage = read("app/behavioral/questions/[questionId]/page.tsx");
check(newQuestionPage.includes("randomUUID") && newQuestionPage.includes("<QuestionForm questionId={randomUUID()}"), "New custom questions receive a stable caller-generated mutation identity");
check(editQuestionPage.includes("<QuestionForm questionId={question.id} question={question}"), "Custom-question edits pass the exact loaded row and revision into the editor");
check(questionDetailPage.includes("deleteQuestionAction.bind(null, question.id, question.custom.updated_at)"), "Custom-question deletion submits the exact displayed revision");
const storyDetailPage = read("app/behavioral/stories/[id]/page.tsx");
for (const [source, binding, href, label] of [
  [storyDetailPage, "deleteStoryAction.bind(null, story.id, story.updated_at)", "latestHref={`/behavioral/stories/${story.id}`}", "story"],
  [questionDetailPage, "deleteAnswerAction.bind(null, question.id, answer.id, answer.updated_at)", "latestHref={answerHref}", "answer"],
]) {
  check(source.includes("RevisionConfirmAction") && source.includes(binding) && source.includes(href), `Behavioral ${label} deletion binds the exact displayed revision and safe latest-record recovery`);
}
const globalCss = read("app/globals.css");
check(globalCss.includes('.behavioral-form .button[aria-disabled="true"]') && globalCss.includes('.behavioral-form .button[aria-disabled="true"]:hover') && globalCss.includes(".behavioral-save-status"), "Story pending and save status styles stay scoped to the Behavioral aggregate editor");
const readiness = read("lib/behavioral/readiness.ts");
for (const marker of ["storyReadiness", 'return "Ready"', '"Needs detail"', "isBehavioralRoundType"]) requireText(readiness, marker, `Deterministic readiness lacks ${marker}.`);
const answerFormSource = read("features/behavioral/answer-form.tsx");
for (const marker of ['name="is_primary"', 'name="application_id"', 'readOnly={Boolean(application)}', 'name="opening_framing"', 'name="details_to_emphasize"', 'name="details_to_avoid"', "Full rehearsal draft", "Optional"]) requireText(answerFormSource, marker, `Question preparation editor lacks ${marker}.`);
for (const marker of [
  "BEHAVIORAL_ANSWER_EXPECTED_REVISION_FIELD",
  "BEHAVIORAL_ANSWER_PRIMARY_PRESENT_FIELD",
  "BEHAVIORAL_ANSWER_FACT_CONFIRMATION_PRESENT_FIELD",
  "answer.updated_at",
  "submissionPending",
  "aria-busy={pending}",
  "aria-disabled={pending}",
  'const liveStatus = pending ? "idle" : state.status',
  'role={liveStatus === "error" ? "alert" : "status"}',
  'aria-live={liveStatus === "error" ? "assertive" : "polite"}',
  'aria-atomic="true"',
  "Saving answer…",
  "Review latest answer in a new tab",
  'target="_blank"',
  'rel="noopener noreferrer"',
]) requireText(answerFormSource, marker, `Answer editor lacks source-regressed aggregate recovery marker ${marker}.`);
const answerSubmitStart = answerFormSource.indexOf("const submit =");
const answerSubmitEnd = answerFormSource.indexOf("const liveStatus", answerSubmitStart);
const answerSubmitSource = answerFormSource.slice(answerSubmitStart, answerSubmitEnd);
for (const marker of ["event.preventDefault()", "if (submissionPending.current || pending) return", "submissionPending.current = true", "new FormData(event.currentTarget)", "startTransition(() => formAction(formData))"]) requireText(answerSubmitSource, marker, `Answer editor submit flow lacks ${marker}.`);
check(answerSubmitSource.indexOf("event.preventDefault()") < answerSubmitSource.indexOf("if (submissionPending.current || pending) return") && answerSubmitSource.indexOf("if (submissionPending.current || pending) return") < answerSubmitSource.indexOf("submissionPending.current = true") && answerSubmitSource.indexOf("submissionPending.current = true") < answerSubmitSource.indexOf("new FormData(event.currentTarget)") && answerSubmitSource.indexOf("new FormData(event.currentTarget)") < answerSubmitSource.indexOf("startTransition(() => formAction(formData))"), "Answer editor must prevent native reset, synchronously guard duplicates, snapshot the draft, then enter the transition");
check(answerFormSource.includes("<form action={formAction} onSubmit={submit}") && answerFormSource.includes('answer && <input type="hidden" name={BEHAVIORAL_ANSWER_EXPECTED_REVISION_FIELD} value={answer.updated_at}'), "Answer editor retains its host-action fallback and submits the loaded revision only for edits");
check(answerFormSource.includes('<Link href={`/behavioral/questions/${questionId}`} target="_blank" rel="noopener noreferrer">Review latest answer in a new tab</Link>'), "Answer conflict recovery opens the canonical question view in a safe new tab without replacing the draft");
check(!/<button[^>]*\sdisabled=\{pending\}/.test(answerFormSource), "Answer editor must not use native disabled while its pending control owns focus");
const questionsPage = read("app/behavioral/questions/page.tsx");
for (const marker of ['type="hidden" name="application"', 'name="q"', 'name="category"', 'name="company"', 'name="source"', 'name="coverage"', "Covered", "Needs story", "Add your own", "linked"]) requireText(questionsPage, marker, `Question library lacks ${marker}.`);
const dashboard = read("app/dashboard/page.tsx");
for (const marker of ["behavioralRound", "getReadyBehavioralStoryCount", "Review stories", "?application="]) requireText(dashboard, marker, `Dashboard integration lacks ${marker}.`);
const application = read("app/applications/[id]/page.tsx");
for (const marker of ["isBehavioralRoundType", "Prepare behavioral stories", "Open behavioral"]) requireText(application, marker, `Application integration lacks ${marker}.`);
const publicPage = read("app/behavioral/page.tsx");
requireText(publicPage, "BehavioralPractice", "Public behavioral guide was replaced instead of preserved.");

if (failures.length) { console.error(`Behavioral workspace regression failed:\n- ${failures.join("\n- ")}`); process.exit(1); }
console.log(`Behavioral workspace regression passed: ${questions.length} curated questions, private STAR CRUD, many-to-many links, multiple answer variants, filters, application integration, account gating, and responsive draft-safe UI hold.`);
