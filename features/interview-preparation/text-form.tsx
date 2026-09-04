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
  PREPARATION_TEXT_EXPECTED_REVISION_FIELD,
  preparationTextDraftSignature,
  resolvePreparationTextDisplayState,
  type PreparationTextDisplayState,
} from "@/lib/interview-preparation/text-action-input";
import type { PreparationActionState } from "./actions";

type PreparationTextAction = (
  state: PreparationActionState,
  formData: FormData,
) => Promise<PreparationActionState>;

function PreparationTextStatus({
  displayState,
  conflict,
  pending,
  latestHref,
}: {
  displayState: PreparationTextDisplayState;
  conflict: boolean;
  pending: boolean;
  latestHref: string;
}) {
  return (
    <p
      className={displayState.status}
      role={displayState.status === "error" ? "alert" : "status"}
      aria-live={displayState.status === "error" ? "assertive" : "polite"}
      aria-atomic="true"
    >
      {displayState.message}
      {!pending && conflict && (
        <>
          <br />
          <Link href={latestHref} target="_blank" rel="noopener noreferrer">
            Review latest in a new tab
          </Link>
        </>
      )}
    </p>
  );
}

export function PreparationNotesForm({
  action,
  value,
  revision,
  latestHref,
}: {
  action: PreparationTextAction;
  value: string;
  revision: string;
  latestHref: string;
}) {
  const [state, formAction, pending] = useActionState(action, {
    status: "idle",
    message: "",
    revision,
  } satisfies PreparationActionState);
  const [changedSinceSubmit, setChangedSinceSubmit] = useState(false);
  const submissionPending = useRef(false);
  const submittedDraftSignature = useRef<string | null>(null);

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

  const updateChangedSinceSubmit = (form: HTMLFormElement) => {
    if (submittedDraftSignature.current === null) return;
    setChangedSinceSubmit(
      preparationTextDraftSignature(new FormData(form), "notes") !==
        submittedDraftSignature.current,
    );
  };
  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (submissionPending.current) return;
    submissionPending.current = true;
    const formData = new FormData(event.currentTarget);
    submittedDraftSignature.current = preparationTextDraftSignature(
      formData,
      "notes",
    );
    setChangedSinceSubmit(false);
    startTransition(() => formAction(formData));
  };
  const displayState = resolvePreparationTextDisplayState(
    state,
    pending,
    changedSinceSubmit,
    "notes",
  );

  return (
    <form
      action={formAction}
      onSubmit={submit}
      onChange={(event) => updateChangedSinceSubmit(event.currentTarget)}
      className="prep-notes-form"
      aria-busy={pending}
    >
      <input
        type="hidden"
        name={PREPARATION_TEXT_EXPECTED_REVISION_FIELD}
        value={state.revision ?? revision}
      />
      <label htmlFor="prep-private-notes">Private notes</label>
      <textarea
        id="prep-private-notes"
        name="private_notes"
        rows={6}
        maxLength={12000}
        defaultValue={value}
        placeholder="Capture reminders, questions, and details for this round."
      />
      <div>
        <PreparationTextStatus
          displayState={displayState}
          conflict={Boolean(state.conflict)}
          pending={pending}
          latestHref={latestHref}
        />
        <button
          className="button button-secondary button-sm"
          type="submit"
          aria-disabled={pending}
        >
          {pending ? "Saving…" : "Save notes"}
        </button>
      </div>
    </form>
  );
}

export function PreparationReflectionForm({
  action,
  values,
  revision,
  latestHref,
}: {
  action: PreparationTextAction;
  values: {
    topicsAsked: string;
    wentWell: string;
    needsImprovement: string;
    followUpNotes: string;
  };
  revision: string;
  latestHref: string;
}) {
  const [state, formAction, pending] = useActionState(action, {
    status: "idle",
    message: "",
    revision,
  } satisfies PreparationActionState);
  const [changedSinceSubmit, setChangedSinceSubmit] = useState(false);
  const submissionPending = useRef(false);
  const submittedDraftSignature = useRef<string | null>(null);

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

  const updateChangedSinceSubmit = (form: HTMLFormElement) => {
    if (submittedDraftSignature.current === null) return;
    setChangedSinceSubmit(
      preparationTextDraftSignature(new FormData(form), "reflection") !==
        submittedDraftSignature.current,
    );
  };
  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (submissionPending.current) return;
    submissionPending.current = true;
    const formData = new FormData(event.currentTarget);
    submittedDraftSignature.current = preparationTextDraftSignature(
      formData,
      "reflection",
    );
    setChangedSinceSubmit(false);
    startTransition(() => formAction(formData));
  };
  const displayState = resolvePreparationTextDisplayState(
    state,
    pending,
    changedSinceSubmit,
    "reflection",
  );

  return (
    <form
      action={formAction}
      onSubmit={submit}
      onChange={(event) => updateChangedSinceSubmit(event.currentTarget)}
      className="prep-reflection-form"
      aria-busy={pending}
    >
      <input
        type="hidden"
        name={PREPARATION_TEXT_EXPECTED_REVISION_FIELD}
        value={state.revision ?? revision}
      />
      <div>
        <label htmlFor="topics-asked">Topics asked</label>
        <textarea id="topics-asked" name="topics_asked" rows={3} maxLength={8000} defaultValue={values.topicsAsked} />
      </div>
      <div>
        <label htmlFor="went-well">What went well</label>
        <textarea id="went-well" name="went_well" rows={3} maxLength={8000} defaultValue={values.wentWell} />
      </div>
      <div>
        <label htmlFor="needs-improvement">What to improve</label>
        <textarea id="needs-improvement" name="needs_improvement" rows={3} maxLength={8000} defaultValue={values.needsImprovement} />
      </div>
      <div>
        <label htmlFor="follow-up-notes">Follow-up notes</label>
        <textarea id="follow-up-notes" name="follow_up_notes" rows={3} maxLength={8000} defaultValue={values.followUpNotes} />
      </div>
      <footer>
        <PreparationTextStatus
          displayState={displayState}
          conflict={Boolean(state.conflict)}
          pending={pending}
          latestHref={latestHref}
        />
        <button className="button" type="submit" aria-disabled={pending}>
          {pending ? "Saving…" : "Save reflection"}
        </button>
      </footer>
    </form>
  );
}
