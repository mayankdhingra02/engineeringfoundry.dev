import { PrivateDataUnavailableError } from "../persistence/errors.ts";
import type { SystemDesignAttemptRow } from "../supabase/database.types.ts";
import {
  asSystemDesignAttempt,
  canonicalSystemDesignProblemIds,
  systemDesignAttemptStatuses,
  systemDesignConfidences,
  type SystemDesignAttempt,
} from "./workspace.ts";

export const SYSTEM_DESIGN_ATTEMPT_PRIVATE_DATA_DOMAIN = "System Design attempt";

const ATTEMPT_ID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

type SystemDesignAttemptQueryResult = Readonly<{
  data: unknown;
  error: unknown;
}>;

function unavailable(): never {
  throw new PrivateDataUnavailableError(SYSTEM_DESIGN_ATTEMPT_PRIVATE_DATA_DOMAIN);
}

function isTimestamp(value: unknown): value is string {
  return typeof value === "string" && value.length > 0 && Number.isFinite(Date.parse(value));
}

function isNullableTimestamp(value: unknown): value is string | null {
  return value === null || isTimestamp(value);
}

function isPersistedAttemptRow(value: unknown): value is SystemDesignAttemptRow {
  if (typeof value !== "object" || value === null || Array.isArray(value)) return false;
  const row = value as Record<string, unknown>;
  return (
    isSystemDesignAttemptId(row.id) &&
    isSystemDesignAttemptId(row.user_id) &&
    canonicalSystemDesignProblemIds.has(row.problem_id as string) &&
    row.catalog_item_type === "design_problem" &&
    (row.application_id === null || isSystemDesignAttemptId(row.application_id)) &&
    typeof row.title === "string" &&
    row.title.trim().length > 0 &&
    [...row.title.trim()].length <= 160 &&
    systemDesignAttemptStatuses.includes(row.status as (typeof systemDesignAttemptStatuses)[number]) &&
    (row.confidence === null || systemDesignConfidences.includes(row.confidence as (typeof systemDesignConfidences)[number])) &&
    Number.isSafeInteger(row.revision) &&
    (row.revision as number) > 0 &&
    isNullableTimestamp(row.first_practiced_at) &&
    isNullableTimestamp(row.last_practiced_at) &&
    isTimestamp(row.created_at) &&
    isTimestamp(row.updated_at)
  );
}

export function isSystemDesignAttemptId(value: unknown): value is string {
  return typeof value === "string" && ATTEMPT_ID_PATTERN.test(value);
}

/**
 * Keeps a genuine owner-scoped zero-row result separate from repository or
 * persisted-data failures. The error uses a fixed domain and never includes a
 * database message, table name, account identifier, or private attempt ID.
 */
export function resolveSystemDesignAttemptQuery(
  result: SystemDesignAttemptQueryResult,
): SystemDesignAttempt | null {
  if (result.error !== null) unavailable();
  if (result.data === null) return null;
  if (!isPersistedAttemptRow(result.data)) unavailable();

  try {
    return asSystemDesignAttempt(result.data) ?? unavailable();
  } catch {
    return unavailable();
  }
}
