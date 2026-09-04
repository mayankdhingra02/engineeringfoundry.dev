export const AUTHENTICATED_ACTOR_UNAVAILABLE_MESSAGE =
  "Your account session is temporarily unavailable. Please try again.";

export type AuthenticatedActorUserResolution =
  | Readonly<{ state: "anonymous" }>
  | Readonly<{ state: "authenticated"; userId: string }>;

export class AuthenticatedActorUnavailableError extends Error {
  constructor() {
    super(AUTHENTICATED_ACTOR_UNAVAILABLE_MESSAGE);
    this.name = "AuthenticatedActorUnavailableError";
  }
}

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/;

function unavailable(): never {
  throw new AuthenticatedActorUnavailableError();
}

function isPlainRecord(value: unknown): value is Record<string, unknown> {
  if (value === null || typeof value !== "object" || Array.isArray(value)) {
    return false;
  }
  const prototype = Object.getPrototypeOf(value);
  return prototype === Object.prototype || prototype === null;
}

function hasExactKeys(value: Record<string, unknown>, expected: readonly string[]) {
  const keys = Reflect.ownKeys(value);
  return (
    keys.length === expected.length &&
    keys.every(
      (key) => typeof key === "string" && expected.includes(key),
    )
  );
}

/**
 * Resolves the untrusted Auth getUser result without treating an outage,
 * malformed response, or contradictory identity as a signed-out session.
 */
export function resolveAuthenticatedActorUserResult(
  input: unknown,
  isSessionMissingError: (error: unknown) => boolean,
): AuthenticatedActorUserResolution {
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
    typeof input.data.user.id !== "string" ||
    !UUID_PATTERN.test(input.data.user.id)
  ) {
    return unavailable();
  }

  return {
    state: "authenticated",
    userId: input.data.user.id,
  };
}
