import type {
  SystemDesignLevel,
  SystemDesignPreparationWindow,
  SystemDesignTargetRole,
} from "@/data/system-design/recommendations";
import type { SystemDesignStudyMinutesPerDay } from "@/data/system-design/study-plan";
import type { PreparationStateErrorCode } from "@/lib/preparation-state/types";

export type SaveStudyPlanInput =
  | { track: "dsa"; level: "sde1" | "sde2" | "senior"; duration: 30 | 60 | 90 }
  | {
    track: "system-design";
    level: SystemDesignLevel;
    preparationWindow: SystemDesignPreparationWindow;
    role: SystemDesignTargetRole | undefined;
    minutesPerDay: SystemDesignStudyMinutesPerDay;
  };

export type SaveStudyPlanAccountResult =
  | { saved: true; reason: "saved" }
  | { saved: false; reason: PreparationStateErrorCode };

export type StudyPlanAccountFailureReason = PreparationStateErrorCode | "request-failed";

export type StudyPlanSaveAttempts =
  | { accountStatus: "saved" }
  | {
    accountStatus: "failed";
    accountReason: StudyPlanAccountFailureReason;
    localStatus: "saved" | "failed";
  };

export type StudyPlanSaveOutcome =
  | { persisted: true; persistence: "account" | "local"; message: string }
  | { persisted: false; persistence: null; message: string };

function assertNever(value: never): never {
  throw new Error(`Unhandled study-plan save outcome: ${String(value)}`);
}

function localSuccessMessage(reason: StudyPlanAccountFailureReason): string {
  switch (reason) {
    case "account-unavailable":
      return "Saved in this browser. Account saving is unavailable in this configuration.";
    case "unauthenticated":
      return "Saved in this browser. Sign in to save it to your account.";
    case "invalid-input":
      return "Saved in this browser. Account saving could not accept this plan.";
    case "persistence-failed":
      return "Saved in this browser. Account saving did not complete.";
    case "request-failed":
      return "Saved in this browser. Account saving could not be confirmed.";
    default:
      return assertNever(reason);
  }
}

function totalFailureMessage(reason: StudyPlanAccountFailureReason): string {
  switch (reason) {
    case "account-unavailable":
      return "This plan is still visible, but it could not be saved in this browser. Account saving is unavailable in this configuration.";
    case "unauthenticated":
      return "This plan is still visible, but it could not be saved in this browser. Sign in to save it to your account.";
    case "invalid-input":
      return "This plan is still visible, but its settings could not be saved. Review the plan and try again.";
    case "persistence-failed":
      return "This plan is still visible, but it could not be saved to your account or in this browser. Try again.";
    case "request-failed":
      return "This plan is still visible, but it could not be saved in this browser. Account saving could not be confirmed.";
    default:
      return assertNever(reason);
  }
}

/** Resolves one user-facing result only after every eligible persistence path settles. */
export function resolveStudyPlanSaveOutcome(attempts: StudyPlanSaveAttempts): StudyPlanSaveOutcome {
  switch (attempts.accountStatus) {
    case "saved":
      return {
        persisted: true,
        persistence: "account",
        message: "Active study plan saved to your account.",
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

/** Stable, non-sensitive analytics identity for the exact selected plan. */
export function studyPlanId(input: SaveStudyPlanInput): string {
  if (input.track === "dsa") return `${input.level}-${input.duration}d`;
  return `${input.level}-${input.preparationWindow}-${input.role ?? "general"}-${input.minutesPerDay}m`;
}
