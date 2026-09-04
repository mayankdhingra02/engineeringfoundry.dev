"use server";

import { redirect } from "next/navigation";
import {
  PASSWORD_RECOVERY_SESSION_ERROR,
  parsePasswordRecoveryActionInput,
  resolveRecentPasswordRecoverySubject,
} from "@/lib/auth/password-recovery-claims";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export interface PasswordActionState { status: "idle" | "error" | "success"; message: string; }

export async function updatePasswordAction(_: PasswordActionState, formData: unknown): Promise<PasswordActionState> {
  const parsed = parsePasswordRecoveryActionInput(formData);
  if (!parsed.ok) return { status: "error", message: parsed.error };
  const supabase = await createSupabaseServerClient();
  if (!supabase) return { status: "error", message: "Password recovery is not configured in this environment." };
  const validationInstant = new Date();
  const { data: claimsData, error: claimsError } = await supabase.auth.getClaims();
  const recoverySubject = claimsError
    ? null
    : resolveRecentPasswordRecoverySubject(
        claimsData?.claims,
        validationInstant,
      );
  if (!recoverySubject) return { status: "error", message: PASSWORD_RECOVERY_SESSION_ERROR };
  const { data: userData, error: userError } = await supabase.auth.getUser();
  if (
    userError ||
    !userData.user ||
    recoverySubject !== userData.user.id.toLowerCase()
  ) {
    return { status: "error", message: PASSWORD_RECOVERY_SESSION_ERROR };
  }
  const { error } = await supabase.auth.updateUser({ password: parsed.value.password });
  if (error) return { status: "error", message: "We couldn't update your password. Request a new reset link and try again." };
  redirect("/dashboard");
}
