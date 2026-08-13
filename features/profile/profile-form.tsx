"use client";

import { LoaderCircle, LockKeyhole, UserRound } from "lucide-react";
import { useRouter } from "next/navigation";
import { useActionState, useEffect } from "react";
import type { Profile } from "@/lib/supabase/database.types";
import { identifyUser, track } from "@/lib/analytics";
import { safeInternalPath } from "@/lib/auth/redirects";
import { initialProfileState, saveProfileAction } from "./actions";

export function ProfileForm({ profile, mode, next, userId }: { profile: Profile; mode: "onboarding" | "settings"; next?: string; userId: string }) {
  const [state, action, pending] = useActionState(saveProfileAction, initialProfileState);
  const router = useRouter();
  useEffect(() => {
    if (mode === "onboarding") track("profile_onboarding_started");
  }, [mode]);
  useEffect(() => {
    if (state.status !== "success") return;
    if (mode === "onboarding") {
      identifyUser(userId, { onboarding_complete: true });
      track("profile_onboarding_completed", { profile_visibility: state.visibility });
      router.push(safeInternalPath(next));
    } else {
      track("profile_updated", { profile_visibility: state.visibility, username_changed: state.username !== profile.username });
      router.refresh();
    }
  }, [mode, next, profile.username, router, state, userId]);

  return <form action={action} className="profile-form form-shell">
    <input type="hidden" name="mode" value={mode} />
    <div className="profile-form-header"><div><p className="auth-kicker">{mode === "onboarding" ? "Account → Profile → Ready" : "Public identity"}</p><h2>{mode === "onboarding" ? "Set up your profile" : "Profile settings"}</h2><p>{mode === "onboarding" ? "Only a username and display name are required. Everything else is optional." : "Control what other engineers see on your public profile."}</p></div><span className="icon-well"><UserRound size={20} /></span></div>
    <div className="form-grid">
      <div className="form-group"><label htmlFor="username">Username <span>Required</span></label><div className="input-prefix"><span>engineeringfoundry.dev/u/</span><input id="username" name="username" required minLength={3} maxLength={30} pattern="[a-zA-Z0-9][a-zA-Z0-9_-]{2,29}" defaultValue={profile.username ?? ""} autoCapitalize="none" autoCorrect="off" /></div><small>3–30 letters, numbers, underscores, or hyphens.</small></div>
      <div className="form-group"><label htmlFor="display-name">Display name <span>Required</span></label><input id="display-name" name="display_name" required maxLength={80} defaultValue={profile.display_name ?? ""} autoComplete="name" /></div>
      <div className="form-group"><label htmlFor="current-company">Current company <span>Optional</span></label><input id="current-company" name="current_company" maxLength={100} defaultValue={profile.current_company ?? ""} /></div>
      <div className="form-group"><label htmlFor="current-role">Current role <span>Optional</span></label><input id="current-role" name="current_role" maxLength={100} defaultValue={profile.current_role ?? ""} /></div>
      <div className="form-group"><label htmlFor="years-experience">Years of experience <span>Optional</span></label><input id="years-experience" name="years_experience" type="number" min={0} max={80} step={1} defaultValue={profile.years_experience ?? ""} /></div>
      <div className="form-group"><label htmlFor="linkedin-url">LinkedIn URL <span>Optional</span></label><input id="linkedin-url" name="linkedin_url" type="url" placeholder="https://linkedin.com/in/…" defaultValue={profile.linkedin_url ?? ""} /></div>
      <div className="form-group full"><label htmlFor="github-url">GitHub URL <span>Optional</span></label><input id="github-url" name="github_url" type="url" placeholder="https://github.com/…" defaultValue={profile.github_url ?? ""} /></div>
      <div className="form-group full"><label htmlFor="bio">Short bio <span>Optional · 280 characters</span></label><textarea id="bio" name="bio" maxLength={280} defaultValue={profile.bio ?? ""} placeholder="What do you build, learn, or help others with?" /></div>
      <fieldset className="visibility-field form-group full"><legend>Profile visibility</legend><label><input type="radio" name="is_public" value="public" defaultChecked={profile.is_public} /><span><UserRound size={17} /><strong>Public</strong><small>Your completed profile can appear at /u/username.</small></span></label><label><input type="radio" name="is_public" value="private" defaultChecked={!profile.is_public} /><span><LockKeyhole size={17} /><strong>Private</strong><small>Your profile won&apos;t be visible to public visitors or other members.</small></span></label></fieldset>
    </div>
    {state.message && <p className={state.status === "error" ? "form-error" : "form-success"} role={state.status === "error" ? "alert" : "status"}>{state.message}</p>}
    <div className="profile-form-actions"><button className="button" disabled={pending} type="submit">{pending ? <><LoaderCircle className="spin" size={16} />Saving…</> : mode === "onboarding" ? "Complete setup" : "Save profile"}</button>{mode === "settings" && state.visibility === "public" && state.username && <a className="button button-secondary" href={`/u/${state.username}`}>View profile</a>}</div>
  </form>;
}
