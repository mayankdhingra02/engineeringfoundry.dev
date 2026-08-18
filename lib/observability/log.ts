import "server-only";

/**
 * Privacy-safe operational logging.
 *
 * Engineering Foundry ships no observability vendor. This is the small shared
 * shape for the handful of server-side failures an operator genuinely needs to
 * see during launch: reminder delivery, export generation, account deletion,
 * and configuration problems.
 *
 * The rule this module enforces is that a log line may say what failed, never
 * what the user wrote. Private notes, STAR stories, answers, attempt documents,
 * credentials, and tokens must never reach a log, so error details are reduced
 * to a bounded, redacted summary rather than passed through.
 */

const MAX_MESSAGE_LENGTH = 200;

/** Substrings that indicate a credential slipped into an error message. */
const SECRET_PATTERNS: RegExp[] = [
  /eyJ[A-Za-z0-9_-]{10,}/g,                 // JWT (anon, service role, access, refresh)
  /sb[a-z]*_[A-Za-z0-9_-]{10,}/gi,          // Supabase publishable/secret keys
  /\bBearer\s+[A-Za-z0-9._-]+/gi,
  /(password|secret|token|api[_-]?key)\s*[=:]\s*\S+/gi,
  /postgres(?:ql)?:\/\/[^\s]+/gi,
];

/** Reduce an unknown thrown value to a bounded, credential-free summary. */
export function redactErrorSummary(cause: unknown): string {
  const raw = cause instanceof Error
    ? `${cause.name}: ${cause.message}`
    : typeof cause === "string"
      ? cause
      : "unknown_error";
  let safe = raw;
  for (const pattern of SECRET_PATTERNS) safe = safe.replace(pattern, "[redacted]");
  return safe.slice(0, MAX_MESSAGE_LENGTH);
}

/** Context values are scalars only, so a private object can never be spread in. */
export type OperationalContext = Record<string, string | number | boolean>;

function safeContext(context: OperationalContext | undefined): OperationalContext {
  if (!context) return {};
  const safe: OperationalContext = {};
  for (const [key, value] of Object.entries(context)) {
    if (typeof value === "string") {
      let text = value;
      for (const pattern of SECRET_PATTERNS) text = text.replace(pattern, "[redacted]");
      safe[key] = text.slice(0, MAX_MESSAGE_LENGTH);
      continue;
    }
    if (typeof value === "number" || typeof value === "boolean") safe[key] = value;
  }
  return safe;
}

/**
 * Records a server-side operational failure.
 *
 * `event` is a stable snake_case name an operator can grep for. Include only
 * identifiers that help diagnose, and prefer counts and states over IDs.
 */
export function logServerOperationalFailure(
  event: string,
  cause?: unknown,
  context?: OperationalContext,
) {
  console.error(JSON.stringify({
    level: "error",
    event,
    at: new Date().toISOString(),
    ...safeContext(context),
    ...(cause === undefined ? {} : { reason: redactErrorSummary(cause) }),
  }));
}

/** Records a notable non-failure operational event, such as a configuration gap. */
export function logServerOperationalWarning(event: string, context?: OperationalContext) {
  console.warn(JSON.stringify({
    level: "warn",
    event,
    at: new Date().toISOString(),
    ...safeContext(context),
  }));
}
