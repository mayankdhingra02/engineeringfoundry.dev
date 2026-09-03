"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { Download, LoaderCircle, LogOut, Trash2 } from "lucide-react";
import { useActionState, useEffect } from "react";
import {
  changePasswordAction,
  deleteAccountAction,
  requestEmailChangeAction,
  savePreparationPreferencesAction,
  signOutEverywhereAction,
  updateDisplayNameAction,
} from "./actions";
import { dsaLevelOptions, focusOptions, roleLevelOptions } from "@/lib/account/preferences";
import type { PreparationPreferences } from "@/lib/account/preparation-preferences";
import { initialAccountActionState } from "./state";

function FormStatus({ state }: { state: typeof initialAccountActionState }) {
  if (!state.message) return null;
  return <p className={`account-form-status ${state.status}`} role={state.status === "error" ? "alert" : "status"}>{state.message}</p>;
}

export function DisplayNameForm({ displayName }: { displayName: string | null }) {
  const [state, action, pending] = useActionState(updateDisplayNameAction, initialAccountActionState);
  return <form className="account-settings-form" action={action}>
    <label className="account-field"><span>Display name</span><input name="displayName" defaultValue={displayName ?? ""} maxLength={80} autoComplete="name" /><small>Optional. This changes how your account is labeled, not who owns it.</small></label>
    <FormStatus state={state} />
    <button className="button button-secondary" disabled={pending}>{pending ? "Saving…" : "Save display name"}</button>
  </form>;
}

export function EmailChangeForm({ email }: { email: string }) {
  const [state, action, pending] = useActionState(requestEmailChangeAction, initialAccountActionState);
  return <form className="account-settings-form" action={action}>
    <label className="account-field"><span>Account email</span><input type="email" name="email" defaultValue={email} required autoComplete="email" /><small>Your authentication provider remains the source of truth. Verification is required before the address changes.</small></label>
    <FormStatus state={state} />
    <button className="button button-secondary" disabled={pending}>{pending ? "Starting…" : "Change email"}</button>
  </form>;
}

export function PasswordChangeForm() {
  const [state, action, pending] = useActionState(changePasswordAction, initialAccountActionState);
  return <form className="account-settings-form" action={action}>
    <div className="account-form-grid">
      <label className="account-field"><span>Current password</span><input type="password" name="currentPassword" required autoComplete="current-password" /></label>
      <label className="account-field"><span>New password</span><input type="password" name="newPassword" required minLength={8} autoComplete="new-password" /></label>
      <label className="account-field"><span>Confirm new password</span><input type="password" name="confirmPassword" required minLength={8} autoComplete="new-password" /></label>
    </div>
    <p className="account-form-help">OAuth-only accounts can use <Link href="/forgot-password">password recovery</Link> instead.</p>
    <FormStatus state={state} />
    <button className="button button-secondary" disabled={pending}>{pending ? "Changing…" : "Change password"}</button>
  </form>;
}

export function GlobalSignOutForm() {
  const router = useRouter();
  const [state, action, pending] = useActionState(signOutEverywhereAction, initialAccountActionState);
  useEffect(() => {
    if (state.status !== "success") return;
    const timer = window.setTimeout(() => router.push("/"), 700);
    return () => window.clearTimeout(timer);
  }, [state.status, router]);
  return <form className="account-inline-action" action={action}>
    <div><strong>Sign out everywhere</strong><p>Revoke refresh tokens for this account, including this browser.</p></div>
    <button className="button button-secondary" disabled={pending}><LogOut size={16} />{pending ? "Signing out…" : "Sign out all sessions"}</button>
    <FormStatus state={state} />
  </form>;
}

export function PreparationPreferencesForm({ preference }: { preference: PreparationPreferences | null }) {
  const [state, action, pending] = useActionState(savePreparationPreferencesAction, initialAccountActionState);
  return <form className="preparation-preferences-form" action={action}>
    <label className="account-field"><span>Preferred role level</span><select name="preferredRoleLevel" defaultValue={preference?.preferred_role_level ?? ""}><option value="">No preference</option>{roleLevelOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}</select><small>Used outside application-specific preparation.</small></label>
    <label className="account-field"><span>Primary preparation focus</span><select name="primaryPreparationFocus" defaultValue={preference?.primary_preparation_focus ?? ""}><option value="">No preference</option>{focusOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}</select><small>Prioritizes the first-use dashboard; it never hides other tracks.</small></label>
    <label className="account-field"><span>Preferred DSA roadmap</span><select name="dsaLevel" defaultValue={preference?.dsa_level ?? ""}><option value="">No preferred roadmap</option>{dsaLevelOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}</select><small>An explicit roadmap choice is respected until you change it.</small></label>
    <FormStatus state={state} />
    <button className="button" disabled={pending}>{pending ? <><LoaderCircle className="spin" size={16} />Saving…</> : "Save preferences"}</button>
  </form>;
}

export function ExportAccountData() {
  return <div className="account-inline-action"><div><strong>Export my data</strong><p>Download a private JSON copy of your Engineering Foundry account and saved preparation.</p></div><a className="button button-secondary" href="/api/account/export" download><Download size={16} />Download JSON</a></div>;
}

export function DeleteAccountForm({ available, requiresPassword }: { available: boolean; requiresPassword: boolean }) {
  const [state, action, pending] = useActionState(deleteAccountAction, initialAccountActionState);
  const description = <p>This removes your applications, interviews, preparation, stories, notes, progress, attempts, preferences, reminders, and authentication identity. It cannot be undone.</p>;

  // Without the trusted server credential deletion cannot run at all. Say so
  // plainly rather than presenting a control that appears operational.
  if (!available) {
    return <div className="delete-account-form">
      <div className="danger-heading"><Trash2 size={19} aria-hidden="true" /><div><strong>Delete account permanently</strong>{description}</div></div>
      <p className="account-form-status error" role="status">Permanent deletion is unavailable in this environment because the trusted server credential is not configured. No deletion request is being accepted. Contact support if you need this account removed.</p>
    </div>;
  }

  return <form className="delete-account-form" action={action}>
    <div className="danger-heading"><Trash2 size={19} aria-hidden="true" /><div><strong>Delete account permanently</strong>{description}</div></div>
    {requiresPassword && <label className="account-field"><span>Current password</span><input type="password" name="currentPassword" required autoComplete="current-password" /></label>}
    <label className="account-field"><span>Type DELETE to confirm</span><input name="confirmation" required autoComplete="off" aria-describedby="delete-account-help" /></label>
    <p id="delete-account-help">{requiresPassword ? "Your current password and this exact confirmation are required." : "Your current authenticated session and this exact confirmation are required. This account signs in with a provider, so there is no password to re-enter."}</p>
    <FormStatus state={state} />
    <button className="button button-danger" disabled={pending}>{pending ? "Deleting…" : "Delete my account"}</button>
  </form>;
}
