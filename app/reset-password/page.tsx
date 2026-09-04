import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { AccountUnavailable } from "@/components/account-unavailable";
import { ResetPasswordForm } from "@/features/auth/password-forms";
import { isAccountPlatformAvailable } from "@/lib/account-platform";
import { resolveRecentPasswordRecoverySubject } from "@/lib/auth/password-recovery-claims";
import { createSupabaseServerClient } from "@/lib/supabase/server";
export const metadata: Metadata = { title: "Reset Password", robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";
export default async function ResetPasswordPage() {
  if (!isAccountPlatformAvailable()) return <AccountUnavailable />;
  const supabase = await createSupabaseServerClient();
  if (!supabase) redirect("/forgot-password");
  const validationInstant = new Date();
  const { data, error } = await supabase.auth.getClaims();
  if (
    error ||
    !resolveRecentPasswordRecoverySubject(data?.claims, validationInstant)
  ) {
    redirect("/forgot-password");
  }
  return <section className="auth-section"><div className="page-width"><ResetPasswordForm /></div></section>;
}
