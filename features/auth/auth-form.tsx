"use client";

import Link from "next/link";
import { Github, LoaderCircle, Mail, MailCheck } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { identifyUser, track } from "@/lib/analytics";
import {
  isAccountPlatformAvailable,
  isGitHubAuthEnabled,
  isGoogleAuthEnabled,
} from "@/lib/account-platform";
import {
  PASSWORD_REQUIREMENT,
  type AuthField,
  type AuthFieldErrors,
  validateSignInCredentials,
  validateSignUpCredentials,
} from "@/lib/auth/credentials";
import { safeInternalPath } from "@/lib/auth/redirects";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { PasswordInput } from "./password-input";

type AuthMode = "sign-in" | "sign-up";
type OAuthProvider = "google" | "github";

const GENERIC_AUTH_ERROR =
  "We couldn't complete that request. Check your details and try again.";

function friendlyAuthError(message: string) {
  const value = message.toLowerCase();
  if (value.includes("invalid login credentials")) {
    return "The email or password is incorrect.";
  }
  if (value.includes("email not confirmed")) {
    return "Confirm your email before signing in.";
  }
  if (value.includes("already registered") || value.includes("already exists")) {
    return "An account already exists for this email. Sign in instead.";
  }
  if (value.includes("password")) return PASSWORD_REQUIREMENT;
  if (value.includes("rate") || value.includes("too many")) {
    return "Too many attempts. Wait a moment and try again.";
  }
  return GENERIC_AUTH_ERROR;
}

function describedBy(...ids: Array<string | false | undefined>) {
  const value = ids.filter(Boolean).join(" ");
  return value || undefined;
}

export function AuthForm({ mode, next }: { mode: AuthMode; next?: string }) {
  const configured = isAccountPlatformAvailable();
  const router = useRouter();
  const [pending, setPending] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [fieldErrors, setFieldErrors] = useState<AuthFieldErrors>({});
  const [confirmation, setConfirmation] = useState(false);
  const destination = safeInternalPath(next, "/dashboard");
  const errorId = `${mode}-form-error`;
  const providers: OAuthProvider[] = [
    ...(isGoogleAuthEnabled() ? (["google"] as const) : []),
    ...(isGitHubAuthEnabled() ? (["github"] as const) : []),
  ];

  function clearFieldError(field: AuthField) {
    if (!fieldErrors[field]) return;
    setFieldErrors((current) => ({ ...current, [field]: undefined }));
  }

  async function continueWithOAuth(provider: OAuthProvider) {
    const supabase = createSupabaseBrowserClient();
    if (!supabase) {
      setError(
        "Authentication is not configured in this environment. Add the public Supabase project settings and enable accounts.",
      );
      return;
    }
    setPending(provider);
    setError("");
    if (mode === "sign-up") {
      track("account_signup_started", { method: provider, demo: false });
    }
    const callback = new URL("/auth/callback", window.location.origin);
    callback.searchParams.set("next", destination);
    const { error: oauthError } = await supabase.auth.signInWithOAuth({
      provider,
      options: { redirectTo: callback.toString() },
    });
    if (oauthError) {
      setError(
        `We couldn't start ${provider === "google" ? "Google" : "GitHub"} sign-in. Try email instead or check the provider configuration.`,
      );
      setPending(null);
    }
  }

  async function submitEmail(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formElement = event.currentTarget;
    const form = new FormData(formElement);
    const fullName = String(form.get("full_name") ?? "").trim();
    const email = String(form.get("email") ?? "").trim();
    const password = String(form.get("password") ?? "");
    const confirmationPassword = String(
      form.get("confirm_password") ?? "",
    );
    const errors =
      mode === "sign-up"
        ? validateSignUpCredentials({
            fullName,
            email,
            password,
            confirmation: confirmationPassword,
          })
        : validateSignInCredentials({ email, password });

    if (Object.keys(errors).length) {
      setFieldErrors(errors);
      setError("");
      const firstInvalid = [
        "full_name",
        "email",
        "password",
        "confirm_password",
      ].find((field) => errors[field as AuthField]);
      if (firstInvalid) {
        const control = formElement.elements.namedItem(firstInvalid);
        if (control instanceof HTMLElement) control.focus();
      }
      return;
    }

    const supabase = createSupabaseBrowserClient();
    if (!supabase) {
      setError(
        "Authentication is not configured in this environment. Add the public Supabase project settings and enable accounts.",
      );
      return;
    }
    setPending("email");
    setError("");
    setFieldErrors({});

    if (mode === "sign-up") {
      track("account_signup_started", { method: "email", demo: false });
      const callback = new URL("/auth/callback", window.location.origin);
      callback.searchParams.set("next", destination);
      const { data, error: signUpError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: { full_name: fullName },
          emailRedirectTo: callback.toString(),
        },
      });
      if (signUpError) {
        setError(friendlyAuthError(signUpError.message));
        setPending(null);
        return;
      }
      if (!data.session) {
        setConfirmation(true);
        setPending(null);
        return;
      }
      track("account_created", { method: "email" });
      if (!data.user) {
        setError(GENERIC_AUTH_ERROR);
        setPending(null);
        return;
      }
      identifyUser(data.user.id, { onboarding_complete: false });
      router.push(`/onboarding?next=${encodeURIComponent(destination)}`);
      router.refresh();
      return;
    }

    const { data, error: signInError } =
      await supabase.auth.signInWithPassword({ email, password });
    if (signInError) {
      setError(friendlyAuthError(signInError.message));
      setPending(null);
      return;
    }
    const { data: profile } = await supabase
      .from("profiles")
      .select("onboarding_complete")
      .eq("id", data.user.id)
      .maybeSingle();
    identifyUser(data.user.id, {
      onboarding_complete: profile?.onboarding_complete ?? false,
    });
    track("sign_in_completed", { method: "email" });
    router.push(
      profile?.onboarding_complete
        ? destination
        : `/onboarding?next=${encodeURIComponent(destination)}`,
    );
    router.refresh();
  }

  if (confirmation) {
    return (
      <div className="auth-card auth-success" role="status">
        <span className="auth-success-mark" aria-hidden="true">
          <MailCheck size={22} />
        </span>
        <h1>Check your email.</h1>
        <p>
          Use the confirmation link we sent to finish signing in. If that
          address already has an account, sign in instead.
        </p>
        <Link className="button" href="/signin">
          Return to sign in
        </Link>
      </div>
    );
  }

  return (
    <div className={`auth-card auth-card--${mode}`}>
      <div className="auth-card-heading">
        <span className="logo-mark" aria-label="Engineering Foundry">
          <span>EF</span>
        </span>
        <span className="demo-label">
          {configured ? "Secure account access" : "Setup required"}
        </span>
      </div>
      <h1>
        {mode === "sign-in"
          ? "Welcome back."
          : "Create your Engineering Foundry account."}
      </h1>
      <p className="auth-intro">
        {mode === "sign-in"
          ? "Continue your interview preparation."
          : "Keep your interview work organized and private to your account."}
      </p>

      {providers.length > 0 && (
        <>
          <div className="oauth-grid">
            {providers.includes("google") && (
              <button
                className="button button-secondary"
                disabled={Boolean(pending)}
                type="button"
                onClick={() => continueWithOAuth("google")}
              >
                <span className="oauth-letter" aria-hidden="true">
                  G
                </span>
                {pending === "google" ? "Connecting…" : "Continue with Google"}
              </button>
            )}
            {providers.includes("github") && (
              <button
                className="button button-secondary"
                disabled={Boolean(pending)}
                type="button"
                onClick={() => continueWithOAuth("github")}
              >
                <Github size={16} aria-hidden="true" />
                {pending === "github" ? "Connecting…" : "Continue with GitHub"}
              </button>
            )}
          </div>
          <div className="auth-divider" aria-hidden="true">
            <span />
            OR USE EMAIL
            <span />
          </div>
        </>
      )}

      <form method="post" onSubmit={submitEmail} className="auth-form" noValidate>
        {mode === "sign-up" && (
          <div className="form-group">
            <label htmlFor="sign-up-name">Name</label>
            <input
              id="sign-up-name"
              name="full_name"
              type="text"
              autoComplete="name"
              minLength={2}
              maxLength={80}
              required
              onChange={() => clearFieldError("full_name")}
              aria-describedby={
                fieldErrors.full_name ? "sign-up-name-error" : undefined
              }
              aria-invalid={Boolean(fieldErrors.full_name)}
            />
            {fieldErrors.full_name && (
              <p className="field-error" id="sign-up-name-error">
                {fieldErrors.full_name}
              </p>
            )}
          </div>
        )}

        <div className="form-group">
          <label htmlFor={`${mode}-email`}>Email address</label>
          <input
            id={`${mode}-email`}
            name="email"
            type="email"
            autoComplete="email"
            inputMode="email"
            required
            placeholder="you@example.com"
            onChange={() => clearFieldError("email")}
            aria-describedby={
              fieldErrors.email ? `${mode}-email-error` : undefined
            }
            aria-invalid={Boolean(fieldErrors.email)}
          />
          {fieldErrors.email && (
            <p className="field-error" id={`${mode}-email-error`}>
              {fieldErrors.email}
            </p>
          )}
        </div>

        <div className="form-group">
          <div className="field-label-row">
            <label htmlFor={`${mode}-password`}>Password</label>
            {mode === "sign-in" && (
              <Link href="/forgot-password">Forgot password?</Link>
            )}
          </div>
          <PasswordInput
            id={`${mode}-password`}
            name="password"
            autoComplete={
              mode === "sign-in" ? "current-password" : "new-password"
            }
            describedBy={describedBy(
              mode === "sign-up"
                ? "password-requirements"
                : fieldErrors.password && `${mode}-password-error`,
            )}
            invalid={Boolean(fieldErrors.password)}
            onChange={() => clearFieldError("password")}
            minLength={mode === "sign-in" ? 1 : 8}
            maxLength={mode === "sign-in" ? undefined : 128}
          />
          {mode === "sign-up" && (
            <p
              className={fieldErrors.password ? "field-error" : "field-hint"}
              id="password-requirements"
            >
              {fieldErrors.password ?? PASSWORD_REQUIREMENT}
            </p>
          )}
          {mode === "sign-in" && fieldErrors.password && (
            <p className="field-error" id={`${mode}-password-error`}>
              {fieldErrors.password}
            </p>
          )}
        </div>

        {mode === "sign-up" && (
          <div className="form-group">
            <label htmlFor="confirm-password">Confirm password</label>
            <PasswordInput
              id="confirm-password"
              name="confirm_password"
              autoComplete="new-password"
              describedBy={
                fieldErrors.confirm_password
                  ? "confirm-password-error"
                  : undefined
              }
              invalid={Boolean(fieldErrors.confirm_password)}
              onChange={() => clearFieldError("confirm_password")}
            />
            {fieldErrors.confirm_password && (
              <p className="field-error" id="confirm-password-error">
                {fieldErrors.confirm_password}
              </p>
            )}
          </div>
        )}

        {error && (
          <p className="form-error" id={errorId} role="alert">
            {error}
          </p>
        )}
        <button
          className="button auth-submit"
          disabled={Boolean(pending)}
          type="submit"
        >
          {pending === "email" ? (
            <>
              <LoaderCircle className="spin" size={16} aria-hidden="true" />
              {mode === "sign-in" ? "Signing in…" : "Creating account…"}
            </>
          ) : (
            <>
              <Mail size={16} aria-hidden="true" />
              {mode === "sign-in" ? "Sign in" : "Sign up"}
            </>
          )}
        </button>
      </form>

      {!configured && (
        <div className="form-note">
          Authentication is inactive in this environment. Configure the public
          Supabase URL and anon key, then enable accounts.
        </div>
      )}
      <p className="auth-switch">
        {mode === "sign-in" ? (
          <>
            New here?{" "}
            <Link
              href={`/signup${next ? `?next=${encodeURIComponent(destination)}` : ""}`}
            >
              Sign up
            </Link>
          </>
        ) : (
          <>
            Already have an account?{" "}
            <Link
              href={`/signin${next ? `?next=${encodeURIComponent(destination)}` : ""}`}
            >
              Sign in
            </Link>
          </>
        )}
      </p>
    </div>
  );
}
