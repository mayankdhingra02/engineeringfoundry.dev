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
const { isBehavioralRoundType, storyReadiness } = await import("../lib/behavioral/readiness.ts");
const { STORY_THEMES } = await import("../lib/behavioral/options.ts");
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

const canonicalStoryId = "123e4567-e89b-42d3-a456-426614174000";
const canonicalStoryRevision = "2026-09-03T18:15:00.123456+00:00";
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
const aggregateDatabaseTest = read("supabase/tests/database/behavioral_workspace.test.sql");
for (const marker of [
  "plan(93)",
  "the exact aggregate revision updates the parent and themes",
  "a stale aggregate update preserves the parent row",
  "a stale aggregate update preserves the theme set",
  "duplicate copies the coherent theme snapshot",
  "invalid themes roll back aggregate creation",
  "clients cannot bypass aggregate revision checks with a direct story update",
  "clients retain owner-scoped story deletion",
  "select public.replace_behavioral_story_themes",
  "deleting a story cascades its themes",
]) requireText(aggregateDatabaseTest, marker, `Behavioral aggregate pgTAP lacks ${marker}.`);
const persistenceQualifier = read("scripts/qualify-persistence-local.mjs");
for (const marker of [
  "concurrent stale full-story saves commit exactly one coherent aggregate",
  "reversed concurrent stale saves preserve the second winner as one aggregate",
  "concurrent duplicate captures either complete aggregate snapshot",
  "invalid aggregate themes roll back both parent and theme changes",
  "foreign and missing story duplicates are indistinguishable",
  "authenticated legacy theme replacement fails without mutation",
]) requireText(persistenceQualifier, marker, `Behavioral persistence qualification lacks ${marker}.`);
const securityQualifier = read("scripts/qualify-security-local.mjs");
for (const marker of [
  "Behavioral aggregate RPCs deny anonymous callers",
  "Behavioral aggregate derives its owner and closes direct mutation bypasses",
  "foreign and missing Behavioral aggregate targets are indistinguishable",
]) requireText(securityQualifier, marker, `Behavioral security qualification lacks ${marker}.`);
const lifecycleQualifier = read("scripts/qualify-account-lifecycle-local.mjs");
for (const marker of ["create_behavioral_story_with_themes", "story.data[0].story_id", "Private behavioral note"]) requireText(lifecycleQualifier, marker, `Behavioral account-lifecycle qualification lacks aggregate compatibility marker ${marker}.`);
const preparationDatabaseTest = read("supabase/tests/database/user_preparation_state.test.sql");
for (const marker of ["create_behavioral_story_with_themes", "update_behavioral_story_with_themes_if_revision", "duplicate_behavioral_story_with_themes", "invalid theme replacement leaves existing themes intact"]) requireText(preparationDatabaseTest, marker, `Behavioral preparation pgTAP compatibility lacks ${marker}.`);

const actions = read("features/behavioral/actions.ts");
const actor = read("lib/auth/actor.ts");
for (const marker of ["getAuthenticatedActor", 'eq("user_id", current.user.id)', "createStoryAction", "updateStoryAction", "deleteStoryAction", "duplicateStoryAction", "createQuestionAction", "updateQuestionAction", "deleteQuestionAction", "linkStoryAction", "linkQuestionToStoryAction", "unlinkStoryAction", "createAnswerAction", "updateAnswerAction", "deleteAnswerAction", "set_behavioral_primary_answer"]) requireText(actions, marker, `Behavioral actions lack ${marker}.`);
for (const marker of ["auth.getUser", "getAuthenticatedActor", "createSupabaseServerClient"]) requireText(actor, marker, `Canonical behavioral actor lacks ${marker}.`);
const createStoryAction = functionSource(actions, "createStoryAction");
const updateStoryAction = functionSource(actions, "updateStoryAction");
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

const queries = read("lib/behavioral/queries.ts");
for (const marker of ["CURATED_BEHAVIORAL_QUESTIONS", "preparationStatus", 'return "Ready"', 'return "Drafted"', 'return "Story linked"', 'return "Not started"']) requireText(queries, marker, `Behavioral data layer lacks ${marker}.`);
requireText(queries, "getAuthenticatedActor", "Behavioral reads do not resolve the current server actor.");
if (/function getBehavioralWorkspaceData\s*\([^)]*userId/.test(queries)) failures.push("Behavioral reads accept an arbitrary user identifier.");
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
const globalCss = read("app/globals.css");
check(globalCss.includes('.behavioral-form .button[aria-disabled="true"]') && globalCss.includes('.behavioral-form .button[aria-disabled="true"]:hover') && globalCss.includes(".behavioral-save-status"), "Story pending and save status styles stay scoped to the Behavioral aggregate editor");
const readiness = read("lib/behavioral/readiness.ts");
for (const marker of ["storyReadiness", 'return "Ready"', '"Needs detail"', "isBehavioralRoundType"]) requireText(readiness, marker, `Deterministic readiness lacks ${marker}.`);
const answerForm = read("features/behavioral/answer-form.tsx");
for (const marker of ['name="is_primary"', 'name="application_id"', 'readOnly={Boolean(application)}', 'name="opening_framing"', 'name="details_to_emphasize"', 'name="details_to_avoid"', "Full rehearsal draft", "Optional"]) requireText(answerForm, marker, `Question preparation editor lacks ${marker}.`);
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
