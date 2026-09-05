import { PrivateDataUnavailableError } from "@/lib/persistence/errors";
import type { MlDesignAttemptRow } from "@/lib/supabase/database.types";
import {
  ML_DESIGN_PROBLEM_VERSION,
  asMlDesignAttempt,
  canonicalMlDesignProblemSlugs,
  mlDesignAttemptDurations,
  mlDesignAttemptModes,
  mlDesignAttemptStatuses,
  type MlDesignAttempt,
} from "./attempt";

export const ML_DESIGN_ATTEMPT_PRIVATE_DATA_DOMAIN = "ML Design attempt";
const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

type AttemptQueryResult = Readonly<{ data: unknown; error: unknown }>;
const unavailable = (): never => { throw new PrivateDataUnavailableError(ML_DESIGN_ATTEMPT_PRIVATE_DATA_DOMAIN); };
const isTimestamp = (value: unknown): value is string => typeof value === "string" && value.length > 0 && Number.isFinite(Date.parse(value));
const isNullableTimestamp = (value: unknown): value is string | null => value === null || isTimestamp(value);

export function isMlDesignAttemptId(value: unknown): value is string {
  return typeof value === "string" && UUID_PATTERN.test(value);
}

function isPersistedAttemptRow(value: unknown): value is MlDesignAttemptRow {
  if (typeof value !== "object" || value === null || Array.isArray(value)) return false;
  const row = value as Record<string, unknown>;
  const duration = row.duration_minutes;
  return isMlDesignAttemptId(row.id)
    && isMlDesignAttemptId(row.user_id)
    && canonicalMlDesignProblemSlugs.has(row.problem_id as string)
    && row.problem_version === ML_DESIGN_PROBLEM_VERSION
    && typeof row.title === "string"
    && row.title.trim().length > 0
    && Array.from(row.title).length <= 160
    && mlDesignAttemptStatuses.includes(row.status as (typeof mlDesignAttemptStatuses)[number])
    && mlDesignAttemptModes.includes(row.mode as (typeof mlDesignAttemptModes)[number])
    && (row.mode === "timed" ? mlDesignAttemptDurations.includes(duration as (typeof mlDesignAttemptDurations)[number]) : duration === null)
    && Number.isSafeInteger(row.revision)
    && (row.revision as number) > 0
    && isNullableTimestamp(row.first_practiced_at)
    && isTimestamp(row.created_at)
    && isTimestamp(row.updated_at);
}

export function resolveMlDesignAttemptQuery(result: AttemptQueryResult): MlDesignAttempt | null {
  if (result.error !== null) unavailable();
  if (result.data === null) return null;
  if (!isPersistedAttemptRow(result.data)) unavailable();
  const row = result.data as MlDesignAttemptRow;
  return asMlDesignAttempt(row) ?? unavailable();
}
