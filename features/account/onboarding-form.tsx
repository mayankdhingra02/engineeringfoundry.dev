"use client";

import { ArrowRight, LoaderCircle } from "lucide-react";
import { useActionState, useEffect, useRef } from "react";
import { completeOnboardingAction } from "./actions";
import { focusOptions, roleLevelOptions } from "@/lib/account/preferences";
import { initialAccountActionState } from "./state";

export function OnboardingForm({ next, savedTimezone }: { next: string; savedTimezone: string | null }) {
  const [state, action, pending] = useActionState(completeOnboardingAction, initialAccountActionState);
  const timezoneInput = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (savedTimezone || !timezoneInput.current || timezoneInput.current.value) return;
    const detected = Intl.DateTimeFormat().resolvedOptions().timeZone;
    if (detected) timezoneInput.current.value = detected;
  }, [savedTimezone]);

  return <form className="onboarding-form" action={action}>
    <input type="hidden" name="next" value={next} />
    <fieldset>
      <legend>What are you preparing for?</legend>
      <p>This sets a useful default. It never locks other roadmaps or overrides an application.</p>
      <div className="account-choice-grid role-choice-grid">
        {roleLevelOptions.map((option) => <label key={option.value} htmlFor={`onboarding-role-${option.value}`} aria-label={option.label}>
          <input id={`onboarding-role-${option.value}`} type="radio" name="preferredRoleLevel" value={option.value} />
          <span><strong>{option.label}</strong><small>{option.description}</small></span>
        </label>)}
      </div>
    </fieldset>

    <div className="onboarding-secondary-grid">
      <fieldset>
        <legend>Do you have an interview scheduled?</legend>
        <div className="account-choice-row">
          <label htmlFor="interview-scheduled-yes" aria-label="Yes"><input id="interview-scheduled-yes" type="radio" name="interviewScheduled" value="yes" /><span><strong>Yes</strong><small>Add it next</small></span></label>
          <label htmlFor="interview-scheduled-no" aria-label="Not yet"><input id="interview-scheduled-no" type="radio" name="interviewScheduled" value="no" defaultChecked /><span><strong>Not yet</strong><small>Start preparing</small></span></label>
        </div>
      </fieldset>
      <label className="account-field">
        <span>Timezone</span>
        <input ref={timezoneInput} name="preferredTimezone" defaultValue={savedTimezone ?? ""} placeholder="America/Chicago" autoComplete="off" />
        <small>Used by interview reminders. You can change it later.</small>
      </label>
    </div>

    <fieldset>
      <legend>What do you want to focus on first?</legend>
      <p>Your choice controls the first destination only.</p>
      <div className="account-choice-grid focus-choice-grid">
        {focusOptions.map((option) => <label key={option.value} htmlFor={`onboarding-focus-${option.value}`} aria-label={option.label}>
          <input id={`onboarding-focus-${option.value}`} type="radio" name="primaryPreparationFocus" value={option.value} />
          <span><strong>{option.label}</strong><small>{option.description}</small></span>
        </label>)}
      </div>
    </fieldset>

    {state.message && <p className={`account-form-status ${state.status}`} role={state.status === "error" ? "alert" : "status"}>{state.message}</p>}
    <div className="onboarding-actions">
      <button className="button" type="submit" name="intent" value="complete" disabled={pending}>
        {pending ? <><LoaderCircle className="spin" size={16} />Saving…</> : <>Start preparing<ArrowRight size={16} /></>}
      </button>
      <button className="button button-quiet" type="submit" name="intent" value="skip" disabled={pending}>Skip for now</button>
    </div>
  </form>;
}
