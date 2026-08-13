"use client";

import Link from "next/link";
import { LoaderCircle, Mail, ShieldCheck } from "lucide-react";
import { useActionState, useState } from "react";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { updatePasswordAction, type PasswordActionState } from "./password-actions";

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
    callback.searchParams.set("flow", "recovery");
    const { error: recoveryError } = await supabase.auth.resetPasswordForEmail(email, { redirectTo: callback.toString() });
    if (recoveryError) { setError("We couldn't send reset instructions right now. Wait a moment and try again."); setPending(false); return; }
    // Deliberately return the same state whether or not the account exists.
    setSent(true); setPending(false);
  }
  if (sent) return <div className="auth-card auth-success" role="status"><ShieldCheck size={25} /><p className="auth-kicker">Request received</p><h1>Check your email.</h1><p>If an account exists for that address, we&apos;ve sent password reset instructions.</p><Link className="button" href="/sign-in">Return to sign in</Link></div>;
  return <div className="auth-card"><p className="auth-kicker">Account recovery</p><h1>Reset your password.</h1><p className="auth-intro">Enter your account email. For privacy, the response is the same whether or not an account exists.</p><form className="auth-form" onSubmit={submit}><div className="form-group"><label htmlFor="recovery-email">Email address</label><input id="recovery-email" name="email" type="email" autoComplete="email" required /></div>{error && <p className="form-error" role="alert">{error}</p>}<button className="button auth-submit" disabled={pending} type="submit">{pending ? <><LoaderCircle className="spin" size={16} />Sending…</> : <><Mail size={16} />Send reset instructions</>}</button></form><p className="auth-switch"><Link href="/sign-in">Back to sign in</Link></p></div>;
}

export function ResetPasswordForm() {
  const [state, action, pending] = useActionState(updatePasswordAction, initialPasswordState);
  return <div className="auth-card"><p className="auth-kicker">Secure recovery</p><h1>Choose a new password.</h1><p className="auth-intro">Use at least eight characters and avoid reusing a password from another service.</p><form className="auth-form" action={action}><div className="form-group"><label htmlFor="new-password">New password</label><input id="new-password" name="password" type="password" autoComplete="new-password" minLength={8} required /></div><div className="form-group"><label htmlFor="confirm-new-password">Confirm new password</label><input id="confirm-new-password" name="confirm_password" type="password" autoComplete="new-password" minLength={8} required /></div>{state.status === "error" && <p className="form-error" role="alert">{state.message}</p>}<button className="button auth-submit" disabled={pending} type="submit">{pending ? <><LoaderCircle className="spin" size={16} />Updating…</> : "Update password"}</button></form></div>;
}
