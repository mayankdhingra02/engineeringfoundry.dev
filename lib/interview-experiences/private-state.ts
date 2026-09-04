import {
  isCanonicalInterviewExperienceId,
  isCanonicalInterviewExperienceRevision,
  type InterviewExperienceStatus,
} from "./action-input.ts";

export const INTERVIEW_EXPERIENCE_OWNER_HISTORY_LIMIT = 20;
export const INTERVIEW_EXPERIENCE_ADMIN_QUEUE_LIMIT = 100;

const OWNER_STATUSES = new Set<unknown>([
  "draft",
  "submitted",
  "needs_changes",
  "approved",
  "rejected",
  "archived",
  "withdrawn",
]);
const MODERATION_STATUSES = new Set<unknown>([
  "submitted",
  "needs_changes",
]);
const ROLE_LEVELS = new Set<unknown>([
  null,
  "Entry",
  "Mid",
  "Senior",
  "Staff+",
  "Management",
  "Prefer not to say",
]);
const PUBLIC_IDENTITIES = new Set<unknown>(["anonymous", "username"]);
const DATE_PATTERN = /^(\d{4})-(\d{2})-(\d{2})$/;

export type OwnedInterviewExperienceRound = Readonly<{
  position: number;
  round_type: string;
  topic_labels: string[];
}>;

export type OwnedInterviewExperience = Readonly<{
  id: string;
  status: InterviewExperienceStatus;
  company_name: string;
  role_title: string;
  role_level: string | null;
  region: string | null;
  interview_date: string | null;
  summary: string;
  preparation_lessons: string | null;
  public_identity: "anonymous" | "username";
  publication_consent: boolean;
  updated_at: string;
  review_note: string | null;
  interview_experience_rounds: OwnedInterviewExperienceRound[];
}>;

export type AdminInterviewExperienceRound = OwnedInterviewExperienceRound &
  Readonly<{ process_notes: string | null }>;

export type AdminInterviewExperience = Readonly<{
  id: string;
  status: "submitted" | "needs_changes";
  company_name: string;
  role_title: string;
  role_level: string | null;
  region: string | null;
  interview_date: string | null;
  summary: string;
  preparation_lessons: string | null;
  public_identity: "anonymous" | "username";
  publication_consent: boolean;
  submitted_at: string | null;
  updated_at: string;
  review_note: string | null;
  interview_experience_rounds: AdminInterviewExperienceRound[];
}>;

export type OwnedInterviewExperienceHistory =
  | Readonly<{
      status: "ready";
      items: readonly OwnedInterviewExperience[];
      limit: typeof INTERVIEW_EXPERIENCE_OWNER_HISTORY_LIMIT;
    }>
  | Readonly<{ status: "unavailable" }>;

export type InterviewExperienceOwnerState =
  | Readonly<{ status: "anonymous" }>
  | OwnedInterviewExperienceHistory;

export type AdminInterviewExperienceQueue =
  | Readonly<{
      status: "ready";
      items: readonly AdminInterviewExperience[];
      limit: typeof INTERVIEW_EXPERIENCE_ADMIN_QUEUE_LIMIT;
    }>
  | Readonly<{ status: "unavailable" }>;

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

function isBoundedText(
  value: unknown,
  max: number,
  allowEmpty = true,
): value is string {
  return (
    typeof value === "string" &&
    !value.includes("\u0000") &&
    Array.from(value).length <= max &&
    (allowEmpty || value.trim().length > 0)
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

function isDatabaseDate(value: unknown): value is string {
  if (typeof value !== "string") return false;
  const match = DATE_PATTERN.exec(value);
  if (!match) return false;
  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  return (
    year >= 1 &&
    month >= 1 &&
    month <= 12 &&
    day >= 1 &&
    day <= daysInMonth(year, month)
  );
}

function isNullableBoundedText(value: unknown, max: number) {
  return value === null || isBoundedText(value, max);
}

function parseRound(
  value: unknown,
  includeProcessNotes: boolean,
): OwnedInterviewExperienceRound | AdminInterviewExperienceRound | null {
  if (!isPlainRecord(value)) return null;
  const expected = includeProcessNotes
    ? ["position", "round_type", "topic_labels", "process_notes"]
    : ["position", "round_type", "topic_labels"];
  if (
    !hasExactKeys(value, expected) ||
    !Number.isInteger(value.position) ||
    (value.position as number) < 1 ||
    (value.position as number) > 20 ||
    !isBoundedText(value.round_type, 80, false) ||
    !Array.isArray(value.topic_labels) ||
    value.topic_labels.length > 12 ||
    value.topic_labels.some(
      (topic) => !isBoundedText(topic, 80, false),
    ) ||
    new Set(value.topic_labels).size !== value.topic_labels.length ||
    (includeProcessNotes && !isNullableBoundedText(value.process_notes, 1500))
  ) {
    return null;
  }
  const base = {
    position: value.position as number,
    round_type: value.round_type,
    topic_labels: [...value.topic_labels] as string[],
  };
  return includeProcessNotes
    ? { ...base, process_notes: value.process_notes as string | null }
    : base;
}

function parseRounds(
  value: unknown,
  includeProcessNotes: boolean,
): Array<OwnedInterviewExperienceRound | AdminInterviewExperienceRound> | null {
  if (!Array.isArray(value) || value.length > 20) return null;
  const rounds = value.map((round) => parseRound(round, includeProcessNotes));
  if (rounds.some((round) => round === null)) return null;
  const parsed = rounds as Array<
    OwnedInterviewExperienceRound | AdminInterviewExperienceRound
  >;
  if (new Set(parsed.map((round) => round.position)).size !== parsed.length) {
    return null;
  }
  return [...parsed].sort((left, right) => left.position - right.position);
}

function hasSuccessfulArrayResult(value: unknown, limit: number) {
  return (
    isPlainRecord(value) &&
    hasExactKeys(value, ["data", "error"]) &&
    Object.hasOwn(value, "data") &&
    Object.hasOwn(value, "error") &&
    value.error === null &&
    Array.isArray(value.data) &&
    value.data.length <= limit
  );
}

function parseOwnerRow(value: unknown): OwnedInterviewExperience | null {
  if (!isPlainRecord(value)) return null;
  const expected = [
    "id",
    "status",
    "company_name",
    "role_title",
    "role_level",
    "region",
    "interview_date",
    "summary",
    "preparation_lessons",
    "public_identity",
    "publication_consent",
    "updated_at",
    "review_note",
    "interview_experience_rounds",
  ] as const;
  const rounds = parseRounds(value.interview_experience_rounds, false);
  if (
    !hasExactKeys(value, expected) ||
    !isCanonicalInterviewExperienceId(value.id) ||
    !OWNER_STATUSES.has(value.status) ||
    !isBoundedText(value.company_name, 120) ||
    !isBoundedText(value.role_title, 160) ||
    !ROLE_LEVELS.has(value.role_level) ||
    !isNullableBoundedText(value.region, 120) ||
    (value.interview_date !== null && !isDatabaseDate(value.interview_date)) ||
    !isBoundedText(value.summary, 4000) ||
    !isNullableBoundedText(value.preparation_lessons, 3000) ||
    !PUBLIC_IDENTITIES.has(value.public_identity) ||
    typeof value.publication_consent !== "boolean" ||
    !isCanonicalInterviewExperienceRevision(value.updated_at) ||
    !isNullableBoundedText(value.review_note, 1000) ||
    rounds === null
  ) {
    return null;
  }
  return {
    id: value.id.toLowerCase(),
    status: value.status as InterviewExperienceStatus,
    company_name: value.company_name,
    role_title: value.role_title,
    role_level: value.role_level as string | null,
    region: value.region as string | null,
    interview_date: value.interview_date as string | null,
    summary: value.summary,
    preparation_lessons: value.preparation_lessons as string | null,
    public_identity: value.public_identity as "anonymous" | "username",
    publication_consent: value.publication_consent,
    updated_at: value.updated_at,
    review_note: value.review_note as string | null,
    interview_experience_rounds:
      rounds as OwnedInterviewExperienceRound[],
  };
}

function parseAdminRow(value: unknown): AdminInterviewExperience | null {
  if (!isPlainRecord(value)) return null;
  const expected = [
    "id",
    "status",
    "company_name",
    "role_title",
    "role_level",
    "region",
    "interview_date",
    "summary",
    "preparation_lessons",
    "public_identity",
    "publication_consent",
    "submitted_at",
    "updated_at",
    "review_note",
    "interview_experience_rounds",
  ] as const;
  const rounds = parseRounds(value.interview_experience_rounds, true);
  if (
    !hasExactKeys(value, expected) ||
    !isCanonicalInterviewExperienceId(value.id) ||
    !MODERATION_STATUSES.has(value.status) ||
    !isBoundedText(value.company_name, 120, false) ||
    !isBoundedText(value.role_title, 160, false) ||
    !ROLE_LEVELS.has(value.role_level) ||
    !isNullableBoundedText(value.region, 120) ||
    (value.interview_date !== null && !isDatabaseDate(value.interview_date)) ||
    !isBoundedText(value.summary, 4000, false) ||
    !isNullableBoundedText(value.preparation_lessons, 3000) ||
    !PUBLIC_IDENTITIES.has(value.public_identity) ||
    typeof value.publication_consent !== "boolean" ||
    (value.submitted_at !== null &&
      !isCanonicalInterviewExperienceRevision(value.submitted_at)) ||
    !isCanonicalInterviewExperienceRevision(value.updated_at) ||
    !isNullableBoundedText(value.review_note, 1000) ||
    rounds === null
  ) {
    return null;
  }
  return {
    id: value.id.toLowerCase(),
    status: value.status as "submitted" | "needs_changes",
    company_name: value.company_name,
    role_title: value.role_title,
    role_level: value.role_level as string | null,
    region: value.region as string | null,
    interview_date: value.interview_date as string | null,
    summary: value.summary,
    preparation_lessons: value.preparation_lessons as string | null,
    public_identity: value.public_identity as "anonymous" | "username",
    publication_consent: value.publication_consent,
    submitted_at: value.submitted_at as string | null,
    updated_at: value.updated_at,
    review_note: value.review_note as string | null,
    interview_experience_rounds:
      rounds as AdminInterviewExperienceRound[],
  };
}

export function resolveOwnedInterviewExperienceHistory(
  result: unknown,
): OwnedInterviewExperienceHistory {
  if (!hasSuccessfulArrayResult(result, INTERVIEW_EXPERIENCE_OWNER_HISTORY_LIMIT)) {
    return { status: "unavailable" };
  }
  const rows = (result as { data: unknown[] }).data.map(parseOwnerRow);
  if (rows.some((row) => row === null)) return { status: "unavailable" };
  return {
    status: "ready",
    items: rows as OwnedInterviewExperience[],
    limit: INTERVIEW_EXPERIENCE_OWNER_HISTORY_LIMIT,
  };
}

export function resolveAdminInterviewExperienceQueue(
  result: unknown,
): AdminInterviewExperienceQueue {
  if (!hasSuccessfulArrayResult(result, INTERVIEW_EXPERIENCE_ADMIN_QUEUE_LIMIT)) {
    return { status: "unavailable" };
  }
  const rows = (result as { data: unknown[] }).data.map(parseAdminRow);
  if (rows.some((row) => row === null)) return { status: "unavailable" };
  return {
    status: "ready",
    items: rows as AdminInterviewExperience[],
    limit: INTERVIEW_EXPERIENCE_ADMIN_QUEUE_LIMIT,
  };
}
