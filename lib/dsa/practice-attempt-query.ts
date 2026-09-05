import { PrivateDataUnavailableError } from "@/lib/persistence/errors";
import type { DsaPracticeAttemptRow } from "@/lib/supabase/database.types";
import { asDsaPracticeAttempt, DSA_PRACTICE_CATALOG_VERSION, dsaPracticeModes, dsaPracticeStatuses, dsaPriorExposureLevels, type DsaPracticeAttempt } from "./practice-attempt";
import { canonicalDsaQuestionById } from "./catalog";
import { isDsaAttemptId } from "./practice-attempt-action-input";

export type DsaPracticeAttemptSummary = Omit<DsaPracticeAttemptRow, "document" | "user_id">;
const unavailable = (): never => { throw new PrivateDataUnavailableError("DSA practice attempts"); };
const timestamp = (value: unknown): value is string => typeof value === "string" && Number.isFinite(Date.parse(value));
const nullableTimestamp = (value: unknown): value is string | null => value === null || timestamp(value);

export function resolveDsaAttempt(result: { data: unknown; error: unknown }): DsaPracticeAttempt | null {
  if (result.error !== null) unavailable();
  if (result.data === null) return null;
  if (typeof result.data !== "object" || Array.isArray(result.data)) unavailable();
  const row = result.data as DsaPracticeAttemptRow;
  if (!isDsaAttemptId(row.id) || !isDsaAttemptId(row.user_id) || !canonicalDsaQuestionById.has(row.question_id) || row.catalog_version !== DSA_PRACTICE_CATALOG_VERSION || !dsaPracticeStatuses.includes(row.status) || !dsaPracticeModes.includes(row.mode) || !dsaPriorExposureLevels.includes(row.prior_exposure) || (row.mode === "timed" ? !Number.isInteger(row.duration_minutes) || (row.duration_minutes ?? 0) < 10 || (row.duration_minutes ?? 0) > 120 : row.duration_minutes !== null) || !Number.isSafeInteger(row.elapsed_seconds) || row.elapsed_seconds < 0 || row.elapsed_seconds > 86400 || ![null, "error", "elapsed", "manual"].includes(row.review_reason) || !Number.isSafeInteger(row.revision) || row.revision < 1 || !nullableTimestamp(row.completed_at) || !timestamp(row.created_at) || !timestamp(row.updated_at)) unavailable();
  return asDsaPracticeAttempt(row) ?? unavailable();
}

export function resolveDsaAttemptSummaries(result: { data: unknown; error: unknown }): DsaPracticeAttemptSummary[] {
  if (result.error !== null || !Array.isArray(result.data)) unavailable();
  const data = result.data as unknown[];
  return data.map((value: unknown) => {
    if (value === null || typeof value !== "object" || Array.isArray(value)) unavailable();
    const row = value as DsaPracticeAttemptSummary;
    if (!isDsaAttemptId(row.id) || !canonicalDsaQuestionById.has(row.question_id) || row.catalog_version !== DSA_PRACTICE_CATALOG_VERSION || !dsaPracticeStatuses.includes(row.status) || !dsaPracticeModes.includes(row.mode) || !dsaPriorExposureLevels.includes(row.prior_exposure) || !Number.isSafeInteger(row.elapsed_seconds) || ![null, "error", "elapsed", "manual"].includes(row.review_reason) || !Number.isSafeInteger(row.revision) || !nullableTimestamp(row.completed_at) || !timestamp(row.created_at) || !timestamp(row.updated_at)) unavailable();
    return row;
  });
}
