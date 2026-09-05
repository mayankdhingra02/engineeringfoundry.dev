"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { LoaderCircle } from "lucide-react";
import {
  startTransition,
  useActionState,
  useEffect,
  useRef,
  useState,
  useTransition,
  type FormEvent,
} from "react";
import {
  EXPERIENCE_ARCHIVE_STATUS,
  EXPERIENCE_MODERATION_STATUSES,
  FEEDBACK_STATUSES,
  feedbackStatusLabel,
} from "@/lib/feedback/model";
import {
  ADMIN_FEEDBACK_EXPECTED_REVISION_FIELD,
  adminFeedbackTriageDraftSignature,
  resolveAdminFeedbackTriageDisplayState,
} from "@/lib/admin/feedback-triage-action-input";
import {
  INTERVIEW_EXPERIENCE_EXPECTED_REVISION_FIELD,
  resolveInterviewExperienceDisplayState,
} from "@/lib/interview-experiences/action-input";
import {
  moderateInterviewExperienceAction,
  updateFeedbackAction,
  type AdminMutationState,
} from "./actions";

export function FeedbackTriageForm({
  feedbackId,
  currentStatus,
  note,
  revision,
}: {
  feedbackId: string;
  currentStatus: string;
  note: string | null;
  revision: string;
}) {
  const [state, action, pending] = useActionState(
    updateFeedbackAction,
    {
      status: "idle",
      message: "",
      revision,
    } satisfies AdminMutationState,
  );
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

  const updateChangedSinceSubmit = (form: HTMLFormElement | null) => {
    if (!form || submittedDraftSignature.current === null) return;
    setChangedSinceSubmit(
      adminFeedbackTriageDraftSignature(new FormData(form)) !==
        submittedDraftSignature.current,
    );
  };

  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (submissionPending.current) return;
    submissionPending.current = true;
    const formData = new FormData(event.currentTarget);
    submittedDraftSignature.current = adminFeedbackTriageDraftSignature(formData);
    setChangedSinceSubmit(false);
    startTransition(() => action(formData));
  };

  const displayState = resolveAdminFeedbackTriageDisplayState(
    state,
    pending,
    changedSinceSubmit,
  );

  return (
    <form
      action={action}
      className="admin-mutation-form"
      onSubmit={submit}
      onChange={(event) => updateChangedSinceSubmit(event.currentTarget)}
      aria-busy={pending}
    >
      <input type="hidden" name="feedback_id" value={feedbackId} />
      <input
        type="hidden"
        name={ADMIN_FEEDBACK_EXPECTED_REVISION_FIELD}
        value={state.revision ?? revision}
      />
      <label>
        Status
        <select name="status" defaultValue={currentStatus}>
          {FEEDBACK_STATUSES.map((status) => (
            <option value={status} key={status}>
              {feedbackStatusLabel(status)}
            </option>
          ))}
        </select>
      </label>
      <label>
        Private operator note <span>Optional</span>
        <textarea
          name="admin_note"
          maxLength={2000}
          rows={5}
          defaultValue={note ?? ""}
        />
      </label>
      {(pending || displayState.message) && (
        <p
          className={displayState.status === "error" ? "form-error" : "form-success"}
          role={displayState.status === "error" ? "alert" : "status"}
          aria-live={displayState.status === "error" ? "assertive" : "polite"}
          aria-atomic="true"
        >
          {displayState.message}
          {!pending && state.conflict && (
            <>
              <br />
              <Link
                href={`/admin/feedback/${feedbackId}`}
                target="_blank"
                rel="noopener noreferrer"
              >
                Review latest in a new tab
              </Link>
            </>
          )}
        </p>
      )}
      <button type="submit" className="button" aria-disabled={pending}>
        {pending ? (
          <>
            <LoaderCircle size={15} className="spin" />Saving…
          </>
        ) : (
          "Save triage"
        )}
      </button>
    </form>
  );
}

function moderationDraftSignature(formData: FormData) {
  return JSON.stringify([
    formData.get("status"),
    formData.get("moderation_note"),
  ]);
}

export function ExperienceModerationForm({
  experienceId,
  revision,
  mode = "review",
}: {
  experienceId: string;
  revision: string;
  mode?: "review" | "archive";
}) {
  const [state, action, pending] = useActionState(
    moderateInterviewExperienceAction,
    {
      status: "idle",
      message: "",
      revision,
    } satisfies AdminMutationState,
  );
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

  const updateChangedSinceSubmit = (form: HTMLFormElement | null) => {
    if (!form || submittedDraftSignature.current === null) return;
    setChangedSinceSubmit(
      moderationDraftSignature(new FormData(form)) !==
        submittedDraftSignature.current,
    );
  };

  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (submissionPending.current) return;
    submissionPending.current = true;
    const formData = new FormData(event.currentTarget);
    submittedDraftSignature.current = moderationDraftSignature(formData);
    setChangedSinceSubmit(false);
    startTransition(() => action(formData));
  };

  const displayState = resolveInterviewExperienceDisplayState(
    {
      status: state.status,
      message: state.message ?? "",
      conflict: state.conflict,
    },
    pending,
    changedSinceSubmit,
    mode === "archive" ? "archive" : "moderation",
  );

  return (
    <form
      action={action}
      className="admin-mutation-form"
      onSubmit={submit}
      onChange={(event) => updateChangedSinceSubmit(event.currentTarget)}
      aria-busy={pending}
    >
      <input type="hidden" name="experience_id" value={experienceId} />
      <input
        type="hidden"
        name={INTERVIEW_EXPERIENCE_EXPECTED_REVISION_FIELD}
        value={state.revision ?? revision}
      />
      {mode === "archive" ? (
        <>
          <input type="hidden" name="status" value={EXPERIENCE_ARCHIVE_STATUS} />
          <p className="admin-rule-note">
            Archiving removes this report from every public directory without
            rewriting or deleting the contributor&apos;s original account.
          </p>
        </>
      ) : (
        <label>
          Moderation decision
          <select name="status" defaultValue="">
            <option value="" disabled>
              Choose a decision
            </option>
            {EXPERIENCE_MODERATION_STATUSES.map((status) => (
              <option value={status} key={status}>
                {feedbackStatusLabel(status)}
              </option>
            ))}
          </select>
        </label>
      )}
      <label>
        {mode === "archive" ? "Private archive rationale" : "Private contributor note"}{" "}
        <span>{mode === "archive" ? "Required" : "Optional"}</span>
        <textarea
          name="moderation_note"
          maxLength={1000}
          rows={4}
          required={mode === "archive"}
          placeholder={mode === "archive"
            ? "Record the correction, removal, freshness, or safety reason."
            : "Explain the moderation decision without rewriting the contributor’s report."}
        />
      </label>
      {(pending || displayState.message) && (
        <p
          className={
            displayState.status === "error" ? "form-error" : "form-success"
          }
          role={displayState.status === "error" ? "alert" : "status"}
          aria-live={displayState.status === "error" ? "assertive" : "polite"}
          aria-atomic="true"
        >
          {displayState.message}
          {!pending && state.conflict && (
            <>
              <br />
              <Link
                href="/admin/interview-experiences"
                target="_blank"
                rel="noopener noreferrer"
              >
                Review latest in a new tab
              </Link>
            </>
          )}
        </p>
      )}
      <button type="submit" className="button" aria-disabled={pending}>
        {pending ? (
          <>
            <LoaderCircle size={15} className="spin" />Saving…
          </>
        ) : (
          mode === "archive" ? "Archive published report" : "Record decision"
        )}
      </button>
    </form>
  );
}

export function AdminInterviewExperienceQueueUnavailable({
  view = "review",
}: {
  view?: "review" | "published";
}) {
  const router = useRouter();
  const [pending, startRetryTransition] = useTransition();
  const retryPending = useRef(false);

  useEffect(() => {
    if (!pending) retryPending.current = false;
  }, [pending]);
  useEffect(
    () => () => {
      retryPending.current = false;
    },
    [],
  );

  return (
    <div
      className="empty-state admin-private-unavailable"
      role="status"
      aria-live="polite"
      aria-atomic="true"
    >
      <strong>
        {pending
          ? view === "published"
            ? "Reloading published reports…"
            : "Reloading the moderation queue…"
          : view === "published"
            ? "Published reports are temporarily unavailable."
            : "The moderation queue is temporarily unavailable."}
      </strong>
      <p>
        {view === "published"
          ? "This does not mean that no reports are public. No archive action is available until the complete published-report view loads successfully."
          : "This does not mean that no reports need review. No moderation action is available until the private queue loads successfully."}
      </p>
      <button
        className="button button-secondary"
        type="button"
        aria-disabled={pending}
        onClick={() => {
          if (retryPending.current) return;
          retryPending.current = true;
          startRetryTransition(() => router.refresh());
        }}
      >
        {pending ? "Trying again…" : "Try again"}
      </button>
    </div>
  );
}
