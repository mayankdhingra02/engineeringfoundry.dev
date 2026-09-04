import type {
  SystemDesignConfidence,
  SystemDesignStatus,
} from "./workspace.ts";

export const SYSTEM_DESIGN_PROGRESS_EXPECTED_REVISION_FIELD =
  "expected_updated_at";
export const SYSTEM_DESIGN_PROGRESS_ABSENT_REVISION = "absent";
export const SYSTEM_DESIGN_PROGRESS_BOOKMARK_PRESENT_FIELD =
  "bookmarked_present";

export const SYSTEM_DESIGN_PROGRESS_INVALID_INPUT_ERROR =
  "Review the progress fields and try again.";
export const SYSTEM_DESIGN_PROGRESS_CONFLICT_ERROR =
  "This progress record may have changed since you opened this page. Your changes were not saved. Review the latest saved version before trying again.";
export const SYSTEM_DESIGN_PROGRESS_PERSISTENCE_ERROR =
  "We couldn't save this progress update.";
export const SYSTEM_DESIGN_PROGRESS_SAVED_MESSAGE = "Progress saved.";

const PROGRESS_INPUT_FIELDS = new Set([
  "item_id",
  "item_type",
  "status",
  "confidence",
  "bookmarked",
  SYSTEM_DESIGN_PROGRESS_BOOKMARK_PRESENT_FIELD,
  "notes",
  SYSTEM_DESIGN_PROGRESS_EXPECTED_REVISION_FIELD,
]);
const ITEM_TYPES = new Set<SystemDesignItemType>([
  "concept",
  "design_problem",
]);
const PROGRESS_STATUSES = new Set<SystemDesignStatus>([
  "not_started",
  "reviewed",
  "review",
  "comfortable",
]);
const PROGRESS_CONFIDENCES = new Set<SystemDesignConfidence>([
  "low",
  "medium",
  "high",
]);
const DATABASE_TIMESTAMP_PATTERN =
  /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2}):(\d{2})(?:\.\d{1,6})?(Z|([+-])(\d{2}):(\d{2}))$/;

export type SystemDesignItemType = "concept" | "design_problem";

export type SystemDesignItemProgressActionInput = Readonly<{
  itemId: string;
  itemType: SystemDesignItemType;
  status: SystemDesignStatus;
  confidence: SystemDesignConfidence | null;
  bookmarked: boolean;
  notes: string | null;
  expectAbsent: boolean;
  expectedUpdatedAt: string | null;
  revision: string;
}>;

export type SystemDesignItemProgressActionInputResult =
  | Readonly<{ ok: true; value: SystemDesignItemProgressActionInput }>
  | Readonly<{ ok: false; reason: "invalid-input" }>;

export type SystemDesignItemProgressSaveResult =
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
    const leapYear =
      year % 4 === 0 && (year % 100 !== 0 || year % 400 === 0);
    return leapYear ? 29 : 28;
  }
  return [4, 6, 9, 11].includes(month) ? 30 : 31;
}

function containsDisallowedTextControl(value: string) {
  for (const character of value) {
    const codePoint = character.codePointAt(0) ?? 0;
    const allowedWhitespace =
      codePoint === 9 || codePoint === 10 || codePoint === 13;
    if (
      (!allowedWhitespace && codePoint <= 31) ||
      (codePoint >= 127 && codePoint <= 159)
    ) {
      return true;
    }
  }
  return false;
}

export function isCanonicalSystemDesignProgressRevision(
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

export function parseSystemDesignItemProgressActionInput(
  input: unknown,
  canonicalItemIds: ReadonlySet<string>,
): SystemDesignItemProgressActionInputResult {
  if (!isFormData(input) || !hasOnlyKnownFields(input)) {
    return { ok: false, reason: "invalid-input" };
  }

  const itemId = singleString(input, "item_id");
  const itemType = singleString(input, "item_type");
  const status = singleString(input, "status");
  const confidence = singleString(input, "confidence");
  const bookmarked = singleString(input, "bookmarked", false);
  const bookmarkPresent = singleString(
    input,
    SYSTEM_DESIGN_PROGRESS_BOOKMARK_PRESENT_FIELD,
  );
  const notes = singleString(input, "notes");
  const revision = singleString(
    input,
    SYSTEM_DESIGN_PROGRESS_EXPECTED_REVISION_FIELD,
  );

  if (
    itemId.status !== "value" ||
    itemType.status !== "value" ||
    !ITEM_TYPES.has(itemType.value as SystemDesignItemType) ||
    !canonicalItemIds.has(`${itemType.value}:${itemId.value}`) ||
    status.status !== "value" ||
    !PROGRESS_STATUSES.has(status.value as SystemDesignStatus) ||
    confidence.status !== "value" ||
    (confidence.value !== "" &&
      !PROGRESS_CONFIDENCES.has(confidence.value as SystemDesignConfidence)) ||
    bookmarkPresent.status !== "value" ||
    bookmarkPresent.value !== "true" ||
    (bookmarked.status === "value" && bookmarked.value !== "true") ||
    bookmarked.status === "invalid" ||
    notes.status !== "value" ||
    containsDisallowedTextControl(notes.value) ||
    Array.from(notes.value).length > 10_000 ||
    revision.status !== "value" ||
    (revision.value !== SYSTEM_DESIGN_PROGRESS_ABSENT_REVISION &&
      !isCanonicalSystemDesignProgressRevision(revision.value))
  ) {
    return { ok: false, reason: "invalid-input" };
  }

  const expectAbsent =
    revision.value === SYSTEM_DESIGN_PROGRESS_ABSENT_REVISION;
  return {
    ok: true,
    value: {
      itemId: itemId.value,
      itemType: itemType.value as SystemDesignItemType,
      status: status.value as SystemDesignStatus,
      confidence:
        confidence.value === ""
          ? null
          : (confidence.value as SystemDesignConfidence),
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

export function parseSystemDesignItemProgressSaveResult(
  value: unknown,
  expectedItemId: string,
  expectedItemType: SystemDesignItemType,
  canonicalItemIds: ReadonlySet<string>,
): SystemDesignItemProgressSaveResult {
  if (!Array.isArray(value)) return { status: "invalid" };
  if (value.length === 0) return { status: "conflict" };
  if (value.length !== 1 || !isPlainRecord(value[0])) {
    return { status: "invalid" };
  }

  const keys = Reflect.ownKeys(value[0]);
  if (
    keys.length !== 3 ||
    !keys.includes("item_id") ||
    !keys.includes("item_type") ||
    !keys.includes("updated_at") ||
    value[0].item_id !== expectedItemId ||
    value[0].item_type !== expectedItemType ||
    !canonicalItemIds.has(`${value[0].item_type}:${value[0].item_id}`) ||
    !isCanonicalSystemDesignProgressRevision(value[0].updated_at)
  ) {
    return { status: "invalid" };
  }

  return { status: "saved", updatedAt: value[0].updated_at };
}
