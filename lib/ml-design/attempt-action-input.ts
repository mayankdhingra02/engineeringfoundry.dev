import {
  ML_DESIGN_PROBLEM_VERSION,
  canonicalMlDesignProblemSlugs,
  emptyMlDesignAttemptDocument,
  mlDesignAttemptDurations,
  mlDesignAttemptModes,
  mlDesignAttemptStatuses,
  mlDesignDecideSections,
  mlDesignRubricBands,
  mlDesignRubricDimensions,
  validateMlDesignAttemptDocument,
  type MlDesignAttemptDocument,
  type MlDesignDecideSection,
  type MlDesignAttemptDuration,
  type MlDesignAttemptMode,
  type MlDesignAttemptStatus,
} from "./attempt.ts";

export const ML_DESIGN_ATTEMPT_INVALID_INPUT_ERROR = "Review the attempt fields and try again.";
export const ML_DESIGN_ATTEMPT_CONFLICT_ERROR = "This attempt changed since you opened it. Your edits were not saved. Review the latest saved version before trying again.";
export const ML_DESIGN_ATTEMPT_PERSISTENCE_ERROR = "We couldn't save this ML Design attempt.";
export const ML_DESIGN_ATTEMPT_SAVED_MESSAGE = "Attempt saved.";
export const ML_DESIGN_ATTEMPT_PENDING_MESSAGE = "Saving attempt…";
export const ML_DESIGN_ATTEMPT_EARLIER_SNAPSHOT_SAVED_MESSAGE = "An earlier attempt snapshot saved. Review your current changes and save again.";
export const ML_DESIGN_ATTEMPT_DELETE_ERROR = "We couldn't delete this attempt. It may have changed or no longer be available.";

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const POSITIVE_INTEGER_PATTERN = /^[1-9]\d*$/;
const NONNEGATIVE_INTEGER_PATTERN = /^\d+$/;
const MAX_FORM_FIELD_LENGTH = 50_000;
const createFields = new Set(["title", "mode", "duration_minutes", "fresh_exposure"]);
const saveSingletonFields = [
  "expected_revision", "title", "status", "mode", "duration_minutes", "assumptions",
  "design_notes", "hints_used", "fresh_exposure", "follow_up_actions",
  ...mlDesignRubricDimensions.flatMap(([id]) => [`review_${id}`, `evidence_${id}`]),
] as const;
const decideFields = mlDesignDecideSections.map((id) => `decide_${id}`);
const saveFields = new Set([...saveSingletonFields, ...decideFields]);

export type MlDesignAttemptCreateInput = Readonly<{
  problemId: string;
  problemVersion: number;
  title: string;
  mode: MlDesignAttemptMode;
  durationMinutes: MlDesignAttemptDuration | null;
  document: MlDesignAttemptDocument;
}>;

export type MlDesignAttemptSaveInput = Readonly<{
  attemptId: string;
  problemId: string;
  problemVersion: number;
  expectedRevision: number;
  title: string;
  status: MlDesignAttemptStatus;
  mode: MlDesignAttemptMode;
  durationMinutes: MlDesignAttemptDuration | null;
  document: MlDesignAttemptDocument;
}>;

export type MlDesignAttemptActionResult<T> = Readonly<{ ok: true; value: T }> | Readonly<{ ok: false }>;
export type MlDesignAttemptSaveResult = Readonly<{ status: "saved"; revision: number }> | Readonly<{ status: "conflict" }> | Readonly<{ status: "invalid" }>;
export type MlDesignAttemptDeleteResult = Readonly<{ status: "deleted"; attemptId: string }> | Readonly<{ status: "conflict" }> | Readonly<{ status: "invalid" }>;
export type MlDesignAttemptDisplayState = Readonly<{ status: "idle" | "pending" | "error" | "success"; message: string; conflict?: boolean }>;

const isFormData = (value: unknown): value is FormData => typeof FormData !== "undefined" && value instanceof FormData;
const isPlainRecord = (value: unknown): value is Record<string, unknown> => {
  if (typeof value !== "object" || value === null || Array.isArray(value)) return false;
  const prototype = Object.getPrototypeOf(value);
  return prototype === Object.prototype || prototype === null;
};
const containsDisallowedControl = (value: string) => Array.from(value).some((character) => {
  const code = character.codePointAt(0) ?? 0;
  return (code < 32 && code !== 9 && code !== 10 && code !== 13) || (code >= 127 && code <= 159);
});
const stableJson = (value: unknown): string => {
  if (Array.isArray(value)) return `[${value.map(stableJson).join(",")}]`;
  if (isPlainRecord(value)) return `{${Object.keys(value).sort().map((key) => `${JSON.stringify(key)}:${stableJson(value[key])}`).join(",")}}`;
  return JSON.stringify(value) ?? "undefined";
};

function hasOnlyKnownFields(formData: FormData, allowed: ReadonlySet<string>) {
  for (const key of formData.keys()) if (!allowed.has(key) && !key.startsWith("$ACTION_")) return false;
  return true;
}

function singleString(formData: FormData, name: string) {
  const values = formData.getAll(name);
  if (values.length !== 1 || typeof values[0] !== "string") return null;
  if (values[0].length > MAX_FORM_FIELD_LENGTH || containsDisallowedControl(values[0])) return null;
  return values[0];
}

function optionalCheckbox(formData: FormData, name: string) {
  const values = formData.getAll(name);
  if (values.length === 0) return false;
  return values.length === 1 && values[0] === "yes" ? true : null;
}

function parseModeAndDuration(modeValue: string, durationValue: string) {
  if (!mlDesignAttemptModes.includes(modeValue as MlDesignAttemptMode)) return null;
  const mode = modeValue as MlDesignAttemptMode;
  if (mode !== "timed") return durationValue === "" ? { mode, durationMinutes: null } : null;
  const duration = Number(durationValue);
  return mlDesignAttemptDurations.includes(duration as MlDesignAttemptDuration)
    ? { mode, durationMinutes: duration as MlDesignAttemptDuration }
    : null;
}

function validTitle(value: string) {
  const title = value.trim();
  return Array.from(title).length >= 1 && Array.from(title).length <= 160 ? title : null;
}

export function parseMlDesignAttemptCreateInput(problemId: unknown, input: unknown): MlDesignAttemptActionResult<MlDesignAttemptCreateInput> {
  if (typeof problemId !== "string" || !canonicalMlDesignProblemSlugs.has(problemId) || !isFormData(input) || !hasOnlyKnownFields(input, createFields)) return { ok: false };
  const titleValue = singleString(input, "title");
  const modeValue = singleString(input, "mode");
  const durationValue = singleString(input, "duration_minutes");
  const exposureValue = singleString(input, "fresh_exposure");
  if (titleValue === null || modeValue === null || durationValue === null || exposureValue === null) return { ok: false };
  const title = validTitle(titleValue);
  const timing = parseModeAndDuration(modeValue, durationValue);
  if (!title || !timing || !["fresh", "repeat"].includes(exposureValue)) return { ok: false };
  return {
    ok: true,
    value: {
      problemId,
      problemVersion: ML_DESIGN_PROBLEM_VERSION,
      title,
      ...timing,
      document: emptyMlDesignAttemptDocument(exposureValue === "fresh"),
    },
  };
}

export function parseMlDesignAttemptSaveInput(attemptId: unknown, problemId: unknown, input: unknown): MlDesignAttemptActionResult<MlDesignAttemptSaveInput> {
  if (typeof attemptId !== "string" || !UUID_PATTERN.test(attemptId) || typeof problemId !== "string" || !canonicalMlDesignProblemSlugs.has(problemId) || !isFormData(input) || !hasOnlyKnownFields(input, saveFields)) return { ok: false };
  const values = new Map<string, string>();
  for (const field of saveSingletonFields) {
    const value = singleString(input, field);
    if (value === null) return { ok: false };
    values.set(field, value);
  }
  const revisionText = values.get("expected_revision") as string;
  const expectedRevision = Number(revisionText);
  const title = validTitle(values.get("title") as string);
  const statusValue = values.get("status") as string;
  const timing = parseModeAndDuration(values.get("mode") as string, values.get("duration_minutes") as string);
  const hintsText = values.get("hints_used") as string;
  const hintsUsed = Number(hintsText);
  const exposureValue = values.get("fresh_exposure") as string;
  if (!POSITIVE_INTEGER_PATTERN.test(revisionText) || !Number.isSafeInteger(expectedRevision) || expectedRevision >= Number.MAX_SAFE_INTEGER || !title || !mlDesignAttemptStatuses.includes(statusValue as MlDesignAttemptStatus) || !timing || !NONNEGATIVE_INTEGER_PATTERN.test(hintsText) || !Number.isSafeInteger(hintsUsed) || hintsUsed > 6 || !["fresh", "repeat"].includes(exposureValue)) return { ok: false };

  const completed: MlDesignDecideSection[] = [];
  for (const section of mlDesignDecideSections) {
    const checked = optionalCheckbox(input, `decide_${section}`);
    if (checked === null) return { ok: false };
    if (checked) completed.push(section);
  }
  const selfReview: MlDesignAttemptDocument["self_review"] = {};
  const dimensionEvidence: MlDesignAttemptDocument["dimension_evidence"] = {};
  for (const [dimension] of mlDesignRubricDimensions) {
    const band = values.get(`review_${dimension}`) as string;
    const evidence = values.get(`evidence_${dimension}`) as string;
    if (band !== "" && !mlDesignRubricBands.includes(band as (typeof mlDesignRubricBands)[number])) return { ok: false };
    if (band) selfReview[dimension] = band as (typeof mlDesignRubricBands)[number];
    if (evidence) dimensionEvidence[dimension] = evidence;
  }
  const followUpActions = (values.get("follow_up_actions") as string).split(/\r?\n/).map((item) => item.trim()).filter(Boolean);
  const document = validateMlDesignAttemptDocument({
    assumptions: values.get("assumptions"),
    design_notes: values.get("design_notes"),
    completed_decide_sections: completed,
    hints_used: hintsUsed,
    self_review: selfReview,
    dimension_evidence: dimensionEvidence,
    follow_up_actions: followUpActions,
    fresh_exposure: exposureValue === "fresh",
  });
  if (!document) return { ok: false };
  return { ok: true, value: { attemptId: attemptId.toLowerCase(), problemId, problemVersion: ML_DESIGN_PROBLEM_VERSION, expectedRevision, title, status: statusValue as MlDesignAttemptStatus, ...timing, document } };
}

export function parseMlDesignAttemptSaveResult(value: unknown, expected: MlDesignAttemptSaveInput): MlDesignAttemptSaveResult {
  if (!Array.isArray(value)) return { status: "invalid" };
  if (value.length === 0) return { status: "conflict" };
  if (value.length !== 1 || !isPlainRecord(value[0])) return { status: "invalid" };
  const row = value[0];
  const document = validateMlDesignAttemptDocument(row.document);
  if (row.id !== expected.attemptId || row.problem_id !== expected.problemId || row.problem_version !== expected.problemVersion || row.title !== expected.title || row.status !== expected.status || row.mode !== expected.mode || row.duration_minutes !== expected.durationMinutes || row.revision !== expected.expectedRevision + 1 || !document || stableJson(document) !== stableJson(expected.document)) return { status: "invalid" };
  return { status: "saved", revision: row.revision as number };
}

export function parseMlDesignAttemptDeleteInput(attemptId: unknown, problemId: unknown, revision: unknown, formInput: unknown) {
  if (typeof attemptId !== "string" || !UUID_PATTERN.test(attemptId) || typeof problemId !== "string" || !canonicalMlDesignProblemSlugs.has(problemId) || typeof revision !== "number" || !Number.isSafeInteger(revision) || revision < 1 || revision >= Number.MAX_SAFE_INTEGER || !isFormData(formInput)) return null;
  for (const key of formInput.keys()) if (!key.startsWith("$ACTION_")) return null;
  return { attemptId: attemptId.toLowerCase(), problemId, expectedRevision: revision };
}

export function parseMlDesignAttemptDeleteResult(value: unknown, expectedAttemptId: string): MlDesignAttemptDeleteResult {
  if (!Array.isArray(value)) return { status: "invalid" };
  if (value.length === 0) return { status: "conflict" };
  if (value.length !== 1 || !isPlainRecord(value[0]) || Reflect.ownKeys(value[0]).length !== 1 || value[0].attempt_id !== expectedAttemptId) return { status: "invalid" };
  return { status: "deleted", attemptId: expectedAttemptId };
}

export function mlDesignAttemptDraftSignature(formData: FormData) {
  return JSON.stringify([...saveSingletonFields.filter((field) => field !== "expected_revision"), ...decideFields].map((name) => formData.get(name)));
}

export function resolveMlDesignAttemptDisplayState(actionState: MlDesignAttemptDisplayState, pending: boolean, changedSinceSubmit: boolean): MlDesignAttemptDisplayState {
  if (pending) return { status: "pending", message: ML_DESIGN_ATTEMPT_PENDING_MESSAGE };
  if (actionState.status === "success" && changedSinceSubmit) return { status: "success", message: ML_DESIGN_ATTEMPT_EARLIER_SNAPSHOT_SAVED_MESSAGE };
  return actionState;
}
