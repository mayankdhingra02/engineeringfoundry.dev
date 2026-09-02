import type { PreparationStateErrorCode } from "@/lib/preparation-state/types";
import type { PreparationTrack } from "@/lib/preparation-progress/local";

export type PreparationActivityAccountResult =
  | { saved: true; reason: "saved" }
  | { saved: false; reason: PreparationStateErrorCode };

export type PreparationActivityAccountFailureReason = PreparationStateErrorCode | "request-failed";

export type PreparationActivitySaveAttempts =
  | { accountStatus: "saved" }
  | {
    accountStatus: "failed";
    accountReason: PreparationActivityAccountFailureReason;
    localStatus: "saved" | "failed";
  };

export type PreparationActivitySaveOutcome =
  | { persisted: true; persistence: "account" | "local"; message: string }
  | { persisted: false; persistence: null; message: string };

function assertNever(value: never): never {
  throw new Error(`Unhandled preparation-activity save outcome: ${String(value)}`);
}

function localSuccessMessage(reason: PreparationActivityAccountFailureReason): string {
  switch (reason) {
    case "account-unavailable":
      return "Saved in this browser. Account saving is unavailable in this configuration.";
    case "unauthenticated":
      return "Saved in this browser. Sign in to import browser activity deliberately.";
    case "invalid-input":
      return "Saved in this browser. Account saving could not accept this activity.";
    case "persistence-failed":
      return "Saved in this browser. Account saving did not complete.";
    case "request-failed":
      return "Saved in this browser. Account saving could not be confirmed.";
    default:
      return assertNever(reason);
  }
}

function totalFailureMessage(reason: PreparationActivityAccountFailureReason): string {
  switch (reason) {
    case "account-unavailable":
      return "Recorded for this visit, but browser storage is unavailable. Account saving is unavailable in this configuration.";
    case "unauthenticated":
      return "Recorded for this visit, but browser storage is unavailable. Sign in to save future activity to your account.";
    case "invalid-input":
      return "Recorded for this visit, but this activity could not be saved in this browser or accepted for account saving.";
    case "persistence-failed":
      return "Recorded for this visit, but it could not be saved to your account or in this browser. Try again.";
    case "request-failed":
      return "Recorded for this visit, but browser storage is unavailable. Account saving could not be confirmed.";
    default:
      return assertNever(reason);
  }
}

/** Resolves one user-facing result only after every eligible persistence path settles. */
export function resolvePreparationActivitySaveOutcome(attempts: PreparationActivitySaveAttempts): PreparationActivitySaveOutcome {
  switch (attempts.accountStatus) {
    case "saved":
      return {
        persisted: true,
        persistence: "account",
        message: "Preparation activity saved to your account.",
      };
    case "failed":
      switch (attempts.localStatus) {
        case "saved":
          return {
            persisted: true,
            persistence: "local",
            message: localSuccessMessage(attempts.accountReason),
          };
        case "failed":
          return {
            persisted: false,
            persistence: null,
            message: totalFailureMessage(attempts.accountReason),
          };
        default:
          return assertNever(attempts.localStatus);
      }
    default:
      return assertNever(attempts);
  }
}

export function preparationActivityKey(track: PreparationTrack, itemId: string): string {
  return `${track}:${itemId}`;
}
