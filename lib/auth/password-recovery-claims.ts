import { PASSWORD_REQUIREMENT } from "./credentials.ts";

export const PASSWORD_RECOVERY_MAX_AGE_SECONDS = 600;
export const PASSWORD_RECOVERY_FUTURE_SKEW_SECONDS = 60;
export const PASSWORD_RECOVERY_INVALID_INPUT_ERROR =
  "Review the password fields and try again.";
export const PASSWORD_RECOVERY_SESSION_ERROR =
  "This recovery session is invalid or expired. Request a new reset link.";
export const PASSWORD_RECOVERY_CONFIRMATION_ERROR = "Passwords do not match.";

const SUBJECT_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const RECOVERY_METHOD = "recovery";
const PASSWORD_FIELDS = new Set(["password", "confirm_password"]);

type PasswordRecoveryActionInput = Readonly<{
  password: string;
}>;

export type PasswordRecoveryActionInputResult =
  | Readonly<{ ok: true; value: PasswordRecoveryActionInput }>
  | Readonly<{ ok: false; error: string }>;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function hasExactKeys(value: Record<string, unknown>, keys: readonly string[]) {
  const actualKeys = Object.keys(value);
  return (
    actualKeys.length === keys.length &&
    keys.every((key) => Object.hasOwn(value, key))
  );
}

function canonicalSubject(value: unknown) {
  return typeof value === "string" && SUBJECT_PATTERN.test(value)
    ? value.toLowerCase()
    : null;
}

export function resolveRecentPasswordRecoverySubject(
  claims: unknown,
  validationInstant = new Date(),
): string | null {
  if (!(validationInstant instanceof Date)) return null;
  const validationTime = validationInstant.getTime();
  if (!Number.isFinite(validationTime) || !isRecord(claims)) return null;

  const subject = canonicalSubject(claims.sub);
  if (!subject || !Array.isArray(claims.amr) || claims.amr.length === 0) {
    return null;
  }

  let recoveryTimestamp: number | null = null;
  for (const entry of claims.amr) {
    if (
      !isRecord(entry) ||
      !hasExactKeys(entry, ["method", "timestamp"]) ||
      typeof entry.method !== "string" ||
      !entry.method ||
      !Number.isSafeInteger(entry.timestamp) ||
      (entry.timestamp as number) < 0
    ) {
      return null;
    }

    if (entry.method === RECOVERY_METHOD) {
      if (recoveryTimestamp !== null) return null;
      recoveryTimestamp = entry.timestamp as number;
    }
  }

  if (recoveryTimestamp === null) return null;
  const nowSeconds = Math.floor(validationTime / 1_000);
  const ageSeconds = nowSeconds - recoveryTimestamp;
  if (
    ageSeconds < -PASSWORD_RECOVERY_FUTURE_SKEW_SECONDS ||
    ageSeconds > PASSWORD_RECOVERY_MAX_AGE_SECONDS
  ) {
    return null;
  }

  return subject;
}

export function parsePasswordRecoveryActionInput(
  input: unknown,
): PasswordRecoveryActionInputResult {
  if (typeof FormData === "undefined" || !(input instanceof FormData)) {
    return { ok: false, error: PASSWORD_RECOVERY_INVALID_INPUT_ERROR };
  }

  for (const key of input.keys()) {
    if (!PASSWORD_FIELDS.has(key) && !key.startsWith("$ACTION_")) {
      return { ok: false, error: PASSWORD_RECOVERY_INVALID_INPUT_ERROR };
    }
  }

  const passwords = input.getAll("password");
  const confirmations = input.getAll("confirm_password");
  if (
    passwords.length !== 1 ||
    confirmations.length !== 1 ||
    typeof passwords[0] !== "string" ||
    typeof confirmations[0] !== "string"
  ) {
    return { ok: false, error: PASSWORD_RECOVERY_INVALID_INPUT_ERROR };
  }

  const password = passwords[0];
  if (
    password.length < 8 ||
    password.length > 128 ||
    !/[A-Za-z]/.test(password) ||
    !/\d/.test(password)
  ) {
    return { ok: false, error: PASSWORD_REQUIREMENT };
  }
  if (confirmations[0] !== password) {
    return { ok: false, error: PASSWORD_RECOVERY_CONFIRMATION_ERROR };
  }

  return { ok: true, value: { password } };
}
