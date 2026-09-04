import {
  meetsPasswordRequirement,
  PASSWORD_REQUIREMENT,
} from "../auth/credentials.ts";

export const ACCOUNT_SETTINGS_INVALID_INPUT_ERROR =
  "Review the account fields and try again.";
export const ACCOUNT_DISPLAY_NAME_INVALID_ERROR =
  "Display name must be 80 characters or fewer.";
export const ACCOUNT_EMAIL_INVALID_ERROR = "Enter a valid email address.";
export const ACCOUNT_PASSWORD_INVALID_INPUT_ERROR =
  "Review the password fields and try again.";
export const ACCOUNT_PASSWORD_CONFIRMATION_ERROR =
  "New passwords do not match.";
export const ACCOUNT_DELETION_CONFIRMATION_ERROR =
  "Type DELETE exactly to confirm permanent account deletion.";

type ParseResult<T, Reason extends string> =
  | Readonly<{ ok: true; value: T }>
  | Readonly<{ ok: false; reason: Reason }>;

type SingleStringField =
  | Readonly<{ status: "missing" }>
  | Readonly<{ status: "invalid" }>
  | Readonly<{ status: "value"; value: string }>;

export type DisplayNameActionInput = Readonly<{ displayName: string | null }>;
export type EmailChangeActionInput = Readonly<{ email: string }>;
export type PasswordChangeActionInput = Readonly<{
  currentPassword: string;
  newPassword: string;
}>;
export type DeleteAccountActionInput = Readonly<{
  currentPassword: string | null;
}>;

export type DisplayNameActionInputParseResult = ParseResult<
  DisplayNameActionInput,
  "invalid-input" | "invalid-display-name"
>;
export type EmailChangeActionInputParseResult = ParseResult<
  EmailChangeActionInput,
  "invalid-input" | "invalid-email"
>;
export type PasswordChangeActionInputParseResult = ParseResult<
  PasswordChangeActionInput,
  "invalid-input" | "weak-password" | "password-mismatch"
>;
export type DeleteAccountActionInputParseResult = ParseResult<
  DeleteAccountActionInput,
  "invalid-input" | "invalid-confirmation"
>;

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

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

export function parseDisplayNameActionInput(
  input: unknown,
): DisplayNameActionInputParseResult {
  const fields = new Set(["displayName"]);
  if (!isFormData(input) || !hasOnlyKnownFields(input, fields)) {
    return { ok: false, reason: "invalid-input" };
  }
  const displayName = singleString(input, "displayName");
  if (displayName.status !== "value") {
    return { ok: false, reason: "invalid-input" };
  }
  const normalized = displayName.value.trim();
  if (normalized.includes("\u0000") || normalized.length > 80) {
    return { ok: false, reason: "invalid-display-name" };
  }
  return { ok: true, value: { displayName: normalized || null } };
}

export function parseEmailChangeActionInput(
  input: unknown,
): EmailChangeActionInputParseResult {
  const fields = new Set(["email"]);
  if (!isFormData(input) || !hasOnlyKnownFields(input, fields)) {
    return { ok: false, reason: "invalid-input" };
  }
  const email = singleString(input, "email");
  if (email.status !== "value") {
    return { ok: false, reason: "invalid-input" };
  }
  const normalized = email.value.trim().toLowerCase();
  if (!EMAIL_PATTERN.test(normalized) || normalized.length > 254) {
    return { ok: false, reason: "invalid-email" };
  }
  return { ok: true, value: { email: normalized } };
}

export function parsePasswordChangeActionInput(
  input: unknown,
): PasswordChangeActionInputParseResult {
  const fields = new Set([
    "currentPassword",
    "newPassword",
    "confirmPassword",
  ]);
  if (!isFormData(input) || !hasOnlyKnownFields(input, fields)) {
    return { ok: false, reason: "invalid-input" };
  }
  const currentPassword = singleString(input, "currentPassword");
  const newPassword = singleString(input, "newPassword");
  const confirmation = singleString(input, "confirmPassword");
  if (
    currentPassword.status !== "value" ||
    !currentPassword.value ||
    newPassword.status !== "value" ||
    confirmation.status !== "value"
  ) {
    return { ok: false, reason: "invalid-input" };
  }
  if (!meetsPasswordRequirement(newPassword.value)) {
    return { ok: false, reason: "weak-password" };
  }
  if (confirmation.value !== newPassword.value) {
    return { ok: false, reason: "password-mismatch" };
  }
  return {
    ok: true,
    value: {
      currentPassword: currentPassword.value,
      newPassword: newPassword.value,
    },
  };
}

export function parseDeleteAccountActionInput(
  input: unknown,
): DeleteAccountActionInputParseResult {
  const fields = new Set(["confirmation", "currentPassword"]);
  if (!isFormData(input) || !hasOnlyKnownFields(input, fields)) {
    return { ok: false, reason: "invalid-input" };
  }
  const confirmation = singleString(input, "confirmation");
  const currentPassword = singleString(input, "currentPassword");
  if (
    confirmation.status !== "value" ||
    currentPassword.status === "invalid"
  ) {
    return { ok: false, reason: "invalid-input" };
  }
  if (confirmation.value !== "DELETE") {
    return { ok: false, reason: "invalid-confirmation" };
  }
  return {
    ok: true,
    value: {
      currentPassword:
        currentPassword.status === "value" ? currentPassword.value : null,
    },
  };
}

export { PASSWORD_REQUIREMENT };
