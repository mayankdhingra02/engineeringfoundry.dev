"use client";

import { LoaderCircle, LockKeyhole, UserRound } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  startTransition,
  useActionState,
  useEffect,
  useRef,
  useState,
  type FormEvent,
} from "react";
import type { Profile } from "@/lib/supabase/database.types";
import { identifyUser, track } from "@/lib/analytics";
import {
  PROFILE_EXPECTED_REVISION_FIELD,
  resolveProfileDisplayState,
} from "@/lib/auth/profile-action-input";
import { saveProfileAction, type ProfileActionState } from "./actions";

export function ProfileForm({ profile, userId }: { profile: Profile; userId: string }) {
  const [state, action, pending] = useActionState(saveProfileAction, {
    status: "idle",
    message: "",
    revision: profile.updated_at,
  } satisfies ProfileActionState);
  const router = useRouter();
  const submissionPending = useRef(false);
  const [changedSinceSubmit, setChangedSinceSubmit] = useState(false);

  useEffect(() => {
    if (!pending) submissionPending.current = false;
  }, [pending]);
  useEffect(() => () => {
    submissionPending.current = false;
  }, []);
  useEffect(() => {
    if (state.status !== "success") return;
    identifyUser(userId, { profile_visibility: state.visibility });
    track("profile_updated", { profile_visibility: state.visibility, username_changed: state.username !== profile.username });
    router.refresh();
  }, [profile.username, router, state, userId]);

  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (submissionPending.current) return;
    submissionPending.current = true;
    setChangedSinceSubmit(false);
    const formData = new FormData(event.currentTarget);
    startTransition(() => action(formData));
  };
  const displayState = resolveProfileDisplayState(
    state,
    pending,
    changedSinceSubmit,
  );

  return <form action={action} onSubmit={submit} onChange={() => {
    if (submissionPending.current) setChangedSinceSubmit(true);
  }} aria-busy={pending} className="profile-form form-shell">
    <input type="hidden" name={PROFILE_EXPECTED_REVISION_FIELD} value={state.revision ?? profile.updated_at} />
    <div className="profile-form-header"><div><p className="auth-kicker">Public identity</p><h2>Profile settings</h2><p>Control what other engineers see on your public profile.</p></div><span className="icon-well"><UserRound size={20} /></span></div>
    <div className="form-grid">
      <div className="form-group"><label htmlFor="username">Username <span>Required</span></label><div className="input-prefix"><span>engineeringfoundry.dev/u/</span><input id="username" name="username" required minLength={3} maxLength={30} pattern={"[a-zA-Z0-9][a-zA-Z0-9_\\-]{2,29}"} defaultValue={profile.username ?? ""} autoCapitalize="none" autoCorrect="off" /></div><small>3–30 letters, numbers, underscores, or hyphens.</small></div>
      <div className="form-group"><label htmlFor="display-name">Display name <span>Required</span></label><input id="display-name" name="display_name" required maxLength={80} defaultValue={profile.display_name ?? ""} autoComplete="name" /></div>
      <div className="form-group"><label htmlFor="current-company">Current company <span>Optional</span></label><input id="current-company" name="current_company" maxLength={100} defaultValue={profile.current_company ?? ""} /></div>
      <div className="form-group"><label htmlFor="current-role">Current role <span>Optional</span></label><input id="current-role" name="current_role" maxLength={100} defaultValue={profile.current_role ?? ""} /></div>
      <div className="form-group"><label htmlFor="years-experience">Years of experience <span>Optional</span></label><input id="years-experience" name="years_experience" type="number" min={0} max={80} step={1} defaultValue={profile.years_experience ?? ""} /></div>
      <div className="form-group"><label htmlFor="linkedin-url">LinkedIn URL <span>Optional</span></label><input id="linkedin-url" name="linkedin_url" type="url" inputMode="url" maxLength={500} aria-describedby="linkedin-url-help" placeholder="https://www.linkedin.com/in/…" defaultValue={profile.linkedin_url ?? ""} autoCapitalize="none" autoCorrect="off" /><small id="linkedin-url-help">Use a full HTTPS URL on linkedin.com.</small></div>
      <div className="form-group full"><label htmlFor="github-url">GitHub URL <span>Optional</span></label><input id="github-url" name="github_url" type="url" inputMode="url" maxLength={500} aria-describedby="github-url-help" placeholder="https://github.com/…" defaultValue={profile.github_url ?? ""} autoCapitalize="none" autoCorrect="off" /><small id="github-url-help">Use a full HTTPS URL on github.com.</small></div>
      <div className="form-group full"><label htmlFor="bio">Short bio <span>Optional · 280 characters</span></label><textarea id="bio" name="bio" maxLength={280} defaultValue={profile.bio ?? ""} placeholder="What do you build, learn, or help others with?" /></div>
      <fieldset className="visibility-field form-group full"><legend>Profile visibility</legend><label><input type="radio" name="is_public" value="public" defaultChecked={profile.is_public} /><span><UserRound size={17} /><strong>Public</strong><small>Your completed profile can appear at /u/username.</small></span></label><label><input type="radio" name="is_public" value="private" defaultChecked={!profile.is_public} /><span><LockKeyhole size={17} /><strong>Private</strong><small>Your profile won&apos;t be visible to public visitors or other members.</small></span></label></fieldset>
    </div>
    {(pending || displayState.message) && <p className={displayState.status === "error" ? "form-error" : displayState.status === "success" ? "form-success" : undefined} role={displayState.status === "error" ? "alert" : "status"} aria-live={displayState.status === "error" ? "assertive" : "polite"} aria-atomic="true">{displayState.message}{!pending && state.conflict && <><br /><Link href="/settings/profile" target="_blank" rel="noopener noreferrer">Review latest in a new tab</Link></>}</p>}
    <div className="profile-form-actions"><button className="button" aria-disabled={pending} type="submit">{pending ? <><LoaderCircle className="spin" size={16} />Saving…</> : "Save profile"}</button>{state.visibility === "public" && state.username && <a className="button button-secondary" href={`/u/${state.username}`}>View profile</a>}</div>
  </form>;
}
