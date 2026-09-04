"use server";

import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { getAuthenticatedActor } from "@/lib/auth/actor";
import { accountDeletionProofCookie, createAccountDeletionProof } from "@/lib/auth/account-deletion";
import {
  ONBOARDING_ACTION_INVALID_INPUT_ERROR,
  ONBOARDING_TIMEZONE_INVALID_ERROR,
  PREPARATION_PREFERENCES_ACTION_INVALID_INPUT_ERROR,
  parseCompleteOnboardingActionInput,
  parseSavePreparationPreferencesActionInput,
} from "@/lib/account/preparation-preference-action-input";
import {
  ACCOUNT_DELETION_CONFIRMATION_ERROR,
  ACCOUNT_DISPLAY_NAME_INVALID_ERROR,
  ACCOUNT_EMAIL_INVALID_ERROR,
  ACCOUNT_PASSWORD_CONFIRMATION_ERROR,
  ACCOUNT_PASSWORD_INVALID_INPUT_ERROR,
  ACCOUNT_SETTINGS_INVALID_INPUT_ERROR,
  PASSWORD_REQUIREMENT,
  parseDeleteAccountActionInput,
  parseDisplayNameActionInput,
  parseEmailChangeActionInput,
  parsePasswordChangeActionInput,
} from "@/lib/account/account-action-input";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { logServerOperationalFailure, logServerOperationalWarning } from "@/lib/observability/log";
import { supportsPasswordReauthentication, verifyPasswordForSensitiveAction } from "@/lib/auth/reauthentication";
import { onboardingDestination } from "@/lib/account/preferences";
import type { AccountActionState } from "./state";

const expired = (): AccountActionState => ({ status: "error", message: "Your session expired. Sign in and try again." });

export async function completeOnboardingAction(_: AccountActionState, form: unknown): Promise<AccountActionState> {
  const parsed = parseCompleteOnboardingActionInput(form);
  if (!parsed.ok) {
    return {
      status: "error",
      message: parsed.reason === "invalid-timezone"
        ? ONBOARDING_TIMEZONE_INVALID_ERROR
        : ONBOARDING_ACTION_INVALID_INPUT_ERROR,
    };
  }
  const actor = await getAuthenticatedActor();
  if (!actor) return expired();
  const {
    preferredRoleLevel: role,
    primaryPreparationFocus: focus,
    preferredTimezone: timezone,
    requestedPath,
    interviewScheduled,
  } = parsed.value;

  const { count, error: upcomingError } = await actor.supabase
    .from("interview_rounds")
    .select("id", { count: "exact", head: true })
    .eq("user_id", actor.user.id)
    .in("status", ["Planned", "Scheduled", "Rescheduled"])
    .gt("scheduled_at", new Date().toISOString());
  if (upcomingError) return { status: "error", message: "We couldn’t finish setup. Try again." };

  const { error } = await actor.supabase.rpc("complete_account_onboarding", {
    preferred_role_level_value: role,
    primary_preparation_focus_value: focus,
    preferred_timezone_value: timezone,
  });
  if (error) return { status: "error", message: "We couldn’t save setup. Review your choices and try again." };

  revalidatePath("/dashboard");
  revalidatePath("/settings");
  redirect(onboardingDestination({
    hasUpcomingInterview: (count ?? 0) > 0,
    interviewScheduled,
    focus,
    requestedPath,
  }));
}

export async function updateDisplayNameAction(_: AccountActionState, form: unknown): Promise<AccountActionState> {
  const parsed = parseDisplayNameActionInput(form);
  if (!parsed.ok) {
    return {
      status: "error",
      message: parsed.reason === "invalid-display-name"
        ? ACCOUNT_DISPLAY_NAME_INVALID_ERROR
        : ACCOUNT_SETTINGS_INVALID_INPUT_ERROR,
    };
  }
  const actor = await getAuthenticatedActor();
  if (!actor) return expired();
  const { error } = await actor.supabase
    .from("profiles")
    .update({ display_name: parsed.value.displayName })
    .eq("id", actor.user.id);
  if (error) return { status: "error", message: "We couldn’t update your display name. Try again." };
  revalidatePath("/settings/account");
  revalidatePath("/dashboard");
  return { status: "success", message: parsed.value.displayName ? "Display name updated." : "Display name removed." };
}

export async function requestEmailChangeAction(_: AccountActionState, form: unknown): Promise<AccountActionState> {
  const parsed = parseEmailChangeActionInput(form);
  if (!parsed.ok) {
    return {
      status: "error",
      message: parsed.reason === "invalid-email"
        ? ACCOUNT_EMAIL_INVALID_ERROR
        : ACCOUNT_SETTINGS_INVALID_INPUT_ERROR,
    };
  }
  const actor = await getAuthenticatedActor();
  if (!actor) return expired();
  const { email } = parsed.value;
  if (email === actor.user.email?.toLowerCase()) return { status: "error", message: "That is already your account email." };
  const { error } = await actor.supabase.auth.updateUser({ email });
  if (error) return { status: "error", message: "We couldn’t start the email change. Try again or keep your current address." };
  return { status: "success", message: "Email change started. Complete the verification steps sent by your authentication provider before the address changes." };
}

export async function changePasswordAction(_: AccountActionState, form: unknown): Promise<AccountActionState> {
  const parsed = parsePasswordChangeActionInput(form);
  if (!parsed.ok) {
    return {
      status: "error",
      message: parsed.reason === "weak-password"
        ? PASSWORD_REQUIREMENT
        : parsed.reason === "password-mismatch"
          ? ACCOUNT_PASSWORD_CONFIRMATION_ERROR
          : ACCOUNT_PASSWORD_INVALID_INPUT_ERROR,
    };
  }
  const actor = await getAuthenticatedActor();
  if (!actor) return expired();
  const { currentPassword, newPassword } = parsed.value;
  if (!actor.user.email) return { status: "error", message: "This account does not have a password email. Use password recovery to add or reset a password." };
  // Verified through an isolated client so confirming the current password does
  // not rotate the caller's active cookie session as a side effect.
  const verified = await verifyPasswordForSensitiveAction(actor.user, currentPassword);
  if (verified.status === "unsupported") return { status: "error", message: "This account signs in with a provider instead of a password. Use password recovery to set one." };
  if (verified.status === "unavailable") return { status: "error", message: "Password changes are unavailable in this environment." };
  if (verified.status !== "verified") return { status: "error", message: "Current password is incorrect. You can use password recovery if needed." };
  const { error } = await actor.supabase.auth.updateUser({ password: newPassword });
  if (error) return { status: "error", message: "We couldn’t change your password. Try again." };
  return { status: "success", message: "Password changed." };
}

export async function savePreparationPreferencesAction(_: AccountActionState, form: unknown): Promise<AccountActionState> {
  const parsed = parseSavePreparationPreferencesActionInput(form);
  if (!parsed.ok) {
    return { status: "error", message: PREPARATION_PREFERENCES_ACTION_INVALID_INPUT_ERROR };
  }
  const actor = await getAuthenticatedActor();
  if (!actor) return expired();
  const {
    preferredRoleLevel: role,
    primaryPreparationFocus: focus,
    dsaLevel,
  } = parsed.value;
  const { error } = await actor.supabase.rpc("save_account_preparation_preferences", {
    preferred_role_level_value: role,
    primary_preparation_focus_value: focus,
    preferred_dsa_level_value: dsaLevel,
  });
  if (error) return { status: "error", message: "We couldn’t save preparation preferences. Try again." };
  revalidatePath("/settings/preparation");
  revalidatePath("/dashboard");
  revalidatePath("/dsa");
  return { status: "success", message: "Preparation preferences saved." };
}

export async function signOutEverywhereAction(previousState: AccountActionState, form: FormData): Promise<AccountActionState> {
  void previousState;
  void form;
  const actor = await getAuthenticatedActor();
  if (!actor) return expired();
  const { error } = await actor.supabase.auth.signOut({ scope: "global" });
  if (error) return { status: "error", message: "We couldn’t sign out every session. Try again." };
  return { status: "success", message: "All sessions have been signed out. This browser will return to the home page." };
}

export async function deleteAccountAction(_: AccountActionState, form: unknown): Promise<AccountActionState> {
  const parsed = parseDeleteAccountActionInput(form);
  if (!parsed.ok) {
    return {
      status: "error",
      message: parsed.reason === "invalid-confirmation"
        ? ACCOUNT_DELETION_CONFIRMATION_ERROR
        : ACCOUNT_SETTINGS_INVALID_INPUT_ERROR,
    };
  }
  const actor = await getAuthenticatedActor();
  if (!actor) return expired();

  // Password-capable accounts must prove the credential now, not merely hold an
  // unlocked session. OAuth-only accounts have no password to confirm, so they
  // keep the explicit confirmation rather than a prompt that verifies nothing.
  if (supportsPasswordReauthentication(actor.user)) {
    const reauthenticated = await verifyPasswordForSensitiveAction(actor.user, parsed.value.currentPassword ?? "");
    if (reauthenticated.status === "unavailable") {
      return { status: "error", message: "Account deletion is unavailable in this environment." };
    }
    if (reauthenticated.status !== "verified") {
      return { status: "error", message: "That password is incorrect. Your account was not deleted." };
    }
  }
  const deletionProofSecret = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const admin = createSupabaseAdminClient();
  if (!admin || !deletionProofSecret) {
    logServerOperationalWarning("account_deletion_unavailable", { reason: "missing_service_role_credential" });
    return { status: "error", message: "Account deletion is unavailable because the trusted server credential is not configured." };
  }

  const { error } = await admin.auth.admin.deleteUser(actor.user.id, false);
  if (error) {
    logServerOperationalFailure("account_deletion_failed", error);
    return { status: "error", message: "Your account was not deleted. Nothing changed; try again later." };
  }

  const cookieStore = await cookies();
  for (const cookie of cookieStore.getAll()) {
    if (cookie.name.startsWith("sb-") || cookie.name === "ef-password-recovery" || cookie.name === "ef-account-export") {
      cookieStore.delete(cookie.name);
    }
  }
  cookieStore.set(accountDeletionProofCookie(
    createAccountDeletionProof(deletionProofSecret),
    process.env.NODE_ENV === "production",
  ));
  redirect("/");
}
