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
import type { TrackerActionState } from "./actions";

type RevisionDeleteAction = (
  state: TrackerActionState,
  formData: FormData,
) => Promise<TrackerActionState>;

const initialState: TrackerActionState = { status: "idle", message: "" };

function RevisionConfirmForm({
  action,
  confirmLabel,
  label,
  latestHref,
  onCancel,
}: {
  action: RevisionDeleteAction;
  confirmLabel: string;
  label: string;
  latestHref: string;
  onCancel: () => void;
}) {
  const [state, formAction, pending] = useActionState(action, initialState);
  const submissionPending = useRef(false);
  const confirmButtonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => confirmButtonRef.current?.focus(), []);
  useEffect(() => {
    if (!pending) submissionPending.current = false;
  }, [pending]);
  useEffect(() => () => {
    submissionPending.current = false;
  }, []);

  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (submissionPending.current) return;
    submissionPending.current = true;
    const formData = new FormData(event.currentTarget);
    startTransition(() => formAction(formData));
  };

  const cancel = () => {
    if (!submissionPending.current) onCancel();
  };
  const handleKeyDown = (event: KeyboardEvent<HTMLButtonElement>) => {
    if (event.key !== "Escape") return;
    event.preventDefault();
    cancel();
  };

  return <div className="tracker-confirm" role="group" aria-label={`${label} confirmation`}>
    <span>Are you sure?</span>
    <form action={formAction} onSubmit={submit} aria-busy={pending}>
      <button ref={confirmButtonRef} className="button button-danger button-sm" type="submit" aria-disabled={pending} onKeyDown={handleKeyDown}>{pending ? "Deleting…" : confirmLabel}</button>
    </form>
    <button className="button button-secondary button-sm" type="button" aria-disabled={pending} onClick={cancel} onKeyDown={handleKeyDown}>Cancel</button>
    {state.message && <p className="form-error" role="alert" aria-live="assertive" aria-atomic="true">{state.message}{state.conflict && <><br /><Link href={latestHref} target="_blank" rel="noopener noreferrer">Review latest in a new tab</Link></>}</p>}
  </div>;
}

export function RevisionConfirmAction({
  action,
  label,
  confirmLabel = "Confirm delete",
  latestHref,
}: {
  action: RevisionDeleteAction;
  label: string;
  confirmLabel?: string;
  latestHref: string;
}) {
  const [confirming, setConfirming] = useState(false);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const restoreTriggerFocus = useRef(false);

  useEffect(() => {
    if (!confirming && restoreTriggerFocus.current) {
      restoreTriggerFocus.current = false;
      triggerRef.current?.focus();
    }
  }, [confirming]);

  if (!confirming) {
    return <button ref={triggerRef} className="tracker-danger-link" type="button" onClick={() => setConfirming(true)}>{label}</button>;
  }
  return <RevisionConfirmForm action={action} confirmLabel={confirmLabel} label={label} latestHref={latestHref} onCancel={() => {
    restoreTriggerFocus.current = true;
    setConfirming(false);
  }} />;
}
