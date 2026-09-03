import type { DsaQuestionStatus } from "./progress.ts";

export const QUICK_DSA_PROGRESS_INVALID_INPUT_ERROR = "That practice update is not valid.";

export type QuickDsaStatusActionInput = Readonly<{
  questionId: string;
  status: DsaQuestionStatus;
}>;

export type QuickDsaBookmarkActionInput = Readonly<{
  questionId: string;
  bookmarked: boolean;
}>;

type QuickDsaActionInputResult<T> =
  | Readonly<{ ok: true; value: T }>
  | Readonly<{ ok: false; reason: "invalid-input" }>;

type SingleStringField =
  | Readonly<{ status: "value"; value: string }>
  | Readonly<{ status: "invalid" }>;

const statusFields = new Set(["question_id", "status"]);
const bookmarkFields = new Set(["question_id", "bookmarked"]);
const quickStatuses = new Set<DsaQuestionStatus>([
  "not_started",
  "attempted",
  "solved",
  "review",
]);

function isFormData(value: unknown): value is FormData {
  return typeof FormData !== "undefined" && value instanceof FormData;
}

function hasOnlyKnownFields(form: FormData, knownFields: ReadonlySet<string>) {
  for (const key of form.keys()) {
    if (!knownFields.has(key) && !key.startsWith("$ACTION_")) return false;
  }
  return true;
}

function singleString(form: FormData, name: string): SingleStringField {
  const values = form.getAll(name);
  if (values.length !== 1 || typeof values[0] !== "string") {
    return { status: "invalid" };
  }
  return { status: "value", value: values[0] };
}

function canonicalQuestionId(
  field: SingleStringField,
  canonicalQuestionIds: ReadonlySet<string>,
) {
  return field.status === "value" && canonicalQuestionIds.has(field.value)
    ? field.value
    : null;
}

export function parseQuickDsaStatusActionInput(
  input: unknown,
  canonicalQuestionIds: ReadonlySet<string>,
): QuickDsaActionInputResult<QuickDsaStatusActionInput> {
  if (!isFormData(input) || !hasOnlyKnownFields(input, statusFields)) {
    return { ok: false, reason: "invalid-input" };
  }

  const questionId = canonicalQuestionId(
    singleString(input, "question_id"),
    canonicalQuestionIds,
  );
  const status = singleString(input, "status");
  if (
    !questionId ||
    status.status !== "value" ||
    !quickStatuses.has(status.value as DsaQuestionStatus)
  ) {
    return { ok: false, reason: "invalid-input" };
  }

  return {
    ok: true,
    value: { questionId, status: status.value as DsaQuestionStatus },
  };
}

export function parseQuickDsaBookmarkActionInput(
  input: unknown,
  canonicalQuestionIds: ReadonlySet<string>,
): QuickDsaActionInputResult<QuickDsaBookmarkActionInput> {
  if (!isFormData(input) || !hasOnlyKnownFields(input, bookmarkFields)) {
    return { ok: false, reason: "invalid-input" };
  }

  const questionId = canonicalQuestionId(
    singleString(input, "question_id"),
    canonicalQuestionIds,
  );
  const bookmarked = singleString(input, "bookmarked");
  if (
    !questionId ||
    bookmarked.status !== "value" ||
    (bookmarked.value !== "true" && bookmarked.value !== "false")
  ) {
    return { ok: false, reason: "invalid-input" };
  }

  return {
    ok: true,
    value: { questionId, bookmarked: bookmarked.value === "true" },
  };
}
