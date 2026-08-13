"use client";

import Link from "next/link";
import { Github, LoaderCircle, Mail } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { identifyUser, track } from "@/lib/analytics";
import { isAccountPlatformAvailable } from "@/lib/account-platform";
import { safeInternalPath } from "@/lib/auth/redirects";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

type AuthMode = "sign-in" | "sign-up";
type OAuthProvider = "google" | "github";

const GENERIC_AUTH_ERROR = "We couldn't complete that request. Check your details and try again.";

function friendlyAuthError(message: string) {
  const value = message.toLowerCase();
  if (value.includes("invalid login credentials")) return "The email or password is incorrect.";
  if (value.includes("email not confirmed")) return "Confirm your email before signing in.";
  if (value.includes("password")) return "Use a stronger password with at least 8 characters.";
  if (value.includes("rate") || value.includes("too many")) return "Too many attempts. Wait a moment and try again.";
  return GENERIC_AUTH_ERROR;
}

export function AuthForm({ mode, next }: { mode: AuthMode; next?: string }) {
  const configured = isAccountPlatformAvailable();
  const router = useRouter();
  const [pending, setPending] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [confirmation, setConfirmation] = useState(false);
  const destination = safeInternalPath(next, "/dashboard");

  async function continueWithOAuth(provider: OAuthProvider) {
    const supabase = createSupabaseBrowserClient();
    if (!supabase) return setError("Supabase is not configured. Add the public project URL and anon key to enable authentication.");
    setPending(provider); setError("");
    if (mode === "sign-up") track("account_signup_started", { method: provider, demo: false });
    const callback = new URL("/auth/callback", window.location.origin);
    callback.searchParams.set("next", destination);
    const { error: oauthError } = await supabase.auth.signInWithOAuth({ provider, options: { redirectTo: callback.toString() } });
    if (oauthError) { setError("The OAuth provider could not be started. Check its Supabase configuration and try again."); setPending(null); }
  }

  async function submitEmail(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const email = String(form.get("email") ?? "").trim();
    const password = String(form.get("password") ?? "");
    const confirm = String(form.get("confirm_password") ?? "");
    if (password.length < 8) return setError("Use a password with at least 8 characters.");
    if (mode === "sign-up" && password !== confirm) return setError("Passwords do not match.");
    const supabase = createSupabaseBrowserClient();
    if (!supabase) return setError("Supabase is not configured. Add the public project URL and anon key to enable authentication.");
    setPending("email"); setError("");

    if (mode === "sign-up") {
      track("account_signup_started", { method: "email", demo: false });
      const callback = new URL("/auth/callback", window.location.origin);
      callback.searchParams.set("next", destination);
      const { data, error: signUpError } = await supabase.auth.signUp({ email, password, options: { emailRedirectTo: callback.toString() } });
      if (signUpError) { setError(friendlyAuthError(signUpError.message)); setPending(null); return; }
      if (!data.session) { setConfirmation(true); setPending(null); return; }
      // A session is only returned for a confirmed, newly created email account.
      track("account_created", { method: "email" });
      if (!data.user) { setError(GENERIC_AUTH_ERROR); setPending(null); return; }
      identifyUser(data.user.id, { onboarding_complete: false });
      router.push(`/onboarding?next=${encodeURIComponent(destination)}`);
      router.refresh();
      return;
    }

    const { data, error: signInError } = await supabase.auth.signInWithPassword({ email, password });
    if (signInError) { setError(friendlyAuthError(signInError.message)); setPending(null); return; }
    const { data: profile } = await supabase.from("profiles").select("onboarding_complete").eq("id", data.user.id).maybeSingle();
    identifyUser(data.user.id, { onboarding_complete: profile?.onboarding_complete ?? false });
    track("sign_in_completed", { method: "email" });
    router.push(profile?.onboarding_complete ? destination : `/onboarding?next=${encodeURIComponent(destination)}`);
    router.refresh();
  }

  if (confirmation) return <div className="auth-card auth-success" role="status"><span className="logo-mark"><span>EF</span></span><p className="auth-kicker">Account created</p><h1>Check your email.</h1><p>Use the confirmation link we sent to finish signing in. If that address already has an account, use password recovery instead.</p><Link className="button" href="/sign-in">Return to sign in</Link></div>;

  return <div className="auth-card">
    <div className="auth-card-heading"><span className="logo-mark"><span>EF</span></span><span className="demo-label">{configured ? "Secure account access" : "Setup required"}</span></div>
    <p className="auth-kicker">{mode === "sign-in" ? "Welcome back" : "Join Engineering Foundry"}</p>
    <h1>{mode === "sign-in" ? "Sign in to the Foundry." : "Create your account."}</h1>
    <p className="auth-intro">{mode === "sign-in" ? "Continue your preparation and manage your public profile." : "Build a persistent identity for preparation, practice, and community."}</p>
    <div className="oauth-grid"><button className="button button-secondary" disabled={Boolean(pending)} type="button" onClick={() => continueWithOAuth("google")}><span className="oauth-letter">G</span>{pending === "google" ? "Connecting…" : "Continue with Google"}</button><button className="button button-secondary" disabled={Boolean(pending)} type="button" onClick={() => continueWithOAuth("github")}><Github size={16} />{pending === "github" ? "Connecting…" : "Continue with GitHub"}</button></div>
    <div className="auth-divider"><span />OR CONTINUE WITH EMAIL<span /></div>
    <form onSubmit={submitEmail} className="auth-form">
      <div className="form-group"><label htmlFor={`${mode}-email`}>Email address</label><input id={`${mode}-email`} name="email" type="email" autoComplete="email" required placeholder="you@example.com" /></div>
      <div className="form-group"><div className="field-label-row"><label htmlFor={`${mode}-password`}>Password</label>{mode === "sign-in" && <Link href="/forgot-password">Forgot password?</Link>}</div><input id={`${mode}-password`} name="password" type="password" autoComplete={mode === "sign-in" ? "current-password" : "new-password"} minLength={8} required /></div>
      {mode === "sign-up" && <div className="form-group"><label htmlFor="confirm-password">Confirm password</label><input id="confirm-password" name="confirm_password" type="password" autoComplete="new-password" minLength={8} required /></div>}
      {error && <p className="form-error" role="alert">{error}</p>}
      <button className="button auth-submit" disabled={Boolean(pending)} type="submit">{pending === "email" ? <><LoaderCircle className="spin" size={16} />{mode === "sign-in" ? "Signing in…" : "Creating account…"}</> : <><Mail size={16} />{mode === "sign-in" ? "Sign In" : "Create Account"}</>}</button>
    </form>
    {!configured && <div className="form-note">Authentication is inactive in this environment. Configure the Supabase public URL and anon key to enable these controls.</div>}
    <p className="auth-switch">{mode === "sign-in" ? <>New here? <Link href={`/sign-up${next ? `?next=${encodeURIComponent(destination)}` : ""}`}>Create an account</Link></> : <>Already have an account? <Link href={`/sign-in${next ? `?next=${encodeURIComponent(destination)}` : ""}`}>Sign in</Link></>}</p>
  </div>;
}
