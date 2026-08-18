"use client";

import { useActionState, useEffect, useState } from "react";
import { saveReminderPreferencesAction, type ReminderPreferenceActionState } from "./actions";

const initial: ReminderPreferenceActionState = { status: "idle", message: "" };
const zones = ["UTC", "America/New_York", "America/Chicago", "America/Denver", "America/Los_Angeles", "Europe/London", "Europe/Berlin", "Asia/Kolkata", "Asia/Singapore", "Asia/Tokyo", "Australia/Sydney"];

export function ReminderPreferencesForm({ preference, emailAvailable }: { preference: { preferred_timezone: string | null; in_app_enabled: boolean; prep_3_days_enabled: boolean; interview_1_day_enabled: boolean; interview_1_hour_enabled: boolean; email_enabled: boolean }; emailAvailable: boolean }) {
  const [state, action, pending] = useActionState(saveReminderPreferencesAction, initial);
  const [suggestion, setSuggestion] = useState("");
  useEffect(() => {
    if (preference.preferred_timezone) return;
    const timer = window.setTimeout(() => setSuggestion(Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC"), 0);
    return () => window.clearTimeout(timer);
  }, [preference.preferred_timezone]);
  return <form className="reminder-preferences-form" action={action}>
    <div className="reminder-timezone-field"><label htmlFor="preferredTimezone">Your timezone</label><p>Used for the “your time” label. The interview&apos;s original timezone stays visible.</p><input id="preferredTimezone" name="preferredTimezone" list="interview-timezones" defaultValue={preference.preferred_timezone ?? ""} placeholder={suggestion || "America/Chicago"} autoComplete="off" /><datalist id="interview-timezones">{zones.map((zone) => <option key={zone} value={zone} />)}</datalist>{!preference.preferred_timezone && suggestion && <button type="button" className="text-button" onClick={(event) => { const input = event.currentTarget.parentElement?.querySelector("input"); if (input) input.value = suggestion; }}>Use {suggestion}</button>}</div>
    <fieldset><legend>Delivery</legend><label htmlFor="inAppEnabled" aria-label="In-app reminders"><input id="inAppEnabled" type="checkbox" name="inAppEnabled" defaultChecked={preference.in_app_enabled} /><span><strong>In-app reminders</strong><small>Show scheduled and due reminders in your private workspace.</small></span></label><label htmlFor="emailEnabled" aria-label="Email reminders" className={!emailAvailable ? "disabled" : ""}><input id="emailEnabled" type="checkbox" name="emailEnabled" defaultChecked={preference.email_enabled && emailAvailable} disabled={!emailAvailable} /><span><strong>Email reminders</strong><small>{emailAvailable ? "Send to your verified account email." : "Unavailable until the site operator connects an email provider and scheduler."}</small></span></label></fieldset>
    <fieldset><legend>Timing</legend><label htmlFor="prep3DaysEnabled" aria-label="Preparation reminder three days before"><input id="prep3DaysEnabled" type="checkbox" name="prep3DaysEnabled" defaultChecked={preference.prep_3_days_enabled} /><span><strong>Preparation · 3 days before</strong><small>A quiet cue to open the focused preparation plan.</small></span></label><label htmlFor="interview1DayEnabled" aria-label="Interview reminder one day before"><input id="interview1DayEnabled" type="checkbox" name="interview1DayEnabled" defaultChecked={preference.interview_1_day_enabled} /><span><strong>Interview · 1 day before</strong><small>Confirm the schedule, timezone, and meeting details.</small></span></label><label htmlFor="interview1HourEnabled" aria-label="Interview reminder one hour before"><input id="interview1HourEnabled" type="checkbox" name="interview1HourEnabled" defaultChecked={preference.interview_1_hour_enabled} /><span><strong>Interview · 1 hour before</strong><small>One final schedule cue—not an extra preparation prompt.</small></span></label></fieldset>
    <p className={`form-status ${state.status}`} role="status" aria-live="polite">{state.message}</p><button className="button" type="submit" disabled={pending}>{pending ? "Saving…" : "Save reminder settings"}</button>
  </form>;
}
