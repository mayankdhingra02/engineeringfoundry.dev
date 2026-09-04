"use client";

import Link from "next/link";
import {
  startTransition,
  useActionState,
  useEffect,
  useRef,
  useState,
  type FormEvent,
  type KeyboardEvent,
} from "react";
import { Check, Circle, Plus } from "lucide-react";
import type { PreparationActionState } from "./actions";

const initialState: PreparationActionState = { status: "idle", message: "" };
type MutationAction = (state: PreparationActionState, formData: FormData) => Promise<PreparationActionState>;

function MutationStatus({ state, pending, pendingMessage, latestHref }: { state: PreparationActionState; pending: boolean; pendingMessage: string; latestHref?: string }) {
  const message = pending ? pendingMessage : state.message;
  if (!message) return null;
  const failed = !pending && state.status === "error";
  return <p className={`prep-mutation-status ${pending ? "pending" : state.status}`} role={failed ? "alert" : "status"} aria-live={failed ? "assertive" : "polite"} aria-atomic="true">{message}{failed && state.conflict && latestHref && <><br /><Link href={latestHref} target="_blank" rel="noopener noreferrer">Review latest in a new tab</Link></>}</p>;
}

export function PreparationChecklistControl({ action, complete, label }: { action: MutationAction; complete: boolean; label: string }) {
  const [state, formAction, pending] = useActionState(action, initialState);
  return <form action={formAction} className="prep-mutation-form"><button aria-pressed={complete} aria-busy={pending} disabled={pending}>{complete ? <Check size={15} /> : <Circle size={15} />}<span>{label}</span></button><MutationStatus state={state} pending={pending} pendingMessage="Saving checklist…" /></form>;
}

export function PreparationTaskControl({ action, complete, label }: { action: MutationAction; complete: boolean; label: string }) {
  const [state, formAction, pending] = useActionState(action, initialState);
  return <form action={formAction} className="prep-mutation-form"><button aria-pressed={complete} aria-busy={pending} disabled={pending}>{complete ? <Check size={15} /> : <Circle size={15} />}<span>{label}</span></button><MutationStatus state={state} pending={pending} pendingMessage="Saving task…" /></form>;
}

export function PreparationTaskDeleteControl({ action, latestHref }: { action: MutationAction; latestHref: string }) {
  const [confirming, setConfirming] = useState(false);
  const [state, formAction, pending] = useActionState(action, initialState);
  const submissionPending = useRef(false);
  const confirmButtonRef = useRef<HTMLButtonElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const restoreTriggerFocus = useRef(false);

  useEffect(() => {
    if (!pending) submissionPending.current = false;
  }, [pending]);
  useEffect(() => () => {
    submissionPending.current = false;
  }, []);
  useEffect(() => {
    if (confirming) {
      confirmButtonRef.current?.focus();
    } else if (restoreTriggerFocus.current) {
      restoreTriggerFocus.current = false;
      triggerRef.current?.focus();
    }
  }, [confirming]);

  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (submissionPending.current) return;
    submissionPending.current = true;
    const formData = new FormData(event.currentTarget);
    startTransition(() => formAction(formData));
  };
  const cancel = () => {
    if (submissionPending.current) return;
    restoreTriggerFocus.current = true;
    setConfirming(false);
  };
  const handleKeyDown = (event: KeyboardEvent<HTMLButtonElement>) => {
    if (event.key !== "Escape") return;
    event.preventDefault();
    cancel();
  };

  if (!confirming) return <button ref={triggerRef} className="tracker-danger-link" type="button" onClick={() => setConfirming(true)}>Remove</button>;
  return <div className="tracker-confirm prep-task-confirm" role="group" aria-label="Remove task confirmation"><span>Are you sure?</span><form action={formAction} onSubmit={submit} aria-busy={pending}><button ref={confirmButtonRef} className="button button-danger button-sm" type="submit" aria-disabled={pending} onKeyDown={handleKeyDown}>{pending ? "Removing…" : "Remove task"}</button></form><button className="button button-secondary button-sm" type="button" onClick={cancel} onKeyDown={handleKeyDown} aria-disabled={pending}>Cancel</button><MutationStatus state={state} pending={pending} pendingMessage="Removing task…" latestHref={latestHref} /></div>;
}

export function PreparationAddTaskForm({ action }: { action: MutationAction }) {
  const [state, formAction, pending] = useActionState(action, initialState);
  return <form className="prep-add-task" action={formAction}><label htmlFor="custom-prep-task">Add a private task</label><div><input id="custom-prep-task" name="title" maxLength={160} required placeholder="e.g. Test the meeting link" disabled={pending} /><button className="button button-secondary button-sm" aria-label="Add task" disabled={pending}><Plus size={15} /></button></div><MutationStatus state={state} pending={pending} pendingMessage="Adding task…" /></form>;
}
