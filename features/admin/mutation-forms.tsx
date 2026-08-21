"use client";

import { useActionState } from "react";
import { LoaderCircle } from "lucide-react";
import { EXPERIENCE_MODERATION_STATUSES, FEEDBACK_STATUSES, feedbackStatusLabel } from "@/lib/feedback/model";
import { initialAdminMutationState, moderateInterviewExperienceAction, updateFeedbackAction } from "./actions";

export function FeedbackTriageForm({ feedbackId, currentStatus, note }: { feedbackId: string; currentStatus: string; note: string | null }) {
  const [state, action, pending] = useActionState(updateFeedbackAction, initialAdminMutationState);
  return <form action={action} className="admin-mutation-form"><input type="hidden" name="feedback_id" value={feedbackId} /><label>Status<select name="status" defaultValue={currentStatus}>{FEEDBACK_STATUSES.map((status) => <option value={status} key={status}>{feedbackStatusLabel(status)}</option>)}</select></label><label>Private operator note <span>Optional</span><textarea name="admin_note" maxLength={2000} rows={5} defaultValue={note ?? ""} /></label>{state.message && <p className={state.status === "error" ? "form-error" : "form-success"} role={state.status === "error" ? "alert" : "status"}>{state.message}</p>}<button type="submit" className="button" disabled={pending}>{pending ? <><LoaderCircle size={15} className="spin" />Saving…</> : "Save triage"}</button></form>;
}

export function ExperienceModerationForm({ experienceId }: { experienceId: string }) {
  const [state, action, pending] = useActionState(moderateInterviewExperienceAction, initialAdminMutationState);
  return <form action={action} className="admin-mutation-form"><input type="hidden" name="experience_id" value={experienceId} /><label>Moderation decision<select name="status" defaultValue=""><option value="" disabled>Choose a decision</option>{EXPERIENCE_MODERATION_STATUSES.map((status) => <option value={status} key={status}>{feedbackStatusLabel(status)}</option>)}</select></label><label>Private contributor note <span>Optional</span><textarea name="moderation_note" maxLength={1000} rows={4} placeholder="Explain the moderation decision without rewriting the contributor’s report." /></label>{state.message && <p className={state.status === "error" ? "form-error" : "form-success"} role={state.status === "error" ? "alert" : "status"}>{state.message}</p>}<button type="submit" className="button" disabled={pending}>{pending ? <><LoaderCircle size={15} className="spin" />Saving…</> : "Record decision"}</button></form>;
}
