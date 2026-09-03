import type { RoadmapLevel } from "../../data/dsa/level-roadmaps.ts";
import { PrivateDataUnavailableError } from "../persistence/errors.ts";
import type { DsaProgressMap } from "./progress.ts";
import type { DsaQuestionProgressRow } from "../supabase/database.types.ts";

export const DSA_WORKSPACE_PRIVATE_DATA_DOMAIN = "DSA workspace";

export type DsaWorkspaceApplication = Readonly<{
  id: string;
  company_name: string;
  company_slug: string | null;
  role_title: string;
}>;

export type DsaWorkspacePrivateState = Readonly<{
  progress: DsaProgressMap;
  preferredRoadmap: RoadmapLevel;
  application: DsaWorkspaceApplication | null;
}>;

export type DsaWorkspaceQueryContext = Readonly<{
  ownerId: string;
  requestedApplicationId: string | null;
  canonicalQuestionIds: readonly string[];
}>;

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const QUESTION_ID_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const COMPANY_SLUG_PATTERN = /^[a-z0-9][a-z0-9-]{0,79}$/;
const DATABASE_TIMESTAMP_PATTERN = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2}):(\d{2})(?:\.\d{1,6})?(?:Z|[+-]\d{2}:\d{2})$/;
const progressStatuses = new Set<DsaQuestionProgressRow["status"]>([
  "not_started",
  "attempted",
  "solved",
  "review",
]);
const confidenceValues = new Set<NonNullable<DsaQuestionProgressRow["confidence"]>>([
  "low",
  "medium",
  "high",
]);
const roadmapLevels = new Set<RoadmapLevel>(["sde1", "sde2", "sde3plus"]);
const progressRowKeys = [
  "user_id",
  "question_id",
  "status",
  "confidence",
  "bookmarked",
  "notes",
  "first_attempted_at",
  "last_practiced_at",
  "solved_at",
  "created_at",
  "updated_at",
] as const;
const applicationKeys = ["id", "company_name", "company_slug", "role_title"] as const;

function unavailable(): never {
  throw new PrivateDataUnavailableError(DSA_WORKSPACE_PRIVATE_DATA_DOMAIN);
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

function hasExactKeys(value: Record<string, unknown>, keys: readonly string[]) {
  const actual = Object.keys(value);
  return actual.length === keys.length && keys.every((key) => Object.hasOwn(value, key));
}

function canonicalUuid(value: unknown) {
  if (typeof value !== "string" || !UUID_PATTERN.test(value)) return null;
  return value.toLowerCase();
}

function isDatabaseTimestamp(value: unknown): value is string {
  if (typeof value !== "string") return false;
  const match = DATABASE_TIMESTAMP_PATTERN.exec(value);
  if (!match || !Number.isFinite(Date.parse(value))) return false;
  const [, yearText, monthText, dayText, hourText, minuteText, secondText] = match;
  const year = Number(yearText);
  const month = Number(monthText);
  const day = Number(dayText);
  const hour = Number(hourText);
  const minute = Number(minuteText);
  const second = Number(secondText);
  if (year < 1 || month < 1 || month > 12 || hour > 23 || minute > 59 || second > 59) return false;
  const daysInMonth = new Date(Date.UTC(year, month, 0)).getUTCDate();
  return day >= 1 && day <= daysInMonth;
}

function isNullableDatabaseTimestamp(value: unknown): value is string | null {
  return value === null || isDatabaseTimestamp(value);
}

function isBoundedDatabaseText(value: unknown, maximum: number): value is string {
  return typeof value === "string" && !value.includes("\0") && [...value].length <= maximum;
}

function parseProgressRow(
  value: unknown,
  ownerId: string,
  canonicalQuestionIds: ReadonlySet<string>,
): DsaQuestionProgressRow {
  if (!isRecord(value) || !hasExactKeys(value, progressRowKeys)) unavailable();

  const rowOwnerId = canonicalUuid(value.user_id);
  if (rowOwnerId !== ownerId) unavailable();
  if (
    typeof value.question_id !== "string" ||
    value.question_id.length > 200 ||
    !QUESTION_ID_PATTERN.test(value.question_id) ||
    !canonicalQuestionIds.has(value.question_id) ||
    typeof value.status !== "string" ||
    !progressStatuses.has(value.status as DsaQuestionProgressRow["status"]) ||
    (value.confidence !== null &&
      (typeof value.confidence !== "string" ||
        !confidenceValues.has(value.confidence as NonNullable<DsaQuestionProgressRow["confidence"]>))) ||
    typeof value.bookmarked !== "boolean" ||
    (value.notes !== null && !isBoundedDatabaseText(value.notes, 5000)) ||
    !isNullableDatabaseTimestamp(value.first_attempted_at) ||
    !isNullableDatabaseTimestamp(value.last_practiced_at) ||
    !isNullableDatabaseTimestamp(value.solved_at) ||
    !isDatabaseTimestamp(value.created_at) ||
    !isDatabaseTimestamp(value.updated_at)
  ) unavailable();

  return {
    user_id: rowOwnerId,
    question_id: value.question_id,
    status: value.status as DsaQuestionProgressRow["status"],
    confidence: value.confidence as DsaQuestionProgressRow["confidence"],
    bookmarked: value.bookmarked,
    notes: value.notes as string | null,
    first_attempted_at: value.first_attempted_at,
    last_practiced_at: value.last_practiced_at,
    solved_at: value.solved_at,
    created_at: value.created_at,
    updated_at: value.updated_at,
  };
}

function parseProgress(
  data: unknown,
  ownerId: string,
  canonicalQuestionIds: ReadonlySet<string>,
): DsaProgressMap {
  if (!Array.isArray(data)) unavailable();
  const progress: Record<string, DsaQuestionProgressRow> = {};
  for (const value of data) {
    const row = parseProgressRow(value, ownerId, canonicalQuestionIds);
    if (Object.hasOwn(progress, row.question_id)) unavailable();
    progress[row.question_id] = row;
  }
  return progress;
}

function parsePreferredRoadmap(data: unknown): RoadmapLevel {
  if (data === null) return "sde2";
  if (!isRecord(data) || !hasExactKeys(data, ["dsa_level"])) unavailable();
  if (data.dsa_level === null) return "sde2";
  if (typeof data.dsa_level !== "string" || !roadmapLevels.has(data.dsa_level as RoadmapLevel)) {
    unavailable();
  }
  return data.dsa_level as RoadmapLevel;
}

function parseRequiredLabel(value: unknown) {
  return typeof value === "string" && value === value.trim() && [...value].length >= 1 && [...value].length <= 120 && !value.includes("\0")
    ? value
    : null;
}

function parseApplication(data: unknown, requestedApplicationId: string | null): DsaWorkspaceApplication | null {
  if (data === null) return null;
  if (!requestedApplicationId || !isRecord(data) || !hasExactKeys(data, applicationKeys)) unavailable();

  const id = canonicalUuid(data.id);
  const companyName = parseRequiredLabel(data.company_name);
  const roleTitle = parseRequiredLabel(data.role_title);
  const companySlug = data.company_slug;
  if (
    id !== requestedApplicationId ||
    !companyName ||
    !roleTitle ||
    (companySlug !== null &&
      (typeof companySlug !== "string" || !COMPANY_SLUG_PATTERN.test(companySlug)))
  ) unavailable();

  return {
    id,
    company_name: companyName,
    company_slug: companySlug as string | null,
    role_title: roleTitle,
  };
}

function queryData(result: unknown): unknown {
  if (
    !isRecord(result) ||
    !Object.hasOwn(result, "data") ||
    !Object.hasOwn(result, "error") ||
    result.error !== null
  ) unavailable();
  return result.data;
}

/**
 * Resolves one complete owner-scoped DSA workspace snapshot. Only successful
 * empty results become empty defaults; any failed or malformed private result
 * throws one fixed, non-sensitive error rather than inventing account state.
 */
export function resolveDsaWorkspacePrivateState(
  input: unknown,
  context: DsaWorkspaceQueryContext,
): DsaWorkspacePrivateState {
  if (
    !isRecord(context) ||
    !hasExactKeys(context, ["ownerId", "requestedApplicationId", "canonicalQuestionIds"])
  ) unavailable();
  const ownerId = canonicalUuid(context.ownerId);
  const requestedApplicationId = context.requestedApplicationId === null
    ? null
    : canonicalUuid(context.requestedApplicationId);
  if (
    !ownerId ||
    (context.requestedApplicationId !== null && !requestedApplicationId) ||
    !Array.isArray(context.canonicalQuestionIds) ||
    context.canonicalQuestionIds.some((id) =>
      typeof id !== "string" || !QUESTION_ID_PATTERN.test(id)
    ) ||
    !isRecord(input) ||
    !hasExactKeys(input, ["progressResult", "preferenceResult", "applicationResult"])
  ) unavailable();

  const progressData = queryData(input.progressResult);
  const preferenceData = queryData(input.preferenceResult);
  const applicationData = queryData(input.applicationResult);
  const canonicalQuestionIds = new Set(context.canonicalQuestionIds);
  if (canonicalQuestionIds.size !== context.canonicalQuestionIds.length) unavailable();

  if (requestedApplicationId === null && applicationData !== null) unavailable();

  return {
    progress: parseProgress(progressData, ownerId, canonicalQuestionIds),
    preferredRoadmap: parsePreferredRoadmap(preferenceData),
    application: parseApplication(applicationData, requestedApplicationId),
  };
}
