import { isTrackerDatabaseRevision } from "./edit-revision.ts";

export const APPLICATION_DELETE_ERROR =
  "We couldn't delete this application. It may have changed or no longer be available.";
export const INTERVIEW_ROUND_DELETE_ERROR =
  "We couldn't delete this interview round. It may have changed or no longer be available.";

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

type DeleteActionForm = Readonly<{ ok: true }> | Readonly<{ ok: false }>;

export type ApplicationDeleteInput = Readonly<{
  applicationId: string;
  expectedUpdatedAt: string;
}>;

export type RoundDeleteInput = ApplicationDeleteInput &
  Readonly<{ roundId: string }>;

export type TrackerDeleteResult =
  | Readonly<{ status: "deleted"; recordId: string }>
  | Readonly<{ status: "conflict" }>
  | Readonly<{ status: "invalid" }>;

function parseUuid(value: unknown) {
  return typeof value === "string" && UUID_PATTERN.test(value)
    ? value.toLowerCase()
    : null;
}

function parseDeleteActionForm(input: unknown): DeleteActionForm {
  if (typeof FormData === "undefined" || !(input instanceof FormData)) {
    return { ok: false };
  }
  for (const key of input.keys()) {
    if (!key.startsWith("$ACTION_")) return { ok: false };
  }
  return { ok: true };
}

export function parseApplicationDeleteInput(
  applicationIdInput: unknown,
  revisionInput: unknown,
  formInput: unknown,
): ApplicationDeleteInput | null {
  const applicationId = parseUuid(applicationIdInput);
  if (
    !applicationId ||
    !isTrackerDatabaseRevision(revisionInput) ||
    !parseDeleteActionForm(formInput).ok
  ) {
    return null;
  }
  return { applicationId, expectedUpdatedAt: revisionInput };
}

export function parseRoundDeleteInput(
  applicationIdInput: unknown,
  roundIdInput: unknown,
  revisionInput: unknown,
  formInput: unknown,
): RoundDeleteInput | null {
  const applicationId = parseUuid(applicationIdInput);
  const roundId = parseUuid(roundIdInput);
  if (
    !applicationId ||
    !roundId ||
    !isTrackerDatabaseRevision(revisionInput) ||
    !parseDeleteActionForm(formInput).ok
  ) {
    return null;
  }
  return { applicationId, roundId, expectedUpdatedAt: revisionInput };
}

function isPlainRecord(value: unknown): value is Record<string, unknown> {
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    return false;
  }
  const prototype = Object.getPrototypeOf(value);
  return prototype === Object.prototype || prototype === null;
}

export function parseTrackerDeleteResult(
  value: unknown,
  idKey: "application_id" | "round_id",
  expectedId: string,
): TrackerDeleteResult {
  if (!Array.isArray(value)) return { status: "invalid" };
  if (value.length === 0) return { status: "conflict" };
  if (value.length !== 1 || !isPlainRecord(value[0])) {
    return { status: "invalid" };
  }
  const row = value[0];
  const keys = Reflect.ownKeys(row);
  const recordId = parseUuid(row[idKey]);
  if (
    keys.length !== 1 ||
    keys[0] !== idKey ||
    recordId !== expectedId
  ) {
    return { status: "invalid" };
  }
  return { status: "deleted", recordId };
}
