"use client";

import Link from "next/link";
import {
  startTransition,
  useActionState,
  useEffect,
  useRef,
  useState,
  type FormEvent,
} from "react";
import {
  REMINDER_PREFERENCE_EXPECTED_REVISION_FIELD,
  REMINDER_PREFERENCE_PRESENCE_FIELDS,
  resolveReminderPreferenceDisplayState,
} from "@/lib/interview-calendar/reminder-preference-action-input";
import {
  saveReminderPreferencesAction,
  type ReminderPreferenceActionState,
} from "./actions";

const zones = [
  "UTC",
  "America/New_York",
  "America/Chicago",
  "America/Denver",
  "America/Los_Angeles",
  "Europe/London",
  "Europe/Berlin",
  "Asia/Kolkata",
  "Asia/Singapore",
  "Asia/Tokyo",
  "Australia/Sydney",
];

type ReminderPreferenceValues = Readonly<{
  preferred_timezone: string | null;
  in_app_enabled: boolean;
  prep_3_days_enabled: boolean;
  interview_1_day_enabled: boolean;
  interview_1_hour_enabled: boolean;
  email_enabled: boolean;
}>;

function reminderPreferenceDraftSignature(formData: FormData) {
  return JSON.stringify([
    formData.get("preferredTimezone"),
    formData.get("inAppEnabled"),
    formData.get("prep3DaysEnabled"),
    formData.get("interview1DayEnabled"),
    formData.get("interview1HourEnabled"),
    formData.get("emailEnabled"),
  ]);
}

export function ReminderPreferencesForm({
  preference,
  preferenceRevision,
  emailAvailable,
}: {
  preference: ReminderPreferenceValues;
  preferenceRevision: string;
  emailAvailable: boolean;
}) {
  const [state, action, pending] = useActionState(
    saveReminderPreferencesAction,
    {
      status: "idle",
      message: "",
      revision: preferenceRevision,
    } satisfies ReminderPreferenceActionState,
  );
  const [suggestion, setSuggestion] = useState("");
  const [changedSinceSubmit, setChangedSinceSubmit] = useState(false);
  const submissionPending = useRef(false);
  const submittedDraftSignature = useRef<string | null>(null);

  useEffect(() => {
    if (preference.preferred_timezone) return;
    const timer = window.setTimeout(
      () =>
        setSuggestion(
          Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC",
        ),
      0,
    );
    return () => window.clearTimeout(timer);
  }, [preference.preferred_timezone]);

  useEffect(() => {
    if (!pending) submissionPending.current = false;
  }, [pending]);

  useEffect(
    () => () => {
      submissionPending.current = false;
      submittedDraftSignature.current = null;
    },
    [],
  );

  const updateChangedSinceSubmit = (form: HTMLFormElement | null) => {
    if (!form || submittedDraftSignature.current === null) return;
    setChangedSinceSubmit(
      reminderPreferenceDraftSignature(new FormData(form)) !==
        submittedDraftSignature.current,
    );
  };

  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (submissionPending.current) return;
    submissionPending.current = true;
    const formData = new FormData(event.currentTarget);
    submittedDraftSignature.current = reminderPreferenceDraftSignature(formData);
    setChangedSinceSubmit(false);
    startTransition(() => action(formData));
  };
  const displayState = resolveReminderPreferenceDisplayState(
    state,
    pending,
    changedSinceSubmit,
  );

  return (
    <form
      className="reminder-preferences-form"
      action={action}
      onSubmit={submit}
      onChange={(event) => updateChangedSinceSubmit(event.currentTarget)}
      aria-busy={pending}
    >
      <input
        type="hidden"
        name={REMINDER_PREFERENCE_EXPECTED_REVISION_FIELD}
        value={state.revision ?? preferenceRevision}
      />
      {Object.values(REMINDER_PREFERENCE_PRESENCE_FIELDS).map((name) => (
        <input key={name} type="hidden" name={name} value="true" />
      ))}

      <div className="reminder-timezone-field">
        <label htmlFor="preferredTimezone">Your timezone</label>
        <p>
          Used for the “your time” label. The interview&apos;s original timezone
          stays visible.
        </p>
        <input
          id="preferredTimezone"
          name="preferredTimezone"
          list="interview-timezones"
          defaultValue={preference.preferred_timezone ?? ""}
          placeholder={suggestion || "America/Chicago"}
          maxLength={100}
          autoComplete="off"
        />
        <datalist id="interview-timezones">
          {zones.map((zone) => (
            <option key={zone} value={zone} />
          ))}
        </datalist>
        {!preference.preferred_timezone && suggestion && (
          <button
            type="button"
            className="text-button"
            onClick={(event) => {
              const input =
                event.currentTarget.parentElement?.querySelector("input");
              if (input) {
                input.value = suggestion;
                updateChangedSinceSubmit(event.currentTarget.form);
              }
            }}
          >
            Use {suggestion}
          </button>
        )}
      </div>

      <fieldset>
        <legend>Delivery</legend>
        <label htmlFor="inAppEnabled" aria-label="In-app reminders">
          <input
            id="inAppEnabled"
            type="checkbox"
            name="inAppEnabled"
            value="true"
            defaultChecked={preference.in_app_enabled}
          />
          <span>
            <strong>In-app reminders</strong>
            <small>Show scheduled and due reminders in your private workspace.</small>
          </span>
        </label>
        <label
          htmlFor="emailEnabled"
          aria-label="Email reminders"
          className={!emailAvailable ? "disabled" : ""}
        >
          <input
            id="emailEnabled"
            type="checkbox"
            name="emailEnabled"
            value="true"
            defaultChecked={preference.email_enabled && emailAvailable}
            disabled={!emailAvailable}
          />
          <span>
            <strong>Email reminders</strong>
            <small>
              {emailAvailable
                ? "Send to your verified account email."
                : "Unavailable until the site operator connects an email provider and scheduler."}
            </small>
          </span>
        </label>
      </fieldset>

      <fieldset>
        <legend>Timing</legend>
        <label
          htmlFor="prep3DaysEnabled"
          aria-label="Preparation reminder three days before"
        >
          <input
            id="prep3DaysEnabled"
            type="checkbox"
            name="prep3DaysEnabled"
            value="true"
            defaultChecked={preference.prep_3_days_enabled}
          />
          <span>
            <strong>Preparation · 3 days before</strong>
            <small>A quiet cue to open the focused preparation plan.</small>
          </span>
        </label>
        <label
          htmlFor="interview1DayEnabled"
          aria-label="Interview reminder one day before"
        >
          <input
            id="interview1DayEnabled"
            type="checkbox"
            name="interview1DayEnabled"
            value="true"
            defaultChecked={preference.interview_1_day_enabled}
          />
          <span>
            <strong>Interview · 1 day before</strong>
            <small>Confirm the schedule, timezone, and meeting details.</small>
          </span>
        </label>
        <label
          htmlFor="interview1HourEnabled"
          aria-label="Interview reminder one hour before"
        >
          <input
            id="interview1HourEnabled"
            type="checkbox"
            name="interview1HourEnabled"
            value="true"
            defaultChecked={preference.interview_1_hour_enabled}
          />
          <span>
            <strong>Interview · 1 hour before</strong>
            <small>One final schedule cue—not an extra preparation prompt.</small>
          </span>
        </label>
      </fieldset>

      <p
        className={`form-status ${displayState.status}`}
        role="status"
        aria-live="polite"
        aria-atomic="true"
      >
        {displayState.message}
        {!pending && state.conflict && (
          <>
            <br />
            <Link
              href="/settings/interviews"
              target="_blank"
              rel="noopener noreferrer"
            >
              Review latest in a new tab
            </Link>
          </>
        )}
      </p>
      <button className="button" type="submit" aria-disabled={pending}>
        {pending ? "Saving…" : "Save reminder settings"}
      </button>
    </form>
  );
}
