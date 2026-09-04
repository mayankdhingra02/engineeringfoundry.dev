import type { DsaConfidence, DsaQuestionStatus } from "./progress.ts";

export const DSA_PROGRESS_EXPECTED_REVISION_FIELD = "expected_updated_at";
export const DSA_PROGRESS_ABSENT_REVISION = "absent";
export const DSA_PROGRESS_CONFIDENCE_PRESENT_FIELD = "confidence_present";
export const DSA_PROGRESS_BOOKMARK_PRESENT_FIELD = "bookmarked_present";

export const DSA_PROGRESS_INVALID_INPUT_ERROR =
  "Review the practice values and try again.";
export const DSA_PROGRESS_CONFLICT_ERROR =
  "This practice record may have changed since you opened this page. Your changes were not saved. Review the latest saved version before trying again.";
export const DSA_PROGRESS_PERSISTENCE_ERROR =
  "We couldn't save this practice update.";
export const DSA_PROGRESS_SAVED_MESSAGE = "Practice progress saved.";

const PROGRESS_INPUT_FIELDS = new Set([
  "question_id",
  "status",
  "confidence",
  DSA_PROGRESS_CONFIDENCE_PRESENT_FIELD,
  "bookmarked",
  DSA_PROGRESS_BOOKMARK_PRESENT_FIELD,
  "notes",
  DSA_PROGRESS_EXPECTED_REVISION_FIELD,
]);
const PROGRESS_STATUSES = new Set<DsaQuestionStatus>([
  "not_started",
  "attempted",
  "solved",
  "review",
]);
const PROGRESS_CONFIDENCES = new Set<DsaConfidence>([
  "low",
  "medium",
  "high",
]);
const DATABASE_TIMESTAMP_PATTERN =
  /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2}):(\d{2})(?:\.\d{1,6})?(Z|([+-])(\d{2}):(\d{2}))$/;

export type DsaQuestionProgressActionInput = Readonly<{
  questionId: string;
  status: DsaQuestionStatus;
  confidence: DsaConfidence | null;
  bookmarked: boolean;
  notes: string | null;
  expectAbsent: boolean;
  expectedUpdatedAt: string | null;
  revision: string;
}>;

export type DsaQuestionProgressActionInputResult =
  | Readonly<{ ok: true; value: DsaQuestionProgressActionInput }>
  | Readonly<{ ok: false; reason: "invalid-input" }>;

export type DsaQuestionProgressSaveResult =
  | Readonly<{ status: "saved"; updatedAt: string }>
  | Readonly<{ status: "conflict" }>
  | Readonly<{ status: "invalid" }>;

type SingleString =
  | Readonly<{ status: "value"; value: string }>
  | Readonly<{ status: "missing" }>
  | Readonly<{ status: "invalid" }>;

function isFormData(value: unknown): value is FormData {
  return typeof FormData !== "undefined" && value instanceof FormData;
}

function hasOnlyKnownFields(form: FormData) {
  for (const key of form.keys()) {
    if (!PROGRESS_INPUT_FIELDS.has(key) && !key.startsWith("$ACTION_")) {
      return false;
    }
  }
  return true;
}

function singleString(
  form: FormData,
  name: string,
  required = true,
): SingleString {
  const values = form.getAll(name);
  if (values.length === 0 && !required) return { status: "missing" };
  if (values.length !== 1 || typeof values[0] !== "string") {
    return { status: "invalid" };
  }
  return { status: "value", value: values[0] };
}

function daysInMonth(year: number, month: number) {
  if (month === 2) {
    const leapYear = year % 4 === 0 && (year % 100 !== 0 || year % 400 === 0);
    return leapYear ? 29 : 28;
  }
  return [4, 6, 9, 11].includes(month) ? 30 : 31;
}

function containsDisallowedTextControl(value: string) {
  for (const character of value) {
    const codePoint = character.codePointAt(0) ?? 0;
    const allowedWhitespace = codePoint === 9 || codePoint === 10 || codePoint === 13;
    if (
      (!allowedWhitespace && codePoint <= 31) ||
      (codePoint >= 127 && codePoint <= 159)
    ) {
      return true;
    }
  }
  return false;
}

export function isCanonicalDsaProgressRevision(value: unknown): value is string {
  if (typeof value !== "string") return false;
  const match = DATABASE_TIMESTAMP_PATTERN.exec(value);
  if (!match || !Number.isFinite(Date.parse(value))) return false;

  const [, yearText, monthText, dayText, hourText, minuteText, secondText, zone, , offsetHourText, offsetMinuteText] = match;
  const year = Number(yearText);
  const month = Number(monthText);
  const day = Number(dayText);
  const hour = Number(hourText);
  const minute = Number(minuteText);
  const second = Number(secondText);
  if (
    year < 1 ||
    month < 1 ||
    month > 12 ||
    day < 1 ||
    day > daysInMonth(year, month) ||
    hour > 23 ||
    minute > 59 ||
    second > 59
  ) {
    return false;
  }

  if (zone !== "Z") {
    const offsetHour = Number(offsetHourText);
    const offsetMinute = Number(offsetMinuteText);
    if (
      offsetHour > 14 ||
      offsetMinute > 59 ||
      (offsetHour === 14 && offsetMinute !== 0)
    ) {
      return false;
    }
  }
  return true;
}

export function parseDsaQuestionProgressActionInput(
  input: unknown,
  canonicalQuestionIds: ReadonlySet<string>,
): DsaQuestionProgressActionInputResult {
  if (!isFormData(input) || !hasOnlyKnownFields(input)) {
    return { ok: false, reason: "invalid-input" };
  }

  const questionId = singleString(input, "question_id");
  const status = singleString(input, "status");
  const confidence = singleString(input, "confidence", false);
  const confidencePresent = singleString(
    input,
    DSA_PROGRESS_CONFIDENCE_PRESENT_FIELD,
  );
  const bookmarked = singleString(input, "bookmarked", false);
  const bookmarkPresent = singleString(
    input,
    DSA_PROGRESS_BOOKMARK_PRESENT_FIELD,
  );
  const notes = singleString(input, "notes");
  const revision = singleString(input, DSA_PROGRESS_EXPECTED_REVISION_FIELD);

  if (
    questionId.status !== "value" ||
    !canonicalQuestionIds.has(questionId.value) ||
    status.status !== "value" ||
    !PROGRESS_STATUSES.has(status.value as DsaQuestionStatus) ||
    confidencePresent.status !== "value" ||
    confidencePresent.value !== "true" ||
    (confidence.status === "value" &&
      !PROGRESS_CONFIDENCES.has(confidence.value as DsaConfidence)) ||
    confidence.status === "invalid" ||
    bookmarkPresent.status !== "value" ||
    bookmarkPresent.value !== "true" ||
    (bookmarked.status === "value" && bookmarked.value !== "true") ||
    bookmarked.status === "invalid" ||
    notes.status !== "value" ||
    containsDisallowedTextControl(notes.value) ||
    Array.from(notes.value).length > 5_000 ||
    revision.status !== "value" ||
    (revision.value !== DSA_PROGRESS_ABSENT_REVISION &&
      !isCanonicalDsaProgressRevision(revision.value))
  ) {
    return { ok: false, reason: "invalid-input" };
  }

  const expectAbsent = revision.value === DSA_PROGRESS_ABSENT_REVISION;
  return {
    ok: true,
    value: {
      questionId: questionId.value,
      status: status.value as DsaQuestionStatus,
      confidence:
        confidence.status === "value"
          ? (confidence.value as DsaConfidence)
          : null,
      bookmarked: bookmarked.status === "value",
      notes: notes.value.trim() || null,
      expectAbsent,
      expectedUpdatedAt: expectAbsent ? null : revision.value,
      revision: revision.value,
    },
  };
}

function isPlainRecord(value: unknown): value is Record<string, unknown> {
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    return false;
  }
  const prototype = Object.getPrototypeOf(value);
  return prototype === Object.prototype || prototype === null;
}

export function parseDsaQuestionProgressSaveResult(
  value: unknown,
  expectedQuestionId: string,
  canonicalQuestionIds: ReadonlySet<string>,
): DsaQuestionProgressSaveResult {
  if (!Array.isArray(value)) return { status: "invalid" };
  if (value.length === 0) return { status: "conflict" };
  if (value.length !== 1 || !isPlainRecord(value[0])) {
    return { status: "invalid" };
  }

  const keys = Reflect.ownKeys(value[0]);
  if (
    keys.length !== 2 ||
    !keys.includes("question_id") ||
    !keys.includes("updated_at") ||
    value[0].question_id !== expectedQuestionId ||
    typeof value[0].question_id !== "string" ||
    !canonicalQuestionIds.has(value[0].question_id) ||
    !isCanonicalDsaProgressRevision(value[0].updated_at)
  ) {
    return { status: "invalid" };
  }

  return { status: "saved", updatedAt: value[0].updated_at };
}
