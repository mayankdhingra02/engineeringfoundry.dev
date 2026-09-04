"use client";

import Link from "next/link";
import { LoaderCircle } from "lucide-react";
import { startTransition, useActionState, useEffect, useRef, type FormEvent } from "react";
import type { Application } from "@/lib/supabase/database.types";
import { TRACKER_EDIT_REVISION_FIELD } from "@/lib/applications/edit-revision";
import { APPLICATION_SOURCES, APPLICATION_STATUSES, ROLE_LEVELS, TRACKER_COMPANIES } from "@/lib/applications/options";
import type { TrackerActionState } from "./actions";

type ApplicationFormAction = (state: TrackerActionState, formData: FormData) => Promise<TrackerActionState>;
const initialTrackerState: TrackerActionState = { status: "idle", message: "" };

function errorProps(state: TrackerActionState, name: string) {
  const message = state.fieldErrors?.[name];
  return { "aria-invalid": Boolean(message), "aria-describedby": message ? `${name}-error` : undefined } as const;
}

function FieldError({ state, name }: { state: TrackerActionState; name: string }) {
  const message = state.fieldErrors?.[name];
  return message ? <small className="field-error" id={`${name}-error`}>{message}</small> : null;
}

export function ApplicationForm({ action, application }: { action: ApplicationFormAction; application?: Application }) {
  const [state, formAction, pending] = useActionState(action, initialTrackerState);
  const editSubmissionPending = useRef(false);
  const cancelHref = application ? `/applications/${application.id}` : "/applications";

  useEffect(() => {
    if (!pending) editSubmissionPending.current = false;
  }, [pending]);

  useEffect(() => () => {
    editSubmissionPending.current = false;
  }, []);

  const submitEdit = (event: FormEvent<HTMLFormElement>) => {
    if (!application) return;
    event.preventDefault();
    if (editSubmissionPending.current) return;
    editSubmissionPending.current = true;
    const formData = new FormData(event.currentTarget);
    startTransition(() => formAction(formData));
  };

  return <form action={formAction} onSubmit={application ? submitEdit : undefined} className="tracker-form form-shell">
    {application && <input type="hidden" name={TRACKER_EDIT_REVISION_FIELD} value={application.updated_at} />}
    <div className="tracker-form-section"><div><h2>Company and role</h2><p>Start with the essentials. You can update every field later.</p></div><div className="form-grid">
      <div className="form-group"><label htmlFor="company-name">Company <span>Required</span></label><input id="company-name" name="company_name" list="tracker-companies" required maxLength={120} defaultValue={application?.company_name ?? ""} {...errorProps(state, "company_name")} /><datalist id="tracker-companies">{TRACKER_COMPANIES.map((company) => <option key={company} value={company} />)}</datalist><FieldError state={state} name="company_name" /></div>
      <div className="form-group"><label htmlFor="role-title">Role title <span>Required</span></label><input id="role-title" name="role_title" required maxLength={120} defaultValue={application?.role_title ?? ""} {...errorProps(state, "role_title")} /><FieldError state={state} name="role_title" /></div>
      <div className="form-group"><label htmlFor="role-level">Role level <span>Optional</span></label><input id="role-level" name="role_level" list="role-levels" maxLength={80} defaultValue={application?.role_level ?? ""} {...errorProps(state, "role_level")} /><datalist id="role-levels">{ROLE_LEVELS.map((level) => <option key={level} value={level} />)}</datalist><FieldError state={state} name="role_level" /></div>
      <div className="form-group"><label htmlFor="application-status">Status</label><select id="application-status" name="status" defaultValue={application?.status ?? "Applied"} {...errorProps(state, "status")}>{APPLICATION_STATUSES.map((status) => <option key={status}>{status}</option>)}</select><FieldError state={state} name="status" /></div>
      <div className="form-group"><label htmlFor="application-date">Application date <span>Optional</span></label><input id="application-date" name="application_date" type="date" defaultValue={application?.application_date ?? ""} {...errorProps(state, "application_date")} /><FieldError state={state} name="application_date" /></div>
      <div className="form-group"><label htmlFor="application-location">Location <span>Optional</span></label><input id="application-location" name="location" maxLength={160} placeholder="Remote, Chicago, London…" defaultValue={application?.location ?? ""} {...errorProps(state, "location")} /><FieldError state={state} name="location" /></div>
    </div></div>
    <details className="tracker-form-optional" open={Boolean(application?.job_url || application?.source || application?.recruiter_name || application?.notes)}><summary>Job, recruiter, and private notes <span>Optional</span></summary><div className="form-grid">
      <div className="form-group"><label htmlFor="job-url">Job posting URL</label><input id="job-url" name="job_url" type="url" placeholder="https://…" defaultValue={application?.job_url ?? ""} {...errorProps(state, "job_url")} /><FieldError state={state} name="job_url" /></div>
      <div className="form-group"><label htmlFor="application-source">Application source</label><input id="application-source" name="source" list="application-sources" maxLength={100} defaultValue={application?.source ?? ""} {...errorProps(state, "source")} /><datalist id="application-sources">{APPLICATION_SOURCES.map((source) => <option key={source} value={source} />)}</datalist><FieldError state={state} name="source" /></div>
      <div className="form-group"><label htmlFor="recruiter-name">Recruiter name</label><input id="recruiter-name" name="recruiter_name" maxLength={120} defaultValue={application?.recruiter_name ?? ""} {...errorProps(state, "recruiter_name")} /><FieldError state={state} name="recruiter_name" /></div>
      <div className="form-group"><label htmlFor="recruiter-email">Recruiter email</label><input id="recruiter-email" name="recruiter_email" type="email" maxLength={254} defaultValue={application?.recruiter_email ?? ""} {...errorProps(state, "recruiter_email")} /><FieldError state={state} name="recruiter_email" /></div>
      <div className="form-group full"><label htmlFor="application-notes">Private notes <span>10,000 characters</span></label><textarea id="application-notes" name="notes" maxLength={10000} rows={7} defaultValue={application?.notes ?? ""} placeholder="Contacts, preparation context, follow-ups…" {...errorProps(state, "notes")} /><FieldError state={state} name="notes" /></div>
    </div></details>
    {state.message && <p className="form-error" role="alert" aria-atomic="true">{state.message}{state.conflict && application && <><br /><Link href={`/applications/${application.id}/edit`} target="_blank" rel="noopener noreferrer">Review latest in a new tab</Link></>}</p>}
    <div className="tracker-form-actions"><button className="button" type="submit" disabled={pending}>{pending ? <><LoaderCircle className="spin" size={16} />Saving…</> : application ? "Save application" : "Add application"}</button><Link className="button button-secondary" href={cancelHref}>Cancel</Link></div>
  </form>;
}
