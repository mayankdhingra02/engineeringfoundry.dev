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
}>;

export type CompleteOnboardingActionInputParseResult = ParseResult<
  CompleteOnboardingActionInput,
  "invalid-input" | "invalid-timezone"
>;

export type SavePreparationPreferencesActionInputParseResult =
  ParseResult<SavePreparationPreferencesActionInput>;

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
  if (
    preferredRoleLevelField.status === "missing" ||
    primaryPreparationFocusField.status === "missing" ||
    dsaLevelField.status === "missing"
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

  return {
    ok: true,
    value: { preferredRoleLevel, primaryPreparationFocus, dsaLevel },
  };
}
