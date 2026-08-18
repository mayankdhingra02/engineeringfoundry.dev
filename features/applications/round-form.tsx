"use client";

import Link from "next/link";
import { LoaderCircle } from "lucide-react";
import { useActionState, useState } from "react";
import type { InterviewRound } from "@/lib/supabase/database.types";
import { ROUND_RESULTS, ROUND_STATUSES, ROUND_TYPES } from "@/lib/applications/options";
import { toLocalDateTimeValue } from "@/lib/applications/format";
import type { TrackerActionState } from "./actions";

type RoundFormAction = (state: TrackerActionState, formData: FormData) => Promise<TrackerActionState>;
const initialTrackerState: TrackerActionState = { status: "idle", message: "" };
const COMMON_TIMEZONES = ["America/New_York", "America/Chicago", "America/Denver", "America/Los_Angeles", "America/Toronto", "Europe/London", "Europe/Berlin", "Asia/Kolkata", "Asia/Singapore", "Asia/Tokyo", "Australia/Sydney"];

export function RoundForm({ action, applicationId, round }: { action: RoundFormAction; applicationId: string; round?: InterviewRound }) {
  const [state, formAction, pending] = useActionState(action, initialTrackerState);
  const [timezone, setTimezone] = useState(round?.timezone ?? "");
  const detectTimezone = () => { if (!timezone) setTimezone(Intl.DateTimeFormat().resolvedOptions().timeZone); };
  const error = (name: string) => state.fieldErrors?.[name];
  const errorProps = (name: string) => ({
    "aria-invalid": Boolean(error(name)),
    "aria-describedby": error(name) ? `${name}-error` : undefined,
  });
  const fieldError = (name: string) => error(name) ? <small className="field-error" id={`${name}-error`}>{error(name)}</small> : null;
  return <form action={formAction} className="tracker-form form-shell">
    <div className="tracker-form-section"><div><h2>Round details</h2><p>Rounds can be created before the company confirms a schedule.</p></div><div className="form-grid">
      <div className="form-group"><label htmlFor="round-name">Round name <span>Required</span></label><input id="round-name" name="round_name" required maxLength={120} defaultValue={round?.round_name ?? ""} {...errorProps("round_name")} />{fieldError("round_name")}</div>
      <div className="form-group"><label htmlFor="round-type">Round type <span>Required · custom allowed</span></label><input id="round-type" name="round_type" list="round-types" required maxLength={100} defaultValue={round?.round_type ?? ""} {...errorProps("round_type")} /><datalist id="round-types">{ROUND_TYPES.map((type) => <option key={type} value={type} />)}</datalist>{fieldError("round_type")}</div>
      <div className="form-group"><label htmlFor="scheduled-local">Date and time <span>Optional</span></label><input id="scheduled-local" name="scheduled_local" type="datetime-local" defaultValue={toLocalDateTimeValue(round?.scheduled_at ?? null, round?.timezone)} onFocus={detectTimezone} {...errorProps("scheduled_local")} />{fieldError("scheduled_local")}</div>
      <div className="form-group"><label htmlFor="round-timezone">Timezone <span>IANA name</span></label><input id="round-timezone" name="timezone" list="timezones" value={timezone} maxLength={100} onChange={(event) => setTimezone(event.target.value)} {...errorProps("timezone")} /><datalist id="timezones">{COMMON_TIMEZONES.map((zone) => <option key={zone} value={zone} />)}</datalist>{fieldError("timezone")}</div>
      <div className="form-group"><label htmlFor="duration-minutes">Duration <span>Minutes</span></label><input id="duration-minutes" name="duration_minutes" type="number" min={5} max={1440} step={5} defaultValue={round?.duration_minutes ?? ""} {...errorProps("duration_minutes")} />{fieldError("duration_minutes")}</div>
      <div className="form-group"><label htmlFor="round-status">Status</label><select id="round-status" name="status" defaultValue={round?.status ?? (round?.scheduled_at ? "Scheduled" : "Planned")}>{ROUND_STATUSES.map((status) => <option key={status}>{status}</option>)}</select></div>
      <div className="form-group"><label htmlFor="round-result">Result</label><select id="round-result" name="result" defaultValue={round?.result ?? "Pending"}>{ROUND_RESULTS.map((result) => <option key={result}>{result}</option>)}</select></div>
    </div></div>
    <details className="tracker-form-optional" open={Boolean(round?.interviewer_name || round?.meeting_link || round?.notes)}><summary>Interviewer, location, and notes <span>Optional</span></summary><div className="form-grid">
      <div className="form-group"><label htmlFor="interviewer-name">Interviewer name</label><input id="interviewer-name" name="interviewer_name" maxLength={120} defaultValue={round?.interviewer_name ?? ""} /></div>
      <div className="form-group"><label htmlFor="interviewer-role">Interviewer role</label><input id="interviewer-role" name="interviewer_role" maxLength={120} defaultValue={round?.interviewer_role ?? ""} /></div>
      <div className="form-group"><label htmlFor="meeting-link">Meeting link</label><input id="meeting-link" name="meeting_link" type="url" placeholder="https://…" defaultValue={round?.meeting_link ?? ""} {...errorProps("meeting_link")} />{fieldError("meeting_link")}</div>
      <div className="form-group"><label htmlFor="round-location">Location</label><input id="round-location" name="location" maxLength={200} defaultValue={round?.location ?? ""} /></div>
      <div className="form-group full"><label htmlFor="round-notes">Private round notes</label><textarea id="round-notes" name="notes" maxLength={10000} rows={7} defaultValue={round?.notes ?? ""} /></div>
    </div></details>
    {state.message && <p className="form-error" role="alert">{state.message}</p>}
    <div className="tracker-form-actions"><button className="button" disabled={pending} type="submit">{pending ? <><LoaderCircle className="spin" size={16} />Saving…</> : round ? "Save round" : "Add interview round"}</button><Link className="button button-secondary" href={`/applications/${applicationId}`}>Cancel</Link></div>
  </form>;
}
