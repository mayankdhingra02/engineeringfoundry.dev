import {
  TRACKER_EDIT_REVISION_FIELD,
  parseTrackerEditRevision,
} from "./edit-revision.ts";
import {
  APPLICATION_STATUSES,
  normalizeCompanySlug,
  ROUND_RESULTS,
  ROUND_STATUSES,
} from "./options.ts";

export type FieldErrors = Record<string, string>;
export type TrackerFormMode = "create" | "edit";

type TrackerFormParseResult<T> =
  | Readonly<{
      ok: true;
      data: T;
      expectedUpdatedAt: string | null;
    }>
  | Readonly<{
      ok: false;
      errors: FieldErrors;
      reason: "invalid-input" | "invalid-revision";
    }>;

const APPLICATION_FIELDS = [
  "company_name",
  "role_title",
  "role_level",
  "status",
  "application_date",
  "location",
  "job_url",
  "source",
  "recruiter_name",
  "recruiter_email",
  "notes",
] as const;

const ROUND_FIELDS = [
  "round_name",
  "round_type",
  "scheduled_local",
  "timezone",
  "duration_minutes",
  "status",
  "result",
  "interviewer_name",
  "interviewer_role",
  "meeting_link",
  "location",
  "notes",
] as const;

function isFormData(value: unknown): value is FormData {
  return typeof FormData !== "undefined" && value instanceof FormData;
}

function exactStringSnapshot<const Name extends string>(
  input: unknown,
  fieldNames: readonly Name[],
  mode: TrackerFormMode,
):
  | Readonly<{
      fields: Readonly<Record<Name, string>>;
      expectedUpdatedAt: string | null;
    }>
  | null {
  if (!isFormData(input)) return null;
  const allowedFields = new Set<string>(fieldNames);
  if (mode === "edit") allowedFields.add(TRACKER_EDIT_REVISION_FIELD);
  for (const key of input.keys()) {
    if (!key.startsWith("$ACTION_") && !allowedFields.has(key)) return null;
  }

  const fields = {} as Record<Name, string>;
  for (const name of fieldNames) {
    const values = input.getAll(name);
    if (values.length !== 1 || typeof values[0] !== "string") return null;
    fields[name] = values[0];
  }

  if (mode === "create") {
    return { fields, expectedUpdatedAt: null };
  }
  const revision = parseTrackerEditRevision(input);
  return revision.ok
    ? { fields, expectedUpdatedAt: revision.expectedUpdatedAt }
    : null;
}

function containsUnsafeControl(value: string, multiline = false) {
  return Array.from(value).some((character) => {
    const codePoint = character.codePointAt(0) ?? 0;
    if (multiline && (codePoint === 9 || codePoint === 10 || codePoint === 13)) {
      return false;
    }
    return codePoint < 32 || codePoint === 127;
  });
}

function text(fields: Readonly<Record<string, string>>, key: string) {
  return fields[key].trim();
}

function optional(
  fields: Readonly<Record<string, string>>,
  key: string,
  max: number,
  errors: FieldErrors,
  multiline = false,
) {
  const value = text(fields, key);
  if (
    Array.from(value).length > max ||
    containsUnsafeControl(value, multiline)
  ) {
    errors[key] = `Use ${max} characters or fewer${multiline ? " and ordinary text" : ""}.`;
  }
  return value || null;
}

function validHttpUrl(value: string | null) {
  if (!value) return true;
  try {
    const url = new URL(value);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
}

function validEmail(value: string | null) {
  return !value || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

function validDateOnly(value: string) {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!match) return false;
  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const date = new Date(Date.UTC(year, month - 1, day));
  return (
    date.getUTCFullYear() === year &&
    date.getUTCMonth() === month - 1 &&
    date.getUTCDate() === day
  );
}

function validTimeZone(value: string) {
  try {
    new Intl.DateTimeFormat("en-US", { timeZone: value }).format();
    return true;
  } catch {
    return false;
  }
}

function zonedDateTimeToUtc(localValue: string, timeZone: string) {
  const match = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})$/.exec(localValue);
  if (!match || !validTimeZone(timeZone)) return null;
  const desired = {
    year: Number(match[1]),
    month: Number(match[2]),
    day: Number(match[3]),
    hour: Number(match[4]),
    minute: Number(match[5]),
  };
  let utc = Date.UTC(
    desired.year,
    desired.month - 1,
    desired.day,
    desired.hour,
    desired.minute,
  );
  const formatter = new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  });
  for (let pass = 0; pass < 2; pass += 1) {
    const parts = Object.fromEntries(
      formatter
        .formatToParts(new Date(utc))
        .filter((part) => part.type !== "literal")
        .map((part) => [part.type, part.value]),
    );
    const represented = Date.UTC(
      Number(parts.year),
      Number(parts.month) - 1,
      Number(parts.day),
      Number(parts.hour),
      Number(parts.minute),
    );
    utc -=
      represented -
      Date.UTC(
        desired.year,
        desired.month - 1,
        desired.day,
        desired.hour,
        desired.minute,
      );
  }
  const check = Object.fromEntries(
    formatter
      .formatToParts(new Date(utc))
      .filter((part) => part.type !== "literal")
      .map((part) => [part.type, part.value]),
  );
  if (
    Number(check.year) !== desired.year ||
    Number(check.month) !== desired.month ||
    Number(check.day) !== desired.day ||
    Number(check.hour) !== desired.hour ||
    Number(check.minute) !== desired.minute
  ) {
    return null;
  }
  return new Date(utc).toISOString();
}

export function parseApplicationForm(
  input: unknown,
  mode: TrackerFormMode = "create",
): TrackerFormParseResult<{
  company_name: string;
  company_slug: string | null;
  role_title: string;
  role_level: string | null;
  location: string | null;
  job_url: string | null;
  application_date: string | null;
  source: string | null;
  status: (typeof APPLICATION_STATUSES)[number];
  recruiter_name: string | null;
  recruiter_email: string | null;
  notes: string | null;
}> {
  const snapshot = exactStringSnapshot(input, APPLICATION_FIELDS, mode);
  if (!snapshot) {
    const invalidRevision =
      mode === "edit" &&
      isFormData(input) &&
      !parseTrackerEditRevision(input).ok;
    return {
      ok: false,
      errors: {},
      reason: invalidRevision ? "invalid-revision" : "invalid-input",
    };
  }

  const { fields } = snapshot;
  const errors: FieldErrors = {};
  const companyName = text(fields, "company_name");
  const roleTitle = text(fields, "role_title");
  if (
    !companyName ||
    Array.from(companyName).length > 120 ||
    containsUnsafeControl(companyName)
  ) {
    errors.company_name = "Enter a company using 120 characters or fewer.";
  }
  if (
    !roleTitle ||
    Array.from(roleTitle).length > 120 ||
    containsUnsafeControl(roleTitle)
  ) {
    errors.role_title = "Enter a role title using 120 characters or fewer.";
  }
  const roleLevel = optional(fields, "role_level", 80, errors);
  const location = optional(fields, "location", 160, errors);
  const jobUrl = optional(fields, "job_url", 1_000, errors);
  const source = optional(fields, "source", 100, errors);
  const recruiterName = optional(fields, "recruiter_name", 120, errors);
  const recruiterEmail = optional(fields, "recruiter_email", 254, errors);
  const notes = optional(fields, "notes", 10_000, errors, true);
  const status = text(fields, "status");
  const applicationDate = text(fields, "application_date") || null;
  if (
    !APPLICATION_STATUSES.includes(
      status as (typeof APPLICATION_STATUSES)[number],
    )
  ) {
    errors.status = "Choose a valid application status.";
  }
  if (applicationDate && !validDateOnly(applicationDate)) {
    errors.application_date = "Enter a valid application date.";
  }
  if (!validHttpUrl(jobUrl)) {
    errors.job_url = "Enter a complete http or https URL.";
  }
  if (!validEmail(recruiterEmail)) {
    errors.recruiter_email = "Enter a valid recruiter email address.";
  }
  if (Object.keys(errors).length) {
    return { ok: false, errors, reason: "invalid-input" };
  }
  return {
    ok: true,
    expectedUpdatedAt: snapshot.expectedUpdatedAt,
    data: {
      company_name: companyName,
      company_slug: normalizeCompanySlug(companyName),
      role_title: roleTitle,
      role_level: roleLevel,
      location,
      job_url: jobUrl,
      application_date: applicationDate,
      source,
      status: status as (typeof APPLICATION_STATUSES)[number],
      recruiter_name: recruiterName,
      recruiter_email: recruiterEmail,
      notes,
    },
  };
}

export function parseRoundForm(
  input: unknown,
  mode: TrackerFormMode = "create",
): TrackerFormParseResult<{
  round_name: string;
  round_type: string;
  scheduled_at: string | null;
  duration_minutes: number | null;
  timezone: string | null;
  interviewer_name: string | null;
  interviewer_role: string | null;
  meeting_link: string | null;
  location: string | null;
  status: (typeof ROUND_STATUSES)[number];
  result: (typeof ROUND_RESULTS)[number];
  notes: string | null;
}> {
  const snapshot = exactStringSnapshot(input, ROUND_FIELDS, mode);
  if (!snapshot) {
    const invalidRevision =
      mode === "edit" &&
      isFormData(input) &&
      !parseTrackerEditRevision(input).ok;
    return {
      ok: false,
      errors: {},
      reason: invalidRevision ? "invalid-revision" : "invalid-input",
    };
  }

  const { fields } = snapshot;
  const errors: FieldErrors = {};
  const roundName = text(fields, "round_name");
  const roundType = text(fields, "round_type");
  if (
    !roundName ||
    Array.from(roundName).length > 120 ||
    containsUnsafeControl(roundName)
  ) {
    errors.round_name = "Enter a round name using 120 characters or fewer.";
  }
  if (
    !roundType ||
    Array.from(roundType).length > 100 ||
    containsUnsafeControl(roundType)
  ) {
    errors.round_type = "Enter or choose a round type.";
  }
  const timezone = optional(fields, "timezone", 100, errors);
  if (timezone && !validTimeZone(timezone)) {
    errors.timezone = "Choose a valid IANA timezone for this interview.";
  }
  const localDateTime = text(fields, "scheduled_local");
  let scheduledAt: string | null = null;
  if (localDateTime) {
    if (!timezone || !validTimeZone(timezone)) {
      errors.timezone = "Choose a valid IANA timezone for this interview.";
    } else {
      scheduledAt = zonedDateTimeToUtc(localDateTime, timezone);
      if (!scheduledAt) {
        errors.scheduled_local =
          "That local date and time does not exist in the selected timezone.";
      }
    }
  }
  const durationRaw = text(fields, "duration_minutes");
  const durationMinutes = durationRaw && /^\d+$/.test(durationRaw)
    ? Number(durationRaw)
    : durationRaw
      ? Number.NaN
      : null;
  if (
    durationMinutes !== null &&
    (!Number.isInteger(durationMinutes) ||
      durationMinutes < 5 ||
      durationMinutes > 1_440)
  ) {
    errors.duration_minutes = "Use a duration between 5 and 1,440 minutes.";
  }
  const interviewerName = optional(fields, "interviewer_name", 120, errors);
  const interviewerRole = optional(fields, "interviewer_role", 120, errors);
  const meetingLink = optional(fields, "meeting_link", 1_000, errors);
  const location = optional(fields, "location", 200, errors);
  const notes = optional(fields, "notes", 10_000, errors, true);
  const status = text(fields, "status");
  const result = text(fields, "result");
  if (
    !ROUND_STATUSES.includes(status as (typeof ROUND_STATUSES)[number])
  ) {
    errors.status = "Choose a valid round status.";
  }
  if (!scheduledAt && ["Scheduled", "Rescheduled"].includes(status)) {
    errors.scheduled_local =
      "Add a date and time for a scheduled interview.";
  }
  if (!ROUND_RESULTS.includes(result as (typeof ROUND_RESULTS)[number])) {
    errors.result = "Choose a valid result.";
  }
  if (!validHttpUrl(meetingLink)) {
    errors.meeting_link = "Enter a complete http or https URL.";
  }
  if (Object.keys(errors).length) {
    return { ok: false, errors, reason: "invalid-input" };
  }
  return {
    ok: true,
    expectedUpdatedAt: snapshot.expectedUpdatedAt,
    data: {
      round_name: roundName,
      round_type: roundType,
      scheduled_at: scheduledAt,
      duration_minutes: durationMinutes,
      timezone,
      interviewer_name: interviewerName,
      interviewer_role: interviewerRole,
      meeting_link: meetingLink,
      location,
      status: status as (typeof ROUND_STATUSES)[number],
      result: result as (typeof ROUND_RESULTS)[number],
      notes,
    },
  };
}
