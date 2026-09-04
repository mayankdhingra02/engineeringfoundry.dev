import {
  attemptDocumentFromForm,
  canonicalSystemDesignProblemIds,
  systemDesignAttemptStatuses,
  systemDesignConfidences,
  validateSystemDesignAttemptDocument,
  type SystemDesignAttemptDocument,
  type SystemDesignAttemptStatus,
  type SystemDesignConfidence,
} from "./workspace.ts";

export const SYSTEM_DESIGN_ATTEMPT_INVALID_INPUT_ERROR =
  "Review the attempt fields and try again.";
export const SYSTEM_DESIGN_ATTEMPT_CONFLICT_ERROR =
  "This attempt may have changed since you opened this page. Your edits were not saved. Review the latest saved version before trying again.";
export const SYSTEM_DESIGN_ATTEMPT_PERSISTENCE_ERROR =
  "We couldn't save this attempt.";
export const SYSTEM_DESIGN_ATTEMPT_SAVED_MESSAGE = "Attempt saved.";
export const SYSTEM_DESIGN_ATTEMPT_PENDING_MESSAGE = "Saving attempt…";
export const SYSTEM_DESIGN_ATTEMPT_EARLIER_SNAPSHOT_SAVED_MESSAGE =
  "An earlier attempt snapshot saved. Review your current changes and save again.";
export const SYSTEM_DESIGN_ATTEMPT_DELETE_ERROR =
  "We couldn't delete this attempt. It may have changed or no longer be available.";

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const POSITIVE_INTEGER_PATTERN = /^[1-9]\d*$/;
const MAX_STRUCTURED_FIELD_LENGTH = 200_000;

const DOCUMENT_FIELD_NAMES = [
  "functional_requirements",
  "non_functional_requirements",
  "capacity_assumptions",
  "capacity_calculations",
  "apis",
  "data_models",
  "high_level_design",
  "deep_dives",
  "bottlenecks",
  "failure_modes",
  "tradeoffs",
  "follow_ups",
  "final_review_notes",
] as const;

const USER_FIELD_NAMES = [
  "title",
  "status",
  "confidence",
  "application_id",
  ...DOCUMENT_FIELD_NAMES,
] as const;

const ATTEMPT_FIELD_NAMES = new Set([
  "expected_revision",
  ...USER_FIELD_NAMES,
]);

type SystemDesignAttemptSaveInput = Readonly<{
  attemptId: string;
  problemId: string;
  expectedRevision: number;
  title: string;
  status: SystemDesignAttemptStatus;
  confidence: SystemDesignConfidence | null;
  applicationId: string | null;
  document: SystemDesignAttemptDocument;
}>;

export type SystemDesignAttemptActionInputResult =
  | Readonly<{ ok: true; value: SystemDesignAttemptSaveInput }>
  | Readonly<{ ok: false }>;

export type SystemDesignAttemptSaveResult =
  | Readonly<{ status: "saved"; revision: number }>
  | Readonly<{ status: "conflict" }>
  | Readonly<{ status: "invalid" }>;

export type SystemDesignAttemptDeleteInput = Readonly<{
  attemptId: string;
  problemId: string;
  expectedRevision: number;
}>;

export type SystemDesignAttemptDeleteResult =
  | Readonly<{ status: "deleted"; attemptId: string }>
  | Readonly<{ status: "conflict" }>
  | Readonly<{ status: "invalid" }>;

export type SystemDesignAttemptDisplayState = Readonly<{
  status: "idle" | "pending" | "error" | "success";
  message: string;
  conflict?: boolean;
}>;

function isFormData(value: unknown): value is FormData {
  return typeof FormData !== "undefined" && value instanceof FormData;
}

function isPlainRecord(value: unknown): value is Record<string, unknown> {
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    return false;
  }
  const prototype = Object.getPrototypeOf(value);
  return prototype === Object.prototype || prototype === null;
}

function containsDisallowedControl(value: string) {
  for (const character of value) {
    const code = character.codePointAt(0) ?? 0;
    if (
      (code < 32 && code !== 9 && code !== 10 && code !== 13) ||
      (code >= 127 && code <= 159)
    ) {
      return true;
    }
  }
  return false;
}

function hasOnlyKnownFields(formData: FormData) {
  for (const key of formData.keys()) {
    if (!ATTEMPT_FIELD_NAMES.has(key) && !key.startsWith("$ACTION_")) {
      return false;
    }
  }
  return true;
}

function isActionOnlyFormData(input: unknown) {
  if (!isFormData(input)) return false;
  for (const key of input.keys()) {
    if (!key.startsWith("$ACTION_")) return false;
  }
  return true;
}

function singleString(formData: FormData, name: string) {
  const values = formData.getAll(name);
  if (values.length !== 1 || typeof values[0] !== "string") return null;
  return values[0];
}

function normalizedDocument(value: unknown) {
  const parsed = validateSystemDesignAttemptDocument(value);
  return parsed.ok ? parsed.data : null;
}

export function parseSystemDesignAttemptActionInput(
  attemptId: unknown,
  problemId: unknown,
  input: unknown,
): SystemDesignAttemptActionInputResult {
  if (
    typeof attemptId !== "string" ||
    !UUID_PATTERN.test(attemptId) ||
    typeof problemId !== "string" ||
    !canonicalSystemDesignProblemIds.has(problemId) ||
    !isFormData(input) ||
    !hasOnlyKnownFields(input)
  ) {
    return { ok: false };
  }

  const values = new Map<string, string>();
  for (const name of ATTEMPT_FIELD_NAMES) {
    const value = singleString(input, name);
    if (
      value === null ||
      value.length > MAX_STRUCTURED_FIELD_LENGTH ||
      containsDisallowedControl(value)
    ) {
      return { ok: false };
    }
    values.set(name, value);
  }

  const revisionText = values.get("expected_revision") as string;
  const expectedRevision = Number(revisionText);
  const title = (values.get("title") as string).trim();
  const status = values.get("status") as string;
  const confidenceValue = values.get("confidence") as string;
  const applicationValue = values.get("application_id") as string;
  if (
    !POSITIVE_INTEGER_PATTERN.test(revisionText) ||
    !Number.isSafeInteger(expectedRevision) ||
    expectedRevision >= Number.MAX_SAFE_INTEGER ||
    Array.from(title).length < 1 ||
    Array.from(title).length > 160 ||
    !systemDesignAttemptStatuses.includes(
      status as SystemDesignAttemptStatus,
    ) ||
    (confidenceValue !== "" &&
      !systemDesignConfidences.includes(
        confidenceValue as SystemDesignConfidence,
      )) ||
    (applicationValue !== "" && !UUID_PATTERN.test(applicationValue))
  ) {
    return { ok: false };
  }

  const documentResult = attemptDocumentFromForm(input);
  if (!documentResult.ok) return { ok: false };
  return {
    ok: true,
    value: {
      attemptId: attemptId.toLowerCase(),
      problemId,
      expectedRevision,
      title,
      status: status as SystemDesignAttemptStatus,
      confidence: confidenceValue
        ? (confidenceValue as SystemDesignConfidence)
        : null,
      applicationId: applicationValue
        ? applicationValue.toLowerCase()
        : null,
      document: documentResult.data,
    },
  };
}

export function parseSystemDesignAttemptSaveResult(
  value: unknown,
  expected: SystemDesignAttemptSaveInput,
): SystemDesignAttemptSaveResult {
  if (!Array.isArray(value)) return { status: "invalid" };
  if (value.length === 0) return { status: "conflict" };
  if (value.length !== 1 || !isPlainRecord(value[0])) {
    return { status: "invalid" };
  }
  const row = value[0];
  const returnedDocument = normalizedDocument(row.document);
  if (
    row.id !== expected.attemptId ||
    row.problem_id !== expected.problemId ||
    row.catalog_item_type !== "design_problem" ||
    row.title !== expected.title ||
    row.status !== expected.status ||
    row.confidence !== expected.confidence ||
    row.application_id !== expected.applicationId ||
    row.revision !== expected.expectedRevision + 1 ||
    !returnedDocument ||
    JSON.stringify(returnedDocument) !== JSON.stringify(expected.document)
  ) {
    return { status: "invalid" };
  }
  return { status: "saved", revision: row.revision as number };
}

export function parseSystemDesignAttemptDeleteInput(
  attemptIdInput: unknown,
  problemIdInput: unknown,
  revisionInput: unknown,
  formInput: unknown,
): SystemDesignAttemptDeleteInput | null {
  if (
    typeof attemptIdInput !== "string" ||
    !UUID_PATTERN.test(attemptIdInput) ||
    typeof problemIdInput !== "string" ||
    !canonicalSystemDesignProblemIds.has(problemIdInput) ||
    typeof revisionInput !== "number" ||
    !Number.isSafeInteger(revisionInput) ||
    revisionInput < 1 ||
    revisionInput >= Number.MAX_SAFE_INTEGER ||
    !isActionOnlyFormData(formInput)
  ) {
    return null;
  }
  return {
    attemptId: attemptIdInput.toLowerCase(),
    problemId: problemIdInput,
    expectedRevision: revisionInput,
  };
}

export function parseSystemDesignAttemptDeleteResult(
  value: unknown,
  expectedAttemptId: string,
): SystemDesignAttemptDeleteResult {
  if (!Array.isArray(value)) return { status: "invalid" };
  if (value.length === 0) return { status: "conflict" };
  if (value.length !== 1 || !isPlainRecord(value[0])) {
    return { status: "invalid" };
  }
  const keys = Reflect.ownKeys(value[0]);
  const attemptId = value[0].attempt_id;
  if (
    keys.length !== 1 ||
    keys[0] !== "attempt_id" ||
    typeof attemptId !== "string" ||
    !UUID_PATTERN.test(attemptId) ||
    attemptId.toLowerCase() !== expectedAttemptId
  ) {
    return { status: "invalid" };
  }
  return { status: "deleted", attemptId: attemptId.toLowerCase() };
}

export function systemDesignAttemptDraftSignature(formData: FormData) {
  return JSON.stringify(USER_FIELD_NAMES.map((name) => formData.get(name)));
}

export function resolveSystemDesignAttemptDisplayState(
  actionState: SystemDesignAttemptDisplayState,
  pending: boolean,
  changedSinceSubmit: boolean,
): SystemDesignAttemptDisplayState {
  if (pending) {
    return { status: "pending", message: SYSTEM_DESIGN_ATTEMPT_PENDING_MESSAGE };
  }
  if (actionState.status === "success" && changedSinceSubmit) {
    return {
      status: "success",
      message: SYSTEM_DESIGN_ATTEMPT_EARLIER_SNAPSHOT_SAVED_MESSAGE,
    };
  }
  return actionState;
}
