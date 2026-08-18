"use client";

import { useActionState } from "react";
import type { PreparationActionState } from "./actions";

const initialState: PreparationActionState = { status: "idle", message: "" };

export function PreparationNotesForm({ action, value }: { action: (state: PreparationActionState, formData: FormData) => Promise<PreparationActionState>; value: string }) {
  const [state, formAction, pending] = useActionState(action, initialState);
  return <form action={formAction} className="prep-notes-form"><label htmlFor="prep-private-notes">Private notes</label><textarea id="prep-private-notes" name="private_notes" rows={6} maxLength={12000} defaultValue={value} placeholder="Capture reminders, questions, and details for this round." /><div><p className={state.status} role="status">{state.message}</p><button className="button button-secondary button-sm" disabled={pending}>{pending ? "Saving…" : "Save notes"}</button></div></form>;
}

export function PreparationReflectionForm({ action, values }: { action: (state: PreparationActionState, formData: FormData) => Promise<PreparationActionState>; values: { topicsAsked: string; wentWell: string; needsImprovement: string; followUpNotes: string } }) {
  const [state, formAction, pending] = useActionState(action, initialState);
  return <form action={formAction} className="prep-reflection-form"><div><label htmlFor="topics-asked">Topics asked</label><textarea id="topics-asked" name="topics_asked" rows={3} maxLength={8000} defaultValue={values.topicsAsked} /></div><div><label htmlFor="went-well">What went well</label><textarea id="went-well" name="went_well" rows={3} maxLength={8000} defaultValue={values.wentWell} /></div><div><label htmlFor="needs-improvement">What to improve</label><textarea id="needs-improvement" name="needs_improvement" rows={3} maxLength={8000} defaultValue={values.needsImprovement} /></div><div><label htmlFor="follow-up-notes">Follow-up notes</label><textarea id="follow-up-notes" name="follow_up_notes" rows={3} maxLength={8000} defaultValue={values.followUpNotes} /></div><footer><p className={state.status} role="status">{state.message}</p><button className="button" disabled={pending}>{pending ? "Saving…" : "Save reflection"}</button></footer></form>;
}
