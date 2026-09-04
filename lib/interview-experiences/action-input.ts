import {
  experienceRoundTypes,
  experienceTopics,
} from "../../data/interview-experiences/index.ts";

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const INTERVIEW_MONTH_PATTERN = /^([1-9][0-9]{3})-(0[1-9]|1[0-2])$/;
const DATABASE_TIMESTAMP_PATTERN =
  /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2}):(\d{2})(?:\.\d{1,6})?(Z|([+-])(\d{2}):(\d{2}))$/;

const roleLevels = new Set<unknown>([
  "",
  "Entry",
  "Mid",
  "Senior",
  "Staff+",
  "Management",
  "Prefer not to say",
]);
const publicIdentities = new Set<unknown>(["anonymous", "username"]);
const managementActions = new Set<unknown>(["withdraw", "delete"]);
const experienceStatuses = new Set<unknown>([
  "draft",
  "submitted",
  "needs_changes",
  "approved",
  "rejected",
  "archived",
  "withdrawn",
  "deleted",
]);
const moderationStatuses = new Set<unknown>([
  "needs_changes",
  "approved",
  "rejected",
]);
const roundTypeLabels = new Set(experienceRoundTypes.map((item) => item.label));
const topicLabels = new Set(experienceTopics.map((item) => item.label));

export const INTERVIEW_EXPERIENCE_EXPECTED_REVISION_FIELD =
  "expected_updated_at";
export const INTERVIEW_EXPERIENCE_ABSENT_REVISION = "absent";

export const INTERVIEW_EXPERIENCE_INVALID_INPUT_ERROR =
  "The interview experience details are not valid.";
export const INTERVIEW_EXPERIENCE_INVALID_MANAGEMENT_ERROR =
  "That submission action is not valid.";
export const INTERVIEW_EXPERIENCE_INVALID_MODERATION_ERROR =
  "Choose an allowed moderation decision.";
export const INTERVIEW_EXPERIENCE_SAVE_UNAVAILABLE_ERROR =
  "Interview experience saving is unavailable in this configuration.";
export const INTERVIEW_EXPERIENCE_MANAGEMENT_UNAVAILABLE_ERROR =
  "Interview experience management is unavailable in this configuration.";
export const INTERVIEW_EXPERIENCE_SAVE_CONFLICT_ERROR =
  "This interview experience may have changed since you opened it. Your changes were not saved. Review the latest submission before trying again.";
export const INTERVIEW_EXPERIENCE_MANAGEMENT_CONFLICT_ERROR =
  "This submission may have changed since it was displayed. The requested action was not applied. Review the latest submission before trying again.";
export const INTERVIEW_EXPERIENCE_MODERATION_CONFLICT_ERROR =
  "This interview experience may have changed since it was displayed. Your moderation decision was not saved. Review the latest submission before trying again.";
export const INTERVIEW_EXPERIENCE_DRAFT_SAVED_MESSAGE =
  "Private draft saved. It is not public.";
export const INTERVIEW_EXPERIENCE_SUBMITTED_MESSAGE =
  "Submitted for privacy and moderation review. You can withdraw it while it is under review.";
export const INTERVIEW_EXPERIENCE_EARLIER_DRAFT_SAVED_MESSAGE =
  "Earlier draft changes saved. Review your current edits and save again.";
export const INTERVIEW_EXPERIENCE_EARLIER_SUBMISSION_SAVED_MESSAGE =
  "An earlier version was submitted for review. Your current edits remain unsaved as a new private draft.";
export const INTERVIEW_EXPERIENCE_EARLIER_WITHDRAW_SAVED_MESSAGE =
  "The submission was withdrawn. Your current form changes remain unsaved.";
export const INTERVIEW_EXPERIENCE_EARLIER_DELETE_SAVED_MESSAGE =
  "The saved submission was deleted. Your current form changes remain unsaved as a new private draft.";
export const INTERVIEW_EXPERIENCE_MODERATION_SAVED_MESSAGE =
  "Moderation decision saved without rewriting contributor content.";
export const INTERVIEW_EXPERIENCE_EARLIER_MODERATION_SAVED_MESSAGE =
  "An earlier moderation decision was saved. Your current form changes were not included.";

export type ExperienceSubmissionFields = Readonly<{
  companyName: string;
  roleTitle: string;
  roleLevel: string;
  region: string;
  interviewDate: string;
  summary: string;
  preparationLessons: string;
  publicIdentity: "anonymous" | "username";
  publicationConsent: boolean;
  roundType: string;
  topics: string[];
}>;

export type ExperienceSubmissionInput = ExperienceSubmissionFields &
  Readonly<{
    id: string;
    revision: string;
  }>;

export type ExperienceManagementAction = "withdraw" | "delete";
export type ExperienceModerationStatus =
  | "needs_changes"
  | "approved"
  | "rejected";
export type InterviewExperienceStatus =
  | "draft"
  | "submitted"
  | "needs_changes"
  | "approved"
  | "rejected"
  | "archived"
  | "withdrawn";
export type InterviewExperienceMutationStatus =
  | InterviewExperienceStatus
  | "deleted";

export type InterviewExperienceMutationResult =
  | Readonly<{
      status: "saved";
      id: string;
      experienceStatus: InterviewExperienceMutationStatus;
      updatedAt: string;
    }>
  | Readonly<{ status: "conflict" }>
  | Readonly<{ status: "invalid" }>;

export type ExperienceModerationInput = Readonly<{
  id: string;
  expectedUpdatedAt: string;
  status: ExperienceModerationStatus;
  note: string | null;
}>;

export type InterviewExperienceDisplayState = Readonly<{
  status: "idle" | "pending" | "error" | "success";
  message: string;
  conflict?: boolean;
}>;

type ParseResult<T> =
  | Readonly<{ ok: true; value: T }>
  | Readonly<{ ok: false }>;

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

function codePointLength(value: string) {
  return Array.from(value).length;
}

function cleanBoundedText(value: unknown, max: number): string | undefined {
  if (typeof value !== "string" || value.includes("\u0000")) return undefined;
  const trimmed = value.trim();
  return codePointLength(trimmed) <= max ? trimmed : undefined;
}

function daysInMonth(year: number, month: number) {
  if (month === 2) {
    const leapYear =
      year % 4 === 0 && (year % 100 !== 0 || year % 400 === 0);
    return leapYear ? 29 : 28;
  }
  return [4, 6, 9, 11].includes(month) ? 30 : 31;
}

export function isCanonicalInterviewExperienceId(
  value: unknown,
): value is string {
  return typeof value === "string" && UUID_PATTERN.test(value);
}

export function isCanonicalInterviewExperienceRevision(
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

function parseInterviewMonth(value: unknown) {
  if (value === "") return "";
  if (typeof value !== "string") return undefined;
  const match = INTERVIEW_MONTH_PATTERN.exec(value);
  return match && Number(match[1]) >= 1 ? value : undefined;
}

export function parseInterviewExperienceSaveInput(
  input: unknown,
  submit: unknown,
): ParseResult<{
  input: ExperienceSubmissionInput;
  submit: boolean;
  expectAbsent: boolean;
  expectedUpdatedAt: string | null;
}> {
  const expectedKeys = [
    "id",
    "revision",
    "companyName",
    "roleTitle",
    "roleLevel",
    "region",
    "interviewDate",
    "summary",
    "preparationLessons",
    "publicIdentity",
    "publicationConsent",
    "roundType",
    "topics",
  ] as const;
  if (
    !isPlainRecord(input) ||
    !hasExactKeys(input, expectedKeys) ||
    typeof submit !== "boolean"
  ) {
    return { ok: false };
  }

  const id = isCanonicalInterviewExperienceId(input.id)
    ? input.id.toLowerCase()
    : undefined;
  const revision = input.revision;
  const companyName = cleanBoundedText(input.companyName, 120);
  const roleTitle = cleanBoundedText(input.roleTitle, 160);
  const region = cleanBoundedText(input.region, 120);
  const interviewDate = parseInterviewMonth(input.interviewDate);
  const summary = cleanBoundedText(input.summary, 4000);
  const preparationLessons = cleanBoundedText(
    input.preparationLessons,
    3000,
  );
  const roundType = cleanBoundedText(input.roundType, 80);
  const topics = input.topics;

  if (
    !id ||
    (revision !== INTERVIEW_EXPERIENCE_ABSENT_REVISION &&
      !isCanonicalInterviewExperienceRevision(revision)) ||
    companyName === undefined ||
    roleTitle === undefined ||
    region === undefined ||
    interviewDate === undefined ||
    summary === undefined ||
    preparationLessons === undefined ||
    roundType === undefined ||
    !roleLevels.has(input.roleLevel) ||
    !publicIdentities.has(input.publicIdentity) ||
    typeof input.publicationConsent !== "boolean" ||
    !Array.isArray(topics) ||
    topics.length > 12
  ) {
    return { ok: false };
  }

  const canonicalTopics: string[] = [];
  for (const topic of topics) {
    const canonical = cleanBoundedText(topic, 80);
    if (
      canonical === undefined ||
      !canonical ||
      !topicLabels.has(canonical) ||
      canonicalTopics.includes(canonical)
    ) {
      return { ok: false };
    }
    canonicalTopics.push(canonical);
  }
  if (
    (roundType !== "" && !roundTypeLabels.has(roundType)) ||
    (roundType === "" && canonicalTopics.length > 0)
  ) {
    return { ok: false };
  }

  const expectAbsent = revision === INTERVIEW_EXPERIENCE_ABSENT_REVISION;
  return {
    ok: true,
    value: {
      input: {
        id,
        revision: revision as string,
        companyName,
        roleTitle,
        roleLevel: input.roleLevel as string,
        region,
        interviewDate,
        summary,
        preparationLessons,
        publicIdentity:
          input.publicIdentity as ExperienceSubmissionInput["publicIdentity"],
        publicationConsent: input.publicationConsent,
        roundType,
        topics: canonicalTopics,
      },
      submit,
      expectAbsent,
      expectedUpdatedAt: expectAbsent ? null : (revision as string),
    },
  };
}

export function parseInterviewExperienceManagementInput(
  id: unknown,
  action: unknown,
  expectedUpdatedAt: unknown,
): ParseResult<{
  id: string;
  action: ExperienceManagementAction;
  expectedUpdatedAt: string;
}> {
  if (
    !isCanonicalInterviewExperienceId(id) ||
    !managementActions.has(action) ||
    !isCanonicalInterviewExperienceRevision(expectedUpdatedAt)
  ) {
    return { ok: false };
  }
  return {
    ok: true,
    value: {
      id: id.toLowerCase(),
      action: action as ExperienceManagementAction,
      expectedUpdatedAt,
    },
  };
}

function isFormData(value: unknown): value is FormData {
  return typeof FormData !== "undefined" && value instanceof FormData;
}

function singleString(form: FormData, name: string) {
  const values = form.getAll(name);
  return values.length === 1 && typeof values[0] === "string"
    ? values[0]
    : undefined;
}

export function parseInterviewExperienceModerationInput(
  input: unknown,
): ParseResult<ExperienceModerationInput> {
  const allowed = new Set([
    "experience_id",
    INTERVIEW_EXPERIENCE_EXPECTED_REVISION_FIELD,
    "status",
    "moderation_note",
  ]);
  if (!isFormData(input)) return { ok: false };
  for (const key of input.keys()) {
    if (!allowed.has(key) && !key.startsWith("$ACTION_")) {
      return { ok: false };
    }
  }

  const id = singleString(input, "experience_id");
  const expectedUpdatedAt = singleString(
    input,
    INTERVIEW_EXPERIENCE_EXPECTED_REVISION_FIELD,
  );
  const status = singleString(input, "status");
  const note = cleanBoundedText(singleString(input, "moderation_note"), 1000);
  if (
    !isCanonicalInterviewExperienceId(id) ||
    !isCanonicalInterviewExperienceRevision(expectedUpdatedAt) ||
    !moderationStatuses.has(status) ||
    note === undefined
  ) {
    return { ok: false };
  }
  return {
    ok: true,
    value: {
      id: id.toLowerCase(),
      expectedUpdatedAt,
      status: status as ExperienceModerationStatus,
      note: note || null,
    },
  };
}

export function parseInterviewExperienceMutationResult(
  value: unknown,
  expectedId: unknown,
  allowedStatuses: readonly InterviewExperienceMutationStatus[],
): InterviewExperienceMutationResult {
  if (
    !isCanonicalInterviewExperienceId(expectedId) ||
    allowedStatuses.length === 0 ||
    allowedStatuses.some((status) => !experienceStatuses.has(status))
  ) {
    return { status: "invalid" };
  }
  if (!Array.isArray(value)) return { status: "invalid" };
  if (value.length === 0) return { status: "conflict" };
  if (value.length !== 1 || !isPlainRecord(value[0])) {
    return { status: "invalid" };
  }
  const row = value[0];
  if (
    !hasExactKeys(row, ["experience_id", "status", "updated_at"]) ||
    !isCanonicalInterviewExperienceId(row.experience_id) ||
    row.experience_id.toLowerCase() !== expectedId.toLowerCase() ||
    !experienceStatuses.has(row.status) ||
    !allowedStatuses.includes(row.status as InterviewExperienceMutationStatus) ||
    !isCanonicalInterviewExperienceRevision(row.updated_at)
  ) {
    return { status: "invalid" };
  }
  return {
    status: "saved",
    id: row.experience_id.toLowerCase(),
    experienceStatus: row.status as InterviewExperienceMutationStatus,
    updatedAt: row.updated_at,
  };
}

export function resolveInterviewExperienceDisplayState(
  actionState: InterviewExperienceDisplayState,
  pending: boolean,
  changedSinceSubmit: boolean,
  context: "draft" | "submit" | "withdraw" | "delete" | "moderation",
): InterviewExperienceDisplayState {
  if (pending) {
    return {
      status: "pending",
      message:
        context === "moderation"
          ? "Saving moderation decision…"
          : context === "withdraw"
            ? "Withdrawing your submission…"
          : context === "delete"
            ? "Deleting your submission…"
          : context === "submit"
            ? "Submitting for review…"
            : "Saving private draft…",
    };
  }
  if (actionState.status === "success" && changedSinceSubmit) {
    return {
      status: "success",
      message:
        context === "moderation"
          ? INTERVIEW_EXPERIENCE_EARLIER_MODERATION_SAVED_MESSAGE
          : context === "withdraw"
            ? INTERVIEW_EXPERIENCE_EARLIER_WITHDRAW_SAVED_MESSAGE
          : context === "delete"
            ? INTERVIEW_EXPERIENCE_EARLIER_DELETE_SAVED_MESSAGE
          : context === "submit"
            ? INTERVIEW_EXPERIENCE_EARLIER_SUBMISSION_SAVED_MESSAGE
            : INTERVIEW_EXPERIENCE_EARLIER_DRAFT_SAVED_MESSAGE,
    };
  }
  return actionState;
}
