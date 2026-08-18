import "server-only";

import { createClient } from "@supabase/supabase-js";
import type { User } from "@supabase/supabase-js";

/**
 * Fresh credential verification for destructive account actions.
 *
 * ## The problem this solves
 *
 * Verifying a password by calling `signInWithPassword` on the *cookie-backed*
 * server client works, but it has a side effect: a successful call issues a new
 * session and rewrites the caller's auth cookies. A verification step should
 * not mutate the session it is verifying.
 *
 * ## The approach
 *
 * `@supabase/supabase-js` supports an isolated client with `persistSession:
 * false`, which keeps its session in memory and never touches cookie storage.
 * Verifying against that client proves the user knows the current password
 * without disturbing the active session. The throwaway session is signed out
 * locally afterwards so no refresh token is left alive.
 *
 * Supabase Auth applies its own brute-force rate limiting to these attempts, so
 * Engineering Foundry deliberately does not add a second limiter here.
 *
 * ## Provider awareness
 *
 * Only accounts with an email/password identity can be reauthenticated this
 * way. An OAuth-only account has no password to confirm, and inventing one
 * would be security theater. Callers must branch on
 * `supportsPasswordReauthentication` and fall back to explicit confirmation.
 */

export type ReauthenticationResult =
  | { status: "verified" }
  | { status: "unsupported" }
  | { status: "invalid" }
  | { status: "unavailable" };

/** True when the account has an email/password identity to verify against. */
export function supportsPasswordReauthentication(user: User) {
  if (!user.email) return false;
  const identities = user.identities ?? [];
  if (identities.length) return identities.some((identity) => identity.provider === "email");
  // Older sessions may not carry identities; fall back to provider metadata.
  const providers = user.app_metadata?.providers;
  if (Array.isArray(providers)) return providers.includes("email");
  return user.app_metadata?.provider === "email";
}

/**
 * Confirms the supplied password belongs to this account without replacing the
 * caller's cookie session.
 */
export async function verifyPasswordForSensitiveAction(
  user: User,
  password: string,
): Promise<ReauthenticationResult> {
  if (!supportsPasswordReauthentication(user) || !user.email) return { status: "unsupported" };
  if (!password) return { status: "invalid" };

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) return { status: "unavailable" };

  // Isolated, in-memory, cookie-free. Nothing here can write the caller's session.
  const verifier = createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
  });

  const { data, error } = await verifier.auth.signInWithPassword({ email: user.email, password });
  if (error || !data.user) return { status: "invalid" };

  // The verified identity must be the same account, not merely valid credentials.
  if (data.user.id !== user.id) return { status: "invalid" };

  // Discard the throwaway session so its refresh token is not left usable.
  await verifier.auth.signOut({ scope: "local" }).catch(() => undefined);

  return { status: "verified" };
}
