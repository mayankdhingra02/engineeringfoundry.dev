import { validIanaTimeZone } from "./model.ts";

export const REMINDER_PREFERENCE_EXPECTED_REVISION_FIELD =
  "expected_updated_at";
export const REMINDER_PREFERENCE_ABSENT_REVISION = "absent";

export const REMINDER_PREFERENCE_INVALID_INPUT_ERROR =
  "Review the reminder settings and try again.";
export const REMINDER_PREFERENCE_TIMEZONE_ERROR =
  "Enter a valid IANA timezone, such as America/Chicago.";
export const REMINDER_PREFERENCE_CONFLICT_ERROR =
  "These reminder settings may have changed since you opened this page. Your changes were not saved. Review the latest saved version before trying again.";
export const REMINDER_PREFERENCE_PERSISTENCE_ERROR =
  "We couldn't save reminder settings. Try again.";
export const REMINDER_PREFERENCE_SAVED_MESSAGE =
  "Interview reminder settings saved.";
export const REMINDER_PREFERENCE_PENDING_MESSAGE =
  "Saving reminder settings…";
export const REMINDER_PREFERENCE_EARLIER_SNAPSHOT_SAVED_MESSAGE =
  "Earlier reminder settings saved. Review your current changes and save again.";

export const REMINDER_PREFERENCE_PRESENCE_FIELDS = {
  inAppEnabled: "inAppEnabled_present",
  prep3DaysEnabled: "prep3DaysEnabled_present",
  interview1DayEnabled: "interview1DayEnabled_present",
  interview1HourEnabled: "interview1HourEnabled_present",
  emailEnabled: "emailEnabled_present",
} as const;

const REMINDER_PREFERENCE_FIELDS = new Set([
  "preferredTimezone",
  "inAppEnabled",
  REMINDER_PREFERENCE_PRESENCE_FIELDS.inAppEnabled,
  "prep3DaysEnabled",
  REMINDER_PREFERENCE_PRESENCE_FIELDS.prep3DaysEnabled,
  "interview1DayEnabled",
  REMINDER_PREFERENCE_PRESENCE_FIELDS.interview1DayEnabled,
  "interview1HourEnabled",
  REMINDER_PREFERENCE_PRESENCE_FIELDS.interview1HourEnabled,
  "emailEnabled",
  REMINDER_PREFERENCE_PRESENCE_FIELDS.emailEnabled,
  REMINDER_PREFERENCE_EXPECTED_REVISION_FIELD,
]);

const DATABASE_TIMESTAMP_PATTERN =
  /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2}):(\d{2})(?:\.\d{1,6})?(Z|([+-])(\d{2}):(\d{2}))$/;

type SingleString =
  | Readonly<{ status: "value"; value: string }>
  | Readonly<{ status: "missing" }>
  | Readonly<{ status: "invalid" }>;

export type ReminderPreferenceActionInput = Readonly<{
  preferredTimezone: string | null;
  inAppEnabled: boolean;
  prep3DaysEnabled: boolean;
  interview1DayEnabled: boolean;
  interview1HourEnabled: boolean;
  emailEnabled: boolean;
  expectAbsent: boolean;
  expectedUpdatedAt: string | null;
  revision: string;
}>;

export type ReminderPreferenceActionInputResult =
  | Readonly<{ ok: true; value: ReminderPreferenceActionInput }>
  | Readonly<{
      ok: false;
      reason: "invalid-input" | "invalid-timezone";
    }>;

export type ReminderPreferenceSaveResult =
  | Readonly<{ status: "saved"; updatedAt: string }>
  | Readonly<{ status: "conflict" }>
  | Readonly<{ status: "invalid" }>;

export type ReminderPreferenceDisplayState = Readonly<{
  status: "idle" | "pending" | "error" | "success";
  message: string;
}>;

function isFormData(value: unknown): value is FormData {
  return typeof FormData !== "undefined" && value instanceof FormData;
}

function hasOnlyKnownFields(form: FormData) {
  for (const key of form.keys()) {
    if (!REMINDER_PREFERENCE_FIELDS.has(key) && !key.startsWith("$ACTION_")) {
      return false;
    }
  }
  return true;
}

function singleString(
  form: FormData,
  name: string,
  required = true,
): SingleString {
  const values = form.getAll(name);
  if (values.length === 0 && !required) return { status: "missing" };
  if (values.length !== 1 || typeof values[0] !== "string") {
    return { status: "invalid" };
  }
  return { status: "value", value: values[0] };
}

function parseCheckbox(
  form: FormData,
  fieldName: string,
  presenceFieldName: string,
): boolean | undefined {
  const presence = singleString(form, presenceFieldName);
  const value = singleString(form, fieldName, false);
  if (
    presence.status !== "value" ||
    presence.value !== "true" ||
    value.status === "invalid" ||
    (value.status === "value" && value.value !== "true")
  ) {
    return undefined;
  }
  return value.status === "value";
}

function daysInMonth(year: number, month: number) {
  if (month === 2) {
    const leapYear =
      year % 4 === 0 && (year % 100 !== 0 || year % 400 === 0);
    return leapYear ? 29 : 28;
  }
  return [4, 6, 9, 11].includes(month) ? 30 : 31;
}

export function isCanonicalReminderPreferenceRevision(
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

function canonicalIanaTimeZone(value: string): string | null | undefined {
  const trimmed = value.trim();
  if (!trimmed) return null;
  if (!validIanaTimeZone(trimmed)) return undefined;

  try {
    const canonical = new Intl.DateTimeFormat("en", { timeZone: trimmed })
      .resolvedOptions()
      .timeZone;
    return validIanaTimeZone(canonical) ? canonical : undefined;
  } catch {
    return undefined;
  }
}

export function parseReminderPreferenceActionInput(
  input: unknown,
): ReminderPreferenceActionInputResult {
  if (!isFormData(input) || !hasOnlyKnownFields(input)) {
    return { ok: false, reason: "invalid-input" };
  }

  const timezone = singleString(input, "preferredTimezone");
  const revision = singleString(
    input,
    REMINDER_PREFERENCE_EXPECTED_REVISION_FIELD,
  );
  const inAppEnabled = parseCheckbox(
    input,
    "inAppEnabled",
    REMINDER_PREFERENCE_PRESENCE_FIELDS.inAppEnabled,
  );
  const prep3DaysEnabled = parseCheckbox(
    input,
    "prep3DaysEnabled",
    REMINDER_PREFERENCE_PRESENCE_FIELDS.prep3DaysEnabled,
  );
  const interview1DayEnabled = parseCheckbox(
    input,
    "interview1DayEnabled",
    REMINDER_PREFERENCE_PRESENCE_FIELDS.interview1DayEnabled,
  );
  const interview1HourEnabled = parseCheckbox(
    input,
    "interview1HourEnabled",
    REMINDER_PREFERENCE_PRESENCE_FIELDS.interview1HourEnabled,
  );
  const emailEnabled = parseCheckbox(
    input,
    "emailEnabled",
    REMINDER_PREFERENCE_PRESENCE_FIELDS.emailEnabled,
  );

  if (
    timezone.status !== "value" ||
    revision.status !== "value" ||
    (revision.value !== REMINDER_PREFERENCE_ABSENT_REVISION &&
      !isCanonicalReminderPreferenceRevision(revision.value)) ||
    inAppEnabled === undefined ||
    prep3DaysEnabled === undefined ||
    interview1DayEnabled === undefined ||
    interview1HourEnabled === undefined ||
    emailEnabled === undefined
  ) {
    return { ok: false, reason: "invalid-input" };
  }

  const preferredTimezone = canonicalIanaTimeZone(timezone.value);
  if (preferredTimezone === undefined) {
    return { ok: false, reason: "invalid-timezone" };
  }

  const expectAbsent = revision.value === REMINDER_PREFERENCE_ABSENT_REVISION;
  return {
    ok: true,
    value: {
      preferredTimezone,
      inAppEnabled,
      prep3DaysEnabled,
      interview1DayEnabled,
      interview1HourEnabled,
      emailEnabled,
      expectAbsent,
      expectedUpdatedAt: expectAbsent ? null : revision.value,
      revision: revision.value,
    },
  };
}

function isPlainRecord(value: unknown): value is Record<string, unknown> {
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    return false;
  }
  const prototype = Object.getPrototypeOf(value);
  return prototype === Object.prototype || prototype === null;
}

export function parseReminderPreferenceSaveResult(
  value: unknown,
): ReminderPreferenceSaveResult {
  if (!Array.isArray(value)) return { status: "invalid" };
  if (value.length === 0) return { status: "conflict" };
  if (!isPlainRecord(value[0]) || value.length !== 1) {
    return { status: "invalid" };
  }

  const keys = Reflect.ownKeys(value[0]);
  if (
    keys.length !== 1 ||
    !keys.includes("updated_at") ||
    !isCanonicalReminderPreferenceRevision(value[0].updated_at)
  ) {
    return { status: "invalid" };
  }

  return { status: "saved", updatedAt: value[0].updated_at };
}

export function resolveReminderPreferenceDisplayState(
  actionState: Readonly<{
    status: "idle" | "error" | "success";
    message: string;
  }>,
  pending: boolean,
  changedSinceSubmit: boolean,
): ReminderPreferenceDisplayState {
  if (pending) {
    return { status: "pending", message: REMINDER_PREFERENCE_PENDING_MESSAGE };
  }
  if (actionState.status === "success" && changedSinceSubmit) {
    return {
      status: "success",
      message: REMINDER_PREFERENCE_EARLIER_SNAPSHOT_SAVED_MESSAGE,
    };
  }
  return actionState;
}
