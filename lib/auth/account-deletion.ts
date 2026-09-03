import { createHmac, randomBytes, timingSafeEqual } from "node:crypto";

export const accountDeletionProofCookieName = "ef-account-deletion-proof";

const accountDeletionProofMaxAgeSeconds = 60;
const accountDeletionProofVersion = "v1";
const accountDeletionNoncePattern = /^[A-Za-z0-9_-]{22}$/;
const accountDeletionSignaturePattern = /^[A-Za-z0-9_-]{43}$/;

function issuedAtSeconds(now: Date): number {
  const milliseconds = now.valueOf();
  if (!Number.isFinite(milliseconds)) throw new Error("Account deletion proof requires a valid issuance time.");
  return Math.floor(milliseconds / 1000);
}

function signAccountDeletionProof(payload: string, secret: string): string {
  return createHmac("sha256", secret).update(payload).digest("base64url");
}

/** Creates an opaque proof containing only a timestamp, random nonce, and MAC. */
export function createAccountDeletionProof(
  secret: string,
  now = new Date(),
  nonce = randomBytes(16).toString("base64url"),
): string {
  if (!secret) throw new Error("Account deletion proof requires a signing secret.");
  if (!accountDeletionNoncePattern.test(nonce)) throw new Error("Account deletion proof requires a 128-bit base64url nonce.");
  const payload = `${accountDeletionProofVersion}.${issuedAtSeconds(now)}.${nonce}`;
  return `${payload}.${signAccountDeletionProof(payload, secret)}`;
}

/**
 * Short-lived, action-controlled proof for the post-deletion confirmation.
 * `secure` is explicit so local HTTP development and production HTTPS can use
 * the same deterministic descriptor without reading process state here.
 */
export function accountDeletionProofCookie(value: string, secure: boolean) {
  return {
    name: accountDeletionProofCookieName,
    value,
    httpOnly: true,
    sameSite: "lax" as const,
    secure,
    path: "/",
    maxAge: accountDeletionProofMaxAgeSeconds,
  };
}

/** Verifies the exact MAC in constant time and accepts only a fresh proof. */
export function isAccountDeletionProof(value: unknown, secret: string, now = new Date()): boolean {
  if (typeof value !== "string" || !secret) return false;
  const parts = value.split(".");
  if (parts.length !== 4) return false;
  const [version, rawIssuedAt, nonce, suppliedSignature] = parts;
  if (version !== accountDeletionProofVersion
    || !/^(?:0|[1-9]\d*)$/.test(rawIssuedAt)
    || !accountDeletionNoncePattern.test(nonce)
    || !accountDeletionSignaturePattern.test(suppliedSignature)) return false;

  const payload = `${version}.${rawIssuedAt}.${nonce}`;
  const expectedSignature = Buffer.from(signAccountDeletionProof(payload, secret), "utf8");
  const actualSignature = Buffer.from(suppliedSignature, "utf8");
  if (actualSignature.length !== expectedSignature.length || !timingSafeEqual(actualSignature, expectedSignature)) return false;

  const currentMilliseconds = now.valueOf();
  const issuedAt = Number(rawIssuedAt);
  if (!Number.isFinite(currentMilliseconds) || !Number.isSafeInteger(issuedAt)) return false;
  const ageMilliseconds = currentMilliseconds - issuedAt * 1000;
  return ageMilliseconds >= 0 && ageMilliseconds <= accountDeletionProofMaxAgeSeconds * 1000;
}
