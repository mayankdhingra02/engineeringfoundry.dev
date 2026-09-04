export const PREPARATION_TASK_INVALID_INPUT_ERROR =
  "This task change is no longer valid. Refresh and try again.";
export const PREPARATION_TASK_PERSISTENCE_ERROR =
  "Task change was not saved. Try again.";
export const PREPARATION_TASK_SAVED_MESSAGE = "Task saved.";
export const PREPARATION_TASK_DELETE_INVALID_INPUT_ERROR =
  "This task removal is no longer valid. Refresh and try again.";
export const PREPARATION_TASK_DELETE_CONFLICT_ERROR =
  "This task may have changed since you opened this page. It was not removed. Review the latest saved version before trying again.";
export const PREPARATION_TASK_DELETE_PERSISTENCE_ERROR =
  "Task was not removed. Try again.";
export const PREPARATION_TASK_DELETED_MESSAGE = "Task removed.";
export const PREPARATION_TASK_ADD_INVALID_INPUT_ERROR =
  "Review the task details and try again.";
export const PREPARATION_TASK_ADD_PERSISTENCE_ERROR =
  "Task was not added. Try again.";
export const PREPARATION_TASK_ADDED_MESSAGE = "Private task added.";

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const DATABASE_TIMESTAMP_PATTERN =
  /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2}):(\d{2})(?:\.\d{1,6})?(Z|([+-])(\d{2}):(\d{2}))$/;
const RESULT_KEYS = ["application_id", "completed", "round_id", "task_id"];
const DELETE_RESULT_KEYS = ["application_id", "round_id", "task_id"];

export type PreparationTaskAddInput = Readonly<{
  roundId: string;
  applicationId: string;
  title: string;
}>;

export type PreparationTaskAddInputResult =
  | Readonly<{ ok: true; value: PreparationTaskAddInput }>
  | Readonly<{ ok: false }>;

export type PreparationTaskCompletionInput = Readonly<{
  roundId: string;
  taskId: string;
  targetCompleted: boolean;
}>;

export type PreparationTaskCompletionInputResult =
  | Readonly<{ ok: true; value: PreparationTaskCompletionInput }>
  | Readonly<{ ok: false }>;

export type PreparationTaskCompletionResult =
  | Readonly<{ status: "saved"; applicationId: string }>
  | Readonly<{ status: "missing" }>
  | Readonly<{ status: "invalid" }>;

export type PreparationTaskDeleteInput = Readonly<{
  roundId: string;
  taskId: string;
  expectedUpdatedAt: string;
}>;

export type PreparationTaskDeleteInputResult =
  | Readonly<{ ok: true; value: PreparationTaskDeleteInput }>
  | Readonly<{ ok: false }>;

export type PreparationTaskDeleteResult =
  | Readonly<{ status: "deleted"; applicationId: string }>
  | Readonly<{ status: "conflict" }>
  | Readonly<{ status: "invalid" }>;

function normalizeUuid(value: unknown): string | null {
  return typeof value === "string" && UUID_PATTERN.test(value)
    ? value.toLowerCase()
    : null;
}

function isExactResultRow(value: unknown): value is Record<string, unknown> {
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    return false;
  }
  const prototype = Object.getPrototypeOf(value);
  return (
    (prototype === Object.prototype || prototype === null) &&
    JSON.stringify(Object.keys(value).sort()) === JSON.stringify(RESULT_KEYS)
  );
}

function isExactDeleteResultRow(value: unknown): value is Record<string, unknown> {
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    return false;
  }
  const prototype = Object.getPrototypeOf(value);
  return (
    (prototype === Object.prototype || prototype === null) &&
    JSON.stringify(Object.keys(value).sort()) === JSON.stringify(DELETE_RESULT_KEYS)
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

export function isCanonicalPreparationTaskRevision(
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

function isActionOnlyFormData(value: unknown) {
  if (typeof FormData === "undefined" || !(value instanceof FormData)) {
    return false;
  }
  for (const key of value.keys()) {
    if (!key.startsWith("$ACTION_")) return false;
  }
  return true;
}

export function parsePreparationTaskAddInput(
  roundId: unknown,
  applicationId: unknown,
  formInput: unknown,
): PreparationTaskAddInputResult {
  const normalizedRoundId = normalizeUuid(roundId);
  const normalizedApplicationId = normalizeUuid(applicationId);
  if (
    normalizedRoundId === null ||
    normalizedApplicationId === null ||
    typeof FormData === "undefined" ||
    !(formInput instanceof FormData)
  ) {
    return { ok: false };
  }
  for (const key of formInput.keys()) {
    if (key !== "title" && !key.startsWith("$ACTION_")) {
      return { ok: false };
    }
  }
  const titles = formInput.getAll("title");
  if (titles.length !== 1 || typeof titles[0] !== "string") {
    return { ok: false };
  }
  const title = titles[0].trim();
  if (
    title.length === 0 ||
    Array.from(title).length > 160 ||
    /\p{Cc}/u.test(title)
  ) {
    return { ok: false };
  }
  return {
    ok: true,
    value: {
      roundId: normalizedRoundId,
      applicationId: normalizedApplicationId,
      title,
    },
  };
}

export function parsePreparationTaskAddResult(value: unknown): string | null {
  return normalizeUuid(value);
}

export function parsePreparationTaskCompletionInput(
  roundId: unknown,
  taskId: unknown,
  targetCompleted: unknown,
): PreparationTaskCompletionInputResult {
  const normalizedRoundId = normalizeUuid(roundId);
  const normalizedTaskId = normalizeUuid(taskId);
  if (
    normalizedRoundId === null ||
    normalizedTaskId === null ||
    typeof targetCompleted !== "boolean"
  ) {
    return { ok: false };
  }
  return {
    ok: true,
    value: {
      roundId: normalizedRoundId,
      taskId: normalizedTaskId,
      targetCompleted,
    },
  };
}

export function parsePreparationTaskCompletionResult(
  value: unknown,
  expected: PreparationTaskCompletionInput,
): PreparationTaskCompletionResult {
  if (!Array.isArray(value)) return { status: "invalid" };
  if (value.length === 0) return { status: "missing" };
  if (value.length !== 1 || !isExactResultRow(value[0])) {
    return { status: "invalid" };
  }
  const row = value[0];
  const taskId = normalizeUuid(row.task_id);
  const roundId = normalizeUuid(row.round_id);
  const applicationId = normalizeUuid(row.application_id);
  if (
    taskId !== expected.taskId ||
    roundId !== expected.roundId ||
    applicationId === null ||
    row.completed !== expected.targetCompleted
  ) {
    return { status: "invalid" };
  }
  return { status: "saved", applicationId };
}

export function parsePreparationTaskDeleteInput(
  roundId: unknown,
  taskId: unknown,
  expectedUpdatedAt: unknown,
  formInput: unknown,
): PreparationTaskDeleteInputResult {
  const normalizedRoundId = normalizeUuid(roundId);
  const normalizedTaskId = normalizeUuid(taskId);
  if (
    normalizedRoundId === null ||
    normalizedTaskId === null ||
    !isCanonicalPreparationTaskRevision(expectedUpdatedAt) ||
    !isActionOnlyFormData(formInput)
  ) {
    return { ok: false };
  }
  return {
    ok: true,
    value: {
      roundId: normalizedRoundId,
      taskId: normalizedTaskId,
      expectedUpdatedAt,
    },
  };
}

export function parsePreparationTaskDeleteResult(
  value: unknown,
  expected: PreparationTaskDeleteInput,
): PreparationTaskDeleteResult {
  if (!Array.isArray(value)) return { status: "invalid" };
  if (value.length === 0) return { status: "conflict" };
  if (value.length !== 1 || !isExactDeleteResultRow(value[0])) {
    return { status: "invalid" };
  }
  const taskId = normalizeUuid(value[0].task_id);
  const roundId = normalizeUuid(value[0].round_id);
  const applicationId = normalizeUuid(value[0].application_id);
  if (
    taskId !== expected.taskId ||
    roundId !== expected.roundId ||
    applicationId === null
  ) {
    return { status: "invalid" };
  }
  return { status: "deleted", applicationId };
}
