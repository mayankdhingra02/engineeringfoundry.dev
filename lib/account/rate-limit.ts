import "server-only";

import type { AuthenticatedActor } from "@/lib/auth/actor";

/**
 * Server-authoritative rate limiting for expensive account actions.
 *
 * The budget lives in Postgres keyed by the authenticated actor, so clearing
 * cookies or switching browsers does not reset it, and the RPC derives its
 * identity from `auth.uid()` so no client can spend another account's budget.
 *
 * Policy is deliberately modest — this is abuse protection, not a quota.
 */
/** Actions the database limiter recognises. */
export type RateLimitedAction = "account_export";

export type RateLimitPolicy = {
  action: RateLimitedAction;
  maxRequests: number;
  windowSeconds: number;
};

export const ACCOUNT_EXPORT_RATE_LIMIT: RateLimitPolicy = {
  action: "account_export",
  maxRequests: 5,
  windowSeconds: 900,
};

export type RateLimitDecision = {
  allowed: boolean;
  retryAfterSeconds: number;
  remaining: number;
};

/**
 * Consumes one unit of the action budget.
 *
 * Fails closed: if the limiter itself errors we deny the request rather than
 * allowing an unbounded expensive operation.
 */
export async function consumeAccountActionRateLimit(
  actor: AuthenticatedActor,
  limit: RateLimitPolicy,
): Promise<RateLimitDecision> {
  const { data, error } = await actor.supabase.rpc("consume_account_action_rate_limit", {
    action_key: limit.action,
    max_requests: limit.maxRequests,
    window_seconds: limit.windowSeconds,
  });

  const decision = Array.isArray(data) ? data[0] : data;
  if (error || !decision) {
    return { allowed: false, retryAfterSeconds: limit.windowSeconds, remaining: 0 };
  }

  return {
    allowed: Boolean(decision.allowed),
    retryAfterSeconds: Number(decision.retry_after_seconds ?? limit.windowSeconds),
    remaining: Number(decision.remaining ?? 0),
  };
}

/** Human-readable wait for a throttled response. */
export function describeRetryAfter(seconds: number) {
  if (seconds <= 60) return "in less than a minute";
  const minutes = Math.ceil(seconds / 60);
  return `in about ${minutes} minute${minutes === 1 ? "" : "s"}`;
}
