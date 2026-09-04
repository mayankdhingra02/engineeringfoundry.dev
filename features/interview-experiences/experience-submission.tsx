"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { CheckCircle2, Send, Trash2, Undo2 } from "lucide-react";
import {
  useEffect,
  useRef,
  useState,
  useTransition,
} from "react";
import { experienceRoundTypes, experienceTopics } from "@/data/interview-experiences";
import {
  manageInterviewExperience,
  saveInterviewExperience,
} from "@/app/interview-experiences/actions";
import { track } from "@/lib/analytics";
import {
  INTERVIEW_EXPERIENCE_ABSENT_REVISION,
  resolveInterviewExperienceDisplayState,
  type ExperienceSubmissionFields,
  type ExperienceSubmissionInput,
  type InterviewExperienceDisplayState,
} from "@/lib/interview-experiences/action-input";
import { canonicalInterviewExperienceCompany } from "@/lib/interview-experiences/company";
import type {
  InterviewExperienceOwnerState,
  OwnedInterviewExperience,
} from "@/lib/interview-experiences/private-state";

type ExperienceDraft = ExperienceSubmissionFields &
  Readonly<{ id: string | null; revision: string }>;
type MutationContext = "draft" | "submit" | "withdraw" | "delete";

const emptyDraft: ExperienceDraft = {
  id: null,
  revision: INTERVIEW_EXPERIENCE_ABSENT_REVISION,
  companyName: "",
  roleTitle: "",
  roleLevel: "",
  region: "",
  interviewDate: "",
  summary: "",
  preparationLessons: "",
  publicIdentity: "anonymous",
  publicationConsent: false,
  roundType: "",
  topics: [],
};
const editableStatuses = new Set(["draft", "needs_changes", "withdrawn"]);

function draftSignature(draft: ExperienceDraft) {
  return JSON.stringify([
    draft.companyName,
    draft.roleTitle,
    draft.roleLevel,
    draft.region,
    draft.interviewDate,
    draft.summary,
    draft.preparationLessons,
    draft.publicIdentity,
    draft.publicationConsent,
    draft.roundType,
    draft.topics,
  ]);
}

function inputFromOwnedExperience(item: OwnedInterviewExperience): ExperienceDraft {
  const round = item.interview_experience_rounds[0];
  return {
    id: item.id,
    revision: item.updated_at,
    companyName: item.company_name,
    roleTitle: item.role_title,
    roleLevel: item.role_level ?? "",
    region: item.region ?? "",
    interviewDate: item.interview_date?.slice(0, 7) ?? "",
    summary: item.summary,
    preparationLessons: item.preparation_lessons ?? "",
    publicIdentity: item.public_identity,
    publicationConsent: item.publication_consent,
    roundType: round?.round_type ?? "",
    topics: round?.topic_labels ?? [],
  };
}

function OwnedHistoryUnavailable() {
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
      className="experience-directory-empty experience-private-unavailable"
      role="status"
      aria-live="polite"
      aria-atomic="true"
    >
      <div>
        <strong>
          {pending
            ? "Reloading your private submissions…"
            : "Your private submissions are temporarily unavailable."}
        </strong>
        <p>
          This does not mean that you have no saved reports. Saving, editing,
          withdrawing, and deleting stay unavailable until your private history
          loads successfully; the reviewed public directory above remains usable.
        </p>
      </div>
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

export function ExperienceSubmission({
  accountPlatformAvailable,
  ownerState,
}: {
  accountPlatformAvailable: boolean;
  ownerState: InterviewExperienceOwnerState;
}) {
  const [input, setInput] = useState<ExperienceDraft>(emptyDraft);
  const inputRef = useRef(input);
  const [view, setView] = useState<"form" | "preview">("form");
  const [messageState, setMessageState] =
    useState<InterviewExperienceDisplayState>({ status: "idle", message: "" });
  const [mutationContext, setMutationContext] =
    useState<MutationContext>("draft");
  const [changedSinceSubmit, setChangedSinceSubmit] = useState(false);
  const [pending, startTransition] = useTransition();
  const mutationPending = useRef(false);
  const submittedDraftSignature = useRef<string | null>(null);
  const submissionStarted = useRef(false);

  useEffect(() => {
    if (ownerState.status !== "ready" || submissionStarted.current) return;
    submissionStarted.current = true;
    track("interview_experience_submission_started", {
      source: "directory_contribution",
    });
  }, [ownerState.status]);

  useEffect(() => {
    if (!pending) mutationPending.current = false;
  }, [pending]);
  useEffect(
    () => () => {
      mutationPending.current = false;
      submittedDraftSignature.current = null;
    },
    [],
  );

  const replaceInput = (next: ExperienceDraft) => {
    inputRef.current = next;
    setInput(next);
  };
  const update = <K extends keyof ExperienceDraft>(
    key: K,
    value: ExperienceDraft[K],
  ) => {
    setInput((current) => {
      const next = { ...current, [key]: value };
      inputRef.current = next;
      if (
        submittedDraftSignature.current !== null &&
        draftSignature(next) !== submittedDraftSignature.current
      ) {
        setChangedSinceSubmit(true);
      }
      return next;
    });
  };

  const save = (submit: boolean) => {
    if (mutationPending.current) return;
    mutationPending.current = true;
    const current = inputRef.current;
    const snapshot: ExperienceDraft = current.id
      ? current
      : { ...current, id: window.crypto.randomUUID() };
    if (!current.id) replaceInput(snapshot);
    const actionInput: ExperienceSubmissionInput = {
      ...snapshot,
      id: snapshot.id as string,
    };
    const signature = draftSignature(snapshot);
    submittedDraftSignature.current = signature;
    setChangedSinceSubmit(false);
    setMutationContext(submit ? "submit" : "draft");
    setMessageState({ status: "idle", message: "" });

    startTransition(async () => {
      try {
        const result = await saveInterviewExperience(actionInput, submit);
        const changed = draftSignature(inputRef.current) !== signature;
        setChangedSinceSubmit(changed);
        if (!result.ok) {
          setMessageState({
            status: "error",
            message: result.error,
            conflict: result.conflict,
          });
          return;
        }

        if (submit) {
          track("interview_experience_submitted", {
            source: "directory_contribution",
          });
          if (changed) {
            replaceInput({
              ...inputRef.current,
              id: null,
              revision: INTERVIEW_EXPERIENCE_ABSENT_REVISION,
            });
            setView("form");
          } else {
            replaceInput(emptyDraft);
            setView("form");
          }
        } else {
          replaceInput({
            ...inputRef.current,
            id: result.id,
            revision: result.revision,
          });
        }
        setMessageState({ status: "success", message: result.message });
      } catch {
        setMessageState({
          status: "error",
          message: "Your experience could not be saved. Please try again.",
        });
      }
    });
  };

  const manage = (
    item: OwnedInterviewExperience,
    action: "withdraw" | "delete",
  ) => {
    if (mutationPending.current) return;
    mutationPending.current = true;
    const managesActiveDraft = inputRef.current.id === item.id;
    const signature = managesActiveDraft
      ? draftSignature(inputRef.current)
      : null;
    submittedDraftSignature.current = signature;
    setMutationContext(action);
    setChangedSinceSubmit(false);
    setMessageState({ status: "idle", message: "" });
    startTransition(async () => {
      try {
        const result = await manageInterviewExperience(
          item.id,
          action,
          item.updated_at,
        );
        if (!result.ok) {
          setMessageState({
            status: "error",
            message: result.error,
            conflict: result.conflict,
          });
          return;
        }
        const changed =
          signature !== null && draftSignature(inputRef.current) !== signature;
        setChangedSinceSubmit(changed);
        if (managesActiveDraft && inputRef.current.id === result.id) {
          if (result.status === "deleted") {
            if (changed) {
              replaceInput({
                ...inputRef.current,
                id: null,
                revision: INTERVIEW_EXPERIENCE_ABSENT_REVISION,
              });
            } else {
              replaceInput(emptyDraft);
            }
          } else {
            replaceInput({
              ...inputRef.current,
              revision: result.revision,
            });
          }
        }
        setMessageState({ status: "success", message: result.message });
      } catch {
        setMessageState({
          status: "error",
          message: "Your submission could not be updated. Please try again.",
        });
      }
    });
  };

  const edit = (item: OwnedInterviewExperience) => {
    if (mutationPending.current || !editableStatuses.has(item.status)) return;
    replaceInput(inputFromOwnedExperience(item));
    setView("form");
    setMutationContext("draft");
    setChangedSinceSubmit(false);
    submittedDraftSignature.current = null;
    setMessageState({
      status: "idle",
      message: `Editing your ${item.status.replaceAll("_", " ")} report.`,
    });
    document
      .getElementById("contribute")
      ?.scrollIntoView({ behavior: "smooth", block: "start" });
  };
  const cancelEdit = () => {
    if (mutationPending.current) return;
    replaceInput(emptyDraft);
    setView("form");
    setMutationContext("draft");
    setChangedSinceSubmit(false);
    submittedDraftSignature.current = null;
    setMessageState({
      status: "idle",
      message: "Editing cancelled. You can start a new private report.",
    });
  };

  if (!accountPlatformAvailable) {
    return (
      <div className="experience-directory-empty">
        <div>
          <strong>
            Contributions are not available in this public configuration.
          </strong>
          <p>
            Use the reviewed-report directory above when it is available.
            Account-backed private drafts and moderation submissions require the
            account platform; nothing can be submitted from this state.
          </p>
        </div>
      </div>
    );
  }
  if (ownerState.status === "anonymous") {
    return (
      <div className="experience-directory-empty">
        <div>
          <strong>Share a process-level experience when you are signed in.</strong>
          <p>
            Your report starts private, goes through review, and only approved
            reports can appear here. Never include exact questions, interviewer
            identities, private links, or confidential material.
          </p>
        </div>
        <a
          className="button"
          href="/signin?next=/interview-experiences#contribute"
        >
          Sign in to contribute
        </a>
      </div>
    );
  }
  if (ownerState.status === "unavailable") {
    return <OwnedHistoryUnavailable />;
  }

  const owned = ownerState.items;
  const preview = input;
  const displayState = resolveInterviewExperienceDisplayState(
    messageState,
    pending,
    changedSinceSubmit,
    mutationContext,
  );

  return (
    <div className="experience-submission" id="contribute" aria-busy={pending}>
      <div className="experience-submission-intro">
        <div>
          <h2>Add an interview experience</h2>
          <p>
            Describe high-level process and preparation lessons. This is a
            contributor report—not a question bank—and it stays private until
            review approves it.
          </p>
        </div>
        <span>
          <CheckCircle2 size={16} />Review required
        </span>
      </div>

      {view === "preview" ? (
        <section
          className="experience-preview"
          aria-labelledby="experience-preview-heading"
        >
          <div>
            <h3 id="experience-preview-heading">Preview your report</h3>
            <p>
              This is not public yet. It shows the bounded report that will be
              sent for moderation when you confirm submission.
            </p>
          </div>
          <dl>
            <div><dt>Company</dt><dd>{canonicalInterviewExperienceCompany(preview.companyName) || "Not provided"}</dd></div>
            <div><dt>Role</dt><dd>{preview.roleTitle.trim() || "Not provided"}</dd></div>
            <div><dt>Level</dt><dd>{preview.roleLevel || "Not provided"}</dd></div>
            <div><dt>Region</dt><dd>{preview.region.trim() || "Not provided"}</dd></div>
            <div><dt>Process stage</dt><dd>{preview.roundType || "Not provided"}</dd></div>
          </dl>
          <h4>High-level process summary</h4>
          <p>{preview.summary.trim() || "Not provided"}</p>
          {preview.preparationLessons.trim() && (
            <>
              <h4>Preparation lessons</h4>
              <p>{preview.preparationLessons.trim()}</p>
            </>
          )}
          <div className="experience-generate-row">
            <button
              className="button button-secondary"
              type="button"
              aria-disabled={pending}
              onClick={() => {
                if (!mutationPending.current) setView("form");
              }}
            >
              Return to edit
            </button>
            <button
              className="button"
              type="button"
              disabled={!preview.publicationConsent}
              aria-disabled={pending || !preview.publicationConsent}
              onClick={() => save(true)}
            >
              <Send size={15} />Submit for review
            </button>
            <span>
              {preview.publicationConsent
                ? "Publication consent confirmed. The report remains private until approval."
                : "Confirm publication consent in edit mode before submitting."}
            </span>
          </div>
        </section>
      ) : (
        <>
          <div className="experience-field-grid">
            <label className="form-group">
              <span>Company</span>
              <input value={input.companyName} onChange={(event) => update("companyName", event.target.value)} maxLength={120} required />
            </label>
            <label className="form-group">
              <span>Role title</span>
              <input value={input.roleTitle} onChange={(event) => update("roleTitle", event.target.value)} maxLength={160} required />
            </label>
            <label className="form-group">
              <span>Level</span>
              <select value={input.roleLevel} onChange={(event) => update("roleLevel", event.target.value)}>
                <option value="">Not provided</option>
                {["Entry", "Mid", "Senior", "Staff+", "Management", "Prefer not to say"].map((level) => <option key={level}>{level}</option>)}
              </select>
            </label>
            <label className="form-group">
              <span>Country or general region</span>
              <input value={input.region} onChange={(event) => update("region", event.target.value)} maxLength={120} placeholder="Optional; avoid precise locations" />
            </label>
            <label className="form-group">
              <span>Interview date</span>
              <input type="month" value={input.interviewDate} onChange={(event) => update("interviewDate", event.target.value)} />
              <small>Optional; month only helps readers judge freshness.</small>
            </label>
            <label className="form-group">
              <span>One process stage</span>
              <select
                value={input.roundType}
                onChange={(event) => {
                  const roundType = event.target.value;
                  setInput((current) => {
                    const next = {
                      ...current,
                      roundType,
                      topics: roundType ? current.topics : [],
                    };
                    inputRef.current = next;
                    if (
                      submittedDraftSignature.current !== null &&
                      draftSignature(next) !== submittedDraftSignature.current
                    ) {
                      setChangedSinceSubmit(true);
                    }
                    return next;
                  });
                }}
              >
                <option value="">Not provided</option>
                {experienceRoundTypes.map((round) => <option key={round.id} value={round.label}>{round.label}</option>)}
              </select>
            </label>
            {input.roundType && (
              <fieldset className="experience-topic-picker full">
                <legend>High-level topic families</legend>
                <div>
                  {experienceTopics.map((topic) => (
                    <label key={topic.id}>
                      <input
                        type="checkbox"
                        checked={input.topics.includes(topic.label)}
                        onChange={() => update("topics", input.topics.includes(topic.label) ? input.topics.filter((item) => item !== topic.label) : [...input.topics, topic.label])}
                      />
                      <span>{topic.label}</span>
                    </label>
                  ))}
                </div>
              </fieldset>
            )}
            <label className="form-group full">
              <span>High-level process summary</span>
              <textarea rows={6} value={input.summary} onChange={(event) => update("summary", event.target.value)} maxLength={4000} placeholder="Describe the process, timing, and topic families without exact prompts, identities, or confidential details." required />
              <small>{Array.from(input.summary).length}/4000. At least 40 characters are required to submit.</small>
            </label>
            <label className="form-group full">
              <span>Preparation lessons (optional)</span>
              <textarea rows={4} value={input.preparationLessons} onChange={(event) => update("preparationLessons", event.target.value)} maxLength={3000} placeholder="What would you recommend preparing, at a high level?" />
            </label>
          </div>
          <fieldset className="experience-safety-checklist">
            <legend>Publication choices</legend>
            <label><input type="radio" checked={input.publicIdentity === "anonymous"} onChange={() => update("publicIdentity", "anonymous")} /><span>Publish anonymously</span></label>
            <label><input type="radio" checked={input.publicIdentity === "username"} onChange={() => update("publicIdentity", "username")} /><span>Show my Engineering Foundry username if approved</span></label>
            <label><input type="checkbox" checked={input.publicationConsent} onChange={(event) => update("publicationConsent", event.target.checked)} /><span>I confirm this is my own account, I have removed exact proprietary questions and personal/confidential information, and I consent to review and publication if approved.</span></label>
          </fieldset>
          <div className="experience-generate-row">
            <button className="button button-secondary" type="button" aria-disabled={pending} onClick={() => save(false)}>Save private draft</button>
            <button className="button button-secondary" type="button" aria-disabled={pending} onClick={cancelEdit}>{input.id ? "Cancel edit" : "Clear form"}</button>
            <button className="button" type="button" aria-disabled={pending} onClick={() => { if (!mutationPending.current) setView("preview"); }}>Preview report</button>
          </div>
        </>
      )}

      <p
        className={displayState.status === "error" ? "form-error" : displayState.status === "success" ? "form-success" : undefined}
        role={displayState.status === "error" ? "alert" : "status"}
        aria-live={displayState.status === "error" ? "assertive" : "polite"}
        aria-atomic="true"
      >
        {displayState.message || "Submission is optional; nothing is public without approval."}
        {!pending && messageState.conflict && (
          <>
            <br />
            <Link href="/interview-experiences#your-experiences" target="_blank" rel="noopener noreferrer">Review latest in a new tab</Link>
          </>
        )}
      </p>

      <section className="experience-owned" aria-labelledby="your-experiences">
        <h2 id="your-experiences">Your latest submissions</h2>
        {owned.length ? (
          <>
            <p className="muted">Showing up to {ownerState.limit} most recently updated reports. Pagination is not available yet.</p>
            <ul>
              {owned.map((item) => (
                <li key={item.id}>
                  <div>
                    <strong>{item.company_name} · {item.role_title}</strong>
                    <span>{item.status.replaceAll("_", " ")} · updated {new Date(item.updated_at).toLocaleDateString()}</span>
                    {item.status === "needs_changes" && item.review_note && <p>{item.review_note}</p>}
                  </div>
                  <div>
                    {editableStatuses.has(item.status) && <button className="button button-secondary" type="button" aria-disabled={pending} onClick={() => edit(item)}>Edit</button>}
                    {["draft", "submitted", "needs_changes"].includes(item.status) && <button className="button button-secondary" type="button" aria-disabled={pending} onClick={() => manage(item, "withdraw")}><Undo2 size={14} />Withdraw</button>}
                    {["draft", "withdrawn", "rejected"].includes(item.status) && <button className="button button-ghost" type="button" aria-disabled={pending} onClick={() => manage(item, "delete")}><Trash2 size={14} />Delete</button>}
                  </div>
                </li>
              ))}
            </ul>
          </>
        ) : (
          <div className="experience-directory-empty">
            <div><strong>No private submissions yet.</strong><p>Start with the form above. A saved draft remains private until you explicitly submit it for review.</p></div>
          </div>
        )}
      </section>
    </div>
  );
}
