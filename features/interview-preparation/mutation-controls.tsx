"use client";

import { useActionState, useState } from "react";
import { Check, Circle, Plus } from "lucide-react";
import type { PreparationActionState } from "./actions";

const initialState: PreparationActionState = { status: "idle", message: "" };
type MutationAction = (state: PreparationActionState, formData: FormData) => Promise<PreparationActionState>;

function MutationStatus({ state, pending, pendingMessage }: { state: PreparationActionState; pending: boolean; pendingMessage: string }) {
  const message = pending ? pendingMessage : state.message;
  if (!message) return null;
  return <p className={`prep-mutation-status ${pending ? "pending" : state.status}`} role={state.status === "error" ? "alert" : "status"} aria-live="polite">{message}</p>;
}

export function PreparationChecklistControl({ action, complete, label }: { action: MutationAction; complete: boolean; label: string }) {
  const [state, formAction, pending] = useActionState(action, initialState);
  return <form action={formAction} className="prep-mutation-form"><button aria-pressed={complete} aria-busy={pending} disabled={pending}>{complete ? <Check size={15} /> : <Circle size={15} />}<span>{label}</span></button><MutationStatus state={state} pending={pending} pendingMessage="Saving checklist…" /></form>;
}

export function PreparationTaskControl({ action, complete, label }: { action: MutationAction; complete: boolean; label: string }) {
  const [state, formAction, pending] = useActionState(action, initialState);
  return <form action={formAction} className="prep-mutation-form"><button aria-pressed={complete} aria-busy={pending} disabled={pending}>{complete ? <Check size={15} /> : <Circle size={15} />}<span>{label}</span></button><MutationStatus state={state} pending={pending} pendingMessage="Saving task…" /></form>;
}

export function PreparationTaskDeleteControl({ action }: { action: MutationAction }) {
  const [confirming, setConfirming] = useState(false);
  const [state, formAction, pending] = useActionState(action, initialState);
  if (!confirming) return <button className="tracker-danger-link" type="button" onClick={() => setConfirming(true)}>Remove</button>;
  return <div className="tracker-confirm prep-task-confirm" role="group" aria-label="Remove task confirmation"><span>Are you sure?</span><form action={formAction}><button className="button button-danger button-sm" type="submit" disabled={pending}>{pending ? "Removing…" : "Remove task"}</button></form><button className="button button-secondary button-sm" type="button" onClick={() => setConfirming(false)} disabled={pending}>Cancel</button><MutationStatus state={state} pending={pending} pendingMessage="Removing task…" /></div>;
}

export function PreparationAddTaskForm({ action }: { action: MutationAction }) {
  const [state, formAction, pending] = useActionState(action, initialState);
  return <form className="prep-add-task" action={formAction}><label htmlFor="custom-prep-task">Add a private task</label><div><input id="custom-prep-task" name="title" maxLength={160} required placeholder="e.g. Test the meeting link" disabled={pending} /><button className="button button-secondary button-sm" aria-label="Add task" disabled={pending}><Plus size={15} /></button></div><MutationStatus state={state} pending={pending} pendingMessage="Adding task…" /></form>;
}
