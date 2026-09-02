export const accountDeletionProofCookieName = "ef-account-deletion-proof";

const accountDeletionProofCookieValue = "account-deleted";
const accountDeletionProofMaxAgeSeconds = 60;

/**
 * Short-lived, action-controlled proof for the post-deletion confirmation.
 * `secure` is explicit so local HTTP development and production HTTPS can use
 * the same deterministic descriptor without reading process state here.
 */
export function accountDeletionProofCookie(secure: boolean) {
  return {
    name: accountDeletionProofCookieName,
    value: accountDeletionProofCookieValue,
    httpOnly: true,
    sameSite: "lax" as const,
    secure,
    path: "/",
    maxAge: accountDeletionProofMaxAgeSeconds,
  };
}

/** Only the exact value emitted after successful deletion proves the notice. */
export function isAccountDeletionProof(value: unknown): boolean {
  return value === accountDeletionProofCookieValue;
}
