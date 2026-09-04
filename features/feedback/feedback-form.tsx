"use client";

import {
  startTransition,
  useActionState,
  useEffect,
  useRef,
  useState,
  type FormEvent,
} from "react";
import { LoaderCircle, Send } from "lucide-react";
import { FEEDBACK_CATEGORIES } from "@/lib/feedback/model";
import {
  FEEDBACK_CONTACT_CONSENT_PRESENT_FIELD,
  feedbackSubmissionDraftSignature,
  resolveFeedbackSubmissionDisplayState,
} from "@/lib/feedback/submission-action-input";
import { submitFeedbackAction } from "./actions";
import { initialFeedbackActionState } from "./state";

export function FeedbackForm() {
  const [state, action, pending] = useActionState(submitFeedbackAction, initialFeedbackActionState);
  const [message, setMessage] = useState("");
  const categoryRef = useRef<HTMLSelectElement>(null);
  const messageRef = useRef<HTMLTextAreaElement>(null);
  const contactEmailRef = useRef<HTMLInputElement>(null);
  const contactConsentRef = useRef<HTMLInputElement>(null);
  const receiptTitleRef = useRef<HTMLHeadingElement>(null);
  const handledStateRef = useRef(state);
  const submissionInFlightRef = useRef(false);
  const submittedDraftSignatureRef = useRef<string | null>(null);
  const editedSinceSubmitRef = useRef(false);
  const receiptFocusPendingRef = useRef(false);
  const [submissionActive, setSubmissionActive] = useState(false);
  const [changedSinceSubmit, setChangedSinceSubmit] = useState(false);
  // The feedback route itself is the current page in the normal no-JS and JS
  // flows. The server collapses any manipulated value before it reaches storage.
  const pageContext = "/feedback";

  useEffect(() => {
    if (handledStateRef.current === state) return;
    handledStateRef.current = state;
    const userResumedEditing = editedSinceSubmitRef.current;
    submissionInFlightRef.current = false;
    submittedDraftSignatureRef.current = null;
    editedSinceSubmitRef.current = false;
    setSubmissionActive(false);

    receiptFocusPendingRef.current =
      state.status === "success" && !userResumedEditing;
    if (state.status === "success") {
      return;
    }
    if (state.status !== "error" || !state.fieldErrors || userResumedEditing) return;

    const firstInvalidControl = [
      { error: state.fieldErrors.category, control: categoryRef.current },
      { error: state.fieldErrors.message, control: messageRef.current },
      { error: state.fieldErrors.contact_email, control: contactEmailRef.current },
      { error: state.fieldErrors.contact_consent, control: contactConsentRef.current },
    ].find(({ error, control }) => Boolean(error && control))?.control;
    firstInvalidControl?.focus();
  }, [state]);

  useEffect(() => {
    if (
      submissionActive ||
      !receiptFocusPendingRef.current ||
      !receiptTitleRef.current
    ) {
      return;
    }
    receiptFocusPendingRef.current = false;
    receiptTitleRef.current.focus();
  }, [submissionActive, state.status]);

  useEffect(
    () => () => {
      submissionInFlightRef.current = false;
      submittedDraftSignatureRef.current = null;
      editedSinceSubmitRef.current = false;
      receiptFocusPendingRef.current = false;
    },
    [],
  );

  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (submissionInFlightRef.current) return;
    submissionInFlightRef.current = true;
    receiptFocusPendingRef.current = false;
    const formData = new FormData(event.currentTarget);
    submittedDraftSignatureRef.current =
      feedbackSubmissionDraftSignature(formData);
    editedSinceSubmitRef.current = false;
    setSubmissionActive(true);
    setChangedSinceSubmit(false);
    startTransition(() => action(formData));
  };

  const updateChangedSinceSubmit = (form: HTMLFormElement) => {
    if (
      !submissionInFlightRef.current ||
      submittedDraftSignatureRef.current === null
    ) {
      return;
    }
    const changed =
      feedbackSubmissionDraftSignature(new FormData(form)) !==
      submittedDraftSignatureRef.current;
    editedSinceSubmitRef.current = changed;
    setChangedSinceSubmit(changed);
  };

  const submitting = pending || submissionActive;
  const displayState = resolveFeedbackSubmissionDisplayState(
    state,
    submitting,
    changedSinceSubmit,
  );
  const fieldErrors = displayState.fieldErrors;

  if (state.status === "success" && !changedSinceSubmit && !submitting) {
    return <section className="feedback-receipt" aria-labelledby="feedback-receipt-title" role="status" aria-live="polite" aria-atomic="true">
      <h2 ref={receiptTitleRef} id="feedback-receipt-title" tabIndex={-1}>Your feedback is in the queue.</h2>
      <p>{state.message}</p>
      <dl><div><dt>Reference</dt><dd>{state.referenceId}</dd></div><div><dt>What happens next</dt><dd>Only authorized operators can read it. We do not publish feedback or add you to marketing.</dd></div></dl>
    </section>;
  }

  return <form
    action={action}
    className="feedback-form form-shell"
    aria-describedby="feedback-privacy-note"
    aria-busy={submitting}
    onSubmit={submit}
    onChange={(event) => updateChangedSinceSubmit(event.currentTarget)}
  >
    <input type="hidden" name="page_context" value={pageContext} />
    <input type="hidden" name={FEEDBACK_CONTACT_CONSENT_PRESENT_FIELD} value="true" />
    <div className="form-group">
      <label htmlFor="feedback-category">What is this about? <span>Required</span></label>
      <select ref={categoryRef} id="feedback-category" name="category" defaultValue="" required aria-invalid={Boolean(fieldErrors?.category)} aria-describedby={fieldErrors?.category ? "feedback-category-error" : undefined}>
        <option value="" disabled>Choose a category</option>
        {FEEDBACK_CATEGORIES.map((category) => <option key={category.id} value={category.id}>{category.label}</option>)}
      </select>
      {fieldErrors?.category && <p id="feedback-category-error" className="form-error">{fieldErrors.category}</p>}
    </div>
    <div className="form-group">
      <label htmlFor="feedback-message">What happened, or what would help? <span>Required</span></label>
      <textarea ref={messageRef} id="feedback-message" name="message" required maxLength={5000} rows={9} value={message} onChange={(event) => setMessage(event.target.value)} aria-invalid={Boolean(fieldErrors?.message)} aria-describedby={fieldErrors?.message ? "feedback-message-help feedback-message-error" : "feedback-message-help"} placeholder="Please include enough detail for us to understand the issue. Do not include passwords, access tokens, private interview material, or other sensitive information." />
      <div className="feedback-message-meta"><small id="feedback-message-help">Up to 5,000 characters. Feedback is private operational data.</small><span aria-live="polite">{message.length.toLocaleString()} / 5,000</span></div>
      {fieldErrors?.message && <p id="feedback-message-error" className="form-error">{fieldErrors.message}</p>}
    </div>
    <fieldset className="feedback-contact-fieldset">
      <legend>Optional follow-up</legend>
      <p>Leave an email only if you want an authorized operator to contact you about this report. It is not used for marketing.</p>
      <div className="form-group"><label htmlFor="feedback-contact-email">Email address <span>Optional</span></label><input ref={contactEmailRef} id="feedback-contact-email" name="contact_email" type="email" maxLength={254} autoComplete="email" aria-invalid={Boolean(fieldErrors?.contact_email)} aria-describedby={fieldErrors?.contact_email ? "feedback-contact-error" : undefined} /></div>
      {fieldErrors?.contact_email && <p id="feedback-contact-error" className="form-error">{fieldErrors.contact_email}</p>}
      <label className="feedback-consent"><input ref={contactConsentRef} id="feedback-contact-consent" type="checkbox" name="contact_consent" value="true" aria-invalid={Boolean(fieldErrors?.contact_consent)} aria-describedby={fieldErrors?.contact_consent ? "feedback-contact-consent-error" : undefined} /><span>I consent to Engineering Foundry using this email only to follow up on this feedback.</span></label>
      {fieldErrors?.contact_consent && <p id="feedback-contact-consent-error" className="form-error">{fieldErrors.contact_consent}</p>}
    </fieldset>
    <p id="feedback-privacy-note" className="form-note">Current context is stored only as the sanitized route <code>{pageContext}</code>; query strings, fragments, and private resource IDs are removed.</p>
    {(submitting || displayState.message) && <p className={displayState.status === "error" ? "form-error" : "form-note feedback-submission-status"} role={displayState.status === "error" ? "alert" : "status"} aria-live={displayState.status === "error" ? "assertive" : "polite"} aria-atomic="true">{displayState.message}{displayState.status === "success" && displayState.referenceId && <><br />Reference <code>{displayState.referenceId}</code></>}</p>}
    <button className="button" type="submit" disabled={submitting}>{submitting ? <><LoaderCircle className="spin" size={16} />Sending…</> : <>Send feedback <Send size={16} /></>}</button>
  </form>;
}
