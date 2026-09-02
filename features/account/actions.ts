"use server";

import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { getAuthenticatedActor } from "@/lib/auth/actor";
import { accountDeletionProofCookie } from "@/lib/auth/account-deletion";
import { safeInternalPath } from "@/lib/auth/redirects";
import { validIanaTimeZone } from "@/lib/interview-calendar/model";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { logServerOperationalFailure, logServerOperationalWarning } from "@/lib/observability/log";
import { supportsPasswordReauthentication, verifyPasswordForSensitiveAction } from "@/lib/auth/reauthentication";
import {
  onboardingDestination,
  parseDsaLevel,
  parsePreferredRoleLevel,
  parsePreparationFocus,
} from "@/lib/account/preferences";
import type { AccountActionState } from "./state";

const expired = (): AccountActionState => ({ status: "error", message: "Your session expired. Sign in and try again." });

export async function completeOnboardingAction(_: AccountActionState, form: FormData): Promise<AccountActionState> {
  const actor = await getAuthenticatedActor();
  if (!actor) return expired();
  const skip = form.get("intent") === "skip";
  const role = skip ? null : parsePreferredRoleLevel(form.get("preferredRoleLevel"));
  const focus = skip ? null : parsePreparationFocus(form.get("primaryPreparationFocus"));
  const rawTimezone = skip ? "" : String(form.get("preferredTimezone") ?? "").trim();
  const timezone = rawTimezone || null;
  if (timezone && !validIanaTimeZone(timezone)) {
    return { status: "error", message: "Choose a valid IANA timezone, such as America/Chicago." };
  }
  const requestedPath = safeInternalPath(String(form.get("next") ?? "/dashboard"));
  const interviewScheduled = !skip && form.get("interviewScheduled") === "yes";

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

export async function updateDisplayNameAction(_: AccountActionState, form: FormData): Promise<AccountActionState> {
  const actor = await getAuthenticatedActor();
  if (!actor) return expired();
  const value = String(form.get("displayName") ?? "").trim();
  if (value.length > 80) return { status: "error", message: "Display name must be 80 characters or fewer." };
  const { error } = await actor.supabase
    .from("profiles")
    .update({ display_name: value || null })
    .eq("id", actor.user.id);
  if (error) return { status: "error", message: "We couldn’t update your display name. Try again." };
  revalidatePath("/settings/account");
  revalidatePath("/dashboard");
  return { status: "success", message: value ? "Display name updated." : "Display name removed." };
}

export async function requestEmailChangeAction(_: AccountActionState, form: FormData): Promise<AccountActionState> {
  const actor = await getAuthenticatedActor();
  if (!actor) return expired();
  const email = String(form.get("email") ?? "").trim().toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 254) {
    return { status: "error", message: "Enter a valid email address." };
  }
  if (email === actor.user.email?.toLowerCase()) return { status: "error", message: "That is already your account email." };
  const { error } = await actor.supabase.auth.updateUser({ email });
  if (error) return { status: "error", message: "We couldn’t start the email change. Try again or keep your current address." };
  return { status: "success", message: "Email change started. Complete the verification steps sent by your authentication provider before the address changes." };
}

export async function changePasswordAction(_: AccountActionState, form: FormData): Promise<AccountActionState> {
  const actor = await getAuthenticatedActor();
  if (!actor) return expired();
  const currentPassword = String(form.get("currentPassword") ?? "");
  const newPassword = String(form.get("newPassword") ?? "");
  const confirmPassword = String(form.get("confirmPassword") ?? "");
  if (!actor.user.email) return { status: "error", message: "This account does not have a password email. Use password recovery to add or reset a password." };
  if (newPassword.length < 8) return { status: "error", message: "New password must be at least 8 characters." };
  if (newPassword !== confirmPassword) return { status: "error", message: "New passwords do not match." };
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

export async function savePreparationPreferencesAction(_: AccountActionState, form: FormData): Promise<AccountActionState> {
  const actor = await getAuthenticatedActor();
  if (!actor) return expired();
  const role = parsePreferredRoleLevel(form.get("preferredRoleLevel"));
  const focus = parsePreparationFocus(form.get("primaryPreparationFocus"));
  const dsaLevel = parseDsaLevel(form.get("dsaLevel"));
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

export async function deleteAccountAction(_: AccountActionState, form: FormData): Promise<AccountActionState> {
  const actor = await getAuthenticatedActor();
  if (!actor) return expired();
  if (String(form.get("confirmation") ?? "") !== "DELETE") {
    return { status: "error", message: "Type DELETE exactly to confirm permanent account deletion." };
  }

  // Password-capable accounts must prove the credential now, not merely hold an
  // unlocked session. OAuth-only accounts have no password to confirm, so they
  // keep the explicit confirmation rather than a prompt that verifies nothing.
  if (supportsPasswordReauthentication(actor.user)) {
    const reauthenticated = await verifyPasswordForSensitiveAction(actor.user, String(form.get("currentPassword") ?? ""));
    if (reauthenticated.status === "unavailable") {
      return { status: "error", message: "Account deletion is unavailable in this environment." };
    }
    if (reauthenticated.status !== "verified") {
      return { status: "error", message: "That password is incorrect. Your account was not deleted." };
    }
  }
  const admin = createSupabaseAdminClient();
  if (!admin) {
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
  cookieStore.set(accountDeletionProofCookie(process.env.NODE_ENV === "production"));
  redirect("/");
}
