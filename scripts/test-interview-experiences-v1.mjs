import fs from "node:fs";
import {
  INTERVIEW_EXPERIENCE_ABSENT_REVISION,
  INTERVIEW_EXPERIENCE_DRAFT_SAVED_MESSAGE,
  INTERVIEW_EXPERIENCE_EARLIER_DRAFT_SAVED_MESSAGE,
  INTERVIEW_EXPERIENCE_EARLIER_DELETE_SAVED_MESSAGE,
  INTERVIEW_EXPERIENCE_EARLIER_MODERATION_SAVED_MESSAGE,
  INTERVIEW_EXPERIENCE_EARLIER_SUBMISSION_SAVED_MESSAGE,
  INTERVIEW_EXPERIENCE_EARLIER_WITHDRAW_SAVED_MESSAGE,
  INTERVIEW_EXPERIENCE_EXPECTED_REVISION_FIELD,
  INTERVIEW_EXPERIENCE_MODERATION_CONFLICT_ERROR,
  parseInterviewExperienceManagementInput,
  parseInterviewExperienceModerationInput,
  parseInterviewExperienceMutationResult,
  parseInterviewExperienceSaveInput,
  resolveInterviewExperienceDisplayState,
} from "../lib/interview-experiences/action-input.ts";
import {
  INTERVIEW_EXPERIENCE_ADMIN_QUEUE_LIMIT,
  INTERVIEW_EXPERIENCE_OWNER_HISTORY_LIMIT,
  resolveAdminInterviewExperienceQueue,
  resolveInterviewExperiencePage,
  resolveOwnedInterviewExperienceHistory,
} from "../lib/interview-experiences/private-state.ts";
import {
  experienceRoundTypes,
  experienceTopics,
} from "../data/interview-experiences/index.ts";

const read = (path) => fs.readFileSync(path, "utf8");
const migration = read("supabase/migrations/202608220001_create_interview_experiences_v1.sql");
const columnPrivacyMigration = read("supabase/migrations/202608230003_restrict_public_interview_experience_columns.sql");
const revisionMigration = read("supabase/migrations/202609040003_save_interview_experience_if_revision.sql");
const experienceDatabaseTest = read("supabase/tests/database/interview_experiences_v1.test.sql");
const persistenceQualifier = read("scripts/qualify-persistence-local.mjs");
const securityQualifier = read("scripts/qualify-security-local.mjs");
const page = read("app/interview-experiences/page.tsx");
const companyPage = read("app/interview-experiences/[company]/page.tsx");
const directory = read("features/interview-experiences/experience-directory.tsx");
const publicClient = read("lib/supabase/public.ts");
const companyNormalization = read("lib/interview-experiences/company.ts");
const actions = read("app/interview-experiences/actions.ts");
const form = read("features/interview-experiences/experience-submission.tsx");
const privateState = read("lib/interview-experiences/private-state.ts");
const queries = read("lib/interview-experiences/queries.ts");
const adminActions = read("features/admin/actions.ts");
const adminForms = read("features/admin/mutation-forms.tsx");
const adminPage = read("app/admin/interview-experiences/page.tsx");
const globalStyles = read("app/globals.css");
const failures = [];
const expect = (condition, message) => { if (!condition) failures.push(message); };
const sourceBetween = (source, start, end) => {
  const startIndex = source.indexOf(start);
  const endIndex = source.indexOf(end, startIndex + start.length);
  return startIndex >= 0 && endIndex > startIndex ? source.slice(startIndex, endIndex) : "";
};

const validId = "123e4567-e89b-42d3-a456-426614174000";
const otherId = "223e4567-e89b-42d3-a456-426614174000";
const experienceIdAt = (index) => `123e4567-e89b-42d3-a456-${String(index).padStart(12, "0")}`;
const validRevision = "2026-09-04T12:34:56.123Z";
const laterRevision = "2026-09-04T12:34:57.123456+00:00";
const validSubmission = {
  id: validId,
  revision: INTERVIEW_EXPERIENCE_ABSENT_REVISION,
  companyName: "  Example Company  ",
  roleTitle: "  Senior Engineer  ",
  roleLevel: "Senior",
  region: "  Chicago  ",
  interviewDate: "2026-09",
  summary: "  A high-level account of the interview process and preparation lessons.  ",
  preparationLessons: "  Practice concise tradeoff explanations.  ",
  publicIdentity: "anonymous",
  publicationConsent: true,
  roundType: "  System Design  ",
  topics: ["  Scaling  ", "Caching"],
};

const draft = parseInterviewExperienceSaveInput(validSubmission, false);
expect(draft.ok && draft.value.submit === false && draft.value.expectAbsent && draft.value.expectedUpdatedAt === null, "A valid new private-draft request must carry an explicit absent revision without becoming a submission.");
expect(draft.ok && draft.value.input.companyName === "Example Company" && draft.value.input.roundType === "System Design" && draft.value.input.topics.join(",") === "Scaling,Caching", "The production parser must apply the bounded canonical normalization used by persistence.");
const submission = parseInterviewExperienceSaveInput(validSubmission, true);
expect(submission.ok && submission.value.submit === true && submission.value.input.id === validId, "A valid submission request must preserve its explicit submit decision and UUID.");
const existing = parseInterviewExperienceSaveInput({ ...validSubmission, id: validId.toUpperCase(), revision: validRevision }, false);
expect(existing.ok && !existing.value.expectAbsent && existing.value.expectedUpdatedAt === validRevision && existing.value.input.id === validId, "An existing save must normalize its UUID and carry the exact persisted revision.");
for (const roleLevel of ["", "Entry", "Mid", "Senior", "Staff+", "Management", "Prefer not to say"]) {
  expect(parseInterviewExperienceSaveInput({ ...validSubmission, roleLevel }, false).ok, `The supported role level ${roleLevel || "empty"} must parse.`);
}
for (const publicIdentity of ["anonymous", "username"]) {
  expect(parseInterviewExperienceSaveInput({ ...validSubmission, publicIdentity }, false).ok, `The supported public identity ${publicIdentity} must parse.`);
}
for (const action of ["withdraw", "delete"]) {
  const result = parseInterviewExperienceManagementInput(validId.toUpperCase(), action, validRevision);
  expect(result.ok && result.value.action === action && result.value.id === validId && result.value.expectedUpdatedAt === validRevision, `A valid ${action} request must carry its exact revision and normalize its UUID.`);
}

for (const input of [null, undefined, "submission", 1, true, [], [validSubmission]]) {
  expect(!parseInterviewExperienceSaveInput(input, false).ok, "Submission input must be a non-array object.");
}
for (const field of ["id", "revision", "companyName", "roleTitle", "roleLevel", "region", "interviewDate", "summary", "preparationLessons", "publicIdentity", "publicationConsent", "roundType", "topics"]) {
  const input = { ...validSubmission };
  delete input[field];
  expect(!parseInterviewExperienceSaveInput(input, false).ok, `Submission input must reject a missing ${field}.`);
}
expect(!parseInterviewExperienceSaveInput({ ...validSubmission, unexpected: true }, false).ok, "Submission input must reject unknown fields.");
for (const field of ["companyName", "roleTitle", "roleLevel", "region", "interviewDate", "summary", "preparationLessons", "roundType"]) {
  for (const value of [null, false, 1, {}, []]) {
    expect(!parseInterviewExperienceSaveInput({ ...validSubmission, [field]: value }, false).ok, `${field} must reject non-string values.`);
  }
}
for (const value of [null, "true", 1, 0, {}, []]) {
  expect(!parseInterviewExperienceSaveInput({ ...validSubmission, publicationConsent: value }, false).ok, "Publication consent must be a boolean.");
}
for (const value of [null, "Caching", {}, true, 1]) {
  expect(!parseInterviewExperienceSaveInput({ ...validSubmission, topics: value }, false).ok, "Topics must be an array.");
}
for (const value of [null, 1, true, {}, [], ["nested"]]) {
  expect(!parseInterviewExperienceSaveInput({ ...validSubmission, topics: ["Caching", value] }, false).ok, "Every topic must be a string.");
}
for (const topics of [["Caching", "Caching"], ["caching"], ["Unknown"], [...experienceTopics.slice(0, 12).map((topic) => topic.label), experienceTopics[12].label]]) {
  expect(!parseInterviewExperienceSaveInput({ ...validSubmission, topics }, false).ok, "Topics must be unique, canonical, case-exact, and bounded to twelve values.");
}
for (const roundType of ["system design", "Unknown"]) expect(!parseInterviewExperienceSaveInput({ ...validSubmission, roundType }, false).ok, "Round types must match the canonical catalog after bounded normalization.");
expect(parseInterviewExperienceSaveInput({ ...validSubmission, roundType: ` ${experienceRoundTypes[0].label} ` }, false).ok, "A canonical round type may be safely trimmed.");
expect(!parseInterviewExperienceSaveInput({ ...validSubmission, roundType: "", topics: ["Caching"] }, false).ok, "Topic selections require a canonical round type.");
for (const value of ["Anonymous", "USERNAME", "public", "", null, 1]) {
  expect(!parseInterviewExperienceSaveInput({ ...validSubmission, publicIdentity: value }, false).ok, "Public identity must use an exact allowed value.");
}
for (const value of ["entry", "Senior ", "Director", null, 1]) {
  expect(!parseInterviewExperienceSaveInput({ ...validSubmission, roleLevel: value }, false).ok, "Role level must use an exact allowed value.");
}
for (const value of ["2026-00", "2026-13", "2026-1", "026-01", "0000-01", "2026-01-01", "September 2026"]) {
  expect(!parseInterviewExperienceSaveInput({ ...validSubmission, interviewDate: value }, false).ok, `Interview month must reject ${value}.`);
}
for (const value of [undefined, null, 0, 1, "false", "true", {}, []]) {
  expect(!parseInterviewExperienceSaveInput(validSubmission, value).ok, "The submit decision must be a boolean.");
}
for (const value of [null, undefined, "", "not-a-uuid", "00000000-0000-0000-0000-000000000000", 1, {}, []]) {
  expect(!parseInterviewExperienceSaveInput({ ...validSubmission, id: value }, false).ok, "Save actions must reject invalid supplied UUIDs.");
  expect(!parseInterviewExperienceManagementInput(value, "withdraw", validRevision).ok, "Management actions must reject invalid UUIDs.");
}
for (const value of [undefined, null, "", "archive", "submit", "Withdraw", "DELETE", 1, {}, []]) {
  expect(!parseInterviewExperienceManagementInput(validId, value, validRevision).ok, "Management verbs must be present and match the exact allowlist.");
}
for (const revision of [undefined, null, "", INTERVIEW_EXPERIENCE_ABSENT_REVISION, "2026-02-30T00:00:00Z", "2026-09-04t12:34:56z", "2026-09-04T12:34:56+14:01", {}, []]) {
  expect(!parseInterviewExperienceManagementInput(validId, "withdraw", revision).ok, "Management actions must reject a missing, absent-sentinel, malformed, impossible, or non-string persisted revision.");
  if (revision !== INTERVIEW_EXPERIENCE_ABSENT_REVISION) expect(!parseInterviewExperienceSaveInput({ ...validSubmission, revision }, false).ok, "Existing-save revision input must reject malformed non-sentinel values.");
}
for (const [field, max] of [["companyName", 120], ["roleTitle", 160], ["region", 120], ["summary", 4000], ["preparationLessons", 3000]]) {
  expect(parseInterviewExperienceSaveInput({ ...validSubmission, [field]: "😀".repeat(max) }, false).ok, `${field} must accept its Unicode code-point boundary.`);
  expect(!parseInterviewExperienceSaveInput({ ...validSubmission, [field]: "😀".repeat(max + 1) }, false).ok, `${field} must reject values beyond its Unicode code-point boundary.`);
  expect(!parseInterviewExperienceSaveInput({ ...validSubmission, [field]: "safe\u0000unsafe" }, false).ok, `${field} must reject NUL.`);
}
expect(!parseInterviewExperienceSaveInput({ ...validSubmission, roundType: `${experienceRoundTypes[0].label}\u0000` }, false).ok, "Round type must reject NUL.");

const moderationForm = ({ id = validId, revision = validRevision, status = "approved", note = "  safe note  " } = {}) => {
  const value = new FormData();
  value.set("experience_id", id);
  value.set(INTERVIEW_EXPERIENCE_EXPECTED_REVISION_FIELD, revision);
  value.set("status", status);
  value.set("moderation_note", note);
  return value;
};
for (const status of ["needs_changes", "approved", "rejected"]) {
  const result = parseInterviewExperienceModerationInput(moderationForm({ id: validId.toUpperCase(), status }));
  expect(result.ok && result.value.id === validId && result.value.status === status && result.value.note === "safe note", `Moderation must parse exact ${status} with a normalized UUID and trimmed note.`);
}
const blankModeration = parseInterviewExperienceModerationInput(moderationForm({ note: "  " }));
expect(blankModeration.ok && blankModeration.value.note === null, "A blank optional moderation note must become null.");
for (const input of [null, {}, [], "form", 1]) expect(!parseInterviewExperienceModerationInput(input).ok, "Moderation input must be FormData.");
for (const field of ["experience_id", INTERVIEW_EXPERIENCE_EXPECTED_REVISION_FIELD, "status", "moderation_note"]) {
  const missing = moderationForm();
  missing.delete(field);
  expect(!parseInterviewExperienceModerationInput(missing).ok, `Moderation must reject missing ${field}.`);
  const duplicate = moderationForm();
  duplicate.append(field, field === "moderation_note" ? "second" : "duplicate");
  expect(!parseInterviewExperienceModerationInput(duplicate).ok, `Moderation must reject duplicate ${field}.`);
}
for (const [field, value] of [["experience_id", "bad-id"], [INTERVIEW_EXPERIENCE_EXPECTED_REVISION_FIELD, INTERVIEW_EXPERIENCE_ABSENT_REVISION], ["status", "Approved"], ["status", "submitted"], ["moderation_note", "x".repeat(1001)], ["moderation_note", "safe\u0000unsafe"]]) {
  const malformed = moderationForm();
  malformed.set(field, value);
  expect(!parseInterviewExperienceModerationInput(malformed).ok, `Moderation must reject malformed ${field}.`);
}
const unknownModeration = moderationForm();
unknownModeration.set("unknown", "value");
expect(!parseInterviewExperienceModerationInput(unknownModeration).ok, "Moderation must reject unknown fields.");
const metadataModeration = moderationForm();
metadataModeration.set("$ACTION_ID_example", "metadata");
expect(parseInterviewExperienceModerationInput(metadataModeration).ok, "Moderation must ignore framework action metadata.");
const fileModeration = moderationForm();
fileModeration.set("moderation_note", new Blob(["note"]), "note.txt");
expect(!parseInterviewExperienceModerationInput(fileModeration).ok, "Moderation must reject file-valued fields.");

const savedRow = { experience_id: validId.toUpperCase(), status: "draft", updated_at: laterRevision };
const savedResult = parseInterviewExperienceMutationResult([savedRow], validId, ["draft"]);
expect(savedResult.status === "saved" && savedResult.id === validId && savedResult.experienceStatus === "draft" && savedResult.updatedAt === laterRevision, "A single correlated row must produce a saved result with the advanced revision.");
expect(parseInterviewExperienceMutationResult([], validId, ["draft"]).status === "conflict", "An exact zero-row result must become conflict.");
for (const [value, expectedId, allowed] of [[null, validId, ["draft"]], [{}, validId, ["draft"]], [[savedRow, savedRow], validId, ["draft"]], [[{ ...savedRow, extra: true }], validId, ["draft"]], [[{ ...savedRow, experience_id: otherId }], validId, ["draft"]], [[{ ...savedRow, status: "submitted" }], validId, ["draft"]], [[{ ...savedRow, updated_at: "bad" }], validId, ["draft"]], [[savedRow], "bad", ["draft"]], [[savedRow], validId, []], [[savedRow], validId, ["unknown"]]]) {
  expect(parseInterviewExperienceMutationResult(value, expectedId, allowed).status === "invalid", "Mutation results must reject malformed, uncorrelated, duplicated, or context-invalid rows.");
}
expect(parseInterviewExperienceMutationResult([{ ...savedRow, status: "deleted" }], validId, ["deleted"]).status === "saved", "A correlated delete result must be distinguishable from conflict.");

const idleState = { status: "idle", message: "" };
const successState = { status: "success", message: INTERVIEW_EXPERIENCE_DRAFT_SAVED_MESSAGE };
expect(resolveInterviewExperienceDisplayState(idleState, true, true, "draft").message === "Saving private draft…", "Pending draft copy must outrank stale success and edit state.");
expect(resolveInterviewExperienceDisplayState(idleState, true, true, "submit").message === "Submitting for review…", "Pending submission copy must be exact.");
expect(resolveInterviewExperienceDisplayState(idleState, true, true, "withdraw").message === "Withdrawing your submission…", "Pending withdraw copy must be exact.");
expect(resolveInterviewExperienceDisplayState(idleState, true, true, "delete").message === "Deleting your submission…", "Pending delete copy must be exact.");
expect(resolveInterviewExperienceDisplayState(idleState, true, true, "moderation").message === "Saving moderation decision…", "Pending moderation copy must be exact.");
expect(resolveInterviewExperienceDisplayState(successState, false, true, "draft").message === INTERVIEW_EXPERIENCE_EARLIER_DRAFT_SAVED_MESSAGE, "A changed draft must report that only the earlier snapshot saved.");
expect(resolveInterviewExperienceDisplayState(successState, false, true, "submit").message === INTERVIEW_EXPERIENCE_EARLIER_SUBMISSION_SAVED_MESSAGE, "A changed submitted draft must not claim the newer edits were submitted.");
expect(resolveInterviewExperienceDisplayState(successState, false, true, "withdraw").message === INTERVIEW_EXPERIENCE_EARLIER_WITHDRAW_SAVED_MESSAGE, "A changed withdrawn draft must say the lifecycle action applied while current edits remain unsaved.");
expect(resolveInterviewExperienceDisplayState(successState, false, true, "delete").message === INTERVIEW_EXPERIENCE_EARLIER_DELETE_SAVED_MESSAGE, "A changed deleted draft must remain an explicitly unsaved new draft.");
expect(resolveInterviewExperienceDisplayState(successState, false, true, "moderation").message === INTERVIEW_EXPERIENCE_EARLIER_MODERATION_SAVED_MESSAGE, "Changed moderation fields must not be attributed to the earlier saved decision.");
const conflictDisplay = { status: "error", message: INTERVIEW_EXPERIENCE_MODERATION_CONFLICT_ERROR, conflict: true };
expect(resolveInterviewExperienceDisplayState(conflictDisplay, false, true, "moderation") === conflictDisplay, "Errors and conflicts must pass through unchanged even after later edits.");

const ownerRound = { position: 2, round_type: "System Design", topic_labels: ["Caching"] };
const ownerRow = { id: validId.toUpperCase(), status: "draft", company_name: "Example", role_title: "Engineer", role_level: null, region: null, interview_date: null, summary: "Draft", preparation_lessons: null, public_identity: "anonymous", publication_consent: false, updated_at: validRevision, review_note: null, interview_experience_rounds: [ownerRound, { ...ownerRound, position: 1, round_type: "Coding" }] };
for (const [value, expected] of [[undefined, 1], ["1", 1], ["2", 2], ["100000", 100000], ["0", 1], ["-1", 1], ["1.0", 1], ["+1", 1], [" 2", 1], ["100001", 1], [2, 1], [["2"], 1]]) {
  expect(resolveInterviewExperiencePage(value) === expected, `Page input ${String(value)} must resolve to ${expected}.`);
}
const ownerReady = resolveOwnedInterviewExperienceHistory({ data: [ownerRow], error: null, count: 1 }, 1);
expect(ownerReady.status === "ready" && ownerReady.limit === INTERVIEW_EXPERIENCE_OWNER_HISTORY_LIMIT && ownerReady.page === 1 && ownerReady.totalCount === 1 && ownerReady.totalPages === 1 && ownerReady.items[0].id === validId && ownerReady.items[0].interview_experience_rounds.map((round) => round.position).join(",") === "1,2", "Owner history must normalize IDs, order rounds, and retain exact page metadata for a valid private snapshot.");
expect(resolveOwnedInterviewExperienceHistory({ data: [], error: null, count: 0 }, 1).status === "ready", "A genuine empty owner history must stay ready rather than unavailable.");
const ownerFirstPageRows = Array.from({ length: INTERVIEW_EXPERIENCE_OWNER_HISTORY_LIMIT }, (_, index) => ({ ...ownerRow, id: experienceIdAt(index + 1) }));
const ownerFirstPage = resolveOwnedInterviewExperienceHistory({ data: ownerFirstPageRows, error: null, count: 21 }, 1);
const ownerSecondPage = resolveOwnedInterviewExperienceHistory({ data: [{ ...ownerRow, id: experienceIdAt(21) }], error: null, count: 21 }, 2);
const ownerPastEnd = resolveOwnedInterviewExperienceHistory({ data: [], error: null, count: 20 }, 2);
expect(ownerFirstPage.status === "ready" && ownerFirstPage.items.length === 20 && ownerFirstPage.totalPages === 2, "Owner history must expose the complete first-page count without truncation claims.");
expect(ownerSecondPage.status === "ready" && ownerSecondPage.items.length === 1 && ownerSecondPage.page === 2 && ownerSecondPage.totalCount === 21, "Owner history must make records beyond the first twenty reachable.");
expect(ownerPastEnd.status === "ready" && ownerPastEnd.items.length === 0 && ownerPastEnd.page === 2 && ownerPastEnd.totalPages === 1, "An owner page emptied by mutation must remain a truthful recoverable page state instead of becoming unavailable.");
for (const status of ["draft", "submitted", "needs_changes", "approved", "rejected", "archived", "withdrawn"]) expect(resolveOwnedInterviewExperienceHistory({ data: [{ ...ownerRow, status }], error: null, count: 1 }, 1).status === "ready", `Owner history must accept the persisted ${status} lifecycle.`);
for (const [result, page = 1] of [[null], [{}], [{ data: [] }], [{ error: null }], [{ data: [], error: null }], [{ data: [], error: undefined, count: 0 }], [{ data: [], error: { message: "private detail" }, count: 0 }], [{ data: [ownerRow], error: { message: "data must not win" }, count: 1 }], [{ data: [], error: null, count: 1 }], [{ data: [ownerRow], error: null, count: 0 }], [{ data: [], error: null, count: -1 }], [{ data: [], error: null, count: 1.5 }], [{ data: [{ ...ownerRow, extra: true }], error: null, count: 1 }], [{ data: [{ ...ownerRow, status: "deleted" }], error: null, count: 1 }], [{ data: [{ ...ownerRow, updated_at: "bad" }], error: null, count: 1 }], [{ data: [{ ...ownerRow, interview_experience_rounds: [ownerRound, ownerRound] }], error: null, count: 1 }], [{ data: [ownerRow, ownerRow], error: null, count: 2 }], [{ data: [ownerRow], error: null, count: 1 }, 0], [{ data: [ownerRow], error: null, count: 1 }, 100001]]) {
  expect(resolveOwnedInterviewExperienceHistory(result, page).status === "unavailable", "Malformed, failed, count-incoherent, duplicate, or invalid paginated owner history must be unavailable rather than false-empty.");
}

const adminRound = { ...ownerRound, position: 1, process_notes: "Private context" };
const adminRow = { id: validId, status: "submitted", company_name: "Example", role_title: "Engineer", role_level: "Senior", region: "Chicago", interview_date: "2026-09-01", summary: "Submitted public summary", preparation_lessons: "Practice the public lesson.", public_identity: "username", publication_consent: true, submitted_at: validRevision, updated_at: validRevision, review_note: null, interview_experience_rounds: [adminRound] };
for (const status of ["submitted", "needs_changes"]) {
  const ready = resolveAdminInterviewExperienceQueue({ data: [{ ...adminRow, status }], error: null, count: 1 }, 1);
  expect(ready.status === "ready" && ready.limit === INTERVIEW_EXPERIENCE_ADMIN_QUEUE_LIMIT && ready.page === 1 && ready.totalCount === 1 && ready.totalPages === 1 && ready.items[0].preparation_lessons === adminRow.preparation_lessons && ready.items[0].public_identity === "username", `Admin queue must preserve every public-facing field and exact count for ${status} moderation.`);
}
expect(resolveAdminInterviewExperienceQueue({ data: [], error: null, count: 0 }, 1).status === "ready", "A genuine empty moderation queue must stay ready.");
const adminFirstPageRows = Array.from({ length: INTERVIEW_EXPERIENCE_ADMIN_QUEUE_LIMIT }, (_, index) => ({ ...adminRow, id: experienceIdAt(index + 1) }));
const adminFirstPage = resolveAdminInterviewExperienceQueue({ data: adminFirstPageRows, error: null, count: 101 }, 1);
const adminSecondPage = resolveAdminInterviewExperienceQueue({ data: [{ ...adminRow, id: experienceIdAt(101) }], error: null, count: 101 }, 2);
const adminPastEnd = resolveAdminInterviewExperienceQueue({ data: [], error: null, count: 100 }, 2);
expect(adminFirstPage.status === "ready" && adminFirstPage.items.length === 100 && adminFirstPage.totalPages === 2, "Moderators must receive complete queue count truth for the first hundred reports.");
expect(adminSecondPage.status === "ready" && adminSecondPage.items.length === 1 && adminSecondPage.page === 2 && adminSecondPage.totalCount === 101, "Moderators must be able to reach reports beyond the first hundred.");
expect(adminPastEnd.status === "ready" && adminPastEnd.items.length === 0 && adminPastEnd.page === 2 && adminPastEnd.totalPages === 1, "An emptied moderation page must resolve coherently so the route can canonicalize it.");
for (const [result, page = 1] of [[null], [{}], [{ data: [] }], [{ data: [], error: undefined, count: 0 }], [{ data: [adminRow], error: { message: "private detail" }, count: 1 }], [{ data: [], error: null, count: 1 }], [{ data: [adminRow], error: null, count: 0 }], [{ data: [{ ...adminRow, preparation_lessons: 1 }], error: null, count: 1 }], [{ data: [{ ...adminRow, public_identity: "public" }], error: null, count: 1 }], [{ data: [{ ...adminRow, interview_experience_rounds: [{ ...adminRound, process_notes: "x".repeat(1501) }] }], error: null, count: 1 }], [{ data: [adminRow, adminRow], error: null, count: 2 }], [{ data: [adminRow], error: null, count: 1 }, 0]]) {
  expect(resolveAdminInterviewExperienceQueue(result, page).status === "unavailable", "Malformed, failed, count-incoherent, duplicate, or invalid paginated moderation data must be unavailable rather than a false empty queue.");
}

for (const marker of ["interview_experiences", "interview_experience_rounds", "draft','submitted','needs_changes','approved','rejected','archived","enable row level security", "approved experiences are publicly readable", "authors read own experiences", "revoke insert, update, delete", "save_interview_experience_draft", "submit_interview_experience", "withdraw_interview_experience", "delete_interview_experience"]) expect(migration.includes(marker), `Migration is missing ${marker}.`);
expect(migration.includes("status = 'approved' and publication_consent"), "Public access must be limited to approved consented reports.");
expect(columnPrivacyMigration.includes("revoke select on table public.interview_experiences from anon"), "Anon table-wide experience reads must be revoked in a forward migration.");
expect(columnPrivacyMigration.includes("revoke select on table public.interview_experience_rounds from anon"), "Anon table-wide round reads must be revoked in a forward migration.");
expect(columnPrivacyMigration.includes('to anon\nusing (status = \'approved\' and publication_consent)'), "Approved report visibility must not grant authenticated non-owners base-table access.");
const grants = new Map([...columnPrivacyMigration.matchAll(/grant select \(([\s\S]*?)\) on table public\.(\w+) to anon;/g)].map((match) => [match[2], match[1]]));
const experienceGrant = grants.get("interview_experiences") ?? "";
const roundGrant = grants.get("interview_experience_rounds") ?? "";
for (const marker of ["id", "status", "company_name", "role_title", "role_level", "region", "interview_date", "summary", "preparation_lessons", "public_identity", "publication_consent"]) expect(new RegExp(`\\b${marker}\\b`).test(experienceGrant), `Anon experience projection is missing ${marker}.`);
for (const marker of ["experience_id", "round_type", "topic_labels"]) expect(new RegExp(`\\b${marker}\\b`).test(roundGrant), `Anon round projection is missing ${marker}.`);
for (const internalColumn of ["author_id", "submitted_at", "reviewed_at", "review_note", "created_at", "updated_at"]) expect(!new RegExp(`\\b${internalColumn}\\b`).test(experienceGrant), `Anon projection must not grant ${internalColumn}.`);
for (const internalColumn of ["id", "position", "process_notes"]) expect(!new RegExp(`\\b${internalColumn}\\b`).test(roundGrant), `Anon round projection must not grant ${internalColumn}.`);
for (const marker of ['import "server-only"', "createClient", "persistSession: false", "autoRefreshToken: false", "detectSessionInUrl: false"]) expect(publicClient.includes(marker), `Public database client is missing ${marker}.`);
expect(!publicClient.includes('from "next/headers"') && !publicClient.includes("cookies()") && !publicClient.includes("createServerClient"), "Public report reads must never inherit an authenticated request session.");
expect(publicClient.includes("listPublicInterviewExperiences") && publicClient.includes('eq("status", "approved")') && publicClient.includes('eq("publication_consent", true)'), "Public report helper must keep the approved and consented boundary.");
expect(page.includes("listPublicInterviewExperiences") && !page.includes("const [publicResult, ownResult] = actor ?"), "Public directory query must not be conditional on an authenticated actor.");
expect(page.includes("actorState") && page.includes("getOwnedInterviewExperienceHistory(actorState.actor, ownerPage)") && page.includes('{ status: "anonymous" as const }') && page.includes('{ status: "unavailable" as const }'), "Private history must stay behind the verified account/actor boundary and distinguish unavailable from anonymous through the strict paginated production query helper.");
expect(!page.includes('.from("interview_experiences")') && !page.includes("publicResult.data ?? []") === false, "The route must delegate private-history access instead of issuing a second raw table query.");
expect(!page.includes("process_notes") && !directory.includes("process_notes"), "Unrendered process notes must remain outside the public projection.");
expect(page.includes("Reviewed experience directory") && directory.includes("No reviewed public interview experiences are published yet."), "Directory-first route needs an honest empty state.");
for (const marker of ["temporarily unavailable", "does not mean that no reports are published", "cannot make a completeness claim"]) expect(directory.includes(marker), `Public query failures and unconfigured environments need honest messaging: ${marker}.`);
for (const source of [page, companyPage]) expect(source.includes('dynamic = "force-dynamic"') && source.includes("listPublicInterviewExperiences"), "Every public report route must fetch the sessionless projection per request.");
expect(companyPage.includes("companyName: item.name") && companyPage.includes("ExperienceDirectory") && !companyPage.includes("No reviewed public interview experiences are published yet"), "Company-specific routes must show the scoped reviewed directory without a hard-coded false zero state.");
expect(companyPage.includes("Each contributor report reflects the contributor") && !companyPage.includes("future community experience"), "Company-specific report disclaimers must describe the live reviewed directory accurately.");
for (const marker of ["Company", "Level", "Region", "Stage"]) expect(directory.includes(marker), `Directory is missing the ${marker} filter.`);
for (const marker of ["fieldset", "legend", 'aria-live="polite"', "Reset filters", "fixedCompany", "initialCompany", "does not substitute unrelated reports"]) expect(directory.includes(marker), `Accessible company-scoped filtering is missing ${marker}.`);
for (const marker of ["canonicalInterviewExperienceCompany", "normalizeInterviewExperienceCompany"]) expect(companyNormalization.includes(marker), `Company normalization is missing ${marker}.`);
expect(actions.includes("canonicalInterviewExperienceCompany") && form.includes("canonicalInterviewExperienceCompany"), "Known company variants must be canonicalized in both client and server submission boundaries.");
expect(page.includes("Contribute a high-level experience") && page.includes("ownerState={ownerState}"), "Route must provide contribution and resolved private-history context.");
expect(page.includes("isAccountPlatformAvailable") && page.includes("accountPlatformAvailable") && page.includes("await getAuthenticatedActorState()") && page.includes('{ state: "anonymous" as const }'), "Account-disabled public routes must not initialize an authenticated contribution lookup, while Auth failures remain unavailable rather than anonymous.");
expect(page.includes("Contribution availability") && page.includes("accountPlatformAvailable={accountPlatformAvailable}") && page.includes("reports its own availability separately"), "The page must pass account availability to an honest contribution state without contradicting report-query availability.");
expect(!page.includes("share a privacy-conscious experience for moderation"), "Static metadata must not advertise contribution when the account platform can be disabled.");
const unavailableBranchStart = form.indexOf("if (!accountPlatformAvailable)");
const signedOutBranchStart = form.indexOf('if (ownerState.status === "anonymous")');
const unavailableBranch = form.slice(unavailableBranchStart, signedOutBranchStart);
expect(unavailableBranchStart >= 0 && signedOutBranchStart > unavailableBranchStart, "Account unavailability must be handled before the enabled-but-signed-out state.");
for (const marker of ["Contributions are not available in this public configuration.", "when it is available", "nothing can be submitted from this state."]) expect(unavailableBranch.includes(marker), `Account-disabled contribution state is missing ${marker}`);
expect(!unavailableBranch.includes("/signin"), "Account-disabled contribution state must not advertise an inoperable sign-in action.");
expect(form.slice(signedOutBranchStart).includes("/signin?next=/interview-experiences#contribute") && form.slice(signedOutBranchStart).includes("Sign in to contribute"), "Enabled signed-out visitors must retain the contribution sign-in handoff.");
expect(/\.experience-directory-empty p\s*\{[^}]*font-size:\s*var\(--type-meta\)/s.test(globalStyles), "Unavailable-state explanatory copy must preserve the 13px readability floor.");
for (const marker of ["getAuthenticatedActor", "save_interview_experience_if_revision", "manage_interview_experience_if_revision"]) expect(actions.includes(marker), `Contributor mutations must authenticate and use the revision-checked RPC boundary: ${marker}.`);
for (const legacy of ["save_interview_experience_draft", "submit_interview_experience", "withdraw_interview_experience", "delete_interview_experience"]) expect(!actions.includes(`"${legacy}"`), `Production contributor actions must not call legacy ${legacy}.`);
expect(!actions.includes("author_id:"), "Caller-controlled author identity is forbidden.");
const saveAction = sourceBetween(actions, "export async function saveInterviewExperience", "const managementFailureError");
const manageAction = actions.slice(actions.indexOf("export async function manageInterviewExperience"));
const saveParserIndex = saveAction.indexOf("const parsed = parseInterviewExperienceSaveInput(input, submit)");
const saveAvailabilityIndex = saveAction.indexOf("isAccountPlatformAvailable()");
const saveActorIndex = saveAction.indexOf("getAuthenticatedActor()");
const saveRpcIndex = saveAction.indexOf('rpc(\n    "save_interview_experience_if_revision"');
const saveResultIndex = saveAction.indexOf("parseInterviewExperienceMutationResult");
const saveRevalidateIndex = saveAction.indexOf('revalidatePath("/interview-experiences")');
expect(saveParserIndex >= 0 && saveParserIndex < saveAvailabilityIndex && saveAvailabilityIndex < saveActorIndex && saveActorIndex < saveRpcIndex && saveRpcIndex < saveResultIndex && saveResultIndex < saveRevalidateIndex, "Save must parse first, resolve availability/actor, use the aggregate CAS RPC, correlate its result, and revalidate only confirmed success.");
for (const marker of ["target_experience_id: validated.id", "target_expect_absent: parsed.value.expectAbsent", "target_expected_updated_at: parsed.value.expectedUpdatedAt", "target_submit: parsed.value.submit", "target_rounds: rounds as Json", "conflict: true", "revision: result.updatedAt"]) expect(saveAction.includes(marker), `Aggregate save wiring is missing ${marker}.`);
const manageParserIndex = manageAction.indexOf("parseInterviewExperienceManagementInput");
const manageAvailabilityIndex = manageAction.indexOf("isAccountPlatformAvailable()");
const manageActorIndex = manageAction.indexOf("getAuthenticatedActor()");
const manageRpcIndex = manageAction.indexOf('rpc(\n    "manage_interview_experience_if_revision"');
const manageResultIndex = manageAction.indexOf("parseInterviewExperienceMutationResult");
const manageRevalidateIndex = manageAction.indexOf('revalidatePath("/interview-experiences")');
expect(manageParserIndex >= 0 && manageParserIndex < manageAvailabilityIndex && manageAvailabilityIndex < manageActorIndex && manageActorIndex < manageRpcIndex && manageRpcIndex < manageResultIndex && manageResultIndex < manageRevalidateIndex, "Management must parse the revision-bound verb before account work, correlate the CAS result, and revalidate only confirmed success.");
for (const marker of ["target_experience_id: parsed.value.id", "target_expected_updated_at: parsed.value.expectedUpdatedAt", "target_action: parsed.value.action", 'parsed.value.action === "withdraw" ? "withdrawn" : "deleted"', "conflict: true", "revision: result.updatedAt"]) expect(manageAction.includes(marker), `Revision-checked management wiring is missing ${marker}.`);

expect(queries.includes('.eq("author_id", actor.user.id)') && queries.includes("resolveOwnedInterviewExperienceHistory") && queries.includes("INTERVIEW_EXPERIENCE_OWNER_HISTORY_LIMIT") && queries.includes('{ count: "exact" }') && queries.includes(".range(from, from + INTERVIEW_EXPERIENCE_OWNER_HISTORY_LIMIT - 1)"), "Owner history query must be explicitly owner-scoped, exactly counted, stably paginated, and strictly resolved.");
expect(queries.includes('.in("status", ["submitted", "needs_changes"])') && queries.includes("resolveAdminInterviewExperienceQueue") && queries.includes("INTERVIEW_EXPERIENCE_ADMIN_QUEUE_LIMIT") && queries.includes(".range(from, from + INTERVIEW_EXPERIENCE_ADMIN_QUEUE_LIMIT - 1)"), "Moderation queue query must be lifecycle-scoped, exactly counted, stably paginated, and strictly resolved.");
for (const marker of ['.order("updated_at", { ascending: false })', '.order("submitted_at", { ascending: true, nullsFirst: false })', '.order("id", { ascending: true })']) expect(queries.includes(marker), `Private pagination needs deterministic ordering: ${marker}.`);
for (const field of ["preparation_lessons", "public_identity", "publication_consent", "interview_experience_rounds(position,round_type,topic_labels,process_notes)"]) expect(queries.includes(field), `Moderation projection must include public-facing ${field}.`);
expect(privateState.includes("resolveOwnedInterviewExperienceHistory") && privateState.includes("resolveAdminInterviewExperienceQueue") && privateState.includes('return { status: "unavailable" }'), "Private query failures and malformed rows must resolve to explicit unavailable states.");
for (const marker of ["resolveInterviewExperiencePage", "totalCount", "totalPages", "expectedLength", "new Set(items.map((item) => item.id))"]) expect(privateState.includes(marker), `Private page resolution is missing ${marker}.`);
expect(form.includes('if (ownerState.status === "unavailable")') && form.includes("OwnedHistoryUnavailable") && form.includes("This does not mean that you have no saved reports."), "Failed private history must not render a false empty list.");
for (const marker of ["Your submissions", "private reports, newest first.", 'aria-label="Your submission pages"', 'aria-current="page"', "ownerHistoryHref", "Previous", "Next", "ownerState.totalCount", "ownerState.totalPages", "ownerPageOutOfRange", "Your current form is", "Return to the last available page", "event.preventDefault()"] ) expect(form.includes(marker), `Owner history pagination UI is missing ${marker}.`);
expect(!form.includes("Pagination is not available yet.") && !form.includes("Your latest submissions"), "Owner history must not retain obsolete truncation copy.");
for (const marker of ["searchParams", "resolveInterviewExperiencePage", "submissions_page", "getOwnedInterviewExperienceHistory(actorState.actor, ownerPage)"]) expect(page.includes(marker), `Owner history route pagination is missing ${marker}.`);
expect(!page.includes("redirect("), "Owner history revalidation must not redirect and discard a locally preserved in-flight draft.");
expect(adminPage.includes('queue.status === "unavailable"') && adminPage.includes("AdminInterviewExperienceQueueUnavailable") && adminForms.includes("This does not mean that no reports need review."), "Failed moderation queries must not render a false empty queue.");
for (const marker of ["searchParams", "resolveInterviewExperiencePage", "moderationQueueHref", "page > queue.totalPages", 'aria-label="Interview Experience moderation pages"', 'aria-current="page"', "queue.totalCount", "Previous", "Next"]) expect(adminPage.includes(marker), `Moderation queue pagination is missing ${marker}.`);
expect(!adminPage.includes("Work these reports before relying on this view as the complete queue."), "Moderation must not retain obsolete first-page incompleteness copy.");
for (const marker of ["experience.preparation_lessons", "Preparation lessons", "experience.public_identity", "Public attribution:", "experience.publication_consent", "Submitted round context"]) expect(adminPage.includes(marker), `Moderators must see every public-facing submitted field: ${marker}.`);

const moderationAction = adminActions.slice(adminActions.indexOf("export async function moderateInterviewExperienceAction"));
const moderationParserIndex = moderationAction.indexOf("const parsed = parseInterviewExperienceModerationInput(form)");
const moderationActorIndex = moderationAction.indexOf("requireAdminActor");
const moderationRpcIndex = moderationAction.indexOf('rpc("moderate_interview_experience_if_revision"');
const moderationResultIndex = moderationAction.indexOf("parseInterviewExperienceMutationResult");
const moderationRevalidateIndex = moderationAction.indexOf("revalidatePath");
expect(moderationParserIndex >= 0 && moderationParserIndex < moderationActorIndex && moderationActorIndex < moderationRpcIndex && moderationRpcIndex < moderationResultIndex && moderationResultIndex < moderationRevalidateIndex, "Moderation must parse the exact FormData first, authorize the operator, call the revision CAS RPC, correlate its result, and revalidate only confirmed success.");
for (const marker of ["target_experience_id: parsed.value.id", "target_expected_updated_at: parsed.value.expectedUpdatedAt", "target_status: parsed.value.status", "target_moderation_note: parsed.value.note", "conflict: true", "revision: result.updatedAt"]) expect(moderationAction.includes(marker), `Moderation CAS wiring is missing ${marker}.`);
expect(!moderationAction.includes('rpc("moderate_interview_experience"'), "Production moderation must not invoke the retired legacy RPC.");

for (const marker of ["Save private draft", "Submit for review", "Withdraw", "Delete", "publicationConsent", "exact proprietary questions", "editableStatuses", "inputFromOwnedExperience(item)", "Cancel edit", "Preview report", "Return to edit", "This is not public yet", "preview.publicationConsent"]) expect(form.includes(marker), `Submission UI is missing ${marker}.`);
expect(form.includes('editableStatuses.has(item.status) && <button') && !form.includes('submitted", "approved"'), "Only draft, needs_changes, and withdrawn reports may enter edit mode.");
for (const marker of ["inputRef", "mutationPending", "submittedDraftSignature", "changedSinceSubmit", "draftSignature(inputRef.current)", "setChangedSinceSubmit(changed)", "revision: result.revision", "resolveInterviewExperienceDisplayState", 'aria-busy={pending}', 'aria-disabled={pending}', 'aria-atomic="true"', 'rel="noopener noreferrer"', "Review latest in a new tab"]) expect(form.includes(marker), `Draft-safe contribution wiring is missing ${marker}.`);
expect((form.match(/if \(mutationPending\.current\) return;/g) ?? []).length >= 3 && form.includes("if (mutationPending.current || !editableStatuses.has(item.status)) return") && (form.match(/if \(!mutationPending\.current\) setView/g) ?? []).length >= 2, "Save, management, edit, cancel, and preview/return handlers must share the synchronous same-tick mutation guard.");
expect(form.includes("submittedDraftSignature.current = signature") && form.includes("setChangedSinceSubmit(false)") && form.indexOf("submittedDraftSignature.current = signature") < form.indexOf("startTransition(async () =>"), "The exact draft snapshot must be captured before the asynchronous save begins.");
expect(form.includes("if (changed)") && form.includes("id: null") && form.includes("revision: INTERVIEW_EXPERIENCE_ABSENT_REVISION"), "A submitted earlier snapshot must preserve newer edits as a new unsent private draft.");
const manageUi = sourceBetween(form, "const manage = (", "const edit = (");
for (const marker of ["const managesActiveDraft = inputRef.current.id === item.id", "const signature = managesActiveDraft", "submittedDraftSignature.current = signature", "setMutationContext(action)", "draftSignature(inputRef.current) !== signature", "setChangedSinceSubmit(changed)"]) expect(manageUi.includes(marker), `Management must capture and compare the active draft snapshot: ${marker}.`);
expect(manageUi.includes("if (changed)") && manageUi.includes("...inputRef.current") && manageUi.includes("id: null") && manageUi.includes("revision: INTERVIEW_EXPERIENCE_ABSENT_REVISION") && manageUi.indexOf("if (changed)") < manageUi.indexOf("replaceInput(emptyDraft)"), "Deleting an earlier snapshot must preserve newer edits as a new unsaved draft; only an unchanged delete may clear the form.");
expect(manageUi.includes("revision: result.revision"), "A confirmed withdraw must advance the active draft revision without replacing its current fields.");
expect(/\.experience-submission \.button\[aria-disabled="true"\][\s\S]*?\.admin-mutation-form \.button\[aria-disabled="true"\]/.test(globalStyles) && /\.experience-submission \.button\[aria-disabled="true"\]:hover/.test(globalStyles), "Pending contributor and moderator controls need scoped hover-neutral aria-disabled treatment.");
expect(/\.experience-pagination\s*\{[^}]*display:\s*flex[^}]*border-top:/s.test(globalStyles) && /@media \(max-width: 760px\)[\s\S]*?\.experience-pagination\s*\{[^}]*justify-content:\s*space-between/s.test(globalStyles), "Owner pagination needs a compact desktop treatment and responsive mobile spacing.");

for (const marker of ["submissionPending", "submittedDraftSignature", "changedSinceSubmit", "event.preventDefault()", "new FormData(event.currentTarget)", "setChangedSinceSubmit(false)", "startTransition(() => action(formData))", "resolveInterviewExperienceDisplayState", 'name={INTERVIEW_EXPERIENCE_EXPECTED_REVISION_FIELD}', 'value={state.revision ?? revision}', 'aria-busy={pending}', 'aria-disabled={pending}', 'aria-atomic="true"', 'href="/admin/interview-experiences"', 'target="_blank"', 'rel="noopener noreferrer"']) expect(adminForms.includes(marker), `Draft-safe moderation wiring is missing ${marker}.`);
const adminSubmit = sourceBetween(adminForms, "const submit = (event: FormEvent<HTMLFormElement>) =>", "const displayState");
expect(adminSubmit.indexOf("event.preventDefault()") >= 0 && adminSubmit.indexOf("event.preventDefault()") < adminSubmit.indexOf("if (submissionPending.current) return") && adminSubmit.indexOf("if (submissionPending.current) return") < adminSubmit.indexOf("submissionPending.current = true") && adminSubmit.indexOf("submissionPending.current = true") < adminSubmit.indexOf("new FormData(event.currentTarget)") && adminSubmit.indexOf("new FormData(event.currentTarget)") < adminSubmit.indexOf("startTransition(() => action(formData))"), "Moderation manual submit must prevent native reset, synchronously reject duplicates, snapshot fields, then dispatch the action.");

const sqlFunction = (name, nextName) => sourceBetween(revisionMigration, `create or replace function public.${name}`, `create or replace function public.${nextName}`);
const saveSql = sqlFunction("save_interview_experience_if_revision", "manage_interview_experience_if_revision");
const manageSql = sqlFunction("manage_interview_experience_if_revision", "moderate_interview_experience_if_revision");
const moderationSql = sourceBetween(revisionMigration, "create or replace function public.moderate_interview_experience_if_revision", "revoke all on function public.save_interview_experience_if_revision");
for (const [source, markers] of [[saveSql, ["auth.uid()", "pg_advisory_xact_lock", "target_expect_absent", "target_expected_updated_at", "on conflict (id) do nothing", "experience.author_id = current_user_id", "delete from public.interview_experience_rounds", "insert into public.interview_experience_rounds", "return query select saved_experience_id, saved_status, saved_updated_at"]], [manageSql, ["auth.uid()", "pg_advisory_xact_lock", "experience.author_id = current_user_id", "experience.updated_at = target_expected_updated_at", "target_action = 'withdraw'", "delete from public.interview_experiences", "return query select saved_experience_id, saved_status, saved_updated_at"]], [moderationSql, ["public.is_current_admin()", "pg_advisory_xact_lock", "experience.updated_at = target_expected_updated_at", "prior_status not in ('submitted', 'needs_changes')", "insert into public.admin_audit_events", "return query select saved_experience_id, saved_status, saved_updated_at"]]]) {
  for (const marker of markers) expect(source.includes(marker), `Revision migration function is missing ${marker}.`);
}
for (const rpc of ["save_interview_experience_if_revision(uuid,boolean,timestamptz,boolean,text,text,text,text,date,text,text,text,boolean,jsonb)", "manage_interview_experience_if_revision(uuid,timestamptz,text)", "moderate_interview_experience_if_revision(uuid,timestamptz,text,text)"]) {
  expect(revisionMigration.includes(`revoke all on function public.${rpc}`) && revisionMigration.includes(`grant execute on function public.${rpc}`), `Revision RPC ${rpc} needs explicit deny-then-authenticated grant handling.`);
}
for (const marker of ["Revision-checked interview experience saving is required", "Revision-checked interview experience submission is required", "Revision-checked interview experience management is required", "Revision-checked interview experience moderation is required", "using errcode = '0A000'"]) expect(revisionMigration.includes(marker), `Legacy mutation fail-safe is missing ${marker}.`);
expect(experienceDatabaseTest.includes("select plan(50);") && experienceDatabaseTest.includes("revision-checked aggregate save exists") && experienceDatabaseTest.includes("stale withdraw returns zero") && experienceDatabaseTest.includes("exact revision delete returns a bounded deleted result"), "Focused pgTAP must cover the frozen revision aggregate, conflict, and lifecycle contract.");
for (const marker of ["concurrent Interview Experience full saves commit one coherent parent and round snapshot", "concurrent Interview Experience save and submit preserve one desired aggregate state", "concurrent Interview Experience resubmit and moderation cannot approve unseen content"]) expect(persistenceQualifier.includes(marker), `Persistence qualification is missing ${marker}.`);
for (const marker of ["Interview Experience revision RPCs deny anonymous callers", "Interview Experience aggregate derives its owner and retires split mutation paths", "foreign and missing Interview Experience revision targets are indistinguishable"]) expect(securityQualifier.includes(marker), `Security qualification is missing ${marker}.`);
if (failures.length) { console.error(failures.join("\n")); process.exit(1); }
console.log("Interview Experiences v1 passed: strict runtime parsing, paginated private-history truth, revision-checked aggregates, draft-safe source integration, complete moderation, and controlled publication boundaries are present.");
