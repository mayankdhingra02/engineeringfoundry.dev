export const PREPARATION_TASK_INVALID_INPUT_ERROR =
  "This task change is no longer valid. Refresh and try again.";
export const PREPARATION_TASK_PERSISTENCE_ERROR =
  "Task change was not saved. Try again.";
export const PREPARATION_TASK_SAVED_MESSAGE = "Task saved.";

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const RESULT_KEYS = ["application_id", "completed", "round_id", "task_id"];

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
