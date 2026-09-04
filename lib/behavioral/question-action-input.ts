import { normalizeCompanySlug } from "../applications/options.ts";

export const BEHAVIORAL_QUESTION_ID_FIELD = "question_id";
export const BEHAVIORAL_QUESTION_EXPECTED_REVISION_FIELD =
  "expected_updated_at";
export const BEHAVIORAL_QUESTION_ABSENT_REVISION = "absent";

export const BEHAVIORAL_QUESTION_INVALID_INPUT_ERROR =
  "Review the highlighted fields.";
export const BEHAVIORAL_QUESTION_PERSISTENCE_ERROR =
  "We couldn't save this question.";
export const BEHAVIORAL_QUESTION_CONFLICT_ERROR =
  "This question may have changed since you opened it. Your edits were not saved. Review the latest saved version before trying again.";
export const BEHAVIORAL_QUESTION_SAVED_MESSAGE = "Question saved.";
export const BEHAVIORAL_QUESTION_EARLIER_SNAPSHOT_SAVED_MESSAGE =
  "Earlier question changes saved. Review your current changes and save again.";
export const BEHAVIORAL_QUESTION_DELETE_ERROR =
  "We couldn't delete this question. It may have changed or no longer be available.";

const QUESTION_FIELDS = new Set([
  BEHAVIORAL_QUESTION_ID_FIELD,
  BEHAVIORAL_QUESTION_EXPECTED_REVISION_FIELD,
  "question_text",
  "category",
  "company_slug",
  "description",
  "notes",
]);
const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const DATABASE_TIMESTAMP_PATTERN =
  /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2}):(\d{2})(?:\.\d{1,6})?(Z|([+-])(\d{2}):(\d{2}))$/;

export type BehavioralQuestionFieldErrors = Record<string, string>;

export type BehavioralQuestionActionInput = Readonly<{
  questionId: string;
  expectAbsent: boolean;
  expectedUpdatedAt: string | null;
  question: Readonly<{
    question_text: string;
    description: string | null;
    category: string;
    company_slug: string | null;
    notes: string | null;
  }>;
}>;

export type BehavioralQuestionActionInputResult =
  | Readonly<{ ok: true; value: BehavioralQuestionActionInput }>
  | Readonly<{
      ok: false;
      reason: "invalid-input";
      fieldErrors?: BehavioralQuestionFieldErrors;
    }>;

export type BehavioralQuestionMutationResult =
  | Readonly<{ status: "saved"; questionId: string; updatedAt: string }>
  | Readonly<{ status: "conflict" }>
  | Readonly<{ status: "invalid" }>;

export type BehavioralQuestionDeleteResult =
  | Readonly<{ status: "deleted"; questionId: string }>
  | Readonly<{ status: "conflict" }>
  | Readonly<{ status: "invalid" }>;

type SingleString =
  | Readonly<{ status: "value"; value: string }>
  | Readonly<{ status: "missing" }>
  | Readonly<{ status: "invalid" }>;

function isFormData(value: unknown): value is FormData {
  return typeof FormData !== "undefined" && value instanceof FormData;
}

function hasOnlyKnownFields(formData: FormData) {
  for (const key of formData.keys()) {
    if (!QUESTION_FIELDS.has(key) && !key.startsWith("$ACTION_")) return false;
  }
  return true;
}

function singleString(formData: FormData, name: string): SingleString {
  const values = formData.getAll(name);
  if (values.length === 0) return { status: "missing" };
  if (values.length !== 1 || typeof values[0] !== "string") {
    return { status: "invalid" };
  }
  return { status: "value", value: values[0] };
}

function containsDisallowedTextControl(
  value: string,
  allowFormattingWhitespace: boolean,
) {
  for (const character of value) {
    const codePoint = character.codePointAt(0) ?? 0;
    const allowedWhitespace =
      allowFormattingWhitespace &&
      (codePoint === 9 || codePoint === 10 || codePoint === 13);
    if (
      (!allowedWhitespace && codePoint <= 31) ||
      (codePoint >= 127 && codePoint <= 159)
    ) {
      return true;
    }
  }
  return false;
}

function daysInMonth(year: number, month: number) {
  if (month === 2) {
    const leapYear =
      year % 4 === 0 && (year % 100 !== 0 || year % 400 === 0);
    return leapYear ? 29 : 28;
  }
  return [4, 6, 9, 11].includes(month) ? 30 : 31;
}

export function parseCanonicalBehavioralQuestionId(value: unknown) {
  if (typeof value !== "string" || !UUID_PATTERN.test(value)) return null;
  return value.toLowerCase();
}

export function isCanonicalBehavioralQuestionRevision(
  value: unknown,
): value is string {
  if (typeof value !== "string") return false;
  const match = DATABASE_TIMESTAMP_PATTERN.exec(value);
  if (!match || !Number.isFinite(Date.parse(value))) return false;
  const [
    ,
    yearText,
    monthText,
    dayText,
    hourText,
    minuteText,
    secondText,
    zone,
    ,
    offsetHourText,
    offsetMinuteText,
  ] = match;
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

function normalizeOptional(
  value: string,
  maximum: number,
  allowFormattingWhitespace: boolean,
) {
  const normalized = value.trim();
  if (
    Array.from(normalized).length > maximum ||
    containsDisallowedTextControl(normalized, allowFormattingWhitespace)
  ) {
    return undefined;
  }
  return normalized || null;
}

export function parseBehavioralQuestionActionInput(
  input: unknown,
): BehavioralQuestionActionInputResult {
  if (!isFormData(input) || !hasOnlyKnownFields(input)) {
    return { ok: false, reason: "invalid-input" };
  }
  const questionId = singleString(input, BEHAVIORAL_QUESTION_ID_FIELD);
  const revision = singleString(
    input,
    BEHAVIORAL_QUESTION_EXPECTED_REVISION_FIELD,
  );
  const questionText = singleString(input, "question_text");
  const category = singleString(input, "category");
  const company = singleString(input, "company_slug");
  const description = singleString(input, "description");
  const notes = singleString(input, "notes");
  if (
    questionId.status !== "value" ||
    revision.status !== "value" ||
    questionText.status !== "value" ||
    category.status !== "value" ||
    company.status !== "value" ||
    description.status !== "value" ||
    notes.status !== "value"
  ) {
    return { ok: false, reason: "invalid-input" };
  }

  const parsedQuestionId = parseCanonicalBehavioralQuestionId(questionId.value);
  const expectAbsent = revision.value === BEHAVIORAL_QUESTION_ABSENT_REVISION;
  const expectedUpdatedAt = expectAbsent ? null : revision.value;
  if (
    !parsedQuestionId ||
    (!expectAbsent &&
      !isCanonicalBehavioralQuestionRevision(expectedUpdatedAt))
  ) {
    return { ok: false, reason: "invalid-input" };
  }

  const fieldErrors: BehavioralQuestionFieldErrors = {};
  const normalizedQuestionText = questionText.value.trim();
  const normalizedCategory = category.value.trim() || "Other";
  const normalizedCompanyInput = company.value.trim();
  const normalizedDescription = normalizeOptional(description.value, 5_000, true);
  const normalizedNotes = normalizeOptional(notes.value, 20_000, true);
  if (
    Array.from(normalizedQuestionText).length < 5 ||
    Array.from(normalizedQuestionText).length > 1_000
  ) {
    fieldErrors.question_text =
      "Add a question between 5 and 1,000 characters.";
  } else if (containsDisallowedTextControl(normalizedQuestionText, true)) {
    fieldErrors.question_text =
      "Question contains unsupported control characters.";
  }
  if (
    Array.from(normalizedCategory).length > 100 ||
    containsDisallowedTextControl(normalizedCategory, false)
  ) {
    fieldErrors.category = "Category must be 100 characters or fewer.";
  }
  if (
    Array.from(normalizedCompanyInput).length > 80 ||
    containsDisallowedTextControl(normalizedCompanyInput, false)
  ) {
    fieldErrors.company_slug = "Company must be 80 characters or fewer.";
  }
  if (normalizedDescription === undefined) {
    fieldErrors.description =
      "Context must be 5,000 characters or fewer and use supported text.";
  }
  if (normalizedNotes === undefined) {
    fieldErrors.notes =
      "Notes must be 20,000 characters or fewer and use supported text.";
  }
  if (Object.keys(fieldErrors).length > 0) {
    return { ok: false, reason: "invalid-input", fieldErrors };
  }

  return {
    ok: true,
    value: {
      questionId: parsedQuestionId,
      expectAbsent,
      expectedUpdatedAt,
      question: {
        question_text: normalizedQuestionText,
        description: normalizedDescription!,
        category: normalizedCategory,
        company_slug: normalizeCompanySlug(normalizedCompanyInput),
        notes: normalizedNotes!,
      },
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

function hasExactKeys(value: Record<string, unknown>, expected: string[]) {
  const keys = Reflect.ownKeys(value);
  return (
    keys.length === expected.length &&
    keys.every(
      (key) => typeof key === "string" && expected.includes(key),
    )
  );
}

export function parseBehavioralQuestionMutationResult(
  value: unknown,
  expectedQuestionId: string,
): BehavioralQuestionMutationResult {
  if (!Array.isArray(value)) return { status: "invalid" };
  if (value.length === 0) return { status: "conflict" };
  if (value.length !== 1 || !isPlainRecord(value[0])) {
    return { status: "invalid" };
  }
  const row = value[0];
  const questionId = parseCanonicalBehavioralQuestionId(row.question_id);
  if (
    !hasExactKeys(row, ["question_id", "updated_at"]) ||
    questionId !== expectedQuestionId ||
    !isCanonicalBehavioralQuestionRevision(row.updated_at)
  ) {
    return { status: "invalid" };
  }
  return { status: "saved", questionId, updatedAt: row.updated_at };
}

export function parseBehavioralQuestionDeleteResult(
  value: unknown,
  expectedQuestionId: string,
): BehavioralQuestionDeleteResult {
  if (!Array.isArray(value)) return { status: "invalid" };
  if (value.length === 0) return { status: "conflict" };
  if (value.length !== 1 || !isPlainRecord(value[0])) {
    return { status: "invalid" };
  }
  const row = value[0];
  const questionId = parseCanonicalBehavioralQuestionId(row.question_id);
  if (
    !hasExactKeys(row, ["question_id"]) ||
    questionId !== expectedQuestionId
  ) {
    return { status: "invalid" };
  }
  return { status: "deleted", questionId };
}

export function parseBehavioralQuestionRevision(
  questionIdInput: unknown,
  revisionInput: unknown,
) {
  const questionId = parseCanonicalBehavioralQuestionId(questionIdInput);
  if (
    !questionId ||
    !isCanonicalBehavioralQuestionRevision(revisionInput)
  ) {
    return null;
  }
  return { questionId, expectedUpdatedAt: revisionInput } as const;
}

export function resolveBehavioralQuestionDisplayState(
  state: Readonly<{
    status: "idle" | "error" | "success";
    message: string;
  }>,
  pending: boolean,
  changedSinceSubmit: boolean,
) {
  if (pending) {
    return { status: "pending" as const, message: "Saving question…" };
  }
  if (state.status === "success" && changedSinceSubmit) {
    return {
      status: "success" as const,
      message: BEHAVIORAL_QUESTION_EARLIER_SNAPSHOT_SAVED_MESSAGE,
    };
  }
  return state;
}
