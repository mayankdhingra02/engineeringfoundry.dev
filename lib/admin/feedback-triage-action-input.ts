import {
  FEEDBACK_STATUSES,
  type FeedbackStatus,
} from "../feedback/model.ts";

export const ADMIN_FEEDBACK_EXPECTED_REVISION_FIELD = "expected_updated_at";
export const ADMIN_FEEDBACK_TRIAGE_INVALID_INPUT_ERROR =
  "Review the feedback triage fields and try again.";
export const ADMIN_FEEDBACK_TRIAGE_CONFLICT_ERROR =
  "This feedback item may have changed since you opened it. Your triage was not saved. Review the latest saved version before trying again.";
export const ADMIN_FEEDBACK_TRIAGE_PERSISTENCE_ERROR =
  "The feedback item was not changed. Try again.";
export const ADMIN_FEEDBACK_TRIAGE_SAVED_MESSAGE =
  "Feedback triage saved. The original report was not modified.";
export const ADMIN_FEEDBACK_TRIAGE_EARLIER_SNAPSHOT_SAVED_MESSAGE =
  "Earlier triage settings saved. Review your current changes and save again.";

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/;
const DATABASE_TIMESTAMP_PATTERN =
  /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2}):(\d{2})(?:\.\d{1,6})?(Z|([+-])(\d{2}):(\d{2}))$/;
const ALLOWED_FIELDS = new Set([
  "feedback_id",
  ADMIN_FEEDBACK_EXPECTED_REVISION_FIELD,
  "status",
  "admin_note",
]);
const RESULT_KEYS = ["feedback_id", "status", "updated_at"];
const STATUS_IDS = new Set<unknown>(FEEDBACK_STATUSES);

export type AdminFeedbackTriageInput = Readonly<{
  feedbackId: string;
  expectedUpdatedAt: string;
  status: FeedbackStatus;
  adminNote: string | null;
}>;

export type AdminFeedbackTriageInputResult =
  | Readonly<{ ok: true; value: AdminFeedbackTriageInput }>
  | Readonly<{ ok: false }>;

export type AdminFeedbackTriageMutationResult =
  | Readonly<{ status: "saved"; updatedAt: string }>
  | Readonly<{ status: "conflict" }>
  | Readonly<{ status: "invalid" }>;

export type AdminFeedbackTriageDisplayState = Readonly<{
  status: "idle" | "pending" | "error" | "success";
  message: string;
}>;

function isPlainRecord(value: unknown): value is Record<string, unknown> {
  if (!value || typeof value !== "object" || Array.isArray(value)) return false;
  const prototype = Object.getPrototypeOf(value);
  return prototype === Object.prototype || prototype === null;
}

function hasExactKeys(value: Record<string, unknown>, expected: readonly string[]) {
  const keys = Reflect.ownKeys(value);
  return (
    keys.length === expected.length &&
    keys.every((key) => typeof key === "string" && expected.includes(key))
  );
}

function daysInMonth(year: number, month: number) {
  if (month === 2) {
    const leapYear =
      year % 4 === 0 && (year % 100 !== 0 || year % 400 === 0);
    return leapYear ? 29 : 28;
  }
  return [4, 6, 9, 11].includes(month) ? 30 : 31;
}

export function isCanonicalAdminFeedbackRevision(
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

function singletonText(form: FormData, key: string): string | null {
  const values = form.getAll(key);
  return values.length === 1 && typeof values[0] === "string"
    ? values[0]
    : null;
}

function containsUnsafeControl(value: string) {
  return Array.from(value).some((character) => {
    const codePoint = character.codePointAt(0) ?? 0;
    return (
      (codePoint < 32 && codePoint !== 9 && codePoint !== 10 && codePoint !== 13) ||
      codePoint === 127
    );
  });
}

export function parseAdminFeedbackTriageInput(
  input: unknown,
): AdminFeedbackTriageInputResult {
  if (typeof FormData === "undefined" || !(input instanceof FormData)) {
    return { ok: false };
  }
  for (const key of input.keys()) {
    if (!key.startsWith("$ACTION_") && !ALLOWED_FIELDS.has(key)) {
      return { ok: false };
    }
  }
  const feedbackId = singletonText(input, "feedback_id");
  const expectedUpdatedAt = singletonText(
    input,
    ADMIN_FEEDBACK_EXPECTED_REVISION_FIELD,
  );
  const status = singletonText(input, "status");
  const note = singletonText(input, "admin_note");
  if (
    feedbackId === null ||
    !UUID_PATTERN.test(feedbackId) ||
    expectedUpdatedAt === null ||
    !isCanonicalAdminFeedbackRevision(expectedUpdatedAt) ||
    status === null ||
    !STATUS_IDS.has(status) ||
    note === null
  ) {
    return { ok: false };
  }
  const trimmedNote = note.trim();
  if (
    Array.from(trimmedNote).length > 2_000 ||
    containsUnsafeControl(trimmedNote)
  ) {
    return { ok: false };
  }
  return {
    ok: true,
    value: {
      feedbackId,
      expectedUpdatedAt,
      status: status as FeedbackStatus,
      adminNote: trimmedNote || null,
    },
  };
}

export function parseAdminFeedbackTriageMutationResult(
  input: unknown,
  expected: Pick<AdminFeedbackTriageInput, "feedbackId" | "status">,
): AdminFeedbackTriageMutationResult {
  if (!Array.isArray(input)) return { status: "invalid" };
  if (input.length === 0) return { status: "conflict" };
  if (input.length !== 1 || !isPlainRecord(input[0])) {
    return { status: "invalid" };
  }
  const row = input[0];
  if (
    !hasExactKeys(row, RESULT_KEYS) ||
    row.feedback_id !== expected.feedbackId ||
    row.status !== expected.status ||
    !isCanonicalAdminFeedbackRevision(row.updated_at)
  ) {
    return { status: "invalid" };
  }
  return { status: "saved", updatedAt: row.updated_at };
}

export function adminFeedbackTriageDraftSignature(form: FormData) {
  return JSON.stringify([form.get("status"), form.get("admin_note")]);
}

export function resolveAdminFeedbackTriageDisplayState(
  actionState: Readonly<{
    status: "idle" | "error" | "success";
    message?: string;
  }>,
  pending: boolean,
  changedSinceSubmit: boolean,
): AdminFeedbackTriageDisplayState {
  if (pending) return { status: "pending", message: "Saving triage…" };
  if (actionState.status === "success" && changedSinceSubmit) {
    return {
      status: "success",
      message: ADMIN_FEEDBACK_TRIAGE_EARLIER_SNAPSHOT_SAVED_MESSAGE,
    };
  }
  return {
    status: actionState.status,
    message: actionState.message ?? "",
  };
}
