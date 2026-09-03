"use client";

import Link from "next/link";
import { LoaderCircle, Mail, ShieldCheck } from "lucide-react";
import { useActionState, useState } from "react";
import { PASSWORD_REQUIREMENT } from "@/lib/auth/credentials";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { updatePasswordAction, type PasswordActionState } from "./password-actions";
import { PasswordInput } from "./password-input";

const initialPasswordState: PasswordActionState = { status: "idle", message: "" };

export function ForgotPasswordForm() {
  const [pending, setPending] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");
  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault(); setPending(true); setError("");
    const supabase = createSupabaseBrowserClient();
    if (!supabase) { setError("Supabase is not configured in this environment."); setPending(false); return; }
    const email = String(new FormData(event.currentTarget).get("email") ?? "").trim();
    const callback = new URL("/auth/callback", window.location.origin);
    callback.searchParams.set("next", "/reset-password");
    const { error: recoveryError } = await supabase.auth.resetPasswordForEmail(email, { redirectTo: callback.toString() });
    if (recoveryError) { setError("We couldn't send reset instructions right now. Wait a moment and try again."); setPending(false); return; }
    // Deliberately return the same state whether or not the account exists.
    setSent(true); setPending(false);
  }
  if (sent) return <div className="auth-card auth-success" role="status"><ShieldCheck size={25} /><h1>Check your email.</h1><p>If an account exists for that address, we&apos;ve sent password reset instructions.</p><Link className="button" href="/signin">Return to sign in</Link></div>;
  return <div className="auth-card"><h1>Reset your password.</h1><p className="auth-intro">Enter your account email. For privacy, the response is the same whether or not an account exists.</p><form className="auth-form" method="post" onSubmit={submit}><div className="form-group"><label htmlFor="recovery-email">Email address</label><input id="recovery-email" name="email" type="email" autoComplete="email" required aria-describedby={error ? "recovery-error" : undefined} aria-invalid={Boolean(error)} /></div>{error && <p className="form-error" id="recovery-error" role="alert">{error}</p>}<button className="button auth-submit" disabled={pending} type="submit">{pending ? <><LoaderCircle className="spin" size={16} />Sending…</> : <><Mail size={16} />Send reset instructions</>}</button></form><p className="auth-switch"><Link href="/signin">Back to sign in</Link></p></div>;
}

export function ResetPasswordForm() {
  const [state, action, pending] = useActionState(updatePasswordAction, initialPasswordState);
  const hasError = state.status === "error";
  return <div className="auth-card"><h1>Choose a new password.</h1><p className="auth-intro">{PASSWORD_REQUIREMENT} Avoid reusing a password from another service.</p><form className="auth-form" action={action}><div className="form-group"><label htmlFor="new-password">New password</label><PasswordInput id="new-password" name="password" autoComplete="new-password" maxLength={128} describedBy={hasError ? "password-update-error" : undefined} invalid={hasError} /></div><div className="form-group"><label htmlFor="confirm-new-password">Confirm new password</label><PasswordInput id="confirm-new-password" name="confirm_password" autoComplete="new-password" maxLength={128} describedBy={hasError ? "password-update-error" : undefined} invalid={hasError} /></div>{hasError && <p className="form-error" id="password-update-error" role="alert">{state.message}</p>}<button className="button auth-submit" disabled={pending} type="submit">{pending ? <><LoaderCircle className="spin" size={16} />Updating…</> : "Update password"}</button></form></div>;
}
