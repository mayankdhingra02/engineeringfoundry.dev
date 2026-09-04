import {
  dsaLevelOptions,
  focusOptions,
  roleLevelOptions,
  type PreferredDsaLevel,
  type PreferredRoleLevel,
  type PrimaryPreparationFocus,
} from "./preferences.ts";
import { safeInternalPath } from "../auth/redirects.ts";
import { validIanaTimeZone } from "../interview-calendar/model.ts";

export const ONBOARDING_ACTION_INVALID_INPUT_ERROR =
  "Those setup choices are not valid. Review the form and try again.";
export const ONBOARDING_TIMEZONE_INVALID_ERROR =
  "Choose a valid IANA timezone, such as America/Chicago.";
export const PREPARATION_PREFERENCES_ACTION_INVALID_INPUT_ERROR =
  "Those preparation preferences are not valid. Review the form and try again.";
export const PREPARATION_PREFERENCES_CONFLICT_ERROR =
  "These preparation preferences may have changed since you opened this page. Your changes were not saved. Review the latest saved version before trying again.";
export const PREPARATION_PREFERENCES_PERSISTENCE_ERROR =
  "We couldn't save preparation preferences. Try again.";
export const PREPARATION_PREFERENCES_SAVED_MESSAGE =
  "Preparation preferences saved.";
export const PREPARATION_PREFERENCES_PENDING_MESSAGE =
  "Saving preparation preferences…";
export const PREPARATION_PREFERENCES_EARLIER_SNAPSHOT_SAVED_MESSAGE =
  "Earlier preparation preferences saved. Review your current changes and save again.";
export const PREPARATION_PREFERENCES_EXPECTED_REVISION_FIELD =
  "expected_updated_at";
export const PREPARATION_PREFERENCES_ABSENT_REVISION = "absent";

const onboardingFieldNames = new Set([
  "intent",
  "next",
  "preferredRoleLevel",
  "primaryPreparationFocus",
  "preferredTimezone",
  "interviewScheduled",
]);
const preferenceFieldNames = new Set([
  "preferredRoleLevel",
  "primaryPreparationFocus",
  "dsaLevel",
  PREPARATION_PREFERENCES_EXPECTED_REVISION_FIELD,
]);
const preferredRoleLevels = new Set(roleLevelOptions.map((option) => option.value));
const primaryPreparationFocuses = new Set(focusOptions.map((option) => option.value));
const preferredDsaLevels = new Set(dsaLevelOptions.map((option) => option.value));

type ParseResult<T, Reason extends string = "invalid-input"> =
  | { ok: true; value: T }
  | { ok: false; reason: Reason };

type SingleStringField =
  | { status: "missing" }
  | { status: "invalid" }
  | { status: "value"; value: string };

export type CompleteOnboardingActionInput = Readonly<{
  intent: "complete" | "skip";
  preferredRoleLevel: PreferredRoleLevel | null;
  primaryPreparationFocus: PrimaryPreparationFocus | null;
  preferredTimezone: string | null;
  interviewScheduled: boolean;
  requestedPath: string;
}>;

export type SavePreparationPreferencesActionInput = Readonly<{
  preferredRoleLevel: PreferredRoleLevel | null;
  primaryPreparationFocus: PrimaryPreparationFocus | null;
  dsaLevel: PreferredDsaLevel | null;
  expectAbsent: boolean;
  expectedUpdatedAt: string | null;
  revision: string;
}>;

export type CompleteOnboardingActionInputParseResult = ParseResult<
  CompleteOnboardingActionInput,
  "invalid-input" | "invalid-timezone"
>;

export type SavePreparationPreferencesActionInputParseResult =
  ParseResult<SavePreparationPreferencesActionInput>;

export type SavePreparationPreferencesResult =
  | Readonly<{ status: "saved"; updatedAt: string }>
  | Readonly<{ status: "conflict" }>
  | Readonly<{ status: "invalid" }>;

export type PreparationPreferenceDisplayState = Readonly<{
  status: "idle" | "pending" | "error" | "success";
  message: string;
}>;

const DATABASE_TIMESTAMP_PATTERN =
  /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2}):(\d{2})(?:\.\d{1,6})?(Z|([+-])(\d{2}):(\d{2}))$/;

function isFormData(value: unknown): value is FormData {
  return typeof FormData !== "undefined" && value instanceof FormData;
}

function hasOnlyKnownFields(form: FormData, knownFields: ReadonlySet<string>) {
  for (const key of form.keys()) {
    if (!knownFields.has(key) && !key.startsWith("$ACTION_")) return false;
  }
  return true;
}

function singleString(form: FormData, name: string): SingleStringField {
  const values = form.getAll(name);
  if (values.length === 0) return { status: "missing" };
  if (values.length !== 1 || typeof values[0] !== "string") {
    return { status: "invalid" };
  }
  return { status: "value", value: values[0] };
}

function optionalExactChoice<T extends string>(
  field: SingleStringField,
  allowed: ReadonlySet<T>,
): T | null | undefined {
  if (field.status === "missing" || field.status === "value" && field.value === "") {
    return null;
  }
  if (field.status !== "value" || !allowed.has(field.value as T)) return undefined;
  return field.value as T;
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

function daysInMonth(year: number, month: number) {
  if (month === 2) {
    const leapYear =
      year % 4 === 0 && (year % 100 !== 0 || year % 400 === 0);
    return leapYear ? 29 : 28;
  }
  return [4, 6, 9, 11].includes(month) ? 30 : 31;
}

export function isCanonicalPreparationPreferenceRevision(
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

export function parseCompleteOnboardingActionInput(
  input: unknown,
): CompleteOnboardingActionInputParseResult {
  if (!isFormData(input) || !hasOnlyKnownFields(input, onboardingFieldNames)) {
    return { ok: false, reason: "invalid-input" };
  }

  const intentField = singleString(input, "intent");
  const nextField = singleString(input, "next");
  if (
    intentField.status !== "value" ||
    (intentField.value !== "complete" && intentField.value !== "skip") ||
    nextField.status !== "value"
  ) {
    return { ok: false, reason: "invalid-input" };
  }

  const requestedPath = safeInternalPath(nextField.value);
  if (intentField.value === "skip") {
    return {
      ok: true,
      value: {
        intent: "skip",
        preferredRoleLevel: null,
        primaryPreparationFocus: null,
        preferredTimezone: null,
        interviewScheduled: false,
        requestedPath,
      },
    };
  }

  const preferredRoleLevel = optionalExactChoice(
    singleString(input, "preferredRoleLevel"),
    preferredRoleLevels,
  );
  const primaryPreparationFocus = optionalExactChoice(
    singleString(input, "primaryPreparationFocus"),
    primaryPreparationFocuses,
  );
  const timezoneField = singleString(input, "preferredTimezone");
  const interviewScheduledField = singleString(input, "interviewScheduled");
  if (
    preferredRoleLevel === undefined ||
    primaryPreparationFocus === undefined ||
    timezoneField.status !== "value" ||
    interviewScheduledField.status !== "value" ||
    (interviewScheduledField.value !== "yes" && interviewScheduledField.value !== "no")
  ) {
    return { ok: false, reason: "invalid-input" };
  }

  const preferredTimezone = canonicalIanaTimeZone(timezoneField.value);
  if (preferredTimezone === undefined) {
    return { ok: false, reason: "invalid-timezone" };
  }

  return {
    ok: true,
    value: {
      intent: "complete",
      preferredRoleLevel,
      primaryPreparationFocus,
      preferredTimezone,
      interviewScheduled: interviewScheduledField.value === "yes",
      requestedPath,
    },
  };
}

export function parseSavePreparationPreferencesActionInput(
  input: unknown,
): SavePreparationPreferencesActionInputParseResult {
  if (!isFormData(input) || !hasOnlyKnownFields(input, preferenceFieldNames)) {
    return { ok: false, reason: "invalid-input" };
  }

  const preferredRoleLevelField = singleString(input, "preferredRoleLevel");
  const primaryPreparationFocusField = singleString(input, "primaryPreparationFocus");
  const dsaLevelField = singleString(input, "dsaLevel");
  const revisionField = singleString(
    input,
    PREPARATION_PREFERENCES_EXPECTED_REVISION_FIELD,
  );
  if (
    preferredRoleLevelField.status === "missing" ||
    primaryPreparationFocusField.status === "missing" ||
    dsaLevelField.status === "missing" ||
    revisionField.status !== "value" ||
    (revisionField.value !== PREPARATION_PREFERENCES_ABSENT_REVISION &&
      !isCanonicalPreparationPreferenceRevision(revisionField.value))
  ) {
    return { ok: false, reason: "invalid-input" };
  }

  const preferredRoleLevel = optionalExactChoice(preferredRoleLevelField, preferredRoleLevels);
  const primaryPreparationFocus = optionalExactChoice(
    primaryPreparationFocusField,
    primaryPreparationFocuses,
  );
  const dsaLevel = optionalExactChoice(dsaLevelField, preferredDsaLevels);
  if (
    preferredRoleLevel === undefined ||
    primaryPreparationFocus === undefined ||
    dsaLevel === undefined
  ) {
    return { ok: false, reason: "invalid-input" };
  }

  const expectAbsent =
    revisionField.value === PREPARATION_PREFERENCES_ABSENT_REVISION;
  return {
    ok: true,
    value: {
      preferredRoleLevel,
      primaryPreparationFocus,
      dsaLevel,
      expectAbsent,
      expectedUpdatedAt: expectAbsent ? null : revisionField.value,
      revision: revisionField.value,
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

export function parseSavePreparationPreferencesResult(
  value: unknown,
): SavePreparationPreferencesResult {
  if (!Array.isArray(value)) return { status: "invalid" };
  if (value.length === 0) return { status: "conflict" };
  if (value.length !== 1 || !isPlainRecord(value[0])) {
    return { status: "invalid" };
  }

  const keys = Reflect.ownKeys(value[0]);
  if (
    keys.length !== 1 ||
    !keys.includes("updated_at") ||
    !isCanonicalPreparationPreferenceRevision(value[0].updated_at)
  ) {
    return { status: "invalid" };
  }

  return { status: "saved", updatedAt: value[0].updated_at };
}

export function resolvePreparationPreferenceDisplayState(
  actionState: Readonly<{
    status: "idle" | "error" | "success";
    message: string;
  }>,
  pending: boolean,
  changedSinceSubmit: boolean,
): PreparationPreferenceDisplayState {
  if (pending) {
    return {
      status: "pending",
      message: PREPARATION_PREFERENCES_PENDING_MESSAGE,
    };
  }
  if (actionState.status === "success" && changedSinceSubmit) {
    return {
      status: "success",
      message: PREPARATION_PREFERENCES_EARLIER_SNAPSHOT_SAVED_MESSAGE,
    };
  }
  return actionState;
}
