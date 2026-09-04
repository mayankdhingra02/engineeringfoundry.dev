export const ACCOUNT_NAVIGATION_UNAVAILABLE_MESSAGE =
  "Account status is temporarily unavailable.";

export type AccountNavigationSummary = Readonly<{
  username: string | null;
  display_name: string | null;
  email: string | null;
}>;

export type AccountNavigationResponse =
  | Readonly<{ state: "disabled" }>
  | Readonly<{ state: "anonymous" }>
  | Readonly<{ state: "ready"; account: AccountNavigationSummary }>
  | Readonly<{ state: "unavailable" }>;

export type AccountNavigationClientState =
  | Readonly<{ state: "loading" }>
  | AccountNavigationResponse;

export type AccountNavigationUserResolution =
  | Readonly<{ state: "anonymous" }>
  | Readonly<{
      state: "authenticated";
      user: Readonly<{ id: string; email: string | null }>;
    }>;

export class AccountNavigationUnavailableError extends Error {
  constructor() {
    super(ACCOUNT_NAVIGATION_UNAVAILABLE_MESSAGE);
    this.name = "AccountNavigationUnavailableError";
  }
}

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/;
const USERNAME_PATTERN = /^[a-z0-9][a-z0-9_-]{2,29}$/;
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function unavailable(): never {
  throw new AccountNavigationUnavailableError();
}

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

function isBoundedText(value: unknown, max: number, min = 0): value is string {
  if (typeof value !== "string" || value.includes("\u0000")) return false;
  const length = Array.from(value).length;
  return length >= min && length <= max;
}

function isNullableBoundedText(
  value: unknown,
  max: number,
  min = 0,
): value is string | null {
  return value === null || isBoundedText(value, max, min);
}

function hasControlCharacter(value: string) {
  return Array.from(value).some((character) => {
    const codePoint = character.codePointAt(0) ?? 0;
    return codePoint <= 31 || (codePoint >= 127 && codePoint <= 159);
  });
}

function parseAccountSummary(value: unknown): AccountNavigationSummary | null {
  if (
    !isPlainRecord(value) ||
    !hasExactKeys(value, ["username", "display_name", "email"]) ||
    !isNullableBoundedText(value.username, 30, 3) ||
    (typeof value.username === "string" &&
      !USERNAME_PATTERN.test(value.username)) ||
    !isNullableBoundedText(value.display_name, 80, 1) ||
    (typeof value.display_name === "string" &&
      (value.display_name.trim().length === 0 ||
        hasControlCharacter(value.display_name))) ||
    !isNullableBoundedText(value.email, 254, 1) ||
    (typeof value.email === "string" && !EMAIL_PATTERN.test(value.email))
  ) {
    return null;
  }
  return {
    username: value.username,
    display_name: value.display_name,
    email: value.email,
  };
}

export function resolveAccountNavigationUserResult(
  input: unknown,
  isSessionMissingError: (error: unknown) => boolean,
): AccountNavigationUserResolution {
  if (
    !isPlainRecord(input) ||
    !hasExactKeys(input, ["data", "error"]) ||
    !isPlainRecord(input.data) ||
    !hasExactKeys(input.data, ["user"])
  ) {
    return unavailable();
  }

  if (input.error !== null) {
    let sessionMissing = false;
    try {
      sessionMissing = isSessionMissingError(input.error);
    } catch {
      return unavailable();
    }
    if (sessionMissing && input.data.user === null) {
      return { state: "anonymous" };
    }
    return unavailable();
  }

  if (
    !isPlainRecord(input.data.user) ||
    !isBoundedText(input.data.user.id, 36, 36) ||
    !UUID_PATTERN.test(input.data.user.id) ||
    !(
      input.data.user.email === undefined ||
      (isNullableBoundedText(input.data.user.email, 254, 1) &&
        (input.data.user.email === null ||
          EMAIL_PATTERN.test(input.data.user.email)))
    )
  ) {
    return unavailable();
  }

  return {
    state: "authenticated",
    user: {
      id: input.data.user.id,
      email: input.data.user.email ?? null,
    },
  };
}

export function resolveAccountNavigationProfileResult(
  input: unknown,
  user: Readonly<{ id: string; email: string | null }>,
): Extract<AccountNavigationResponse, { state: "ready" }> {
  if (
    !UUID_PATTERN.test(user.id) ||
    !isNullableBoundedText(user.email, 254, 1) ||
    !isPlainRecord(input) ||
    !hasExactKeys(input, ["data", "error"]) ||
    input.error !== null
  ) {
    return unavailable();
  }

  if (input.data === null) {
    return {
      state: "ready",
      account: { username: null, display_name: null, email: user.email },
    };
  }
  const account = parseAccountSummary({
    ...(isPlainRecord(input.data) ? input.data : {}),
    email: user.email,
  });
  if (!account) return unavailable();
  return { state: "ready", account };
}

export function parseAccountNavigationResponse(
  status: number,
  input: unknown,
): AccountNavigationResponse {
  if (!isPlainRecord(input)) return { state: "unavailable" };
  if (
    status === 200 &&
    hasExactKeys(input, ["state"]) &&
    (input.state === "disabled" || input.state === "anonymous")
  ) {
    return { state: input.state };
  }
  if (
    status === 200 &&
    hasExactKeys(input, ["state", "account"]) &&
    input.state === "ready"
  ) {
    const account = parseAccountSummary(input.account);
    return account ? { state: "ready", account } : { state: "unavailable" };
  }
  if (
    status === 503 &&
    hasExactKeys(input, ["state"]) &&
    input.state === "unavailable"
  ) {
    return { state: "unavailable" };
  }
  return { state: "unavailable" };
}

export function resolveAccountNavigationSettlement(
  current: AccountNavigationClientState,
  incoming: AccountNavigationResponse,
  expectedAuthenticated = false,
): AccountNavigationClientState {
  if (
    incoming.state === "unavailable" ||
    (expectedAuthenticated && incoming.state === "anonymous")
  ) {
    return current.state === "ready" ? current : { state: "unavailable" };
  }
  return incoming;
}
